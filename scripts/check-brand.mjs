import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { HOMUN_LETTERS, JELLY } from "../src/data/brand.mjs";
import { eyeOffset, shouldAnimate } from "../src/scripts/mascot.mjs";

assert.deepEqual(eyeOffset(0, 0, 5), { x: 0, y: 0 });
assert.deepEqual(eyeOffset(600, 0, 5), { x: 5, y: 0 });
assert.equal(eyeOffset(0, 600, 5).y, 3.5);
assert.equal(eyeOffset(150, 0, 5).x, 2.5);
assert.equal(shouldAnimate({ reducedMotion: true, hidden: false }), false);
assert.equal(shouldAnimate({ reducedMotion: false, hidden: true }), false);
assert.equal(shouldAnimate({ reducedMotion: false, hidden: false }), true);

const wordmark = readFileSync("src/assets/brand/homun-wordmark-light.svg", "utf8");
assert.equal(HOMUN_LETTERS.length, 5);
for (const path of [...HOMUN_LETTERS, JELLY[0]]) {
  assert.ok(wordmark.includes(`d="${path}"`), `Missing wordmark path: ${path}`);
}

assert.deepEqual(
  readFileSync("public/favicon.svg"),
  readFileSync("src/assets/brand/favicon.svg"),
  "The public favicon must match the brand asset byte for byte",
);

const homepage = readFileSync("dist/index.html", "utf8");
assert.match(homepage, /<svg\b(?=[^>]*\bdata-mascot(?:\s|=|>))[^>]*\bdata-product="homun"[^>]*>/);

const legacyDot = Buffer.from("M778 26C794.569");
for (const entry of readdirSync("dist", { recursive: true, withFileTypes: true })) {
  if (entry.isFile()) {
    const path = join(entry.parentPath, entry.name);
    assert.ok(!readFileSync(path).includes(legacyDot), `Legacy wordmark in ${path}`);
  }
}

const docs = readFileSync("dist/docs/index.html", "utf8");
assert.match(docs, /<img\b[^>]*\bsrc="[^"]*homun-wordmark[^"]*"/);

const css = readFileSync("src/styles/mascot.css", "utf8");
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/);

console.log("Mascot functions, brand assets, and brand build checks passed.");
