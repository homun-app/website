import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { compareVersions, MIN_PUBLIC_VERSION } from "../src/lib/versions.mjs";
import releases from "../src/data/releases.json" with { type: "json" };

const en = "Being updated for the new Homun — some pages describe the previous version.";
const it = "In aggiornamento per il nuovo Homun: alcune pagine descrivono la versione precedente.";
const page = (route) => readFileSync("dist/" + route + "index.html", "utf8");
for (const route of ["docs/", "roadmap/", "roadmap/team-spaces-roles/"]) {
	assert.ok(page(route).includes(en), "English notice missing on " + route);
}
assert.ok(page("it/docs/").includes(it));
for (const route of ["", "docs/engramma/", "it/docs/engramma/"]) {
	assert.ok(!page(route).includes(en) && !page(route).includes(it), "Unexpected notice on " + route);
}
const changelog = page("changelog/");
for (const { version } of releases.items) {
	const id = version.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
	const article = changelog.match(new RegExp('<article id="' + id + '"[^>]*>[\\s\\S]*?<\\/article>'))?.[0];
	assert.ok(article, "Missing changelog entry " + version);
	assert.equal(article.includes(">Homun 2<"), compareVersions(version, MIN_PUBLIC_VERSION) < 0, version);
}
assert.ok(existsSync("dist/marketplace/index.html"));
console.log("Transition notices and historical release labels passed");
