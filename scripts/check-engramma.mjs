import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as brand from "../src/data/brand.mjs";

const output = "dist/engramma/index.html";
assert.ok(existsSync(output), "Build must include the Engramma product page");
const html = readFileSync(output, "utf8");
assert.match(html, /Inside Homun today · coming to other AI apps/);
const sections = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(sections, ["hero", "remembers", "time", "sources", "quarantine", "local", "developers"]);
assert.match(html, /\bdata-homun-download\b/);
for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
	assert.doesNotMatch(href, /github\.com.*engramma|\.mcpb|engramma[^/?#]*\.(?:dmg|exe|msi|deb|appimage|zip|tar\.gz)/i);
}
assert.ok(brand.ENGRAMMA_LETTERS?.[0]);
assert.ok(readFileSync("src/assets/brand/engramma-wordmark-light.svg", "utf8").includes(brand.ENGRAMMA_LETTERS[0]));
console.log("Engramma product page contract passed");
