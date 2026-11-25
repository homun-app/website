import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as brand from "../src/data/brand.mjs";
import { ENGRAMMA_RELEASE, ENGRAMMA_ROADMAP, ENGRAMMA_CLIENTS } from "../src/data/engramma.mjs";

const output = "dist/engramma/index.html";
assert.ok(existsSync(output), "Build must include the Engramma product page");
const html = readFileSync(output, "utf8");
assert.match(html, /Developer preview \d+\.\d+\.\d+-beta\.\d+ · also inside Homun/);
const sections = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(sections, ["hero", "how", "different", "remembers", "time", "sources", "quarantine", "connect", "trust", "roadmap"]);
// The hero installs Engramma; Homun's download stays in the nav only.
const hero = html.slice(html.indexOf('id="hero"'), html.indexOf('id="how"'));
assert.ok(hero.includes(ENGRAMMA_RELEASE.installerUrl), "The hero must carry the installer");
assert.doesNotMatch(hero, /\bdata-homun-download\b/, "The hero must not download Homun");
for (const { id, name } of ENGRAMMA_CLIENTS) assert.ok(html.includes(`id="panel-${id}"`) && html.includes(name), `Connect needs ${name}`);

// The developer preview is a prerelease, so every link names the version
// (GitHub's releases/latest skips prereleases).
assert.match(ENGRAMMA_RELEASE.version, /^\d+\.\d+\.\d+-beta\.\d+$/);
assert.ok(html.includes(ENGRAMMA_RELEASE.installerUrl), "The install command must use the versioned installer");
assert.ok(html.includes(`href="${ENGRAMMA_RELEASE.releaseUrl}"`), "The page must link the release");
for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
	assert.doesNotMatch(href, /releases\/latest/, "No releases/latest link while Engramma is a prerelease");
	assert.doesNotMatch(href, /\.mcpb|engramma[^/?#]*\.(?:dmg|exe|msi|deb|appimage|zip|tar\.xz|tar\.gz)$/i, "No direct binary downloads: the installer checks them");
}
for (const { label, shipped } of ENGRAMMA_RELEASE.platforms.filter(({ shipped }) => !shipped)) {
	assert.ok(!shipped && html.includes(label), `${label} is listed as not shipped`);
}

const start = html.indexOf('id="roadmap"');
assert.ok(start > 0, "The page needs the roadmap");
const roadmap = html.slice(start);
for (const { stage, items } of ENGRAMMA_ROADMAP) {
	assert.ok(roadmap.includes(stage), `Roadmap needs the ${stage} stage`);
	for (const { title } of items) assert.ok(roadmap.includes(title), `Roadmap needs ${title}`);
}

assert.ok(brand.ENGRAMMA_LETTERS?.[0]);
assert.ok(readFileSync("src/assets/brand/engramma-wordmark-light.svg", "utf8").includes(brand.ENGRAMMA_LETTERS[0]));
console.log("Engramma product page contract passed");
