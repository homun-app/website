import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getViteConfig } from "astro/config";
import { createServer } from "vite";
import * as roadmapPresentationModule from "../src/lib/roadmap-presentation.mjs";

const { roadmapPresentation, selectFeaturedProject } = roadmapPresentationModule;

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
const featuredSource = await readSource("src/components/roadmap/FeaturedProject.astro");
const productDataSource = await readSource("src/lib/product-data.ts");
const roadmapSnapshot = JSON.parse(await readSource("src/data/roadmap.json"));
const releasesSnapshot = JSON.parse(await readSource("src/data/releases.json"));
const orderedReleases = [...releasesSnapshot.items].sort(
	(left, right) => new Date(right.publishedAt) - new Date(left.publishedAt)
		|| left.version.localeCompare(right.version),
);
assert.ok(orderedReleases.length >= 2, "Release presentation contract needs two releases");
const [expectedLatestRelease, expectedPreviousRelease] = orderedReleases;
const releaseId = (version) => version.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

assert.equal(
	typeof selectFeaturedProject,
	"function",
	"Roadmap presentation is missing its featured Building selector",
);
const ordinaryBuilding = {
	...canonicalIdea,
	slug: "ordinary-building",
	status: "building",
	featured: false,
};
assert.equal(
	selectFeaturedProject([{ ...canonicalIdea, featured: true }, ordinaryBuilding]),
	ordinaryBuilding,
	"An Idea marked featured must not be projected as Currently building",
);
assert.equal(
	selectFeaturedProject([{ ...ordinaryBuilding, featured: true }, ordinaryBuilding]).featured,
	true,
	"A featured Building initiative must take precedence over the Building fallback",
);

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

	const { default: FeaturedProject } = await viteServer.ssrLoadModule(
		"/src/components/roadmap/FeaturedProject.astro",
	);
	const featuredHtml = await container.renderToString(FeaturedProject, {
		props: {
			project: {
				...canonicalIdea,
				status: "building",
				publicUpdateDate: "2026-07-04",
			},
		},
	});
	assert.ok(featuredHtml.includes("Updated Jul 4"), "Featured project does not use publicUpdateDate");
	assert.ok(
		featuredHtml.includes('data-public-update-date="2026-07-04"'),
		"Featured project does not expose its stable public update date",
	);
	const featuredWithoutDate = await container.renderToString(FeaturedProject, {
		props: {
			project: {
				...canonicalIdea,
				status: "building",
				publicUpdateDate: null,
			},
		},
	});
	assert.ok(
		!featuredWithoutDate.includes("Updated "),
		"Featured project invents an update date when publicUpdateDate is absent",
	);
	await assert.rejects(
		container.renderToString(FeaturedProject, {
			props: { project: { ...canonicalIdea, featured: true } },
		}),
		/Featured roadmap project must be Building: shared-spaces/,
		"FeaturedProject must reject a non-Building project",
	);
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
	expectedLatestRelease.version,
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
assert.doesNotMatch(
	productDataSource,
	/export const ideasOpenForVoting\b/,
	"Product data exposes an unused ideasOpenForVoting collection",
);
assert.doesNotMatch(
	featuredSource,
	/project\.updatedAt/,
	"Featured project reads the raw Issue activity timestamp",
);
assert.doesNotMatch(
	productDataSource,
	/\bupdatedAt\s*:/,
	"The public RoadmapItem contract exposes raw Issue activity metadata",
);
assert.match(
	productDataSource,
	/selectFeaturedProject\(roadmapItems\)/,
	"Product data does not use the guarded featured Building projection",
);

assert.match(
	roadmapHtml,
	new RegExp(
		`Latest release[\\s\\S]*?<h2[^>]*>${escapeRegex(expectedLatestRelease.version)}<\\/h2>`,
	),
	`Roadmap latest-release card is not led by ${expectedLatestRelease.version}`,
);
const latestArticleStart = changelogHtml.indexOf(`id="${releaseId(expectedLatestRelease.version)}"`);
const previousArticleStart = changelogHtml.indexOf(`id="${releaseId(expectedPreviousRelease.version)}"`);
assert.ok(latestArticleStart >= 0, `Changelog is missing ${expectedLatestRelease.version}`);
assert.ok(previousArticleStart >= 0, `Changelog is missing ${expectedPreviousRelease.version}`);
assert.ok(
	latestArticleStart < previousArticleStart,
	`Changelog does not order ${expectedLatestRelease.version} before ${expectedPreviousRelease.version}`,
);
const latestArticleHtml = changelogHtml.slice(latestArticleStart, previousArticleStart);
assert.ok(
	latestArticleHtml.includes(expectedLatestRelease.version)
		&& latestArticleHtml.includes("Latest"),
	`Changelog does not mark ${expectedLatestRelease.version} as latest`,
);
assert.ok(!changelogText.includes("illustrative samples"), "Changelog still contains sample copy");
const rssItems = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
assert.ok(rssItems.length >= 2, "RSS release contract needs two items");
assert.ok(
	rssItems[0].includes(`<title>Homun ${expectedLatestRelease.version}</title>`)
		&& rssItems[0].includes(`#${releaseId(expectedLatestRelease.version)}/</link>`),
	`RSS first item is not ${expectedLatestRelease.version}`,
);
assert.ok(
	rss.indexOf(`<title>Homun ${expectedLatestRelease.version}</title>`)
		< rss.indexOf(`<title>Homun ${expectedPreviousRelease.version}</title>`),
	`RSS does not order ${expectedLatestRelease.version} before ${expectedPreviousRelease.version}`,
);

console.log("Living roadmap and release contract passed");
