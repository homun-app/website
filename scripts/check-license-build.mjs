import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

const expectedLicenseSha256 =
	"cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30";

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


const archive = "https://github.com/homun-app/website/blob/site-v2-workspace/src/data/homun-core-license.md";
const [english, italian, homepage, bindingText] = await Promise.all([
	fromDist("license/index.html"),
	fromDist("it/license/index.html"),
	fromDist("index.html"),
	readFile(new URL("../src/data/homun-core-license.md", import.meta.url), "utf8"),
]);

assert.equal(
	createHash("sha256").update(bindingText).digest("hex"),
	expectedLicenseSha256,
	"Published license must match the official Apache-2.0 text",
);
assert.match(english, /<link rel="canonical" href="https:\/\/homun\.app\/license\/"/);
assert.match(italian, /<link rel="canonical" href="https:\/\/homun\.app\/it\/license\/"/);
for (const page of [english, italian]) {
	const text = visibleText(page);
	for (const marker of ["Apache License", "Version 2.0"]) {
		assert.ok(text.includes(marker), "Missing license content: " + marker);
	}
	assert.ok(page.includes('href="https://github.com/homun-app/homun-core"'), "Missing Homun Core repository link");
	assert.ok(page.includes('href="' + archive + '"'), "Missing FSL archive link");
}
assert.ok(visibleText(english).includes("Versions before 0.3 were published under FSL-1.1-ALv2"));
assert.ok(visibleText(italian).includes("Le versioni precedenti alla 0.3 sono state pubblicate con licenza FSL-1.1-ALv2"));
assert.ok(visibleText(italian).includes("Il testo inglese della licenza è vincolante"));
assert.ok(visibleText(italian).includes("Testo vincolante (in inglese)"));
assert.ok(homepage.includes('href="/license/"'), "Homepage must link to the license");

for (const { path, html } of await allHtml(new URL("../dist/", import.meta.url))) {
	assert.doesNotMatch(visibleText(html), /source-available/i, path + " still uses the old license label");
}

console.log("Apache-2.0 license build contract passed");
