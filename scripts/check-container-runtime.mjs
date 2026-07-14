import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const imageName = `homun-website-roadmap-smoke:${process.pid}`;
const containerName = `homun-website-roadmap-smoke-${process.pid}`;
const activeChildren = new Set();

let dockerAvailable = false;
let imageBuilt = false;
let containerCreated = false;
let cleanupPromise;
let handlingSignal = false;

function runDocker(
	args,
	{ allowFailure = false, allowDuringShutdown = false } = {},
) {
	if (handlingSignal && !allowDuringShutdown) {
		return Promise.reject(
			new Error(`docker ${args[0]} not started: runtime checker is shutting down`),
		);
	}

	return new Promise((resolve, reject) => {
		const child = spawn("docker", args, {
			cwd: repositoryRoot,
			stdio: ["ignore", "pipe", "pipe"],
		});
		activeChildren.add(child);

		let stdout = "";
		let stderr = "";
		let settled = false;

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});

		const finish = (error, result) => {
			if (settled) return;
			settled = true;
			activeChildren.delete(child);
			if (error) reject(error);
			else resolve(result);
		};

		child.on("error", (error) => finish(error));
		child.on("close", (code, signal) => {
			const result = { code, signal, stdout, stderr };
			if (code === 0 || allowFailure) {
				finish(undefined, result);
				return;
			}

			const detail = stderr.trim() || stdout.trim() || `exit code ${code}`;
			finish(
				new Error(`docker ${args[0]} failed: ${detail}`, { cause: result }),
			);
		});
	});
}

async function removeRuntimeArtifacts() {
	if (!dockerAvailable) return;
	if (cleanupPromise) return cleanupPromise;

	cleanupPromise = (async () => {
		const containerRemoval = await runDocker(
			["rm", "--force", containerName],
			{ allowFailure: true, allowDuringShutdown: true },
		);
		const imageRemoval = await runDocker(
			["image", "rm", "--force", imageName],
			{ allowFailure: true, allowDuringShutdown: true },
		);
		const cleanupErrors = [];

		if (containerCreated && containerRemoval.code !== 0) {
			cleanupErrors.push(
				`container cleanup failed: ${containerRemoval.stderr.trim() || containerRemoval.stdout.trim()}`,
			);
		}
		if (imageBuilt && imageRemoval.code !== 0) {
			cleanupErrors.push(
				`image cleanup failed: ${imageRemoval.stderr.trim() || imageRemoval.stdout.trim()}`,
			);
		}
		if (cleanupErrors.length > 0) {
			throw new Error(cleanupErrors.join("\n"));
		}
	})();

	return cleanupPromise;
}

function waitForChildExit(child) {
	return new Promise((resolve) => {
		if (child.exitCode !== null || child.signalCode !== null) {
			resolve();
			return;
		}

		const finish = () => {
			child.off("close", finish);
			child.off("error", finish);
			resolve();
		};
		child.once("close", finish);
		child.once("error", finish);
	});
}

async function terminateActiveChildren() {
	const children = [...activeChildren];
	const exits = children.map(waitForChildExit);
	for (const child of children) child.kill("SIGTERM");

	const exitedGracefully = await Promise.race([
		Promise.allSettled(exits).then(() => true),
		wait(2_000).then(() => false),
	]);
	if (exitedGracefully) return;

	for (const child of children) {
		if (child.exitCode === null && child.signalCode === null) {
			child.kill("SIGKILL");
		}
	}
	await Promise.allSettled(exits);
}

async function handleSignal(signal) {
	if (handlingSignal) return;
	handlingSignal = true;
	await terminateActiveChildren();

	try {
		await removeRuntimeArtifacts();
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
	}

	process.exit(signal === "SIGINT" ? 130 : 143);
}

process.once("SIGINT", () => void handleSignal("SIGINT"));
process.once("SIGTERM", () => void handleSignal("SIGTERM"));

function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function checkRoute(baseUrl, { path, content }, deadline) {
	const remaining = deadline - Date.now();
	if (remaining <= 0) throw new Error("runtime check deadline exceeded");

	const response = await fetch(`${baseUrl}${path}`, {
		signal: AbortSignal.timeout(Math.min(2_000, remaining)),
	});
	if (response.status !== 200) {
		throw new Error(`${path} returned HTTP ${response.status}, expected 200`);
	}

	if (content) {
		const html = await response.text();
		if (!html.includes(content)) {
			throw new Error(`${path} did not contain ${JSON.stringify(content)}`);
		}
	}
}

async function waitForRoutes(baseUrl) {
	const routes = [
		{ path: "/health" },
		{ path: "/roadmap/", content: "Ideas" },
		{ path: "/roadmap/apprentice/", content: "The Apprentice" },
	];
	const deadline = Date.now() + 30_000;
	let lastError;

	while (Date.now() < deadline) {
		try {
			await Promise.all(
				routes.map((route) => checkRoute(baseUrl, route, deadline)),
			);
			return;
		} catch (error) {
			lastError = error;
			if (Date.now() < deadline) await wait(250);
		}
	}

	const detail = lastError instanceof Error ? lastError.message : String(lastError);
	throw new Error(`container routes were not ready within 30 seconds: ${detail}`);
}

async function runRuntimeCheck() {
	try {
		await runDocker(["--version"]);
		await runDocker(["info", "--format", "{{.ServerVersion}}"]);
	} catch {
		console.log("SKIP: Docker unavailable");
		return;
	}
	dockerAvailable = true;

	await runDocker(["build", "--tag", imageName, "--file", "Dockerfile", "."]);
	imageBuilt = true;

	await runDocker([
		"run",
		"--detach",
		"--name",
		containerName,
		"--publish",
		"127.0.0.1::80",
		imageName,
	]);
	containerCreated = true;

	const { stdout: publishedPorts } = await runDocker([
		"port",
		containerName,
		"80/tcp",
	]);
	const portMatch = publishedPorts.match(/^127\.0\.0\.1:(\d+)$/m);
	if (!portMatch) {
		throw new Error(
			`could not determine the loopback host port for ${containerName}: ${publishedPorts.trim()}`,
		);
	}

	await waitForRoutes(`http://127.0.0.1:${portMatch[1]}`);
	console.log("Container runtime roadmap smoke test passed");
}

let runtimeError;
try {
	await runRuntimeCheck();
} catch (error) {
	runtimeError = error;
} finally {
	try {
		await removeRuntimeArtifacts();
	} catch (error) {
		runtimeError = runtimeError
			? new AggregateError([runtimeError, error], "runtime check and cleanup failed")
			: error;
	}
}

if (runtimeError) {
	console.error(
		runtimeError instanceof Error ? runtimeError.message : String(runtimeError),
	);
	process.exitCode = 1;
}
