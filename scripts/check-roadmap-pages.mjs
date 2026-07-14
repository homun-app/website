import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
const roadmapText = plain(roadmapHtml);
const changelogText = plain(changelogHtml);
const detailText = plain(detailHtml);
const ideaDetailText = plain(ideaDetailHtml);

assert.ok(roadmapHtml.includes("data-roadmap-filter"), "Roadmap is missing area filters");
for (const required of ["The Apprentice", "Building", "68%", "Discuss on GitHub", "Related releases"]) {
	assert.ok(detailText.includes(required), `Roadmap detail missing: ${required}`);
}
assert.ok(
	detailHtml.includes('data-public-update-date="2026-07-13"'),
	"Roadmap detail is not tied to the stable public update date",
);
assert.ok(!detailText.includes("Under review"), "Published apprentice is incorrectly marked under review");
assert.ok(!detailText.includes("Vote on GitHub"), "Voting is incorrectly shown outside open Ideas");
for (const required of ["Ideas", "👍 0", "Vote on GitHub", "Discuss on GitHub"]) {
	assert.ok(ideaDetailText.includes(required), `Open idea detail missing: ${required}`);
}
assert.match(
	detailSource,
	/project\.underReview[\s\S]*Under review/,
	"Roadmap detail does not support the conditional Under review badge",
);

for (const required of [
	"What we're building. What just shipped.",
	"Currently building",
	"The journey",
	"Ideas",
	"Vote on GitHub",
	"Discuss on GitHub",
	"👍 0",
	"Suggest an idea",
	"v0.1.1055",
	"Synced with GitHub",
]) {
	assert.ok(roadmapText.includes(required), `Roadmap missing: ${required}`);
}
assert.ok(!roadmapText.includes("Exploring"), "Roadmap still exposes the retired Exploring stage");
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

assert.ok(changelogText.includes("v0.1.1055"), "Changelog is missing the real latest release");
assert.ok(!changelogText.includes("illustrative samples"), "Changelog still contains sample copy");
assert.ok(rss.includes("v0.1.1055"), "RSS is missing the real latest release");

console.log("Living roadmap and release contract passed");
