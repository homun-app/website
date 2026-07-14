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
import { applyReleasePublicationPolicy } from "./lib/release-publication-policy.mjs";
import {
	hasSemanticChanges,
	persistSnapshotPair,
	recoverSnapshotPair,
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

assert.equal(checkedInRoadmap.schemaVersion, 2);
assert.ok(checkedInRoadmap.items.length >= 10);
for (const slug of ["apprentice", "shared-spaces", "connected-actions"]) {
	assert.ok(checkedInRoadmap.items.some((item) => item.slug === slug));
}
assert.equal(checkedInReleases.schemaVersion, 2);
assert.doesNotThrow(() => validateSnapshot(checkedInRoadmap, checkedInReleases));

const tiedOrderProjectFixture = structuredClone(projectFixture);
const tiedOrderNodes = tiedOrderProjectFixture.data.organization.projectV2.items.nodes;
const secondOrderField = tiedOrderNodes[1].fieldValues.nodes.find(
	(field) => field.field.name === "Order",
);
secondOrderField.number = 1;
const reversedTiedOrderProjectFixture = structuredClone(tiedOrderProjectFixture);
reversedTiedOrderProjectFixture.data.organization.projectV2.items.nodes.reverse();
assert.deepEqual(
	normalizeProject(tiedOrderProjectFixture).candidates,
	normalizeProject(reversedTiedOrderProjectFixture).candidates,
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
assert.equal(releases.schemaVersion, 2);
assert.equal(releases.fetchedAt, projectFixture.syncedAt);
assert.deepEqual(Object.keys(releases), ["schemaVersion", "fetchedAt", "items"]);
const deterministicReleaseA = structuredClone(releaseFixture[0]);
deterministicReleaseA.tag_name = "v0.1.alpha";
deterministicReleaseA.name = "0.1 alpha";
deterministicReleaseA.body = [
	"## Highlights",
	"- First semantic highlight",
	"- Second semantic highlight",
	"",
	"Roadmap: shared-spaces, connected-actions",
].join("\n");
const deterministicReleaseB = structuredClone(deterministicReleaseA);
deterministicReleaseB.tag_name = "v0.1.beta";
deterministicReleaseB.name = "0.1 beta";
const deterministicReleaseInput = [deterministicReleaseB, deterministicReleaseA];
const reorderedDeterministicReleaseInput = structuredClone(deterministicReleaseInput).reverse();
for (const release of reorderedDeterministicReleaseInput) {
	release.assets.reverse();
	release.body = release.body.replace(
		"Roadmap: shared-spaces, connected-actions",
		"Roadmap: connected-actions, shared-spaces",
	);
}
const deterministicReleases = normalizeReleases(
	deterministicReleaseInput,
	roadmap.candidates,
	projectFixture.syncedAt,
);
assert.deepEqual(
	deterministicReleases,
	normalizeReleases(
		reorderedDeterministicReleaseInput,
		roadmap.candidates,
		projectFixture.syncedAt,
	),
);
const reorderedHighlightsInput = structuredClone(deterministicReleaseInput);
reorderedHighlightsInput[0].body = reorderedHighlightsInput[0].body.replace(
	"- First semantic highlight\n- Second semantic highlight",
	"- Second semantic highlight\n- First semantic highlight",
);
assert.equal(
	hasSemanticChanges(
		deterministicReleases,
		normalizeReleases(
			reorderedHighlightsInput,
			roadmap.candidates,
			projectFixture.syncedAt,
		),
	),
	true,
);
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
const asPublicReleases = (releaseSnapshot) => ({
	schemaVersion: 2,
	contentUpdatedAt: projectFixture.syncedAt,
	items: releaseSnapshot.items,
});
const publicReleases = asPublicReleases(releases);
assert.throws(
	() => validateSnapshot(publicRoadmap, releases),
	/Invalid releases snapshot shape/,
);
assert.throws(
	() => validateSnapshot(roadmap, publicReleases),
	/Invalid releases snapshot shape/,
);
for (const invalidRawReleases of [
	{ schemaVersion: 2, items: releases.items },
	{ schemaVersion: 2, fetchedAt: "", items: releases.items },
	{ ...releases, contentUpdatedAt: projectFixture.syncedAt },
]) {
	assert.throws(
		() => validateSnapshot(roadmap, invalidRawReleases),
		/Invalid releases snapshot shape/,
	);
}
for (const invalidPublicReleases of [
	{ schemaVersion: 2, items: releases.items },
	{ schemaVersion: 2, contentUpdatedAt: "", items: releases.items },
	{ ...publicReleases, fetchedAt: projectFixture.syncedAt },
]) {
	assert.throws(
		() => validateSnapshot(publicRoadmap, invalidPublicReleases),
		/Invalid releases snapshot shape/,
	);
}
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
		schemaVersion: 2,
		contentUpdatedAt: "2026-07-13T10:00:00.000Z",
		checkedAt: "2026-07-13T10:00:00.000Z",
		items: [{ version: "v1" }],
	},
};
const timestampOnly = {
	releases: {
		items: [{ version: "v1" }],
		contentUpdatedAt: "2026-07-14T10:00:00.000Z",
		checkedAt: "2026-07-14T10:00:00.000Z",
		schemaVersion: 2,
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
	releases: { items: [{ version: "v1" }], schemaVersion: 2 },
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
const nestedOperationalNameCurrent = {
	schemaVersion: 2,
	contentUpdatedAt: "2026-07-13T10:00:00.000Z",
	items: [{ slug: "apprentice", audit: { contentUpdatedAt: "approved-value" } }],
};
const nestedOperationalNameCandidate = structuredClone(nestedOperationalNameCurrent);
nestedOperationalNameCandidate.contentUpdatedAt = "2026-07-14T10:00:00.000Z";
nestedOperationalNameCandidate.items[0].audit.contentUpdatedAt = "changed-public-value";
assert.equal(
	hasSemanticChanges(nestedOperationalNameCurrent, nestedOperationalNameCandidate),
	true,
);
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
assert.equal(
	hasSemanticChanges(
		{ capabilities: ["First capability", "Second capability"] },
		{ capabilities: ["Second capability", "First capability"] },
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

function numberedProjectNode(template, number) {
	const node = structuredClone(template);
	const fields = node.fieldValues.nodes;
	fields.find((field) => field.field.name === "Slug").text = `paginated-item-${number}`;
	fields.find((field) => field.field.name === "Order").number = number;
	fields.find((field) => field.field.name === "Featured").name = "No";
	node.content.number = number;
	node.content.title = `Paginated item ${number}`;
	node.content.url = `https://github.com/homun-app/homun/issues/${number}`;
	return node;
}

const paginationTemplate = projectFixture.data.organization.projectV2.items.nodes[0];
const paginatedProjectNodes = Array.from(
	{ length: 101 },
	(_, index) => numberedProjectNode(paginationTemplate, index + 1),
);
const projectPageOne = {
	data: {
		organization: {
			projectV2: {
				items: {
					pageInfo: { hasNextPage: true, endCursor: "cursor-100" },
					nodes: paginatedProjectNodes.slice(0, 100),
				},
			},
		},
	},
};
const projectPageTwo = {
	data: {
		organization: {
			projectV2: {
				items: {
					pageInfo: { hasNextPage: false, endCursor: "cursor-101" },
					nodes: paginatedProjectNodes.slice(100),
				},
			},
		},
	},
};
const paginatedReleases = Array.from({ length: 101 }, (_, index) => ({
	...structuredClone(releaseFixture[0]),
	tag_name: `v0.1.${2000 - index}`,
	name: `0.1.${2000 - index}`,
	published_at: new Date(Date.UTC(2026, 6, 14, 12, 0, 0) - index * 1000).toISOString(),
	body: "## Highlights\n- Pagination fixture",
}));
const paginationRequests = [];
const paginationResponses = [
	projectPageOne,
	projectPageTwo,
	paginatedReleases.slice(0, 100),
	paginatedReleases.slice(100),
];
const paginatedSnapshots = await fetchProductData(
	{
		token: "fixture-token",
		owner: "homun-app",
		projectNumber: 1,
		releasesRepo: "homun-app/homun-releases",
	},
	async (url, init = {}) => {
		paginationRequests.push({ url, init: structuredClone(init) });
		return { ok: true, json: async () => structuredClone(paginationResponses.shift()) };
	},
	() => "2026-07-14T15:00:00.000Z",
);
assert.equal(paginatedSnapshots.roadmap.candidates.length, 101);
assert.deepEqual(
	paginatedSnapshots.roadmap.candidates.map(({ slug }) => slug),
	paginatedProjectNodes.map((node) =>
		node.fieldValues.nodes.find((field) => field.field.name === "Slug").text),
);
assert.equal(paginatedSnapshots.releases.items.length, 101);
assert.deepEqual(
	paginatedSnapshots.releases.items.map(({ version }) => version),
	paginatedReleases.map(({ tag_name }) => tag_name),
);
assert.equal(paginationRequests.length, 4);
assert.deepEqual(
	paginationRequests.slice(0, 2).map(({ url }) => url),
	["https://api.github.com/graphql", "https://api.github.com/graphql"],
);
const projectVariables = paginationRequests.slice(0, 2).map(({ init }) =>
	JSON.parse(init.body).variables);
assert.deepEqual(projectVariables, [
	{ owner: "homun-app", number: 1, after: null },
	{ owner: "homun-app", number: 1, after: "cursor-100" },
]);
for (const { init } of paginationRequests.slice(0, 2)) {
	const query = JSON.parse(init.body).query;
	assert.match(query, /\$after:\s*String/);
	assert.match(query, /items\(first:\s*100,\s*after:\s*\$after\)/);
	assert.match(query, /pageInfo\s*\{\s*hasNextPage\s+endCursor\s*\}/s);
}
assert.deepEqual(
	paginationRequests.slice(2).map(({ url }) => url),
	[
		"https://api.github.com/repos/homun-app/homun-releases/releases?per_page=100&page=1",
		"https://api.github.com/repos/homun-app/homun-releases/releases?per_page=100&page=2",
	],
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
await assert.rejects(
	fetchFrom([{
		data: {
			organization: {
				projectV2: {
					items: { nodes: [], pageInfo: { hasNextPage: false } },
				},
			},
		},
	}]),
	/GitHub Project response has invalid items.pageInfo/,
);
await assert.rejects(
	fetchFrom([{
		data: {
			organization: {
				projectV2: {
					items: {
						nodes: [],
						pageInfo: { hasNextPage: true, endCursor: null },
					},
				},
			},
		},
	}]),
	/GitHub Project response has no end cursor/,
);
await assert.rejects(
	fetchFrom([
		{
			data: {
				organization: {
					projectV2: {
						items: {
							nodes: [],
							pageInfo: { hasNextPage: true, endCursor: "repeat" },
						},
					},
				},
			},
		},
		{
			data: {
				organization: {
					projectV2: {
						items: {
							nodes: [],
							pageInfo: { hasNextPage: true, endCursor: "repeat" },
						},
					},
				},
			},
		},
	]),
	/GitHub Project pagination repeated cursor: repeat/,
);
assert.doesNotThrow(() => validateSnapshot(roadmap, releases));
assert.doesNotThrow(() => validateSnapshot(publicRoadmap, publicReleases));
assert.doesNotThrow(() => validateSnapshot(checkedInRoadmap, checkedInReleases));
for (const invalidProjectSlug of ["", 1055, "Shared Spaces"]) {
	const releaseWithInvalidProjectSlug = structuredClone(publicReleases);
	releaseWithInvalidProjectSlug.items[0].projectSlugs = [invalidProjectSlug];
	assert.throws(
		() => validateSnapshot(publicRoadmap, releaseWithInvalidProjectSlug),
		/Invalid project slugs in release v0.1.1055/,
	);
}
const releaseWithNonArrayProjectSlugs = structuredClone(publicReleases);
releaseWithNonArrayProjectSlugs.items[0].projectSlugs = "connected-actions";
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithNonArrayProjectSlugs),
	/Invalid project slugs in release v0.1.1055/,
);
assert.throws(
	() => validateSnapshot(roadmap, {
		schemaVersion: 2,
		fetchedAt: projectFixture.syncedAt,
		items: [null],
	}),
	/Invalid release item/,
);
const releaseWithNonStringVersion = structuredClone(publicReleases);
releaseWithNonStringVersion.items[0].version = 1055;
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithNonStringVersion),
	/Invalid release version/,
);
const releaseWithEmptyVersion = structuredClone(publicReleases);
releaseWithEmptyVersion.items[0].version = "";
assert.throws(
	() => validateSnapshot(publicRoadmap, releaseWithEmptyVersion),
	/Invalid release version/,
);
assert.throws(
	() => validateSnapshot(roadmap, {
		schemaVersion: 2,
		fetchedAt: projectFixture.syncedAt,
		items: {},
	}),
	/Invalid releases snapshot shape/,
);
assert.throws(
	() => validateSnapshot(roadmap, {
		schemaVersion: 2,
		fetchedAt: projectFixture.syncedAt,
	}),
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
	validateSnapshot(
		publicRoadmapWithoutShippedItems,
		asPublicReleases(normalizedWithoutNotes),
	),
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
	() => validateSnapshot(publicRoadmap, asPublicReleases(releasesWithPrereleaseLink)),
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
assert.throws(
	() => validateSnapshot(roadmap, releaseWithDuplicateSlug),
	/Duplicate roadmap slug in release v0.1.1055: connected-actions/,
);
assert.throws(
	() => validateSnapshot(checkedInRoadmap, asPublicReleases(releaseWithDuplicateSlug)),
	/Duplicate roadmap slug in release v0.1.1055: connected-actions/,
);
assert.throws(
	() => validateSnapshot(publicRoadmap, asPublicReleases(releaseWithDuplicateSlug)),
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
	() => validateSnapshot(publicRoadmap, asPublicReleases(releaseWithUnknownDuplicateSlug)),
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
	() => validateSnapshot(shippedLinkedOnlyFromDraft, asPublicReleases(releasesWithDraftLink)),
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
assert.deepEqual(
	validateSnapshot(publicRoadmap, asPublicReleases(releaseWithUnknownSlug)),
	{
		warnings: [
			"Unknown roadmap slug in release v0.1.1056: missing-project",
		],
	},
);
assert.deepEqual(releaseWithUnknownSlug.items[0].projectSlugs, [
	"connected-actions",
	"missing-project",
	"shared-spaces",
]);

const releasePolicyPreviousRoadmap = {
	schemaVersion: 2,
	contentUpdatedAt: "2026-07-13T10:00:00.000Z",
	items: [
		{ slug: "apprentice" },
		{ slug: "shared-spaces" },
		{ slug: "connected-actions" },
		{ slug: "retired-experiment" },
	],
};
const releasePolicyPreviousReleases = {
	schemaVersion: 2,
	contentUpdatedAt: "2026-07-13T10:00:00.000Z",
	items: [
		{ version: "v3", name: "Old v3", projectSlugs: [] },
		{
			version: "v2",
			name: "Old v2",
			projectSlugs: ["apprentice", "connected-actions", "shared-spaces"],
		},
		{
			version: "v1",
			name: "Old v1",
			projectSlugs: ["apprentice", "retired-experiment"],
		},
	],
};
const releasePolicyRawReleases = {
	schemaVersion: 2,
	fetchedAt: "2026-07-14T10:00:00.000Z",
	items: [
		{
			version: "v3",
			name: "Fresh v3",
			highlights: ["Keep fresh release content"],
			projectSlugs: [
				"apprentice",
				"connected-actions",
				"future-memory",
				"ghost",
				"retired-experiment",
				"shared-spaces",
			],
		},
		{ version: "v2", name: "Fresh v2", projectSlugs: [] },
		{ version: "v1", name: "Fresh v1", projectSlugs: [] },
	],
};
const releasePolicyCandidates = [
	{ slug: "apprentice", publicationStatus: "review" },
	{ slug: "shared-spaces", publicationStatus: "draft" },
	{ slug: "connected-actions", publicationStatus: "published" },
	{ slug: "retired-experiment", publicationStatus: "archived" },
	{ slug: "future-memory", publicationStatus: "review" },
];
const governedReleaseResult = applyReleasePublicationPolicy(
	releasePolicyPreviousReleases,
	releasePolicyRawReleases,
	releasePolicyCandidates,
	releasePolicyPreviousRoadmap,
);
assert.equal(
	governedReleaseResult.releases.contentUpdatedAt,
	releasePolicyPreviousReleases.contentUpdatedAt,
);
assert.equal(governedReleaseResult.releases.items[0].name, "Fresh v3");
assert.deepEqual(governedReleaseResult.releases.items[0].highlights, [
	"Keep fresh release content",
]);
assert.deepEqual(
	governedReleaseResult.releases.items.map(({ version, projectSlugs }) => [
		version,
		projectSlugs,
	]),
	[
		["v3", ["connected-actions", "ghost", "retired-experiment"]],
		["v2", ["apprentice", "shared-spaces"]],
		["v1", ["apprentice", "retired-experiment"]],
	],
);
assert.deepEqual(governedReleaseResult.warnings, [
	"Unknown roadmap slug in release v3: ghost",
]);
assert.deepEqual(
	validateSnapshot(
		{
			schemaVersion: 2,
			contentUpdatedAt: releasePolicyPreviousRoadmap.contentUpdatedAt,
			items: [{
				...structuredClone(
					checkedInRoadmap.items.find(({ slug }) => slug === "apprentice"),
				),
				voting: "open",
				progress: 50,
				featured: false,
			}],
		},
		governedReleaseResult.releases,
		{ knownRoadmapSlugs: releasePolicyCandidates.map(({ slug }) => slug) },
	),
	{ warnings: ["Unknown roadmap slug in release v3: ghost"] },
);
const shippedWithoutPublishedRelease = structuredClone(publicRoadmap);
assert.throws(
	() => validateSnapshot(shippedWithoutPublishedRelease, asPublicReleases(normalizedWithoutNotes)),
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
assert.throws(() => normalizeProject(fixtureWithField("Area", undefined)), /Missing area/);
assert.throws(() => normalizeProject(fixtureWithField("Area", "")), /Missing area/);
assert.throws(() => normalizeProject(fixtureWithField("Area", 7)), /Invalid area/);
assert.throws(() => normalizeProject(fixtureWithField("Featured", undefined)), /Missing featured/);
assert.throws(() => normalizeProject(fixtureWithField("Featured", "Maybe")), /Invalid featured/);
assert.throws(() => normalizeProject(fixtureWithField("Progress", undefined)), /Missing progress/);
assert.throws(() => normalizeProject(fixtureWithField("Progress", Number.NaN, "number")), /Invalid progress/);
assert.throws(() => normalizeProject(fixtureWithField("Slug", 24, "number")), /Invalid roadmap slug/);
assert.throws(() => normalizeProject(fixtureWithField("Order", "1", "text")), /Invalid order/);
for (const invalidVotes of [-1, 1.5, Number.NaN]) {
	const invalidVoteFixture = structuredClone(projectFixture);
	invalidVoteFixture.data.organization.projectV2.items.nodes[0].content.reactions.totalCount =
		invalidVotes;
	assert.throws(() => normalizeProject(invalidVoteFixture), /Invalid votes: shared-spaces/);
}
const missingVotesFixture = structuredClone(projectFixture);
delete missingVotesFixture.data.organization.projectV2.items.nodes[0].content.reactions;
assert.throws(() => normalizeProject(missingVotesFixture), /Missing votes: shared-spaces/);
assert.throws(
	() => normalizeProject(fixtureWithField("Public update date", "14/07/2026", "date")),
	/Invalid public update date: shared-spaces/,
);
const updateWithoutValidDate = fixtureWithField("Public update date", "2026-02-30", "date");
assert.throws(
	() => normalizeProject(updateWithoutValidDate),
	/Invalid public update date: shared-spaces/,
);
const rawWithoutFetchedAt = structuredClone(roadmap);
delete rawWithoutFetchedAt.fetchedAt;
assert.throws(
	() => validateSnapshot(rawWithoutFetchedAt, releases),
	/Invalid raw roadmap fetchedAt/,
);
const publicWithoutContentUpdatedAt = structuredClone(publicRoadmap);
delete publicWithoutContentUpdatedAt.contentUpdatedAt;
assert.throws(
	() => validateSnapshot(publicWithoutContentUpdatedAt, publicReleases),
	/Invalid public roadmap contentUpdatedAt/,
);
for (const [field, value, expected] of [
	["title", undefined, /Invalid roadmap title: shared-spaces/],
	["area", undefined, /Invalid roadmap area: shared-spaces/],
	["votes", -1, /Invalid votes: shared-spaces/],
	["underReview", "false", /Invalid underReview: shared-spaces/],
]) {
	const malformed = structuredClone(publicRoadmap);
	malformed.items[0][field] = value;
	assert.throws(() => validateSnapshot(malformed, publicReleases), expected);
}
for (const [field, value, expected] of [
	["description", "", /Invalid roadmap description: shared-spaces/],
	["githubUrl", "", /Invalid roadmap GitHub URL: shared-spaces/],
	["capabilities", [""], /Invalid capabilities: shared-spaces/],
	["featured", "false", /Invalid featured: shared-spaces/],
	["progress", Number.NaN, /Invalid progress: shared-spaces/],
	["order", 1.5, /Invalid order: shared-spaces/],
	["voting", "maybe", /Unknown voting state: maybe/],
	["issueNumber", 0, /Invalid issue number: shared-spaces/],
	["targetRelease", 2, /Invalid target release: shared-spaces/],
	["publicUpdate", 2, /Invalid public update: shared-spaces/],
	["publicUpdateDate", "14/07/2026", /Invalid public update date: shared-spaces/],
]) {
	const malformed = structuredClone(publicRoadmap);
	malformed.items[0][field] = value;
	assert.throws(() => validateSnapshot(malformed, publicReleases), expected);
}
const publicUpdateWithoutDate = structuredClone(publicRoadmap);
publicUpdateWithoutDate.items[0].publicUpdateDate = null;
assert.throws(
	() => validateSnapshot(publicUpdateWithoutDate, publicReleases),
	/Missing public update date: shared-spaces/,
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

const recoveryRoot = await mkdtemp(join(tmpdir(), "homun-product-recovery-"));
try {
	const recoveryRoadmapPath = join(recoveryRoot, "roadmap.json");
	const recoveryReleasesPath = join(recoveryRoot, "releases.json");
	const recoveryRoadmapBackup = `${recoveryRoadmapPath}.product-data.bak`;
	const recoveryReleasesBackup = `${recoveryReleasesPath}.product-data.bak`;
	const recoveryRoadmapTemp = `${recoveryRoadmapPath}.product-data.tmp`;
	const recoveryReleasesTemp = `${recoveryReleasesPath}.product-data.tmp`;
	const recoveryJournalPath = join(recoveryRoot, ".product-data-transaction.json");
	await Promise.all([
		writeFile(recoveryRoadmapPath, "candidate-roadmap\n"),
		writeFile(recoveryReleasesPath, "original-releases\n"),
		writeFile(recoveryRoadmapBackup, "original-roadmap\n"),
		writeFile(recoveryReleasesBackup, "original-releases\n"),
		writeFile(recoveryReleasesTemp, "candidate-releases\n"),
		writeFile(recoveryJournalPath, JSON.stringify({
			schemaVersion: 1,
			roadmap: {
				targetPath: recoveryRoadmapPath,
				tempPath: recoveryRoadmapTemp,
				backupPath: recoveryRoadmapBackup,
			},
			releases: {
				targetPath: recoveryReleasesPath,
				tempPath: recoveryReleasesTemp,
				backupPath: recoveryReleasesBackup,
			},
		})),
	]);
	assert.deepEqual(
		await recoverSnapshotPair({
			roadmapPath: recoveryRoadmapPath,
			releasesPath: recoveryReleasesPath,
		}),
		{ status: "RECOVERED" },
	);
	assert.equal(await readFile(recoveryRoadmapPath, "utf8"), "original-roadmap\n");
	assert.equal(await readFile(recoveryReleasesPath, "utf8"), "original-releases\n");
	assert.deepEqual((await readdir(recoveryRoot)).sort(), ["releases.json", "roadmap.json"]);
} finally {
	await rm(recoveryRoot, { recursive: true, force: true });
}

const missingTargetRoot = await mkdtemp(join(tmpdir(), "homun-product-missing-"));
try {
	const missingRoadmapPath = join(missingTargetRoot, "roadmap.json");
	const missingReleasesPath = join(missingTargetRoot, "releases.json");
	const missingTargetCurrent = {
		roadmap: {
			schemaVersion: 2,
			contentUpdatedAt: "2026-07-13T10:00:00.000Z",
			items: [publishedApprentice],
		},
		releases: {
			schemaVersion: 2,
			contentUpdatedAt: "2026-07-13T10:00:00.000Z",
			items: [],
		},
	};
	const missingTargetCandidate = structuredClone(missingTargetCurrent);
	missingTargetCandidate.roadmap.items[0].votes += 1;
	await writeFile(
		missingRoadmapPath,
		`${JSON.stringify(missingTargetCurrent.roadmap, null, 2)}\n`,
	);
	await assert.rejects(
		persistSnapshotPair(
			missingTargetCurrent,
			missingTargetCandidate,
			{
				roadmapPath: missingRoadmapPath,
				releasesPath: missingReleasesPath,
			},
		),
		(error) => {
			assert.equal(error.message, `Snapshot target missing: ${missingReleasesPath}`);
			return true;
		},
	);
	await assert.rejects(
		syncProductData({
			paths: {
				roadmapPath: missingRoadmapPath,
				releasesPath: missingReleasesPath,
			},
			mode: "dry-run",
		}),
		(error) => {
			assert.equal(error.message, `Snapshot target missing: ${missingReleasesPath}`);
			return true;
		},
	);
	assert.deepEqual(await readdir(missingTargetRoot), ["roadmap.json"]);
} finally {
	await rm(missingTargetRoot, { recursive: true, force: true });
}

const tempRoot = await mkdtemp(join(tmpdir(), "homun-product-data-"));
try {
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
		releases: {
			schemaVersion: 2,
			contentUpdatedAt: "2026-07-13T10:00:00.000Z",
			items: [],
		},
	};
	const emptyCandidatePair = {
		roadmap: {
			schemaVersion: 2,
			contentUpdatedAt: "2026-07-14T10:00:00.000Z",
			items: [],
		},
		releases: {
			schemaVersion: 2,
			contentUpdatedAt: "2026-07-14T10:00:00.000Z",
			items: [],
		},
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
	timestampOnlyCandidatePair.releases.contentUpdatedAt = "2026-07-14T10:00:00.000Z";
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
	const serializedCurrentRoadmap = `${JSON.stringify(nonEmptyCurrentPair.roadmap, null, 2)}\n`;
	const serializedCurrentReleases = `${JSON.stringify(nonEmptyCurrentPair.releases, null, 2)}\n`;
	await Promise.all([
		writeFile(roadmapPath, serializedCurrentRoadmap),
		writeFile(releasesPath, serializedCurrentReleases),
	]);
	assert.deepEqual(
		await persistSnapshotPair(
			nonEmptyCurrentPair,
			invalidCandidatePair,
			{ roadmapPath, releasesPath },
		),
		{ status: "WROTE_CHANGE" },
	);
	assert.deepEqual(
		JSON.parse(await readFile(releasesPath, "utf8")).items.at(-1).projectSlugs,
		["unknown-roadmap-item"],
	);
	const concurrentRoadmap = structuredClone(nonEmptyCurrentPair.roadmap);
	concurrentRoadmap.items[0].votes += 99;
	const concurrentRoadmapBytes = `${JSON.stringify(concurrentRoadmap, null, 2)}\n`;
	await Promise.all([
		writeFile(roadmapPath, concurrentRoadmapBytes),
		writeFile(releasesPath, serializedCurrentReleases),
	]);
	const staleCandidatePair = structuredClone(nonEmptyCurrentPair);
	staleCandidatePair.roadmap.items[0].votes += 1;
	await assert.rejects(
		persistSnapshotPair(
			nonEmptyCurrentPair,
			staleCandidatePair,
			{ roadmapPath, releasesPath },
		),
		/Snapshot changed since it was read/,
	);
	assert.equal(await readFile(roadmapPath, "utf8"), concurrentRoadmapBytes);
	assert.equal(await readFile(releasesPath, "utf8"), serializedCurrentReleases);
	await Promise.all([
		writeFile(roadmapPath, serializedCurrentRoadmap),
		writeFile(releasesPath, serializedCurrentReleases),
	]);
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
	await Promise.all([
		writeFile(roadmapPath, serializedCurrentRoadmap),
		writeFile(releasesPath, serializedCurrentReleases),
	]);
	const changedCandidatePair = structuredClone(nonEmptyCurrentPair);
	changedCandidatePair.roadmap.items[0].votes += 1;
	let durableTransactionObserved = false;
	await assert.rejects(
		persistSnapshotPair(
			nonEmptyCurrentPair,
			changedCandidatePair,
			{ roadmapPath, releasesPath },
			{
				fileOps: {
					rename: async (source, target) => {
						if (target === roadmapPath) {
							const transactionFiles = await readdir(tempRoot);
							for (const expected of [
								".product-data-transaction.json",
								"roadmap.json.product-data.bak",
								"releases.json.product-data.bak",
							]) {
								assert.ok(
									transactionFiles.includes(expected),
									`Missing durable transaction file before replace: ${expected}`,
								);
							}
							durableTransactionObserved = true;
						}
						if (
							source === `${releasesPath}.product-data.tmp`
							&& target === releasesPath
						) {
							throw new Error("Injected second replacement failure");
						}
						return fsRename(source, target);
					},
				},
			},
		),
		/Injected second replacement failure/,
	);
	assert.equal(durableTransactionObserved, true);
	assert.equal(await readFile(roadmapPath, "utf8"), serializedCurrentRoadmap);
	assert.equal(await readFile(releasesPath, "utf8"), serializedCurrentReleases);
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
		writeFile(roadmapPath, `${JSON.stringify({
			schemaVersion: 2,
			fetchedAt: projectFixture.syncedAt,
			candidates: [],
		}, null, 2)}\n`),
		writeFile(releasesPath, `${JSON.stringify({
			schemaVersion: 2,
			fetchedAt: projectFixture.syncedAt,
			items: [],
		}, null, 2)}\n`),
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
	const currentPublicPair = { roadmap: publicRoadmap, releases: publicReleases };
	const voteChangedFixture = structuredClone(projectFixture);
	voteChangedFixture.data.organization.projectV2.items.nodes[0].content.reactions.totalCount += 1;
	const transactionJournalPath = join(tempRoot, ".product-data-transaction.json");
	await Promise.all([
		writeFile(roadmapPath, "partially-replaced-roadmap\n"),
		writeFile(releasesPath, `${JSON.stringify(publicReleases, null, 2)}\n`),
		writeFile(
			`${roadmapPath}.product-data.bak`,
			`${JSON.stringify(publicRoadmap, null, 2)}\n`,
		),
		writeFile(
			`${releasesPath}.product-data.bak`,
			`${JSON.stringify(publicReleases, null, 2)}\n`,
		),
		writeFile(`${releasesPath}.product-data.tmp`, "candidate-releases\n"),
		writeFile(transactionJournalPath, JSON.stringify({
			schemaVersion: 1,
			roadmap: {
				targetPath: roadmapPath,
				tempPath: `${roadmapPath}.product-data.tmp`,
				backupPath: `${roadmapPath}.product-data.bak`,
			},
			releases: {
				targetPath: releasesPath,
				tempPath: `${releasesPath}.product-data.tmp`,
				backupPath: `${releasesPath}.product-data.bak`,
			},
		})),
	]);
	const recoveredSyncResult = await syncProductData({
		env: syncEnv,
		fetchImpl: fixtureFetchFor(projectFixture, releaseFixture),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T14:00:00.000Z",
		mode: "dry-run",
	});
	assert.equal(recoveredSyncResult.status, "NO_CHANGE");
	assert.deepEqual((await readdir(tempRoot)).sort(), ["releases.json", "roadmap.json"]);

	await writePairFiles(currentPublicPair);
	const newReviewReleaseFixture = structuredClone(releaseFixture);
	newReviewReleaseFixture[0].body = newReviewReleaseFixture[0].body.replace(
		"Roadmap: connected-actions",
		"Roadmap: connected-actions, apprentice",
	);
	const newReviewLinkResult = await syncProductData({
		env: syncEnv,
		fetchImpl: fixtureFetchFor(projectFixture, newReviewReleaseFixture),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T14:10:00.000Z",
		mode: "dry-run",
	});
	assert.equal(newReviewLinkResult.status, "NO_CHANGE");
	assert.deepEqual(
		newReviewLinkResult.snapshots.releases.items[0].projectSlugs,
		["connected-actions"],
	);

	const existingReviewRoadmap = structuredClone(publicRoadmap);
	existingReviewRoadmap.items.push(structuredClone(publishedApprentice));
	existingReviewRoadmap.items.sort((left, right) => left.order - right.order);
	const existingReviewReleases = structuredClone(publicReleases);
	existingReviewReleases.items[0].projectSlugs.push("apprentice");
	existingReviewReleases.items[0].projectSlugs.sort();
	await writePairFiles({
		roadmap: existingReviewRoadmap,
		releases: existingReviewReleases,
	});
	const existingReviewLinkResult = await syncProductData({
		env: syncEnv,
		fetchImpl: fixtureFetchFor(projectFixture, releaseFixture),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T14:20:00.000Z",
		mode: "dry-run",
	});
	assert.equal(existingReviewLinkResult.status, "WOULD_CHANGE");
	assert.deepEqual(
		existingReviewLinkResult.snapshots.releases.items[0].projectSlugs,
		["apprentice", "connected-actions"],
	);

	const archivedRoadmap = structuredClone(publicRoadmap);
	archivedRoadmap.items.push({
		...structuredClone(publishedApprentice),
		slug: "retired-experiment",
		title: "Retired experiment",
		featured: false,
		order: 60,
	});
	const archivedReleases = structuredClone(publicReleases);
	archivedReleases.items[0].projectSlugs.push("retired-experiment");
	archivedReleases.items[0].projectSlugs.sort();
	await writePairFiles({ roadmap: archivedRoadmap, releases: archivedReleases });
	const archivedLinkResult = await syncProductData({
		env: syncEnv,
		fetchImpl: fixtureFetchFor(projectFixture, releaseFixture),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T14:30:00.000Z",
		mode: "dry-run",
	});
	assert.equal(archivedLinkResult.status, "WOULD_CHANGE");
	assert.equal(
		archivedLinkResult.snapshots.roadmap.items.some(
			({ slug }) => slug === "retired-experiment",
		),
		false,
	);
	assert.deepEqual(
		archivedLinkResult.snapshots.releases.items[0].projectSlugs,
		["connected-actions", "retired-experiment"],
	);

	await writePairFiles(currentPublicPair);
	const unknownReleaseFixture = structuredClone(releaseFixture);
	unknownReleaseFixture[0].body = unknownReleaseFixture[0].body.replace(
		"Roadmap: connected-actions",
		"Roadmap: connected-actions, ghost",
	);
	const unknownLinkResult = await syncProductData({
		env: syncEnv,
		fetchImpl: fixtureFetchFor(projectFixture, unknownReleaseFixture),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T14:40:00.000Z",
		mode: "dry-run",
	});
	assert.deepEqual(unknownLinkResult.warnings, [
		"Unknown roadmap slug in release v0.1.1055: ghost",
	]);
	assert.deepEqual(
		unknownLinkResult.snapshots.releases.items[0].projectSlugs,
		["connected-actions", "ghost"],
	);
	assert.match(
		formatSyncSummary(unknownLinkResult),
		/\nWARNING: Unknown roadmap slug in release v0\.1\.1055: ghost$/,
	);

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
	assert.equal(dryRunResult.snapshots.releases.schemaVersion, 2);
	assert.equal(dryRunResult.snapshots.releases.contentUpdatedAt, "2026-07-14T15:00:00.000Z");
	assert.equal("fetchedAt" in dryRunResult.snapshots.releases, false);
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
			mode: "dry-run",
		}),
		/refusing to replace 3 roadmap items with zero/i,
	);
	assert.deepEqual(
		await Promise.all([readFile(roadmapPath, "utf8"), readFile(releasesPath, "utf8")]),
		beforeNoChangeSync,
	);
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
		fetchImpl: fixtureFetchFor(emptyProjectFixture, releaseFixture),
		paths: { roadmapPath, releasesPath },
		clock: () => "2026-07-14T17:00:00.000Z",
		mode: "write",
		allowEmpty: true,
	});
	assert.equal(allowEmptySyncResult.status, "WROTE_CHANGE");
	assert.deepEqual(JSON.parse(await readFile(roadmapPath, "utf8")).items, []);
	assert.deepEqual(
		JSON.parse(await readFile(releasesPath, "utf8")).items[0].projectSlugs,
		["connected-actions"],
	);
	assert.deepEqual(allowEmptySyncResult.warnings, [
		"Unknown roadmap slug in release v0.1.1055: connected-actions",
	]);

	await writePairFiles({
		roadmap: { ...checkedInRoadmap, schemaVersion: 1 },
		releases: checkedInReleases,
	});
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
} finally {
	await rm(tempRoot, { recursive: true, force: true });
}

const workflow = await readFile(
	new URL("../.github/workflows/sync-product-data.yml", import.meta.url),
	"utf8",
);
for (const required of [
	"schedule:",
	"HOMUN_PROJECT_NUMBER",
	"git diff --quiet -- src/data/roadmap.json src/data/releases.json",
]) {
	assert.ok(workflow.includes(required), `Product sync workflow is missing: ${required}`);
}

assert.match(
	workflow,
	/  workflow_dispatch:\n    inputs:\n      allow_empty:\n        description: .+\n        required: false\n        default: false\n        type: boolean/,
	"Manual product-data syncs must expose a documented, default-off allow_empty input",
);
assert.match(
	workflow,
	/  repository_dispatch:\n    types: \[product-data-sync\]/,
	"Repository dispatch must accept only the product-data-sync event type",
);

function workflowStep(name) {
	const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = workflow.match(
		new RegExp(`      - name: ${escapedName}\\n([\\s\\S]*?)(?=      - name: |$)`),
	);
	assert.ok(match, `Product sync workflow is missing step: ${name}`);
	return match[1];
}

function workflowStepValue(step, key, indentation = 8) {
	const match = step.match(new RegExp(`^ {${indentation}}${key}: (.+)$`, "m"));
	assert.ok(match, `Product sync workflow step is missing ${key}`);
	return match[1];
}

const checkoutStep = workflowStep("Check out website");
assert.equal(
	workflowStepValue(checkoutStep, "ref", 10),
	"${{ github.event.repository.default_branch }}",
	"Every product-data event must check out the repository default branch",
);

const normalSyncStep = workflowStep("Synchronize roadmap and releases");
assert.equal(
	workflowStepValue(normalSyncStep, "if"),
	"${{ github.event_name != 'workflow_dispatch' || inputs.allow_empty == false }}",
	"Scheduled, repository-dispatched, and default manual syncs must use the guarded write path",
);
assert.equal(
	workflowStepValue(normalSyncStep, "run"),
	"npm run sync:product-data -- --write",
);

const recoverySyncStep = workflowStep(
	"Synchronize roadmap and releases (allow empty recovery)",
);
assert.equal(
	workflowStepValue(recoverySyncStep, "if"),
	"${{ github.event_name == 'workflow_dispatch' && inputs.allow_empty == true }}",
	"Only an explicit manual dispatch may activate empty-snapshot recovery",
);
assert.equal(
	workflowStepValue(recoverySyncStep, "run"),
	"npm run sync:product-data -- --write --allow-empty",
);

const commitStep = workflowStep("Commit semantic changes");
assert.match(
	commitStep,
	/^          git push origin HEAD:\$\{\{ github\.event\.repository\.default_branch \}\}$/m,
	"Product-data changes must be pushed explicitly to the repository default branch",
);

console.log("Product data contract passed");
