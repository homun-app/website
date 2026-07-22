import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const runId = randomUUID();
const ownershipLabel = `dev.homun.smoke-run=${runId}`;
const imageName = `homun-website-roadmap-smoke:${runId}`;
const containerName = `homun-website-roadmap-smoke-${runId}`;
const cleanupTimeoutMilliseconds = 5_000;
const activeChildren = new Set();

let dockerAvailable = false;
let imageBuilt = false;
let containerCreated = false;
let cleanupPromise;
let handlingSignal = false;

function runDocker(
	args,
	{
		allowFailure = false,
		allowDuringShutdown = false,
		timeoutMilliseconds = 0,
	} = {},
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
		let timedOut = false;
		let timeout;
		let forceKillTimeout;

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
			clearTimeout(timeout);
			clearTimeout(forceKillTimeout);
			activeChildren.delete(child);
			if (error) reject(error);
			else resolve(result);
		};
		const timeoutError = (result) =>
			new Error(
				`docker ${args[0]} timed out after ${timeoutMilliseconds}ms`,
				{ cause: result },
			);
		const finishTimeout = (result) => {
			if (allowFailure) finish(undefined, result);
			else finish(timeoutError(result));
		};

		child.on("error", (error) => finish(error));
		child.on("close", (code, signal) => {
			const result = { code, signal, stdout, stderr, timedOut };
			if (timedOut) {
				finishTimeout(result);
				return;
			}
			if (code === 0 || allowFailure) {
				finish(undefined, result);
				return;
			}

			const detail = stderr.trim() || stdout.trim() || `exit code ${code}`;
			finish(
				new Error(`docker ${args[0]} failed: ${detail}`, { cause: result }),
			);
		});

		if (timeoutMilliseconds > 0) {
			timeout = setTimeout(() => {
				timedOut = true;
				child.kill("SIGTERM");
				forceKillTimeout = setTimeout(() => {
					if (child.exitCode === null && child.signalCode === null) {
						child.kill("SIGKILL");
					}
					finishTimeout({
						code: child.exitCode,
						signal: child.signalCode,
						stdout,
						stderr,
						timedOut,
					});
				}, 250);
			}, timeoutMilliseconds);
		}
	});
}

async function removeRuntimeArtifacts() {
	if (!dockerAvailable) return;
	if (cleanupPromise) return cleanupPromise;

	cleanupPromise = (async () => {
		const containerRemoval = await runDocker(
			["rm", "--force", containerName],
			{
				allowFailure: true,
				allowDuringShutdown: true,
				timeoutMilliseconds: cleanupTimeoutMilliseconds,
			},
		);
		const imageRemoval = await runDocker(
			["image", "rm", "--force", imageName],
			{
				allowFailure: true,
				allowDuringShutdown: true,
				timeoutMilliseconds: cleanupTimeoutMilliseconds,
			},
		);
		const cleanupErrors = [];

		if (
			containerRemoval.timedOut ||
			(containerCreated && containerRemoval.code !== 0)
		) {
			cleanupErrors.push(
				containerRemoval.timedOut
					? `container cleanup failed: timed out after ${cleanupTimeoutMilliseconds}ms`
					: `container cleanup failed: ${containerRemoval.stderr.trim() || containerRemoval.stdout.trim()}`,
			);
		}
		if (
			imageRemoval.timedOut ||
			(imageBuilt && imageRemoval.code !== 0)
		) {
			cleanupErrors.push(
				imageRemoval.timedOut
					? `image cleanup failed: timed out after ${cleanupTimeoutMilliseconds}ms`
					: `image cleanup failed: ${imageRemoval.stderr.trim() || imageRemoval.stdout.trim()}`,
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

async function checkRoute(baseUrl, { path, content, redirectTo }, deadline) {
	const remaining = deadline - Date.now();
	if (remaining <= 0) throw new Error("runtime check deadline exceeded");

	const requestUrl = `${baseUrl}${path}`;
	let response = await fetch(requestUrl, {
		redirect: "manual",
		signal: AbortSignal.timeout(Math.min(2_000, remaining)),
	});
	const location = response.headers.get("location");
	if (response.status >= 300 && response.status < 400 && location) {
		const redirectedUrl = new URL(location, requestUrl);
		const redirectedRemaining = deadline - Date.now();
		if (redirectedRemaining <= 0) {
			throw new Error("runtime check deadline exceeded");
		}
		response = await fetch(
			`${baseUrl}${redirectedUrl.pathname}${redirectedUrl.search}`,
			{
				signal: AbortSignal.timeout(Math.min(2_000, redirectedRemaining)),
			},
		);
	}
	if (response.status !== 200) {
		throw new Error(`${path} returned HTTP ${response.status}, expected 200`);
	}

	if (content || redirectTo) {
		const html = await response.text();
		if (content && !html.includes(content)) {
			throw new Error(`${path} did not contain ${JSON.stringify(content)}`);
		}
		if (redirectTo && !html.includes(`url=${redirectTo}`)) {
			throw new Error(`${path} did not redirect to ${redirectTo}`);
		}
	}
}

async function waitForRoutes(baseUrl) {
	const routes = [
		{ path: "/health" },
		{ path: "/it", redirectTo: "/it/docs/" },
		{ path: "/roadmap/", content: "AI that keeps your company moving." },
		{ path: "/roadmap/homun-flow/", content: "Homun Flow" },
		{ path: "/roadmap/client-work/", content: "Client Work" },
		{ path: "/roadmap/mobile-companion/", redirectTo: "/roadmap/homun-mobile" },
		{ path: "/roadmap/shared-spaces/", redirectTo: "/roadmap/team-spaces-roles" },
		{ path: "/roadmap/voice-capture/", redirectTo: "/roadmap/voice-meeting-capture" },
	];
	const deadline = Date.now() + 30_000;
	let lastError;

	while (Date.now() < deadline) {
		const routeResults = await Promise.allSettled(
			routes.map((route) => checkRoute(baseUrl, route, deadline)),
		);
		const failedRoute = routeResults.find((result) => result.status === "rejected");
		if (!failedRoute) return;

		lastError = failedRoute.reason;
		if (Date.now() < deadline) {
			await wait(Math.min(250, deadline - Date.now()));
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

	await runDocker([
		"build",
		"--label",
		ownershipLabel,
		"--tag",
		imageName,
		"--file",
		"Dockerfile",
		".",
	]);
	imageBuilt = true;

	await runDocker([
		"run",
		"--detach",
		"--name",
		containerName,
		"--label",
		ownershipLabel,
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
