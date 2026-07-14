import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { roadmapPresentation } from "../src/lib/roadmap-presentation.mjs";

const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

function assertNoNestedAnchors(html) {
	let depth = 0;
	for (const [token] of html.matchAll(/<\/?a\b[^>]*>/gi)) {
		if (token.startsWith("</")) depth -= 1;
		else depth += 1;
		assert.ok(depth <= 1, "Roadmap contains nested links");
		assert.ok(depth >= 0, "Roadmap contains an unmatched closing link");
	}
	assert.equal(depth, 0, "Roadmap contains an unmatched opening link");
}

const roadmapHtml = await read("roadmap/index.html");
const detailHtml = await read("roadmap/apprentice/index.html");
const ideaDetailHtml = await read("roadmap/shared-spaces/index.html");
const changelogHtml = await read("changelog/index.html");
const rss = await read("changelog/rss.xml");
const detailSource = await readSource("src/pages/roadmap/[slug].astro");
const journeySource = await readSource("src/components/roadmap/RoadmapJourney.astro");
const productDataSource = await readSource("src/lib/product-data.ts");
const roadmapSnapshot = JSON.parse(await readSource("src/data/roadmap.json"));
const roadmapText = plain(roadmapHtml);
const changelogText = plain(changelogHtml);
const detailText = plain(detailHtml);
const ideaDetailText = plain(ideaDetailHtml);
const sharedSpaces = roadmapSnapshot.items.find((item) => item.slug === "shared-spaces");

assert.deepEqual(
	roadmapPresentation(sharedSpaces),
	{ underReview: false, canParticipate: false },
	"Fallback idea URLs must not enable participation",
);
assert.deepEqual(
	roadmapPresentation({
		...sharedSpaces,
		issueNumber: 123,
		githubUrl: "https://github.com/homun-app/homun/issues/123",
	}),
	{ underReview: false, canParticipate: true },
	"A matching public GitHub issue must enable participation",
);
for (const candidate of [
	{ issueNumber: 123, githubUrl: "https://github.com/homun-app/homun/issues/new" },
	{ issueNumber: 123, githubUrl: "https://github.com/homun-app/homun/issues/456" },
	{ issueNumber: null, githubUrl: "https://github.com/homun-app/homun/issues/123" },
]) {
	assert.equal(
		roadmapPresentation({ ...sharedSpaces, ...candidate }).canParticipate,
		false,
		"New, mismatched, and missing issue references must stay non-participatory",
	);
}
assert.equal(roadmapPresentation({ ...sharedSpaces, underReview: true }).underReview, true);
assert.equal(roadmapPresentation({ ...sharedSpaces, underReview: false }).underReview, false);

assert.ok(roadmapHtml.includes("data-roadmap-filter"), "Roadmap is missing area filters");
for (const required of ["The Apprentice", "Building", "68%", "Related releases"]) {
	assert.ok(detailText.includes(required), `Roadmap detail missing: ${required}`);
}
assert.ok(
	detailHtml.includes('data-public-update-date="2026-07-13"'),
	"Roadmap detail is not tied to the stable public update date",
);
assert.ok(!detailText.includes("Under review"), "Published apprentice is incorrectly marked under review");
assert.ok(!detailText.includes("Vote on GitHub"), "Voting is incorrectly shown outside open Ideas");
for (const required of ["Ideas", "👍 0"]) {
	assert.ok(ideaDetailText.includes(required), `Open idea detail missing: ${required}`);
}
assert.ok(!ideaDetailText.includes("Vote on GitHub"), "Fallback idea URL incorrectly enables voting");
assert.ok(!ideaDetailText.includes("Discuss on GitHub"), "Fallback idea URL incorrectly enables discussion");
assert.match(
	detailSource,
	/roadmapPresentation[\s\S]*presentation\.underReview[\s\S]*Under review/,
	"Roadmap detail does not support the conditional Under review badge",
);
assert.match(
	journeySource,
	/roadmapPresentation[\s\S]*presentation\.canParticipate/,
	"Roadmap journey does not gate participation through the shared helper",
);

for (const required of [
	"What we're building. What just shipped.",
	"Currently building",
	"The journey",
	"Ideas",
	"👍 0",
	"Suggest an idea",
	"v0.1.1055",
	"Synced with GitHub",
]) {
	assert.ok(roadmapText.includes(required), `Roadmap missing: ${required}`);
}
assert.ok(!roadmapText.includes("Exploring"), "Roadmap still exposes the retired Exploring stage");
assert.ok(!roadmapText.includes("Vote on GitHub"), "Roadmap exposes voting without a real issue");
assert.ok(!roadmapText.includes("Discuss on GitHub"), "Roadmap exposes discussion without a real issue");
assert.deepEqual(
	[...roadmapHtml.matchAll(/<h3[^>]*>(Ideas|Next|Building|Shipped)<\/h3>/g)].map((match) => match[1]),
	["Ideas", "Next", "Building", "Shipped"],
	"Roadmap stages are not rendered in governance order",
);
assert.equal(
	roadmapText.match(/Suggest an idea/g)?.length,
	1,
	"Roadmap must contain exactly one proposal entry point",
);
assert.ok(
	roadmapHtml.includes("https://github.com/homun-app/homun/issues/new?template=roadmap-idea.yml"),
	"Roadmap proposal entry point does not use the structured idea form",
);
assertNoNestedAnchors(roadmapHtml);
assert.doesNotMatch(
	productDataSource,
	/export const communityIdeas\b/,
	"Product data still exports the retired communityIdeas alias",
);

assert.ok(changelogText.includes("v0.1.1055"), "Changelog is missing the real latest release");
assert.ok(!changelogText.includes("illustrative samples"), "Changelog still contains sample copy");
assert.ok(rss.includes("v0.1.1055"), "RSS is missing the real latest release");

console.log("Living roadmap and release contract passed");
