import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const dockerfile = await readFile("Dockerfile", "utf8").catch(() => "");
const dockerignore = await readFile(".dockerignore", "utf8").catch(() => "");
const healthEndpoint = await readFile("public/health", "utf8").catch(() => "");

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

console.log("Container deployment contract passed");
