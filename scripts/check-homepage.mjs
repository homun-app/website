import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const text = html
	.replace(/<[^>]+>/g, " ")
	.replace(/&#39;/g, "'")
	.replace(/&quot;/g, '"')
	.replace(/&amp;/g, "&")
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

// The sections follow the mockup's order.
const order = [
	"team", "how", "drafts", "apps", "skills", "computer",
	"approvals", "routines", "models", "memory", "privacy", "uses", "roadmap", "faq", "download",
];
const positions = order.map((id) => html.search(new RegExp(`<section\\b[^>]*\\bid="${id}"`)));
for (const id of order) assert.ok(positions[order.indexOf(id)] >= 0, `homepage is missing section#${id}`);
for (let index = 1; index < order.length; index += 1) {
	assert.ok(positions[index] > positions[index - 1], `${order[index]} must follow ${order[index - 1]}`);
}

// The hero: the split pitch, the waking mascot, the app window at work.
const hero = section("hero").length ? html.slice(html.indexOf('id="hero"'), html.indexOf('id="team"')) : "";
assert.ok(hero, "the hero precedes the team band");
const mascot = hero.match(/<svg\b[^>]*\bdata-mascot(?=[\s>])[^>]*>/)?.[0];
assert.match(mascot ?? "", /class="[^"]*\bis-waking\b/, "hero must show the waking mascot");
const heading = hero.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]
	?.replace(/<[^>]+>/g, " ")
	.replace(/\s+/g, " ").trim();
assert.equal(heading, "Your bot team. On your computer.");
assert.match(hero, /<a\b[^>]*\bdata-homun-download(?=[\s>])/, "hero needs a download link");
const platforms = hero.match(/<div\b[^>]*\bdata-hero-platforms(?=[\s>])[^>]*>([\s\S]*?)<\/div>/)?.[1];
assert.ok(platforms, "hero needs a platform row");
const platformText = platforms.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
assert.equal((platformText.match(/\bbeta\b/gi) ?? []).length, 1, "only the platform the offer ships is the beta");
assert.equal((platformText.match(/\bsoon\b/gi) ?? []).length, 2, "the platforms the offer does not cover say «soon»");
assert.match(platformText, /Apple Silicon/, "the chip says which Macs the installer fits");
for (const chip of ["Gmail", "Calendar", "Slack", "Notion", "GitHub", "Anthropic", "OpenAI", "Ollama"]) {
	assert.ok(hero.includes(`>${chip}<`), `hero must list ${chip} in the works-with row`);
}
// The window is the app kit's own: four bots, the team, the draft.
assert.equal((hero.match(/data-bot-row(?=[\s>])/g) ?? []).length, 4, "the window needs four bot rows");
assert.match(hero, /data-team-row(?=[\s>])/, "the window needs the team row");
assert.match(hero, /data-card="draft"/, "the window needs a draft card");
// `glow` is the retired background effect of the old pages (absolute, blurred):
// on the card it made the draft invisible.
assert.doesNotMatch(hero, /class="[^"]*\bglow\b[^"]*"[^>]*data-card="draft"/, "the draft card must not carry the old background class");
assert.match(hero, /draft — sent only if you confirm/, "the draft must say it waits for you");
assert.match(hero, /data-bot-avatar="/, "the bots are the app's own avatars");
assert.match(hero, /Offsite Dec 12/, "the team of the window is the offsite");

// The team hub: the strong point, with the Activity panel's own words.
const team = section("team");
for (const name of ["Chief of staff", "Scout", "Inbox manager", "You", "Daily briefing", "Account manager"]) {
	assert.ok(team.includes(`data-node="${name}"`), `the hub needs ${name}`);
}
assert.match(team, /data-verdict(?=[\s>])/, "the hub needs its verdict line");
// Labels the app really prints (0.3, beta.20: renderer/src/lib/activity.ts,
// AgentSendRow.tsx, TeamChat.tsx, ActivityPanel.tsx, ApprovalCard.tsx,
// shared/ui-messages.ts, MemoryPanel.tsx).
for (const label of [
	"Asked Scout: a venue for Dec 12",
	"Opened salanavigli.it",
	"Wants to send the booking request",
	"Allowed for this turn",
	"Draft awaiting your click: 20 invites",
	"Took note: Acme only signs annual contracts",
	"Summary for you",
]) {
	assert.ok(team.includes(label), `the activity log must show the app's own label: ${label}`);
}
for (const legend of ["waits for you", "done, or allowed by you", "remembered, with its source"]) {
	assert.ok(team.includes(legend), `the hub legend must explain: ${legend}`);
}

// How a bot works: the family's pipeline, five steps, the gate in teal, the
// memory in Engramma's blue.
const how = section("how");
assert.equal((how.match(/class="stage(?=[ "])/g) ?? []).length, 5, "the pipeline has five steps");
for (const stage of ["You ask, or it wakes up", "Thinks with the model you chose", "Works with your apps and the bots’ computer", "Asks before it goes too far", "Remembers, and says where from"]) {
	assert.ok(how.includes(stage), `the pipeline needs the step: ${stage}`);
}
assert.match(how, /class="stage[^"]*\bcore\b/, "Your OK is the gate, in the product's accent");
assert.match(how, /class="stage[^"]*\bmem\b/, "the memory step is Engramma's, in blue");
assert.match(how, /by Engramma/, "the memory step names Engramma");
for (const chip of ["chat", "routines", "triggers", "Composio · MCP", "Allow · Deny", "For this turn", "Always allow for a bot"]) {
	assert.ok(how.includes(`>${chip}<`), `the pipeline chip must exist in the app: ${chip}`);
}

// The dives.
const drafts = section("drafts");
assert.equal((drafts.match(/data-card="draft"/g) ?? []).length, 2);
assert.match(drafts, /7 more drafts awaiting your click/);

const apps = section("apps");
const tiles = apps.split(/<div\b[^>]*\bdata-app-tile(?=[\s>])/).slice(1)
	.map((tile) => tile.split("</div>", 1)[0]);
assert.ok(tiles.length >= 8, "apps needs at least eight app tiles");
assert.match(apps, /Composio/);
assert.match(apps, /MCP/);
assert.ok(tiles.some((tile) => tile.includes("work · personal")), "one tile must show both Gmail accounts");

assert.match(section("skills"), /data-card="skill"[^>]*>[\s\S]*?wants to change skills/, "a skill is saved through the app's own card");
assert.match(section("skills"), /Claude Code plugins/);

const computer = section("computer");
assert.match(computer, /data-computer-screen(?=[\s>])[^>]*>[\s\S]*?Take control/, "the takeover uses the app's own label");
assert.match(computer, /a box with a browser, files and a terminal/, "the dive says what the computer holds");

const approvals = section("approvals");
const approvalActions = [...approvals.matchAll(/data-pill(?=[\s>])[^>]*>\s*([^<]+?)\s*<\/span>/g)]
	.map((match) => match[1]);
assert.deepEqual(approvalActions, ["Allow", "For this turn", "Always allow for Scout", "Deny"]);
assert.match(approvals, /Allowed for this turn · request sent/);
assert.match(approvals, /In Automatic, a model lets what serves your request through/, "the dive says which mode it describes");

assert.match(section("routines"), /data-card="routine"[^>]*>[\s\S]*?data-pill(?=[\s>])[^>]*>\s*Activate\s*<\/span>/);
assert.match(section("routines"), /data-pill(?=[\s>])[^>]*>\s*Edit\s*<\/span>/, "a routine is edited with the app's own button");
assert.match(section("routines"), /on an incoming email/, "the triggers are the app's");

const models = section("models");
for (const provider of ["Ollama", "LM Studio", "Anthropic", "OpenRouter", "OpenAI-compatible"]) {
	assert.ok(models.includes(provider), `models must show ${provider}`);
}
assert.match(models, /Built-in \(on your Mac\)/);
assert.match(models, /Anthropic · your key/);

const memory = section("memory");
assert.match(memory, /<a\b[^>]*\bhref="\/engramma\/"/, "memory links Engramma's page");
assert.ok(memory.includes("from you · Tue 11 Nov · stated"), "a note shows its source");
assert.ok(memory.includes("from a website · waiting for confirmation"), "the web claim waits for confirmation, as the app says");

// Where your data stays: every way out that the app's code has (0.3, beta.20),
// Composio's servers included, and what leaves without connecting anything.
const privacy = section("privacy")
	.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
for (const value of [
	"Your computer",
	"The bots’ computer",
	"Library and memory",
	"Local models",
	"The apps you connected",
	"through Composio’s servers",
	"A cloud model",
	"Web search and web pages",
	"on by default, without a key",
	"Skills, plugins and MCP servers",
	"Models to download",
	"from Hugging Face",
	"Updates and setup",
	"every six hours",
	"Nothing installs without your OK",
	"No telemetry",
	"/reference/architecture/",
]) {
	assert.ok(privacy.includes(value), `the privacy map must say: ${value}`);
}
// The page promises only what a local model keeps: the searches and the pages
// a bot uses still leave.
assert.match(models, /Web searches, pages and apps a bot uses still go out/);

// Uses.
const uses = section("uses");
const articles = [...uses.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)];
assert.equal(articles.length, 6);
// English display names from sandbot/src/main/templates.
const templates = [
	"Chief of staff", "Daily briefing editor", "Executive assistant",
	"Inbox manager", "Meeting preparation assistant", "Mention monitor",
];
let templateCount = 0;
for (const [, article] of articles) {
	const template = article.match(/Template\s*·\s*([^<]+)/)?.[1].trim();
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
const roadmap = section("roadmap");
assert.match(roadmap, /^<section\b[^>]*\bdata-tone="band"/);
assert.ok(!roadmap.includes("data-news-version") && !roadmap.includes("data-roadmap-lane"), "No hand-written news or roadmap on the homepage");

const download = section("download");
assert.match(download, /<svg\b[^>]*data-mascot(?=[\s>])/);
assert.match(download, /<a\b[^>]*data-homun-download(?=[\s>])/);

await import("./check-news.mjs");

// The questions of the homepage answer from the published guides: each answer
// links a page of the documentation that the build has produced.
const faq = section("faq");
const answers = [...faq.matchAll(/<details\b[\s\S]*?<\/details>/g)].map(([details]) => details);
assert.equal(answers.length, 5);
assert.match(faq, /Does it need Docker\?/, "the page answers about Docker");
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

// The mockup's builder notes never reach the page.
assert.ok(!html.includes("MOCKUP NOTE"), "no mockup note may ship");

// The mockup invented labels for things the app 0.3 calls otherwise: they
// never reach the page (Take control, edit, "{bot} wants to change skills",
// Direct MCP, "import from your email, calendar or a webhook", "shared").
for (const label of ["Take over", "Change time", "Save skill", ">Not now<", "direct GitHub", "when something changes", "shared by the team", "1,000+ apps"]) {
	assert.ok(!html.includes(label), `a label the app does not have is back: ${label}`);
}

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
