import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const dockerfile = await readFile("Dockerfile", "utf8").catch(() => "");
const dockerignore = await readFile(".dockerignore", "utf8").catch(() => "");
const healthEndpoint = await readFile("public/health", "utf8").catch(() => "");
const runtimeCheck = await readFile(
	"scripts/check-container-runtime.mjs",
	"utf8",
).catch(() => "");

assert.match(dockerfile, /^FROM node:24-alpine AS build$/m);
assert.match(dockerfile, /^RUN npm ci$/m);
assert.match(dockerfile, /^RUN npm run build$/m);
assert.match(dockerfile, /^FROM nginx:alpine$/m);
assert.match(
	dockerfile,
	/^COPY --from=build \/app\/dist \/usr\/share\/nginx\/html$/m,
);
assert.match(dockerfile, /^EXPOSE 80$/m);

for (const ignoredPath of ["node_modules", "dist", ".git"]) {
	assert.ok(
		dockerignore.split("\n").includes(ignoredPath),
		`.dockerignore must exclude ${ignoredPath}`,
	);
}

assert.equal(
	healthEndpoint,
	"ok\n",
	"public/health must provide the container health response",
);
assert.match(
	runtimeCheck,
	/const routeResults = await Promise\.allSettled\(/,
	"runtime route polling must settle every fetch attempt",
);
assert.match(
	runtimeCheck,
	/await wait\(Math\.min\(250, deadline - Date\.now\(\)\)\)/,
	"runtime route polling must not sleep past its deadline",
);
for (const route of [
	'/roadmap/", content: "Homun turns requests, messages and recurring work',
	'/roadmap/homun-flow/", content: "Homun Flow',
	'/roadmap/client-work/", content: "Client Work',
	'/roadmap/mobile-companion/", redirectTo: "/roadmap/homun-mobile"',
	'/roadmap/shared-spaces/", redirectTo: "/roadmap/team-spaces-roles"',
	'/roadmap/voice-capture/", redirectTo: "/roadmap/voice-meeting-capture"',
]) {
	assert.ok(runtimeCheck.includes(route), `runtime smoke test must cover ${route}`);
}
assert.doesNotMatch(runtimeCheck, /roadmap\/apprentice/);

console.log("Container deployment contract passed");
