import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	normalizeProject,
	normalizeReleases,
	validateSnapshot,
} from "./lib/github-product-data.mjs";
import { readConfig, writeSnapshots } from "./sync-product-data.mjs";

const projectFixture = JSON.parse(
	await readFile(new URL("./fixtures/github-project.json", import.meta.url)),
);
const releaseFixture = JSON.parse(
	await readFile(new URL("./fixtures/github-releases.json", import.meta.url)),
);
const roadmap = normalizeProject(projectFixture);
const releases = normalizeReleases(releaseFixture, roadmap.items, projectFixture.syncedAt);
const checkedInRoadmap = JSON.parse(
	await readFile(new URL("../src/data/roadmap.json", import.meta.url)),
);
const checkedInReleases = JSON.parse(
	await readFile(new URL("../src/data/releases.json", import.meta.url)),
);

assert.equal(roadmap.schemaVersion, 1);
assert.equal(roadmap.items.some((item) => item.slug === "private-internal-work"), false);
assert.equal(roadmap.items.filter((item) => item.featured).length, 1);
assert.deepEqual(
	roadmap.items.map((item) => item.status),
	["exploring", "next", "building", "shipped", "exploring"],
);
assert.equal(roadmap.items.find((item) => item.slug === "voice-capture").votes, 184);
assert.equal(releases.items.length, 1);
assert.equal(releases.items[0].version, "v0.1.1055");
assert.deepEqual(releases.items[0].platforms, ["Linux", "macOS", "Windows"]);
assert.deepEqual(releases.items[0].projectSlugs, ["connected-actions"]);
assert.doesNotThrow(() => validateSnapshot(roadmap, releases));
assert.doesNotThrow(() => validateSnapshot(checkedInRoadmap, checkedInReleases));

const duplicate = structuredClone(roadmap);
duplicate.items.push({ ...duplicate.items[0] });
assert.throws(() => validateSnapshot(duplicate, releases), /Duplicate roadmap slug/);

assert.throws(
	() => readConfig({ HOMUN_PROJECT_NUMBER: "1" }),
	/Missing HOMUN_GITHUB_TOKEN/,
);
assert.throws(
	() => readConfig({ HOMUN_GITHUB_TOKEN: "secret" }),
	/Missing HOMUN_PROJECT_NUMBER/,
);

const tempRoot = await mkdtemp(join(tmpdir(), "homun-product-data-"));
const roadmapPath = join(tempRoot, "roadmap.json");
const releasesPath = join(tempRoot, "releases.json");
await writeFile(roadmapPath, "original-roadmap\n");
await writeFile(releasesPath, "original-releases\n");
await assert.rejects(
	writeSnapshots(duplicate, releases, { roadmapPath, releasesPath }),
	/Duplicate roadmap slug/,
);
assert.equal(await readFile(roadmapPath, "utf8"), "original-roadmap\n");
assert.equal(await readFile(releasesPath, "utf8"), "original-releases\n");
await writeSnapshots(roadmap, releases, { roadmapPath, releasesPath });
assert.equal(JSON.parse(await readFile(roadmapPath, "utf8")).items.length, 5);
assert.equal(JSON.parse(await readFile(releasesPath, "utf8")).items.length, 1);
await rm(tempRoot, { recursive: true, force: true });

const workflow = await readFile(
	new URL("../.github/workflows/sync-product-data.yml", import.meta.url),
	"utf8",
);
for (const required of [
	"workflow_dispatch:",
	"schedule:",
	"HOMUN_PROJECT_NUMBER",
	"npm run sync:product-data",
	"git diff --quiet -- src/data/roadmap.json src/data/releases.json",
]) {
	assert.ok(workflow.includes(required), `Product sync workflow is missing: ${required}`);
}

console.log("Product data contract passed");
