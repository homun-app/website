import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const text = html
	.replace(/<[^>]+>/g, " ")
	.replace(/&#39;/g, "'")
	.replace(/&quot;/g, '"')
	.replace(/\s+/g, " ");

function section(id) {
	const match = html.match(new RegExp(`<section\\b(?=[^>]*\\bid="${id}")[^>]*>`));
	assert.ok(match, `homepage is missing section#${id}`);
	const tags = /<\/?section\b[^>]*>/g;
	tags.lastIndex = match.index + match[0].length;
	let depth = 1;
	for (let tag; (tag = tags.exec(html));) {
		depth += tag[0].startsWith("</") ? -1 : 1;
		if (depth === 0) return html.slice(match.index, tags.lastIndex);
	}
	assert.fail(`section#${id} is not closed`);
}

const hero = section("hero");
const mascot = hero.match(/<svg\b[^>]*\bdata-mascot(?=[\s>])[^>]*>/)?.[0];
assert.match(mascot ?? "", /class="[^"]*\bis-waking\b/, "hero must show the waking mascot");

const heading = hero.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]
	?.replace(/<[^>]+>/g, " ")
	.replace(/\s+/g, " ").trim();
assert.equal(heading, "Your bot team. On your computer.");
assert.match(hero, /<a\b[^>]*\bdata-homun-download(?=[\s>])/, "hero needs a download link");

const platforms = hero.match(/<div\b[^>]*\bdata-hero-platforms(?=[\s>])[^>]*>([\s\S]*?)<\/div>/)?.[1];
assert.ok(platforms, "hero needs a platform row");
assert.equal((platforms.replace(/<[^>]+>/g, " ").match(/\bbeta\b/gi) ?? []).length, 2);

const showcase = section("showcase");
const windowStart = showcase.search(/<div\b[^>]*\bdata-app-window(?=[\s>])/);
assert.ok(windowStart >= 0, "showcase needs the full app window");
const tags = /<\/?div\b[^>]*>/g;
tags.lastIndex = windowStart;
let depth = 0;
for (let tag; (tag = tags.exec(showcase));) {
	depth += tag[0].startsWith("</") ? -1 : 1;
	if (depth === 0) break;
}
assert.ok(tags.lastIndex > windowStart, "app window must be closed");
const app = showcase.slice(windowStart, tags.lastIndex);
assert.ok((app.match(/<div\b[^>]*\bdata-bot-row(?=[\s>])/g) ?? []).length >= 4, "app needs at least four bot rows");
assert.match(app, /<div\b[^>]*\bdata-team-row(?=[\s>])/, "app needs a team row");
assert.match(app, /<div\b[^>]*\bdata-card="draft"/, "app needs a draft card");

assert.doesNotMatch(html, /\bdata-hero-templates\b|<section\b[^>]*\bid="meet"/);

// The Homun 2 homepage is retired: none of its slogans may come back, not
// even through the default page title.
for (const slogan of [
	"Your work. Your models. Your system.",
	"Independent AI workspace",
	"An AI workspace for people who build",
	"Official Homun workflow packs.",
]) {
	assert.ok(!text.includes(slogan), `homepage still contains the retired slogan: ${slogan}`);
}

console.log("Homepage bot-team contract passed");
