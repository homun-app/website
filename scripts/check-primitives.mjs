import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { FAMILIES, botSvg } = await import("../src/data/bot-families.mjs");
assert.deepEqual(Object.keys(FAMILIES).sort(), ["creature", "device", "jelly", "robo"]);

const creature = { family: "creature", color: "#F26A2E" };
const waiting = botSvg({ ...creature, state: "waiting" });
assert.match(waiting, /M32 34 C26 20 28 10 34 8/);
assert.match(waiting, /<animate\b/);
assert.doesNotMatch(botSvg({ ...creature, state: "happy" }), /class="blink"/);
assert.doesNotMatch(botSvg({ ...creature, state: "idle", mini: true }), /<animate\b/);
assert.throws(() => botSvg({ ...creature, family: "unknown", state: "idle" }), /family/i);

const html = await readFile(
	new URL("../dist/dev/primitives/index.html", import.meta.url),
	"utf8",
);
for (const marker of [
	"data-app-window", "data-surface", "data-app-tile", "data-computer-screen",
	"data-bot-avatar", "data-done", "data-pill",
	'data-from="me"', 'data-from="bot"', 'data-from="member"',
	'data-card="draft"', 'data-card="approval"', 'data-card="routine"', 'data-card="skill"',
]) {
	assert.ok(html.includes(marker), `primitives preview is missing ${marker}`);
}

assert.ok(
	/<meta\s+name="robots"\s+content="noindex"\s*\/?>/.test(html),
	'primitives preview is missing <meta name="robots" content="noindex">',
);

const sitemap = await readFile(
	new URL("../dist/sitemap-0.xml", import.meta.url),
	"utf8",
);
assert.ok(
	!sitemap.includes("/dev/primitives"),
	"the /dev/primitives preview must be excluded from the sitemap",
);

console.log("App kit primitives contract passed");
