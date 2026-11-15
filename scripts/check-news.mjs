import assert from "node:assert/strict";
import { NEWS } from "../src/data/news.mjs";
import { ROADMAP } from "../src/data/home-roadmap.mjs";
import { compareVersions, MIN_PUBLIC_VERSION } from "../src/lib/versions.mjs";

// Update from published GitHub Releases, including prereleases.
const PUBLISHED_VERSIONS = [
	"v0.3.1001-beta.1",
	"v0.3.1001-beta.2",
	"v0.3.1001-beta.3",
	"v0.3.1001-beta.4",
];

assert.equal(NEWS.length, 4);
assert.equal(new Set(NEWS.map(({ version }) => version)).size, NEWS.length);
for (const [index, { version, date, prerelease }] of NEWS.entries()) {
	assert.ok(PUBLISHED_VERSIONS.includes(version), `Unpublished release: ${version}`);
	assert.ok(compareVersions(version.split("-")[0], MIN_PUBLIC_VERSION) >= 0);
	assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
	assert.ok(Number.isFinite(Date.parse(date)));
	assert.equal(prerelease, version.includes("-"));
	if (index > 0) assert.ok(NEWS[index - 1].date >= date, "News must be newest first");
}
assert.deepEqual(Object.keys(ROADMAP).sort(), ["later", "next", "now"]);
for (const items of Object.values(ROADMAP)) {
	assert.ok(Array.isArray(items) && items.length >= 1 && items.length <= 3);
}

console.log("Homepage news and roadmap contract passed");
