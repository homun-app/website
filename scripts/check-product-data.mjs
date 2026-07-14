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
import * as productDataSync from "./sync-product-data.mjs";

const { fetchProductData, readConfig, writeSnapshots } = productDataSync;

const projectFixture = JSON.parse(
	await readFile(new URL("./fixtures/github-project.json", import.meta.url)),
);
const releaseFixture = JSON.parse(
	await readFile(new URL("./fixtures/github-releases.json", import.meta.url)),
);
const roadmap = normalizeProject(projectFixture);
const checkedInRoadmap = JSON.parse(
	await readFile(new URL("../src/data/roadmap.json", import.meta.url)),
);
const checkedInReleases = JSON.parse(
	await readFile(new URL("../src/data/releases.json", import.meta.url)),
);

assert.equal(roadmap.schemaVersion, 2);
assert.equal(roadmap.fetchedAt, projectFixture.syncedAt);
assert.deepEqual(Object.keys(roadmap), ["schemaVersion", "fetchedAt", "candidates"]);
assert.deepEqual(
	roadmap.candidates.map(({ slug, status, publicationStatus }) => [
		slug,
		status,
		publicationStatus,
	]),
	[
		["shared-spaces", "ideas", "published"],
		["mobile-companion", "next", "published"],
		["apprentice", "building", "review"],
		["connected-actions", "shipped", "published"],
		["voice-capture", "ideas", "draft"],
		["retired-experiment", "ideas", "archived"],
	],
);
assert.equal(roadmap.candidates[0].voting, "open");
assert.equal(roadmap.candidates[0].publicUpdateDate, "2026-07-14");
assert.equal("sourceStatus" in roadmap.candidates[0], false);
assert.equal(roadmap.candidates.filter((candidate) => candidate.featured).length, 1);
assert.equal(roadmap.candidates.find((candidate) => candidate.slug === "voice-capture").votes, 184);
const releases = normalizeReleases(releaseFixture, roadmap.candidates, projectFixture.syncedAt);
assert.equal(releases.items.length, 1);
assert.equal(releases.items[0].version, "v0.1.1055");
assert.deepEqual(releases.items[0].platforms, ["Linux", "macOS", "Windows"]);
assert.deepEqual(releases.items[0].projectSlugs, ["connected-actions"]);

const fetchResponses = [projectFixture, releaseFixture];
const fakeFetch = async () => ({
	ok: true,
	json: async () => structuredClone(fetchResponses.shift()),
});
const fetchedSnapshots = await fetchProductData(
	{
		token: "fixture-token",
		owner: "homun-app",
		projectNumber: 1,
		releasesRepo: "homun-app/homun-releases",
	},
	fakeFetch,
);
assert.equal(fetchedSnapshots.roadmap.candidates.length, 6);
assert.deepEqual(fetchedSnapshots.releases.items, releases.items);
assert.equal(
	productDataSync.formatSyncSummary?.(fetchedSnapshots),
	"Synced 6 roadmap candidates and 1 releases",
);
assert.doesNotThrow(() => validateSnapshot(roadmap, releases));
assert.doesNotThrow(() => validateSnapshot(checkedInRoadmap, checkedInReleases));

const releaseWithoutNotes = structuredClone(releaseFixture);
releaseWithoutNotes[0].body = null;
const normalizedWithoutNotes = normalizeReleases(
	releaseWithoutNotes,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.deepEqual(normalizedWithoutNotes.items[0].highlights, []);
assert.deepEqual(normalizedWithoutNotes.items[0].projectSlugs, []);

const duplicate = structuredClone(roadmap);
duplicate.candidates.push({ ...duplicate.candidates[0] });
assert.throws(() => validateSnapshot(duplicate, releases), /Duplicate roadmap slug/);

function fixtureWithField(name, value, property = "name", nodeIndex = 0) {
	const fixture = structuredClone(projectFixture);
	const fields = fixture.data.organization.projectV2.items.nodes[nodeIndex].fieldValues.nodes;
	const field = fields.find((candidate) => candidate.field.name === name);
	if (value === undefined) {
		fields.splice(fields.indexOf(field), 1);
	} else {
		for (const key of ["name", "text", "number", "date"]) delete field[key];
		field[property] = value;
	}
	return fixture;
}

const missingContent = structuredClone(projectFixture);
missingContent.data.organization.projectV2.items.nodes[0].content = null;
assert.throws(() => normalizeProject(missingContent), /Missing roadmap content/);
assert.throws(() => normalizeProject(fixtureWithField("Slug", "", "text")), /Missing roadmap slug/);
assert.throws(
	() => normalizeProject(fixtureWithField("Slug", "Shared Spaces", "text")),
	/Invalid roadmap slug/,
);
assert.throws(
	() => normalizeProject(fixtureWithField("Public status", "Exploring")),
	/Unknown public status/,
);
assert.throws(
	() => normalizeProject(fixtureWithField("Publication status", "Visible")),
	/Unknown publication status/,
);
assert.throws(
	() => normalizeProject(fixtureWithField("Voting", "Voting")),
	/Unknown voting state/,
);
assert.throws(() => normalizeProject(fixtureWithField("Order", 1.5, "number")), /Invalid order/);
assert.throws(() => normalizeProject(fixtureWithField("Progress", 101, "number")), /Invalid progress/);
assert.throws(
	() => normalizeProject(fixtureWithField("Public update date", undefined)),
	/Missing public update date/,
);
const duplicateSlug = structuredClone(projectFixture);
const secondFields = duplicateSlug.data.organization.projectV2.items.nodes[1].fieldValues.nodes;
secondFields.find((field) => field.field.name === "Slug").text = "shared-spaces";
assert.throws(() => normalizeProject(duplicateSlug), /Duplicate roadmap slug/);

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
assert.equal(JSON.parse(await readFile(roadmapPath, "utf8")).candidates.length, 6);
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
