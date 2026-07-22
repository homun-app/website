import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

const manifest = await readJson("./fixtures/roadmap-v3-manifest.json");
const preview = await readJson("./fixtures/roadmap-v3-preview.json");
const previewReleases = await readJson("./fixtures/releases-v3-preview.json");
const checkedInRoadmap = await readJson("../src/data/roadmap.json");
const checkedInReleases = await readJson("../src/data/releases.json");

const strategicSlugs = [
	"operational-workspace",
	"homun-flow",
	"team-spaces-roles",
	"homun-mobile",
	"more-ways-to-reach-homun",
	"adaptive-company-intelligence",
	"voice-meeting-capture",
	"developer-platform",
];
const workflowSlugs = [
	"client-work",
	"sales-operations",
	"content-marketing",
	"internal-operations",
	"customer-support",
];

assert.equal(manifest.schemaVersion, 3);
assert.deepEqual(
	manifest.items.filter(({ itemType }) => itemType === "strategic_program").map(({ slug }) => slug),
	strategicSlugs,
);
assert.deepEqual(
	manifest.items.filter(({ itemType }) => itemType === "workflow_idea").map(({ slug }) => slug),
	workflowSlugs,
);
assert.equal(manifest.items.filter(({ featured }) => featured).length, 1);
assert.equal(manifest.items.find(({ featured }) => featured).slug, "homun-flow");
assert.deepEqual(manifest.legacy.transform, {
	5: "homun-mobile",
	7: "team-spaces-roles",
	8: "voice-meeting-capture",
});
assert.deepEqual(Object.keys(manifest.legacy.archive).map(Number), [2, 3, 4, 6, 9, 10, 11]);

for (const item of manifest.items) {
	for (const field of [
		"slug", "title", "itemType", "stage", "area", "outcome", "whyNow",
		"firstRelease", "milestones", "notIncludedYet", "featured", "voting", "order",
		"publicUpdate", "publicUpdateDate",
	]) assert.ok(Object.hasOwn(item, field), `${item.slug} is missing ${field}`);
	assert.equal(item.publicUpdateDate, "2026-07-16");
	assert.ok(!Object.hasOwn(item, "progress"), `${item.slug} contains arbitrary progress`);
	assert.ok(!Object.hasOwn(item, "targetRelease"), `${item.slug} contains a target-release promise`);
}

assert.equal(preview.schemaVersion, 3);
assert.deepEqual(preview.items.map(({ slug }) => slug), [...strategicSlugs, ...workflowSlugs]);
const withoutRuntimeMetadata = ({ githubUrl, issueNumber, votes, underReview, ...item }) => item;
assert.deepEqual(
	checkedInRoadmap.items.map(withoutRuntimeMetadata),
	preview.items.map(withoutRuntimeMetadata),
);
const checkedInReleaseVersions = new Set(
	checkedInReleases.items.map(({ version }) => version),
);
assert.deepEqual(
	previewReleases.items
		.map(({ version }) => version)
		.filter((version) => !checkedInReleaseVersions.has(version)),
	[],
	"Published releases must retain the roadmap v3 evidence baseline",
);
assert.ok(checkedInRoadmap.contentUpdatedAt !== preview.contentUpdatedAt);
assert.ok(checkedInRoadmap.items.every(({ githubUrl, issueNumber }) =>
	Number.isInteger(issueNumber)
	&& githubUrl === `https://github.com/homun-app/homun/issues/${issueNumber}`),
"Published roadmap records must link to their real GitHub issues");
assert.ok(
	preview.items.filter(({ issueNumber }) => issueNumber !== null).every(({ issueNumber }) => [5, 7, 8].includes(issueNumber)),
	"Only transformed public issues may have real issue numbers in the branch preview",
);
assert.ok(
	checkedInReleases.items.find(({ version }) => version === "v0.1.1059").projectSlugs.includes("operational-workspace"),
	"The Available program needs published release evidence",
);

console.log("Roadmap v3 manifest and synchronized snapshot contract passed");
