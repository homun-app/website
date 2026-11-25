import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { baseVersion, compareVersions, MIN_PUBLIC_VERSION } from "../src/lib/versions.mjs";
import releases from "../src/data/releases.json" with { type: "json" };

const en = "Being updated for the new Homun — some pages describe the previous version.";
const it = "In aggiornamento per il nuovo Homun: alcune pagine descrivono la versione precedente.";
const page = (route) => readFileSync("dist/" + route + "index.html", "utf8");
for (const route of ["roadmap/", "roadmap/team-spaces-roles/"]) {
	assert.ok(page(route).includes(en), "English notice missing on " + route);
}
// The Homun docs describe 0.3, so they carry no transition notice.
for (const route of ["", "docs/", "it/docs/", "guides/getting-started/", "it/guides/getting-started/", "docs/engramma/", "it/docs/engramma/"]) {
	assert.ok(!page(route).includes(en) && !page(route).includes(it), "Unexpected notice on " + route);
}
const changelog = page("changelog/");
let preReleases = 0;
for (const { version, prerelease } of releases.items) {
	const id = version.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
	const article = changelog.match(new RegExp('<article id="' + id + '"[^>]*>[\\s\\S]*?<\\/article>'))?.[0];
	assert.ok(article, "Missing changelog entry " + version);
	// A pre-release of 0.3 is no Homun 2: the line it belongs to is the version it precedes.
	assert.equal(article.includes(">Homun 2<"), !prerelease && compareVersions(baseVersion(version), MIN_PUBLIC_VERSION) < 0, version);
	// The pre-releases are listed, and marked: "Latest" stays on a stable release.
	assert.equal(article.includes(">Pre-release<"), Boolean(prerelease), version + " must say whether it is a pre-release");
	if (prerelease) {
		preReleases += 1;
		assert.ok(!article.includes(">Latest<"), version + " is a pre-release: not the latest release");
	}
}
assert.ok(preReleases > 0, "The changelog must list the beta channel: the homepage leads there");
assert.ok(existsSync("dist/marketplace/index.html"));
console.log("Transition notices and historical release labels passed");
