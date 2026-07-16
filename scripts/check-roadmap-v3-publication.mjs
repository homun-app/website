import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeProject } from "./lib/github-product-data.mjs";
import * as publicationModule from "./lib/publication-policy.mjs";
import { parseSyncArgs } from "./sync-product-data.mjs";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const projectFixture = await readJson("./fixtures/roadmap-v3-project.json");
const preview = await readJson("./fixtures/roadmap-v3-preview.json");
const previousV2 = await readJson("./fixtures/public-roadmap-v2.json");
const manifest = await readJson("./fixtures/roadmap-v3-manifest.json");
const normalized = normalizeProject(projectFixture);

assert.equal(typeof publicationModule.upgradePublishedRoadmap, "function");

function publicRecord(candidate) {
	const { publicationStatus, updatedAt, ...record } = candidate;
	return { ...structuredClone(record), underReview: false };
}

const previous = {
	schemaVersion: 3,
	contentUpdatedAt: "2026-07-16T08:00:00.000Z",
	items: normalized.candidates.map(publicRecord),
};

const reviewCandidates = structuredClone(normalized.candidates);
reviewCandidates[0].publicationStatus = "review";
reviewCandidates[0].outcome = "Unapproved changed outcome";
reviewCandidates[0].milestones[0].completed = false;
const reviewed = publicationModule.applyPublicationPolicy(previous, reviewCandidates);
assert.equal(reviewed.schemaVersion, 3);
assert.equal(reviewed.items[0].outcome, previous.items[0].outcome);
assert.deepEqual(reviewed.items[0].milestones, previous.items[0].milestones);
assert.equal(reviewed.items[0].underReview, true);

const publishedCandidates = structuredClone(normalized.candidates);
publishedCandidates[0].outcome = "Approved changed outcome";
const published = publicationModule.applyPublicationPolicy(previous, publishedCandidates);
assert.equal(published.items[0].outcome, "Approved changed outcome");
assert.equal(published.items[0].underReview, false);

const archivedCandidates = structuredClone(normalized.candidates);
archivedCandidates[1].publicationStatus = "archived";
const archived = publicationModule.applyPublicationPolicy(previous, archivedCandidates);
assert.equal(archived.items.some(({ slug }) => slug === "client-work"), false);

const newReview = structuredClone(normalized.candidates[1]);
newReview.slug = "new-review";
newReview.title = "New review";
newReview.publicationStatus = "review";
const hiddenReview = publicationModule.applyPublicationPolicy(previous, [
	...normalized.candidates,
	newReview,
]);
assert.equal(hiddenReview.items.some(({ slug }) => slug === "new-review"), false);

const upgradeCandidates = preview.items.map((item, index) => {
	const { underReview, ...candidate } = structuredClone(item);
	return {
		...candidate,
		publicationStatus: "published",
		updatedAt: `2026-07-16T10:${String(index).padStart(2, "0")}:00Z`,
		githubUrl: `https://github.com/homun-app/homun/issues/${200 + index}`,
		issueNumber: 200 + index,
	};
});
const upgraded = publicationModule.upgradePublishedRoadmap(previousV2, upgradeCandidates, manifest);
assert.equal(upgraded.schemaVersion, 3);
assert.equal(upgraded.items.length, 13);
assert.equal(upgraded.items.filter(({ itemType }) => itemType === "strategic_program").length, 8);
assert.equal(upgraded.items.filter(({ itemType }) => itemType === "workflow_idea").length, 5);

const missingCandidate = upgradeCandidates.slice(1);
assert.throws(
	() => publicationModule.upgradePublishedRoadmap(previousV2, missingCandidate, manifest),
	/Missing roadmap v3 candidate/,
);
const reviewDuringUpgrade = structuredClone(upgradeCandidates);
reviewDuringUpgrade[0].publicationStatus = "review";
assert.throws(
	() => publicationModule.upgradePublishedRoadmap(previousV2, reviewDuringUpgrade, manifest),
	/All roadmap v3 candidates must be Published/,
);

assert.deepEqual(parseSyncArgs(["--dry-run", "--allow-schema-upgrade"]), {
	mode: "dry-run",
	allowEmpty: false,
	allowSchemaUpgrade: true,
});
assert.deepEqual(parseSyncArgs(["--write", "--allow-schema-upgrade"]), {
	mode: "write",
	allowEmpty: false,
	allowSchemaUpgrade: true,
});
assert.throws(
	() => parseSyncArgs(["--write", "--allow-empty", "--allow-schema-upgrade"]),
	/Cannot combine --allow-empty and --allow-schema-upgrade/,
);

console.log("Roadmap v3 publication and schema upgrade contract passed");
