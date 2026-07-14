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
import { applyPublicationPolicy } from "./lib/publication-policy.mjs";
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

const publishedApprentice = {
	slug: "apprentice",
	title: "Apprentice",
	status: "building",
	area: "AI",
	description: "Teach Homun repeatable local workflows.",
	capabilities: ["Learn from approved examples", "Keep private context local"],
	featured: true,
	progress: 62,
	targetRelease: "v0.2",
	publicUpdate: "The first guided workflow is under active development.",
	publicUpdateDate: "2026-07-13",
	voting: "open",
	order: 30,
	updatedAt: "2026-07-13T09:30:00.000Z",
	githubUrl: "https://github.com/homun-app/homun/issues/30",
	issueNumber: 30,
	votes: 42,
	underReview: false,
};
const previous = {
	schemaVersion: 2,
	contentUpdatedAt: "2026-07-13T10:00:00.000Z",
	items: [publishedApprentice],
};
const { underReview: _approvedReviewState, ...apprenticeCandidateFields } = publishedApprentice;
const unchangedApprenticePublished = {
	...apprenticeCandidateFields,
	publicationStatus: "published",
};
const changedApprentice = {
	...unchangedApprenticePublished,
	title: "Apprentice, redesigned",
	status: "next",
	description: "Candidate copy that must not leak before approval.",
	capabilities: ["Unapproved capability"],
	featured: false,
	progress: 95,
	targetRelease: "v0.3",
	publicUpdate: "Unapproved update",
	publicUpdateDate: "2026-07-14",
	voting: "closed",
	order: 1,
	updatedAt: "2026-07-14T08:00:00.000Z",
	archiveReason: "internal-only",
	projectItemId: "PVTI_internal",
	labels: ["private-metadata"],
};
const draftCandidate = { ...changedApprentice, publicationStatus: "draft" };
const newDraftCandidate = {
	...unchangedApprenticePublished,
	slug: "future-memory",
	title: "Future Memory",
	order: 10,
	publicationStatus: "draft",
};
const newReviewCandidate = {
	...unchangedApprenticePublished,
	slug: "quiet-mode",
	title: "Quiet Mode",
	order: 20,
	publicationStatus: "review",
};
const newPublishedCandidate = {
	...unchangedApprenticePublished,
	slug: "connected-actions",
	title: "Connected Actions",
	order: 20,
	publicationStatus: "published",
	archiveReason: "must-not-leak",
	projectItemId: "PVTI_new",
	labels: ["internal"],
};

assert.deepEqual(applyPublicationPolicy(previous, [draftCandidate]).items, previous.items);
assert.deepEqual(
	applyPublicationPolicy(previous, [unchangedApprenticePublished, newDraftCandidate]).items,
	previous.items,
);
assert.deepEqual(
	applyPublicationPolicy(previous, [unchangedApprenticePublished, newReviewCandidate]).items,
	previous.items,
);
assert.deepEqual(
	applyPublicationPolicy(previous, [
		{ ...changedApprentice, publicationStatus: "review" },
	]).items,
	[{ ...publishedApprentice, underReview: true }],
);
assert.equal(
	applyPublicationPolicy(previous, [
		{ ...changedApprentice, publicationStatus: "published" },
	]).items[0].title,
	changedApprentice.title,
);
assert.equal(
	applyPublicationPolicy(previous, [
		{ ...changedApprentice, publicationStatus: "published" },
	]).items[0].underReview,
	false,
);
assert.deepEqual(
	applyPublicationPolicy(previous, [
		{ ...changedApprentice, publicationStatus: "archived" },
	]).items,
	[],
);
assert.throws(() => applyPublicationPolicy(previous, []), /missing from Project source/i);

const publishedWithNewItem = applyPublicationPolicy(previous, [
	unchangedApprenticePublished,
	newPublishedCandidate,
]);
assert.equal(publishedWithNewItem.items[0].title, "Connected Actions");
assert.deepEqual(Object.keys(publishedWithNewItem.items[0]), [
	"slug",
	"title",
	"status",
	"area",
	"description",
	"capabilities",
	"featured",
	"progress",
	"targetRelease",
	"publicUpdate",
	"publicUpdateDate",
	"voting",
	"order",
	"updatedAt",
	"githubUrl",
	"issueNumber",
	"votes",
	"underReview",
]);
assert.equal(publishedWithNewItem.items[0].underReview, false);
assert.equal("publicationStatus" in publishedWithNewItem.items[0], false);
assert.equal("archiveReason" in publishedWithNewItem.items[0], false);
assert.equal("projectItemId" in publishedWithNewItem.items[0], false);
assert.equal("labels" in publishedWithNewItem.items[0], false);

const alphaPublishedCandidate = {
	...newPublishedCandidate,
	slug: "alpha-action",
	title: "Alpha Action",
};
assert.deepEqual(
	applyPublicationPolicy(previous, [
		unchangedApprenticePublished,
		newPublishedCandidate,
		alphaPublishedCandidate,
	]).items.map(({ slug }) => slug),
	["alpha-action", "connected-actions", "apprentice"],
);
assert.throws(
	() =>
		applyPublicationPolicy(
			previous,
			[unchangedApprenticePublished, { ...unchangedApprenticePublished }],
			{ allowMissing: true },
		),
	/Duplicate roadmap candidate slug: apprentice/,
);
assert.throws(
	() =>
		applyPublicationPolicy(
			previous,
			[{ ...unchangedApprenticePublished, publicationStatus: "private" }],
			{ allowMissing: true },
		),
	/Unknown publication status: private/,
);
assert.deepEqual(applyPublicationPolicy(previous, [], { allowMissing: true }).items, previous.items);
assert.deepEqual(applyPublicationPolicy(previous, [unchangedApprenticePublished]), {
	schemaVersion: 2,
	contentUpdatedAt: previous.contentUpdatedAt,
	items: [publishedApprentice],
});

function assertRecordsAreIsolated(label, source, result) {
	const sourceTitle = source.title;
	const sourceCapabilities = [...source.capabilities];
	const resultCapabilities = [...result.capabilities];

	result.title = `${label} result mutation`;
	result.capabilities.push(`${label} result mutation`);
	assert.equal(source.title, sourceTitle, `${label} result title must not alias its input`);
	assert.deepEqual(
		source.capabilities,
		sourceCapabilities,
		`${label} result capabilities must not alias its input`,
	);

	source.title = `${label} input mutation`;
	source.capabilities.push(`${label} input mutation`);
	assert.equal(result.title, `${label} result mutation`, `${label} input must not change result`);
	assert.deepEqual(
		result.capabilities,
		[...resultCapabilities, `${label} result mutation`],
		`${label} input capabilities must not change result`,
	);
}

const draftIsolationPrevious = structuredClone(previous);
const draftIsolationCandidate = structuredClone(draftCandidate);
const draftIsolationResult = applyPublicationPolicy(draftIsolationPrevious, [
	draftIsolationCandidate,
]);
assertRecordsAreIsolated(
	"Draft",
	draftIsolationPrevious.items[0],
	draftIsolationResult.items[0],
);
draftIsolationCandidate.title = "Draft candidate input mutation";
draftIsolationCandidate.capabilities.push("Draft candidate input mutation");
assert.equal(draftIsolationResult.items[0].title, "Draft result mutation");
assert.deepEqual(draftIsolationResult.items[0].capabilities, [
	...publishedApprentice.capabilities,
	"Draft result mutation",
]);

const reviewIsolationPrevious = structuredClone(previous);
const reviewIsolationCandidate = {
	...structuredClone(changedApprentice),
	publicationStatus: "review",
};
const reviewIsolationResult = applyPublicationPolicy(reviewIsolationPrevious, [
	reviewIsolationCandidate,
]);
assertRecordsAreIsolated(
	"Review",
	reviewIsolationPrevious.items[0],
	reviewIsolationResult.items[0],
);
reviewIsolationCandidate.title = "Review candidate input mutation";
reviewIsolationCandidate.capabilities.push("Review candidate input mutation");
assert.equal(reviewIsolationResult.items[0].title, "Review result mutation");
assert.deepEqual(reviewIsolationResult.items[0].capabilities, [
	...publishedApprentice.capabilities,
	"Review result mutation",
]);

const publishedIsolationPrevious = structuredClone(previous);
const publishedIsolationCandidate = {
	...structuredClone(changedApprentice),
	publicationStatus: "published",
};
const publishedIsolationResult = applyPublicationPolicy(publishedIsolationPrevious, [
	publishedIsolationCandidate,
]);
assertRecordsAreIsolated(
	"Published",
	publishedIsolationCandidate,
	publishedIsolationResult.items[0],
);

const missingIsolationPrevious = structuredClone(previous);
const missingIsolationResult = applyPublicationPolicy(missingIsolationPrevious, [], {
	allowMissing: true,
});
assertRecordsAreIsolated(
	"allowMissing",
	missingIsolationPrevious.items[0],
	missingIsolationResult.items[0],
);

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
