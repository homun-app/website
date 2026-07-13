import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

const roadmapHtml = await read("roadmap/index.html");
const changelogHtml = await read("changelog/index.html");
const rss = await read("changelog/rss.xml");
const roadmapText = plain(roadmapHtml);
const changelogText = plain(changelogHtml);

for (const required of [
	"What we're building. What just shipped.",
	"Currently building",
	"The journey",
	"Community ideas",
	"v0.1.1055",
	"Synced with GitHub",
]) {
	assert.ok(roadmapText.includes(required), `Roadmap missing: ${required}`);
}

assert.ok(changelogText.includes("v0.1.1055"), "Changelog is missing the real latest release");
assert.ok(!changelogText.includes("illustrative samples"), "Changelog still contains sample copy");
assert.ok(rss.includes("v0.1.1055"), "RSS is missing the real latest release");

console.log("Living roadmap and release contract passed");
