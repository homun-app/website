import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

const expectedLicenseSha256 =
	"5904c160d2d93c62e0113b5cc9d20a6880e04839bff3a130bd622cc141a64429";

function fromDist(path) {
	return readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
}

function visibleText(html) {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/&quot;/gi, '"')
		.replace(/\s+/g, " ")
		.trim();
}

async function allHtml(directory, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map(async (entry) => {
		const url = new URL(entry.name, directory);
		if (entry.isDirectory()) return allHtml(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`);
		if (!entry.isFile() || !entry.name.endsWith(".html")) return [];
		return [{ path: `${prefix}${entry.name}`, html: await readFile(url, "utf8") }];
	}));
	return nested.flat();
}

const [english, italian, homepage, releaseData, bindingText] = await Promise.all([
	fromDist("license/index.html"),
	fromDist("it/license/index.html"),
	fromDist("index.html"),
	readFile(new URL("../src/data/releases.json", import.meta.url), "utf8").then(JSON.parse),
	readFile(new URL("../src/data/homun-core-license.md", import.meta.url), "utf8"),
]);
const { changeDate } = await import("../src/lib/license-dates.mjs");

assert.equal(
	createHash("sha256").update(bindingText).digest("hex"),
	expectedLicenseSha256,
	"Published license text must match the audited homun-core license",
);
assert.equal(
	changeDate("2026-07-22T12:23:28Z"),
	"2028-07-22T12:23:28.000Z",
);
assert.match(english, /<link rel="canonical" href="https:\/\/homun\.app\/license\/"/);
assert.match(italian, /<link rel="canonical" href="https:\/\/homun\.app\/it\/license\/"/);

const englishText = visibleText(english);
const italianText = visibleText(italian);
for (const marker of [
	"Functional Source License, Version 1.1, ALv2 Future License",
	"FSL-1.1-ALv2",
	"Grant of Future License",
	"Apache License, Version 2.0",
]) {
	assert.ok(englishText.includes(marker), `English license page is missing: ${marker}`);
	assert.ok(italianText.includes(marker), `Italian license page is missing: ${marker}`);
}
assert.ok(
	englishText.includes("Each Homun version changes to Apache-2.0 on its own date"),
	"English page must explain per-version conversion",
);
assert.ok(
	italianText.includes("Ogni versione di Homun passa ad Apache-2.0 nella propria data"),
	"Italian page must explain per-version conversion",
);
assert.ok(
	italianText.includes("Il testo inglese della licenza è vincolante"),
	"Italian page must identify the binding terms",
);
assert.ok(
	italianText.includes("Testo vincolante (in inglese)"),
	"Italian binding-text heading must be localized",
);

for (const release of releaseData.items) {
	const conversion = changeDate(release.publishedAt);
	for (const [name, html] of [["English", english], ["Italian", italian]]) {
		assert.ok(html.includes(release.version), `${name} page is missing ${release.version}`);
		assert.ok(html.includes(release.githubUrl), `${name} page is missing ${release.githubUrl}`);
		assert.ok(html.includes(`datetime="${conversion}"`), `${name} page is missing ${conversion}`);
	}
}

assert.ok(english.includes('href="/license/"'), "English footer must link to /license/");
assert.ok(italian.includes('href="/it/license/"'), "Italian footer must link to /it/license/");
assert.ok(homepage.includes('href="/license/"'), "Marketing footer must link to /license/");
assert.ok(homepage.includes("Cloud · source-available · local"));
const builtHtml = await allHtml(new URL("../dist/", import.meta.url));
for (const page of builtHtml) {
	assert.ok(
		!visibleText(page.html).includes("Cloud · open source · local"),
		`${page.path} contains obsolete open-source wording`,
	);
}

console.log(`License build contract passed (${releaseData.items.length} releases)`);
