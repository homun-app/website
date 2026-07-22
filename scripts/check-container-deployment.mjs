import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const dockerfile = await readFile("Dockerfile", "utf8").catch(() => "");
const dockerignore = await readFile(".dockerignore", "utf8").catch(() => "");
const healthEndpoint = await readFile("public/health", "utf8").catch(() => "");
const nginxConfig = await readFile("nginx/default.conf", "utf8").catch(() => "");
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
assert.match(
	dockerfile,
	/^COPY nginx\/default\.conf \/etc\/nginx\/conf\.d\/default\.conf$/m,
	"Docker image must install the Homun nginx server configuration",
);
assert.match(dockerfile, /^EXPOSE 80$/m);

assert.match(
	nginxConfig,
	/^\s*error_page\s+404\s+\/404\.html\s*;\s*$/m,
	"nginx must map missing paths to the generated Homun 404 page",
);
assert.doesNotMatch(
	nginxConfig,
	/error_page\s+404\s+=\s*200/i,
	"custom 404 mapping must preserve the HTTP 404 status",
);
assert.match(
	nginxConfig,
	/location\s*=\s*\/404\.html\s*{[^}]*\binternal\s*;/s,
	"generated 404 page must be served through an internal error location",
);
assert.match(
	nginxConfig,
	/try_files\s+\$uri\s+\$uri\/\s+=404\s*;/,
	"nginx must preserve static files and directory redirects before returning 404",
);

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
assert.match(
	runtimeCheck,
	/redirect:\s*"manual"/,
	"runtime smoke test must inspect redirects manually",
);
assert.match(
	runtimeCheck,
	/response\.headers\.get\("location"\)/,
	"runtime smoke test must parse the HTTP Location header",
);
for (const route of [
	'/it", redirectTo: "/it/docs/"',
	'/roadmap/", content: "AI that keeps your company moving.',
	'/roadmap/homun-flow/", content: "Homun Flow',
	'/roadmap/client-work/", content: "Client Work',
	'/roadmap/mobile-companion/", redirectTo: "/roadmap/homun-mobile"',
	'/roadmap/shared-spaces/", redirectTo: "/roadmap/team-spaces-roles"',
	'/roadmap/voice-capture/", redirectTo: "/roadmap/voice-meeting-capture"',
	'path: "/visitor@example.com/private-workspace"',
	'expectedStatus: 404',
	'"Page not found."',
	'\'href="/privacy/"\'',
]) {
	assert.ok(runtimeCheck.includes(route), `runtime smoke test must cover ${route}`);
}
assert.doesNotMatch(
	runtimeCheck,
	/SKIP: Docker unavailable/,
	"real container smoke test must fail rather than skip when Docker is unavailable",
);
assert.doesNotMatch(runtimeCheck, /roadmap\/apprentice/);

console.log("Container deployment contract passed");
