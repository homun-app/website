import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { homeRoadmap } from "../src/lib/releases-roadmap.mjs";

// The homepage lists what the two snapshots hold, through the adapter. The
// snapshots sync from GitHub (`npm run sync:product-data`): they are read here
// and never written.
const releaseSnapshot = JSON.parse(readFileSync("src/data/releases.json", "utf8"));
const roadmapSnapshot = JSON.parse(readFileSync("src/data/roadmap.json", "utf8"));
const model = homeRoadmap(releaseSnapshot, roadmapSnapshot);

// No hand-written news or roadmap is left to drift from the snapshots.
for (const path of ["src/data/news.mjs", "src/data/home-roadmap.mjs"]) {
	assert.ok(!existsSync(path), `${path} must not come back: the homepage reads the snapshots`);
}

// The sync keeps pre-releases too: every item says which it is, and the
// download resolver still picks stable releases only (check-download-routing.mjs).
assert.ok(releaseSnapshot.items.length > 0, "releases.json is empty");
assert.ok(
	releaseSnapshot.items.every(({ prerelease }) => typeof prerelease === "boolean"),
	"every release must say whether it is a pre-release",
);
const keptPrereleases = releaseSnapshot.items.filter(({ prerelease }) => prerelease);
assert.ok(keptPrereleases.length > 0, "the beta channel is public record: the sync must keep it");
const newest = [...releaseSnapshot.items].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
const stablesOfSnapshot = newest.filter(({ prerelease }) => !prerelease);

// Shipped: one line for the pre-releases of a version line, then the newest
// stable releases whose lead is a readable title.
const shown = model.shipped.flatMap(({ releases }) => releases);
const [beta, ...stables] = shown;
assert.deepEqual(
	{ version: beta.version, meta: beta.meta },
	{ version: "0.3", meta: "beta" },
	"the open beta leads the column, as its version line marked as such",
);
// The line invents no title: it counts the pre-releases, dates the last one
// and leaves the reading to the changelog. GitHub names a release after its
// tag and the 0.3 beta notes are in Italian, so there is no title to show.
assert.equal(beta.title, `${keptPrereleases.length} pre-release${keptPrereleases.length === 1 ? "" : "s"}`);
assert.match(beta.body, /^The latest on [A-Z][a-z]{2} \d{1,2}, \d{4}\.$/);
assert.equal(beta.href, "/changelog/", "the beta line leads to the changelog, not to an installer");
const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
assert.ok(beta.body.includes(dateFormat.format(new Date(newest[0].publishedAt))), "the beta line dates the last pre-release");

// A readable title is the lead of the first highlight, in five words at most:
// a longer one is a sentence about the internals, and the release stays out
// until it has a title on GitHub.
const plain = (text) => (text ?? "").replace(/\*\*/g, "").replace(/`([^`]*)`/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
const leadOf = (release) => {
	const first = [...release.highlights, ...release.improvements, ...release.fixes][0];
	return plain(/^\*\*(.+?)\.?\*\*/.exec(first ?? "")?.[1] ?? "");
};
const readable = (release) => {
	const lead = leadOf(release);
	return lead !== "" && lead.split(/\s+/).length <= 5;
};
const readableStables = stablesOfSnapshot.filter(readable);
assert.ok(readableStables.length >= 3, "the stable releases need readable titles on GitHub");
assert.deepEqual(stables.map(({ version }) => `v${version}`), readableStables.slice(0, 3).map(({ version }) => version));
for (const [index, release] of stables.entries()) {
	assert.equal(release.href, readableStables[index].githubUrl, `${release.version} must link its release`);
	assert.ok(release.title && release.body, `${release.version} needs a title and a body`);
	assert.equal(release.title, leadOf(readableStables[index]).replace(/\.$/, ""), `${release.version} shows the lead of its note, and nothing else`);
}

// The work ahead: each card is a program of the snapshot, in the stage of its column.
const stages = { now: "building", next: "next", later: "exploring" };
for (const [lane, stage] of Object.entries(stages)) {
	assert.ok(model[lane].releases.length >= 1, `The ${lane} column is empty`);
	for (const { href } of model[lane].releases) {
		const slug = href.split("/").filter(Boolean).at(-1);
		const item = roadmapSnapshot.items.find((item) => item.slug === slug);
		if (item) assert.equal(item.stage, stage, `${slug} is in stage "${item.stage}", not "${stage}": the adapter or the snapshot moved`);
	}
}
const building = roadmapSnapshot.items.filter((item) => item.itemType === "strategic_program" && item.stage === "building");
const milestones = building.flatMap(({ milestones }) => milestones);
assert.deepEqual(model.progress, {
	done: milestones.filter(({ completed }) => completed).length,
	total: milestones.length,
});

// The built homepage shows exactly this, in this order.
const html = readFileSync("dist/index.html", "utf8");
const roadmap = html.slice(html.indexOf('id="roadmap"'), html.indexOf('id="download"'));
const printed = roadmap.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
assert.deepEqual([...roadmap.matchAll(/data-era="([^"]+)"/g)].map(([, era]) => era), ["shipped", "now", "next", "later"]);
for (const { version, meta, title, body } of [...shown, ...model.now.releases, ...model.next.releases, ...model.later.releases]) {
	for (const value of [version, meta, title, body].filter((value) => value !== undefined)) {
		assert.ok(printed.includes(value), `The homepage must show: ${value}`);
	}
}
assert.match(printed, /0\.3 · beta/, "the beta must be marked as such on the page");
assert.match(roadmap.slice(roadmap.indexOf('data-era="shipped"'), roadmap.indexOf('data-era="now"')), /href="\/changelog\/"/, "the beta line must lead to the changelog");
// Never a technical title, and never a made-up one for the beta channel.
for (const release of stablesOfSnapshot.filter((release) => !readable(release))) {
	const lead = leadOf(release);
	if (lead) assert.ok(!printed.includes(lead), `A release without a readable title is on the page: ${lead}`);
}
assert.ok(!printed.includes("The bot team"), "the beta line takes no title from the mockup");
// The bar says how far the work has come. While nothing is done the page
// shows neither a bar nor a number, only «in progress».
assert.ok(!printed.includes("0 of "), "the roadmap must never read as «0 of N»");
if (model.progress.done === 0) {
	assert.ok(!roadmap.includes('role="progressbar"'), "an empty progress bar stays out of the page");
	assert.match(printed, /In progress/, "work that has started and is not measured yet reads «in progress»");
}
assert.ok(roadmap.includes('href="/roadmap/"'), "The section must link the roadmap");
assert.ok(roadmap.includes('href="/changelog/"'), "The section must link the changelog");

// The beta line leads to a changelog that does list the pre-releases, each
// marked as such, and keeps «Latest» on the newest stable release.
const changelog = readFileSync("dist/changelog/index.html", "utf8");
const id = (version) => version.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
for (const release of newest.slice(0, 3)) {
	const article = changelog.match(new RegExp('<article id="' + id(release.version) + '"[^>]*>[\\s\\S]*?<\\/article>'))?.[0];
	assert.ok(article, `the changelog must list ${release.version}`);
	assert.equal(article.includes(">Pre-release<"), Boolean(release.prerelease), `${release.version} must say whether it is a pre-release`);
	assert.equal(article.includes(">Latest<"), !release.prerelease && release === stablesOfSnapshot[0], `${release.version}: «Latest» belongs to the newest stable release only`);
}

console.log("Homepage releases and roadmap contract passed");
