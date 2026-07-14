import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getViteConfig } from "astro/config";
import { createServer } from "vite";
import { roadmapPresentation } from "../src/lib/roadmap-presentation.mjs";

const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const moderationCopy = "Voting opens after moderation links this idea to its GitHub discussion.";

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
const canonicalIdea = {
	...sharedSpaces,
	issueNumber: 123,
	githubUrl: "https://github.com/homun-app/homun/issues/123",
};

assert.deepEqual(
	roadmapPresentation(sharedSpaces),
	{ underReview: false, hasIssue: false, canDiscuss: false, canVote: false },
	"Fallback idea URLs must not enable participation",
);
assert.deepEqual(
	roadmapPresentation(canonicalIdea),
	{ underReview: false, hasIssue: true, canDiscuss: true, canVote: true },
	"An open Idea with a matching public GitHub issue must enable discussion and voting",
);
assert.deepEqual(
	roadmapPresentation({ ...canonicalIdea, voting: "closed" }),
	{ underReview: false, hasIssue: true, canDiscuss: true, canVote: false },
	"A closed Idea with a matching issue must remain discussable without voting",
);
assert.deepEqual(
	roadmapPresentation({ ...canonicalIdea, status: "building" }),
	{ underReview: false, hasIssue: true, canDiscuss: true, canVote: false },
	"A Building item with a matching issue must remain discussable without voting",
);
for (const candidate of [
	{ issueNumber: 123, githubUrl: "https://github.com/homun-app/homun/issues/new" },
	{ issueNumber: 123, githubUrl: "https://github.com/homun-app/homun/issues/456" },
	{ issueNumber: null, githubUrl: "https://github.com/homun-app/homun/issues/123" },
]) {
	assert.deepEqual(
		roadmapPresentation({ ...sharedSpaces, ...candidate }),
		{ underReview: false, hasIssue: false, canDiscuss: false, canVote: false },
		"New, mismatched, and missing issue references must stay non-participatory",
	);
}
assert.equal(roadmapPresentation({ ...sharedSpaces, underReview: true }).underReview, true);
assert.equal(roadmapPresentation({ ...sharedSpaces, underReview: false }).underReview, false);

const viteConfig = await getViteConfig({
	appType: "custom",
	logLevel: "silent",
	server: { middlewareMode: true },
}, {
	configFile: false,
	root: new URL("../", import.meta.url),
})({ command: "serve", mode: "test" });
const viteServer = await createServer(viteConfig);
try {
	const { default: RoadmapParticipation } = await viteServer.ssrLoadModule(
		"/src/components/roadmap/RoadmapParticipation.astro",
	);
	assert.equal(typeof RoadmapParticipation, "function", "Shared roadmap participation component is missing");

	const container = await AstroContainer.create();
	const activeHtml = await container.renderToString(RoadmapParticipation, {
		props: { item: { ...canonicalIdea, underReview: true, votes: 7 }, variant: "detail" },
	});
	for (const required of ["Under review", "Vote on GitHub", "Discuss on GitHub", "👍 7"]) {
		assert.ok(activeHtml.includes(required), `Rendered participation component missing: ${required}`);
	}

	const fallbackHtml = await container.renderToString(RoadmapParticipation, {
		props: { item: sharedSpaces, variant: "detail" },
	});
	assert.ok(!fallbackHtml.includes("Under review"), "Fallback component leaks a review badge");
	assert.ok(!fallbackHtml.includes("Vote on GitHub"), "Fallback component invents a voting link");
	assert.ok(!fallbackHtml.includes("Discuss on GitHub"), "Fallback component invents a discussion link");
	assert.ok(fallbackHtml.includes(moderationCopy), "Fallback component is missing neutral moderation copy");
} finally {
	await viteServer.close();
}

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
assert.ok(ideaDetailText.includes(moderationCopy), "Fallback idea detail is missing moderation copy");
assert.match(
	detailSource,
	/RoadmapParticipation[\s\S]*item=\{project\}/,
	"Roadmap detail does not use the shared participation component",
);
assert.match(
	journeySource,
	/RoadmapParticipation[\s\S]*item=\{item\}/,
	"Roadmap journey does not use the shared participation component",
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
assert.ok(roadmapText.includes(moderationCopy), "Roadmap is missing neutral moderation copy");
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
