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

// Shipped: the newest releases of the snapshot, newest first, each linking its
// release. The sync keeps stable releases only: if a prerelease ever appears
// here, the wording of the section ("stable releases") has to be looked at.
assert.ok(releaseSnapshot.items.length > 0, "releases.json is empty");
assert.ok(releaseSnapshot.items.every(({ version }) => !/-/.test(version)), "releases.json holds a prerelease: the homepage calls them stable");
const newest = [...releaseSnapshot.items].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
const shown = model.shipped.flatMap(({ releases }) => releases);
assert.equal(shown.length, 4);
assert.deepEqual(shown.map(({ version }) => `v${version}`), newest.slice(0, 4).map(({ version }) => version));
for (const [index, release] of shown.entries()) {
	assert.equal(release.href, newest[index].githubUrl, `${release.version} must link its release`);
	assert.ok(release.title && release.body, `${release.version} needs a title and a body`);
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
const news = html.slice(html.indexOf('id="news"'), html.indexOf('id="download"'));
const printed = news.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
assert.deepEqual([...news.matchAll(/data-era="([^"]+)"/g)].map(([, era]) => era), ["shipped", "now", "next", "later"]);
for (const { version, title, body } of [...shown, ...model.now.releases, ...model.next.releases, ...model.later.releases]) {
	for (const value of [version, title, body]) assert.ok(printed.includes(value), `The homepage must show: ${value}`);
}
assert.ok(news.includes("stable releases"), "The section must say which releases it lists");
assert.ok(news.includes('href="/roadmap/"'), "The section must link the roadmap");

console.log("Homepage releases and roadmap contract passed");
