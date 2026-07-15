import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const runtimeChecker = fileURLToPath(
	new URL("check-container-runtime.mjs", import.meta.url),
);
const fixtureDirectory = await mkdtemp(
	join(tmpdir(), "homun-container-runtime-signals-"),
);
const dockerFixture = join(fixtureDirectory, "docker");
const eventLog = join(fixtureDirectory, "events.log");

const fakeDocker = `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const args = process.argv.slice(2);
const eventLog = process.env.HOMUN_RUNTIME_SIGNAL_LOG;
const signalMode = process.env.HOMUN_RUNTIME_SIGNAL_MODE;
const record = (event) => appendFileSync(eventLog, event + "\\n");

if (args[0] === "--version" || args[0] === "info") process.exit(0);

if (args[0] === "build") {
  record("build-started");
  process.once("SIGTERM", () => {
    setTimeout(() => {
      record("build-exited");
      process.exit(signalMode === "success" ? 0 : 143);
    }, signalMode === "success" ? 50 : 300);
  });
  setInterval(() => {}, 1_000);
} else if (args[0] === "run") {
  record("run-started");
  setTimeout(() => {
    record("run-exited");
    console.log("fake-container");
  }, 300);
} else if (args[0] === "rm") {
  record("cleanup-container");
  if (signalMode === "cleanup-hang") {
    record("cleanup-pid:" + process.pid);
    process.on("SIGTERM", () => record("cleanup-sigterm"));
    setInterval(() => {}, 1_000);
  }
} else if (args[0] === "image") {
  record("cleanup-image");
} else {
  record("unexpected-" + args[0]);
  process.exit(1);
}
`;

function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function processExists(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		if (error?.code === "ESRCH") return false;
		throw error;
	}
}

async function runSignalScenario(signalMode) {
	const scenarioLog = `${eventLog}-${signalMode}`;
	const checker = spawn(process.execPath, [runtimeChecker], {
		cwd: repositoryRoot,
		env: {
			...process.env,
			PATH: `${fixtureDirectory}${delimiter}${process.env.PATH ?? ""}`,
			HOMUN_RUNTIME_SIGNAL_LOG: scenarioLog,
			HOMUN_RUNTIME_SIGNAL_MODE: signalMode,
		},
		stdio: ["ignore", "pipe", "pipe"],
	});
	const checkerExit = new Promise((resolve, reject) => {
		checker.once("error", reject);
		checker.once("close", (code, signal) => resolve({ code, signal }));
	});

	const readScenarioEvents = async () => {
		const contents = await readFile(scenarioLog, "utf8").catch(() => "");
		return contents.trim().split("\n").filter(Boolean);
	};
	const waitForScenarioEvent = async (event) => {
		const deadline = Date.now() + 2_000;
		while (Date.now() < deadline) {
			if ((await readScenarioEvents()).includes(event)) return;
			await wait(20);
		}
		throw new Error(`Timed out waiting for ${signalMode} event: ${event}`);
	};

	let timeout;
	const checkerTimeout = signalMode === "cleanup-hang" ? 8_000 : 5_000;
	try {
		await waitForScenarioEvent("build-started");
		checker.kill("SIGTERM");
		const result = await Promise.race([
			checkerExit,
			new Promise((_, reject) => {
				timeout = setTimeout(
					() => reject(new Error(`Runtime checker did not exit for ${signalMode}`)),
					checkerTimeout,
				);
			}),
		]);
		await waitForScenarioEvent("build-exited");
		await wait(400);
		return { result, events: await readScenarioEvents() };
	} finally {
		clearTimeout(timeout);
		if (checker.exitCode === null && checker.signalCode === null) {
			checker.kill("SIGKILL");
		}
	}
}

try {
	await writeFile(dockerFixture, fakeDocker, "utf8");
	await chmod(dockerFixture, 0o755);

	const failedBuild = await runSignalScenario("failure");
	assert.deepEqual(failedBuild.result, { code: 143, signal: null });
	const childExit = failedBuild.events.indexOf("build-exited");
	const cleanupStart = failedBuild.events.indexOf("cleanup-container");
	assert.notEqual(cleanupStart, -1, "runtime checker did not start cleanup");
	assert.ok(
		childExit < cleanupStart,
		`cleanup began before the active Docker child exited: ${failedBuild.events.join(", ")}`,
	);

	const successfulBuild = await runSignalScenario("success");
	assert.deepEqual(successfulBuild.result, { code: 143, signal: null });
	assert.ok(
		!successfulBuild.events.includes("run-started"),
		`runtime checker spawned Docker after shutdown began: ${successfulBuild.events.join(", ")}`,
	);

	const cleanupStartedAt = Date.now();
	const hangingCleanup = await runSignalScenario("cleanup-hang");
	assert.deepEqual(hangingCleanup.result, { code: 143, signal: null });
	assert.ok(
		hangingCleanup.events.includes("cleanup-sigterm"),
		`hanging cleanup was not terminated: ${hangingCleanup.events.join(", ")}`,
	);
	const cleanupPid = Number(
		hangingCleanup.events
			.find((event) => event.startsWith("cleanup-pid:"))
			?.slice("cleanup-pid:".length),
	);
	assert.ok(Number.isInteger(cleanupPid), "hanging cleanup did not record its PID");
	assert.equal(
		processExists(cleanupPid),
		false,
		`hanging cleanup process ${cleanupPid} survived the timeout`,
	);
	assert.ok(
		Date.now() - cleanupStartedAt < 8_000,
		"signal handling exceeded the cleanup time limit",
	);

	console.log("Container runtime signal cleanup contract passed");
} finally {
	const cleanupEvents = await readFile(`${eventLog}-cleanup-hang`, "utf8").catch(
		() => "",
	);
	for (const match of cleanupEvents.matchAll(/^cleanup-pid:(\d+)$/gm)) {
		const pid = Number(match[1]);
		if (processExists(pid)) process.kill(pid, "SIGKILL");
	}
	await rm(fixtureDirectory, { recursive: true, force: true });
}
