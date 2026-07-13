import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
	normalizeProject,
	normalizeReleases,
	validateSnapshot,
} from "./lib/github-product-data.mjs";

const projectFixture = JSON.parse(
	await readFile(new URL("./fixtures/github-project.json", import.meta.url)),
);
const releaseFixture = JSON.parse(
	await readFile(new URL("./fixtures/github-releases.json", import.meta.url)),
);
const roadmap = normalizeProject(projectFixture);
const releases = normalizeReleases(releaseFixture, roadmap.items, projectFixture.syncedAt);

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

const duplicate = structuredClone(roadmap);
duplicate.items.push({ ...duplicate.items[0] });
assert.throws(() => validateSnapshot(duplicate, releases), /Duplicate roadmap slug/);

console.log("Product data contract passed");
