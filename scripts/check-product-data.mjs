import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
	mkdtemp,
	readdir,
	rename as fsRename,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	normalizeProject,
	normalizeReleases,
	validateSnapshot,
} from "./lib/github-product-data.mjs";
import { applyPublicationPolicy } from "./lib/publication-policy.mjs";
import {
	hasSemanticChanges,
	persistSnapshotPair,
	semanticSnapshot,
} from "./lib/snapshot-store.mjs";
import * as productDataSync from "./sync-product-data.mjs";

const {
	fetchProductData,
	formatSyncSummary,
	parseSyncArgs,
	readConfig,
	syncProductData,
	writeSnapshots,
} = productDataSync;

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
const publicRoadmap = applyPublicationPolicy(
	{
		schemaVersion: 2,
		contentUpdatedAt: projectFixture.syncedAt,
		items: [],
	},
	roadmap.candidates,
);
assert.deepEqual(
	publicRoadmap.items.map(({ slug }) => slug),
	["shared-spaces", "mobile-companion", "connected-actions"],
);

const semanticCurrent = {
	roadmap: {
		schemaVersion: 2,
		contentUpdatedAt: "2026-07-13T10:00:00.000Z",
		items: [
			{
				slug: "apprentice",
				votes: 42,
				underReview: true,
				publicUpdateDate: "2026-07-13",
			},
		],
	},
	releases: {
		schemaVersion: 1,
		syncedAt: "2026-07-13T10:00:00.000Z",
		items: [{ version: "v1", checkedAt: "2026-07-13T10:00:00.000Z" }],
	},
};
const timestampOnly = {
	releases: {
		items: [{ checkedAt: "2026-07-14T10:00:00.000Z", version: "v1" }],
		syncedAt: "2026-07-14T10:00:00.000Z",
		schemaVersion: 1,
	},
	roadmap: {
		items: [
			{
				publicUpdateDate: "2026-07-13",
				underReview: true,
				votes: 42,
				slug: "apprentice",
			},
		],
		contentUpdatedAt: "2026-07-14T10:00:00.000Z",
		fetchedAt: "2026-07-14T10:00:00.000Z",
		schemaVersion: 2,
	},
};
assert.deepEqual(semanticSnapshot(timestampOnly), {
	releases: { items: [{ version: "v1" }], schemaVersion: 1 },
	roadmap: {
		items: [
			{
				publicUpdateDate: "2026-07-13",
				slug: "apprentice",
				underReview: true,
				votes: 42,
			},
		],
		schemaVersion: 2,
	},
});
assert.equal(hasSemanticChanges(semanticCurrent, timestampOnly), false);
assert.equal(hasSemanticChanges(semanticCurrent.roadmap, timestampOnly.roadmap), false);
const changedVotes = structuredClone(timestampOnly);
changedVotes.roadmap.items[0].votes = 43;
assert.equal(hasSemanticChanges(semanticCurrent, changedVotes), true);
const changedRelease = structuredClone(timestampOnly);
changedRelease.releases.items[0].version = "v2";
assert.equal(hasSemanticChanges(semanticCurrent, changedRelease), true);
const reorderedArray = structuredClone(timestampOnly);
reorderedArray.releases.items.push({ version: "v0" });
assert.equal(
	hasSemanticChanges(
		{
			...semanticCurrent,
			releases: {
				...semanticCurrent.releases,
				items: [{ version: "v0" }, ...semanticCurrent.releases.items],
			},
		},
		reorderedArray,
	),
	true,
);

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
const fetchConfig = {
	token: "fixture-token",
	owner: "homun-app",
	projectNumber: 1,
	releasesRepo: "homun-app/homun-releases",
};
async function fetchFrom(payloads) {
	const queue = structuredClone(payloads);
	return fetchProductData(
		fetchConfig,
		async () => ({ ok: true, json: async () => queue.shift() }),
		() => "2026-07-14T15:00:00.000Z",
	);
}
await assert.rejects(
	fetchFrom([{ data: { organization: null } }]),
	/GitHub organization not found: homun-app/,
);
await assert.rejects(
	fetchFrom([{ data: { organization: { projectV2: null } } }]),
	/GitHub Project 1 not found/,
);
await assert.rejects(
	fetchFrom([{ data: { organization: { projectV2: {} } } }]),
	/GitHub Project response is missing items.nodes/,
);
await assert.rejects(
	fetchFrom([{ data: { organization: { projectV2: { items: {} } } } }]),
	/GitHub Project response is missing items.nodes/,
);
assert.doesNotThrow(() => validateSnapshot(roadmap, releases));
assert.doesNotThrow(() => validateSnapshot(publicRoadmap, releases));
assert.doesNotThrow(() => validateSnapshot(checkedInRoadmap, checkedInReleases));
for (const invalidProjectSlug of ["", 1055, "Shared Spaces"]) {
	const releaseWithInvalidProjectSlug = structuredClone(releases);
	releaseWithInvalidProjectSlug.items[0].projectSlugs = [invalidProjectSlug];
	assert.throws(
		() => validateSnapshot(publicRoadmap, releaseWithInvalidProjectSlug),
		/Invalid project slugs in release v0.1.1055/,
	);
}
const releaseWithNonArrayProjectSlugs = structuredClone(releases);
releaseWithNonArrayProjectSlugs.items[0].projectSlugs = "connected-actions";
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithNonArrayProjectSlugs),
	/Invalid project slugs in release v0.1.1055/,
);
assert.throws(
	() => validateSnapshot(roadmap, { schemaVersion: 1, items: [null] }),
	/Invalid release item/,
);
const releaseWithNonStringVersion = structuredClone(releases);
releaseWithNonStringVersion.items[0].version = 1055;
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithNonStringVersion),
	/Invalid release version/,
);
const releaseWithEmptyVersion = structuredClone(releases);
releaseWithEmptyVersion.items[0].version = "";
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithEmptyVersion),
	/Invalid release version/,
);
assert.throws(
	() => validateSnapshot(roadmap, { schemaVersion: 1, items: {} }),
	/Invalid releases snapshot shape/,
);
assert.throws(
	() => validateSnapshot(roadmap, { schemaVersion: 1 }),
	/Invalid releases snapshot shape/,
);
assert.throws(
	() => validateSnapshot({ schemaVersion: 1, items: {} }, releases),
	/Invalid roadmap snapshot shape/,
);
assert.throws(
	() => validateSnapshot({ schemaVersion: 2 }, releases),
	/Invalid roadmap snapshot shape/,
);
const ambiguousV2Roadmap = structuredClone(roadmap);
ambiguousV2Roadmap.items = structuredClone(publicRoadmap.items);
assert.throws(
	() => validateSnapshot(ambiguousV2Roadmap, releases),
	/Invalid roadmap snapshot shape/,
);

const releaseWithoutNotes = structuredClone(releaseFixture);
releaseWithoutNotes[0].body = null;
const normalizedWithoutNotes = normalizeReleases(
	releaseWithoutNotes,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.deepEqual(normalizedWithoutNotes.items[0].highlights, []);
assert.deepEqual(normalizedWithoutNotes.items[0].projectSlugs, []);
const publicRoadmapWithoutShippedItems = structuredClone(publicRoadmap);
publicRoadmapWithoutShippedItems.items.find(
	(item) => item.slug === "connected-actions",
).status = "building";
assert.doesNotThrow(() =>
	validateSnapshot(publicRoadmapWithoutShippedItems, normalizedWithoutNotes),
);
const rawCandidatesWithUnpublishedShippedItem = structuredClone(roadmap);
rawCandidatesWithUnpublishedShippedItem.candidates.find(
	(candidate) => candidate.slug === "connected-actions",
).status = "building";
rawCandidatesWithUnpublishedShippedItem.candidates.find(
	(candidate) => candidate.slug === "apprentice",
).status = "shipped";
assert.doesNotThrow(() =>
	validateSnapshot(rawCandidatesWithUnpublishedShippedItem, normalizedWithoutNotes),
);
const prereleaseLinkFixture = structuredClone(releaseFixture);
prereleaseLinkFixture[0].body = "## Highlights\n- Published release without a roadmap link";
prereleaseLinkFixture[1].draft = false;
prereleaseLinkFixture[1].prerelease = true;
prereleaseLinkFixture[1].published_at = "2026-07-14T08:00:00Z";
prereleaseLinkFixture[1].body = "Roadmap: connected-actions";
const releasesWithPrereleaseLink = normalizeReleases(
	prereleaseLinkFixture,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.equal(releasesWithPrereleaseLink.items.length, 1);
assert.deepEqual(releasesWithPrereleaseLink.items[0].projectSlugs, []);
assert.throws(
	() => validateSnapshot(publicRoadmap, releasesWithPrereleaseLink),
	/Shipped roadmap item has no published release: connected-actions/,
);
const duplicateReleaseLinkFixture = structuredClone(releaseFixture);
duplicateReleaseLinkFixture[0].body =
	"## Highlights\n- Duplicate roadmap reference\n\nRoadmap:  connected-actions, , connected-actions  ";
const releaseWithDuplicateSlug = normalizeReleases(
	duplicateReleaseLinkFixture,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.deepEqual(releaseWithDuplicateSlug.items[0].projectSlugs, [
	"connected-actions",
	"connected-actions",
]);
assert.doesNotThrow(() => validateSnapshot(roadmap, releaseWithDuplicateSlug));
assert.doesNotThrow(() => validateSnapshot(checkedInRoadmap, releaseWithDuplicateSlug));
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithDuplicateSlug),
	/Duplicate roadmap slug in release v0.1.1055: connected-actions/,
);
const unknownDuplicateReleaseLinkFixture = structuredClone(releaseFixture);
unknownDuplicateReleaseLinkFixture[0].body = "Roadmap: ghost, ghost";
const releaseWithUnknownDuplicateSlug = normalizeReleases(
	unknownDuplicateReleaseLinkFixture,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.deepEqual(releaseWithUnknownDuplicateSlug.items[0].projectSlugs, ["ghost", "ghost"]);
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithUnknownDuplicateSlug),
	/Duplicate roadmap slug in release v0.1.1055: ghost/,
);
const draftLinkFixture = structuredClone(releaseFixture);
draftLinkFixture[0].body = "## Highlights\n- Published release without a roadmap link";
draftLinkFixture[1].published_at = "2026-07-14T08:00:00Z";
draftLinkFixture[1].body = "Roadmap: connected-actions";
const releasesWithDraftLink = normalizeReleases(
	draftLinkFixture,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.equal(releasesWithDraftLink.items.length, 1);
assert.deepEqual(releasesWithDraftLink.items[0].projectSlugs, []);
const shippedLinkedOnlyFromDraft = structuredClone(publicRoadmap);
assert.throws(
	() => validateSnapshot(shippedLinkedOnlyFromDraft, releasesWithDraftLink),
	/Shipped roadmap item has no published release: connected-actions/,
);
const releaseWithUnknownSlugFixture = structuredClone(releaseFixture);
releaseWithUnknownSlugFixture[0].tag_name = "v0.1.1056";
releaseWithUnknownSlugFixture[0].name = "0.1.1056";
releaseWithUnknownSlugFixture[0].body =
	"## Highlights\n- Release with an invalid roadmap reference\n\nRoadmap: shared-spaces, missing-project, connected-actions";
const releaseWithUnknownSlug = normalizeReleases(
	releaseWithUnknownSlugFixture,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithUnknownSlug),
	/Unknown roadmap slug in release v0.1.1056: missing-project/,
);
assert.deepEqual(releaseWithUnknownSlug.items[0].projectSlugs, [
	"shared-spaces",
	"missing-project",
	"connected-actions",
]);
const shippedWithoutPublishedRelease = structuredClone(publicRoadmap);
assert.throws(
	() => validateSnapshot(shippedWithoutPublishedRelease, normalizedWithoutNotes),
	/Shipped roadmap item has no published release: connected-actions/,
);

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
assert.deepEqual(parseSyncArgs([]), { mode: "dry-run", allowEmpty: false });
assert.deepEqual(parseSyncArgs(["--dry-run"]), { mode: "dry-run", allowEmpty: false });
assert.deepEqual(parseSyncArgs(["--write"]), { mode: "write", allowEmpty: false });
assert.deepEqual(parseSyncArgs(["--write", "--allow-empty"]), {
	mode: "write",
	allowEmpty: true,
});
assert.throws(() => parseSyncArgs(["--wat"]), /Unknown option: --wat/);
assert.throws(
	() => parseSyncArgs(["--dry-run", "--write"]),
	/Cannot combine --dry-run and --write/,
);
assert.throws(
	() => parseSyncArgs(["--allow-empty"]),
	/--allow-empty requires --write/,
);

const tempRoot = await mkdtemp(join(tmpdir(), "homun-product-data-"));
const roadmapPath = join(tempRoot, "roadmap.json");
const releasesPath = join(tempRoot, "releases.json");
await writeFile(roadmapPath, "original-roadmap\n");
await writeFile(releasesPath, "original-releases\n");
const tenRoadmapItems = Array.from({ length: 10 }, (_, index) => ({
	...publishedApprentice,
	slug: `roadmap-item-${index + 1}`,
	title: `Roadmap item ${index + 1}`,
	featured: false,
	order: index + 1,
}));
const nonEmptyCurrentPair = {
	roadmap: {
		schemaVersion: 2,
		contentUpdatedAt: "2026-07-13T10:00:00.000Z",
		items: tenRoadmapItems,
	},
	releases: { schemaVersion: 1, syncedAt: "2026-07-13T10:00:00.000Z", items: [] },
};
const emptyCandidatePair = {
	roadmap: {
		schemaVersion: 2,
		contentUpdatedAt: "2026-07-14T10:00:00.000Z",
		items: [],
	},
	releases: { schemaVersion: 1, syncedAt: "2026-07-14T10:00:00.000Z", items: [] },
};
await assert.rejects(
	persistSnapshotPair(
		nonEmptyCurrentPair,
		emptyCandidatePair,
		{ roadmapPath, releasesPath },
	),
	/refusing to replace 10 roadmap items with zero/i,
);
assert.equal(await readFile(roadmapPath, "utf8"), "original-roadmap\n");
assert.equal(await readFile(releasesPath, "utf8"), "original-releases\n");
const timestampOnlyCandidatePair = structuredClone(nonEmptyCurrentPair);
timestampOnlyCandidatePair.roadmap.contentUpdatedAt = "2026-07-14T10:00:00.000Z";
timestampOnlyCandidatePair.releases.syncedAt = "2026-07-14T10:00:00.000Z";
const beforeNoOpStats = await Promise.all([
	stat(roadmapPath, { bigint: true }),
	stat(releasesPath, { bigint: true }),
]);
assert.deepEqual(
	await persistSnapshotPair(
		nonEmptyCurrentPair,
		timestampOnlyCandidatePair,
		{ roadmapPath, releasesPath },
	),
	{ status: "NO_CHANGE" },
);
const afterNoOpStats = await Promise.all([
	stat(roadmapPath, { bigint: true }),
	stat(releasesPath, { bigint: true }),
]);
assert.deepEqual(
	afterNoOpStats.map(({ mtimeNs }) => mtimeNs),
	beforeNoOpStats.map(({ mtimeNs }) => mtimeNs),
);
assert.equal(await readFile(roadmapPath, "utf8"), "original-roadmap\n");
assert.equal(await readFile(releasesPath, "utf8"), "original-releases\n");
const invalidCandidatePair = structuredClone(nonEmptyCurrentPair);
invalidCandidatePair.releases.items.push({
	version: "v-invalid",
	projectSlugs: ["unknown-roadmap-item"],
});
await assert.rejects(
	persistSnapshotPair(
		nonEmptyCurrentPair,
		invalidCandidatePair,
		{ roadmapPath, releasesPath },
	),
	/Unknown roadmap slug/,
);
assert.equal(await readFile(roadmapPath, "utf8"), "original-roadmap\n");
assert.equal(await readFile(releasesPath, "utf8"), "original-releases\n");
assert.deepEqual(
	await persistSnapshotPair(
		nonEmptyCurrentPair,
		emptyCandidatePair,
		{ roadmapPath, releasesPath },
		{ allowEmpty: true },
	),
	{ status: "WROTE_CHANGE" },
);
assert.deepEqual(JSON.parse(await readFile(roadmapPath, "utf8")), emptyCandidatePair.roadmap);
assert.deepEqual(JSON.parse(await readFile(releasesPath, "utf8")), emptyCandidatePair.releases);
await writeFile(roadmapPath, "rollback-roadmap\n");
await writeFile(releasesPath, "rollback-releases\n");
const changedCandidatePair = structuredClone(nonEmptyCurrentPair);
changedCandidatePair.roadmap.items[0].votes += 1;
await assert.rejects(
	persistSnapshotPair(
		nonEmptyCurrentPair,
		changedCandidatePair,
		{ roadmapPath, releasesPath },
		{
			fileOps: {
				rename: async (source, target) => {
					if (source.endsWith(".tmp") && target === releasesPath) {
						throw new Error("Injected second replacement failure");
					}
					return fsRename(source, target);
				},
			},
		},
	),
	/Injected second replacement failure/,
);
assert.equal(await readFile(roadmapPath, "utf8"), "rollback-roadmap\n");
assert.equal(await readFile(releasesPath, "utf8"), "rollback-releases\n");
assert.deepEqual((await readdir(tempRoot)).sort(), ["releases.json", "roadmap.json"]);
await writeFile(roadmapPath, "original-roadmap\n");
await writeFile(releasesPath, "original-releases\n");
await assert.rejects(
	writeSnapshots(duplicate, releases, { roadmapPath, releasesPath }),
	/Duplicate roadmap slug/,
);
assert.equal(await readFile(roadmapPath, "utf8"), "original-roadmap\n");
assert.equal(await readFile(releasesPath, "utf8"), "original-releases\n");
await Promise.all([
	writeFile(roadmapPath, `${JSON.stringify(checkedInRoadmap, null, 2)}\n`),
	writeFile(releasesPath, `${JSON.stringify(checkedInReleases, null, 2)}\n`),
]);
await writeSnapshots(roadmap, releases, { roadmapPath, releasesPath });
assert.equal(JSON.parse(await readFile(roadmapPath, "utf8")).candidates.length, 6);
assert.equal(JSON.parse(await readFile(releasesPath, "utf8")).items.length, 1);

async function writePairFiles(pair) {
	await Promise.all([
		writeFile(roadmapPath, `${JSON.stringify(pair.roadmap, null, 2)}\n`),
		writeFile(releasesPath, `${JSON.stringify(pair.releases, null, 2)}\n`),
	]);
}

function fixtureFetchFor(projectPayload, releasePayload) {
	const responses = structuredClone([projectPayload, releasePayload]);
	return async () => ({ ok: true, json: async () => responses.shift() });
}

const syncEnv = {
	HOMUN_GITHUB_TOKEN: "fixture-token",
	HOMUN_PROJECT_NUMBER: "1",
	HOMUN_PROJECT_OWNER: "homun-app",
	HOMUN_RELEASES_REPO: "homun-app/homun-releases",
};
const currentPublicPair = { roadmap: publicRoadmap, releases };
const voteChangedFixture = structuredClone(projectFixture);
voteChangedFixture.data.organization.projectV2.items.nodes[0].content.reactions.totalCount += 1;
await writePairFiles(currentPublicPair);
const beforeDryRunBytes = await Promise.all([
	readFile(roadmapPath, "utf8"),
	readFile(releasesPath, "utf8"),
]);
const dryRunResult = await syncProductData({
	env: syncEnv,
	fetchImpl: fixtureFetchFor(voteChangedFixture, releaseFixture),
	paths: { roadmapPath, releasesPath },
	clock: () => "2026-07-14T15:00:00.000Z",
	mode: "dry-run",
});
assert.equal(dryRunResult.status, "WOULD_CHANGE");
assert.equal(dryRunResult.snapshots.roadmap.contentUpdatedAt, "2026-07-14T15:00:00.000Z");
assert.ok(formatSyncSummary(dryRunResult).startsWith("WOULD_CHANGE"));
assert.deepEqual(
	await Promise.all([readFile(roadmapPath, "utf8"), readFile(releasesPath, "utf8")]),
	beforeDryRunBytes,
);

const writeResult = await syncProductData({
	env: syncEnv,
	fetchImpl: fixtureFetchFor(voteChangedFixture, releaseFixture),
	paths: { roadmapPath, releasesPath },
	clock: () => "2026-07-14T15:00:00.000Z",
	mode: "write",
});
assert.equal(writeResult.status, "WROTE_CHANGE");
assert.ok(formatSyncSummary(writeResult).startsWith("WROTE_CHANGE"));
assert.equal(
	JSON.parse(await readFile(roadmapPath, "utf8")).items[0].votes,
	voteChangedFixture.data.organization.projectV2.items.nodes[0].content.reactions.totalCount,
);
const beforeNoChangeSync = await Promise.all([
	readFile(roadmapPath, "utf8"),
	readFile(releasesPath, "utf8"),
]);
const noChangeResult = await syncProductData({
	env: syncEnv,
	fetchImpl: fixtureFetchFor(voteChangedFixture, releaseFixture),
	paths: { roadmapPath, releasesPath },
	clock: () => "2026-07-14T16:00:00.000Z",
	mode: "write",
});
assert.equal(noChangeResult.status, "NO_CHANGE");
assert.ok(formatSyncSummary(noChangeResult).startsWith("NO_CHANGE"));
assert.deepEqual(
	await Promise.all([readFile(roadmapPath, "utf8"), readFile(releasesPath, "utf8")]),
	beforeNoChangeSync,
);

const emptyProjectFixture = structuredClone(projectFixture);
emptyProjectFixture.data.organization.projectV2.items.nodes = [];
await assert.rejects(
	syncProductData({
		env: syncEnv,
		fetchImpl: fixtureFetchFor(emptyProjectFixture, []),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T17:00:00.000Z",
		mode: "write",
	}),
	/refusing to replace 3 roadmap items with zero/i,
);
assert.deepEqual(
	await Promise.all([readFile(roadmapPath, "utf8"), readFile(releasesPath, "utf8")]),
	beforeNoChangeSync,
);
const allowEmptySyncResult = await syncProductData({
	env: syncEnv,
	fetchImpl: fixtureFetchFor(emptyProjectFixture, []),
	paths: { roadmapPath, releasesPath },
	clock: () => "2026-07-14T17:00:00.000Z",
	mode: "write",
	allowEmpty: true,
});
assert.equal(allowEmptySyncResult.status, "WROTE_CHANGE");
assert.deepEqual(JSON.parse(await readFile(roadmapPath, "utf8")).items, []);

await writePairFiles({ roadmap: checkedInRoadmap, releases: checkedInReleases });
await assert.rejects(
	syncProductData({
		env: syncEnv,
		fetchImpl: fixtureFetchFor(projectFixture, releaseFixture),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T18:00:00.000Z",
		mode: "dry-run",
	}),
	/Previous roadmap must use schemaVersion 2/,
);
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
