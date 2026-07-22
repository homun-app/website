import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const runtimeChecker = fileURLToPath(
	new URL("check-container-runtime.mjs", import.meta.url),
);
const fixtureDirectory = await mkdtemp(
	join(tmpdir(), "homun-container-runtime-ownership-"),
);
const dockerFixture = join(fixtureDirectory, "docker");
const commandLog = join(fixtureDirectory, "commands.jsonl");
const fakeDocker = `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const args = process.argv.slice(2);
appendFileSync(process.env.HOMUN_RUNTIME_COMMAND_LOG, JSON.stringify(args) + "\\n");

if (args[0] === "port") {
  console.log("127.0.0.1:" + process.env.HOMUN_RUNTIME_HTTP_PORT);
}
`;

function closeServer(server) {
	return new Promise((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});
}

const requestedPaths = new Set();
const server = createServer((request, response) => {
	requestedPaths.add(request.url);
	response.statusCode = 200;
	if (request.url === "/it") response.end("url=/it/docs/");
	else if (request.url === "/roadmap/") response.end("AI that keeps your company moving.");
	else if (request.url === "/roadmap/homun-flow/") response.end("Homun Flow");
	else if (request.url === "/roadmap/client-work/") response.end("Client Work");
	else if (request.url === "/roadmap/mobile-companion/") response.end("url=/roadmap/homun-mobile");
	else if (request.url === "/roadmap/shared-spaces/") response.end("url=/roadmap/team-spaces-roles");
	else if (request.url === "/roadmap/voice-capture/") response.end("url=/roadmap/voice-meeting-capture");
	else response.end("ok");
});

let checker;
try {
	await writeFile(dockerFixture, fakeDocker, "utf8");
	await chmod(dockerFixture, 0o755);
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});
	const address = server.address();
	assert.ok(address && typeof address !== "string");

	checker = spawn(process.execPath, [runtimeChecker], {
		cwd: repositoryRoot,
		env: {
			...process.env,
			PATH: `${fixtureDirectory}${delimiter}${process.env.PATH ?? ""}`,
			HOMUN_RUNTIME_COMMAND_LOG: commandLog,
			HOMUN_RUNTIME_HTTP_PORT: String(address.port),
		},
		stdio: ["ignore", "pipe", "pipe"],
	});
	let timeout;
	let result;
	try {
		result = await Promise.race([
			new Promise((resolve, reject) => {
				checker.once("error", reject);
				checker.once("close", (code, signal) => resolve({ code, signal }));
			}),
			new Promise((_, reject) => {
				timeout = setTimeout(
					() => reject(new Error("Runtime ownership checker did not exit")),
					5_000,
				);
			}),
		]);
	} finally {
		clearTimeout(timeout);
	}
	assert.deepEqual(result, { code: 0, signal: null });

	const commands = (await readFile(commandLog, "utf8"))
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line));
	const build = commands.find(([command]) => command === "build");
	const run = commands.find(([command]) => command === "run");
	const removeContainer = commands.find(([command]) => command === "rm");
	const removeImage = commands.find(
		([command, operation]) => command === "image" && operation === "rm",
	);
	assert.ok(build && run && removeContainer && removeImage);

	const buildLabel = build[build.indexOf("--label") + 1];
	const labelMatch = buildLabel?.match(
		/^dev\.homun\.smoke-run=([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/,
	);
	assert.ok(labelMatch, `Docker build lacks a UUID ownership label: ${build}`);
	const runId = labelMatch[1];
	const imageName = `homun-website-roadmap-smoke:${runId}`;
	const containerName = `homun-website-roadmap-smoke-${runId}`;

	assert.equal(build[build.indexOf("--tag") + 1], imageName);
	assert.equal(run[run.indexOf("--label") + 1], buildLabel);
	assert.equal(run[run.indexOf("--name") + 1], containerName);
	assert.equal(run.at(-1), imageName);
	assert.deepEqual(removeContainer, ["rm", "--force", containerName]);
	assert.deepEqual(removeImage, ["image", "rm", "--force", imageName]);
	assert.ok(requestedPaths.has("/it"), "Runtime checker did not cover /it");

	console.log("Container runtime ownership contract passed");
} finally {
	if (checker && checker.exitCode === null && checker.signalCode === null) {
		checker.kill("SIGKILL");
	}
	if (server.listening) await closeServer(server);
	await rm(fixtureDirectory, { recursive: true, force: true });
}
