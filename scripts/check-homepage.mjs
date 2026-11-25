import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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

const [drafts, apps, skills, computer, approvals] = [
	"drafts", "apps", "skills", "computer", "approvals",
].map(section);
let previous = showcase;
for (const current of [drafts, apps, skills, computer, approvals]) {
	assert.ok(html.indexOf(current) >= html.indexOf(previous) + previous.length,
		"feature sections must follow the showcase in plan order");
	previous = current;
}

assert.equal((drafts.match(/data-card="draft"/g) ?? []).length, 2);
assert.match(drafts, /draft — sent only if you confirm/);

const tiles = apps.split(/<div\b[^>]*\bdata-app-tile(?=[\s>])/).slice(1)
	.map((tile) => tile.split("</div>", 1)[0]);
assert.ok(tiles.length >= 8, "apps needs at least eight app tiles");
assert.match(apps, /Composio/);
assert.match(apps, /MCP/);
assert.ok(tiles.some((tile) => tile.includes("work · personal")), "one tile must show both Gmail accounts");

assert.match(skills, /data-card="skill"[^>]*>[\s\S]*?Save skill/);
assert.match(computer, /data-computer-screen(?=[\s>])[^>]*>[\s\S]*?Take over/);
const approvalActions = [...approvals.matchAll(/data-pill(?=[\s>])[^>]*>\s*([^<]+?)\s*<\/span>/g)]
	.map((match) => match[1]);
assert.deepEqual(approvalActions, ["Allow", "For this turn", "Always allow", "Deny"]);

const [teams, routines, models, memory] = ["teams", "routines", "models", "memory"].map(section);
for (const current of [teams, routines, models, memory]) {
	assert.ok(html.indexOf(current) >= html.indexOf(previous) + previous.length,
		"teams, routines, models and memory must follow approvals in plan order");
	previous = current;
}

const members = [...teams.matchAll(/<li\b[^>]*\bdata-team-member="(bot|user)"[^>]*>([\s\S]*?)<\/li>/g)];
assert.deepEqual(members.map((member) => member[1]), ["bot", "bot", "bot", "user"]);
for (const [, kind, member] of members) {
	if (kind === "bot") assert.match(member, /data-bot-avatar="/);
	else assert.match(member, />\s*You\s*</);
}
assert.equal((teams.match(/data-from="member"/g) ?? []).length, 3);

assert.match(routines, /data-card="routine"[^>]*>[\s\S]*?data-pill(?=[\s>])[^>]*>\s*Activate\s*<\/span>/);

for (const provider of ["Ollama", "LM Studio", "Anthropic", "OpenRouter", "OpenAI-compatible"]) {
	assert.ok(models.includes(provider), `models must show ${provider}`);
}
assert.ok((models.match(/data-model-location="local"[^>]*>\s*local\s*<\/span>/g) ?? []).length >= 3);
assert.match(models, /Homun local[\s\S]*?built into Homun/);
const botModels = [...models.matchAll(/<li\b[^>]*\bdata-bot-model(?=[\s>])[^>]*>([\s\S]*?)<\/li>/g)];
assert.equal(botModels.length, 3);
const modelNames = botModels.map(([, row]) => {
	assert.match(row, /data-bot-avatar="/);
	const model = row.match(/<em\b[^>]*>\s*([^<]+?)\s*<\/em>/)?.[1];
	assert.ok(model, "each bot must show its model");
	return model;
});
assert.equal(new Set(modelNames).size, 3);

assert.match(memory, /^<section\b[^>]*\bdata-tone="band"/);
assert.match(memory, /<svg\b[^>]*\bdata-product="engramma"/);
assert.match(memory, /<a\b[^>]*\bhref="\/engramma"/);
assert.match(memory, /data-memory-note(?=[\s>])[^>]*>[\s\S]*?waiting for your OK/);

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

const [uses, news, download] = ["uses", "news", "download"].map(section);
for (const current of [uses, news, download]) {
	assert.ok(html.indexOf(current) >= html.indexOf(previous) + previous.length,
		"use cases, news and download must follow memory in plan order");
	previous = current;
}

const articles = [...uses.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)];
assert.equal(articles.length, 6);
// English display names from sandbot/src/main/templates.
const templates = [
	"Chief of staff", "Daily briefing editor", "Executive assistant",
	"Inbox manager", "Meeting preparation assistant", "Mention monitor",
];
let templateCount = 0;
for (const [, article] of articles) {
	const template = article.match(/Template:\s*([^<]+)/)?.[1].trim();
	if (template) {
		assert.ok(templates.includes(template), `Unknown template: ${template}`);
		templateCount++;
	} else {
		assert.match(article, /Ask in your own words/);
	}
}
assert.equal(templateCount, 3);

// The releases and the roadmap come from the two snapshots: check-news.mjs
// compares the section with them, through the adapter.
assert.match(news, /^<section\b[^>]*\bdata-tone="band"/);
assert.ok(!news.includes("data-news-version") && !news.includes("data-roadmap-lane"), "No hand-written news or roadmap on the homepage");
assert.match(download, /<svg\b[^>]*data-mascot(?=[\s>])/);
assert.match(download, /<a\b[^>]*data-homun-download(?=[\s>])/);

await import("./check-news.mjs");

// The questions of the homepage answer from the published guides: each answer
// links a page of the documentation that the build has produced.
const faq = section("faq", "download");
const answers = [...faq.matchAll(/<details\b[\s\S]*?<\/details>/g)].map(([details]) => details);
assert.equal(answers.length, 4);
for (const answer of answers) {
	const hrefs = [...answer.matchAll(/href="(\/[^"#]+)(#[^"]*)?"/g)].map(([, path]) => path);
	assert.ok(hrefs.length >= 1, "Each answer links its guide");
	for (const path of hrefs) assert.ok(existsSync(`dist${path}index.html`), `The answer links a page that does not exist: ${path}`);
}
assert.match(faq, /data-product="homun"/);

console.log("Homepage bot-team contract passed");

const nav = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? "";
assert.ok(nav.includes('href="/engramma/"') && nav.includes(">Preview<"), "Nav must link Engramma with a Preview label");
for (const link of ["/marketplace", "#computer", "#memory"]) assert.ok(!nav.includes(link), "Unexpected nav link " + link);
assert.match(nav, /href="\/docs\/?"/);
assert.match(nav, /data-homun-download/);
const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)?.[0] ?? "";
for (const value of ["Apache-2.0", "https://github.com/homun-app/homun-core", "Changelog", "Roadmap", 'data-product="engramma"', 'data-product="homun"']) {
	assert.ok(footer.includes(value), "Footer needs " + value);
}
assert.doesNotMatch(footer, /Sign in|source-available|Your work · your models · your system/i);
assert.match(html, /<title>[^<]*bot team/i);
