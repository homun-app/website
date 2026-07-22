import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tracker = "https://cloud.umami.is/script.js";
const websiteId = "f3bdb523-4352-430b-b2a2-c7fdf4c0131f";

function read(path) {
	return readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
}

const englishPrivacy = await read("privacy/index.html");
for (const content of [
	"Fabio Cantone",
	"hello@homun.app",
	"Umami Cloud",
	"legitimate interest",
	"IP address",
	"not stored",
	"24 months",
	"right to object",
	"Garante per la protezione dei dati personali",
]) {
	assert.ok(
		englishPrivacy.includes(content),
		`English privacy page is missing: ${content}`,
	);
}

const italianPrivacy = await read("it/privacy/index.html");
for (const content of [
	"Fabio Cantone",
	"hello@homun.app",
	"Umami Cloud",
	"legittimo interesse",
	"indirizzo IP",
	"non viene conservato",
	"24 mesi",
	"diritto di opposizione",
	"Garante per la protezione dei dati personali",
]) {
	assert.ok(
		italianPrivacy.includes(content),
		`Italian privacy page is missing: ${content}`,
	);
}

for (const output of ["index.html", "roadmap/index.html", "changelog/index.html"]) {
	assert.ok(
		(await read(output)).includes('href="/privacy/"'),
		`${output} must link to the English privacy page`,
	);
}

for (const output of ["docs/index.html", "guides/security/index.html"]) {
	assert.ok(
		(await read(output)).includes('href="/privacy/"'),
		`${output} must link to the English privacy page`,
	);
}

for (const output of ["it/docs/index.html", "it/guides/security/index.html"]) {
	assert.ok(
		(await read(output)).includes('href="/it/privacy/"'),
		`${output} must link to the Italian privacy page`,
	);
}

for (const output of [
	"index.html",
	"docs/index.html",
	"privacy/index.html",
	"it/privacy/index.html",
]) {
	const html = await read(output);
	const scripts = (html.match(/<script\b[^>]*>/g) ?? []).filter((script) =>
		script.includes(tracker),
	);
	assert.equal(scripts.length, 1, `${output} must load Umami exactly once`);

	const [script] = scripts;
	for (const attribute of [
		`data-website-id="${websiteId}"`,
		'data-do-not-track="true"',
		'data-exclude-search="true"',
		'data-exclude-hash="true"',
		'data-domains="homun.app,www.homun.app"',
	]) {
		assert.ok(
			script.includes(attribute),
			`${output} Umami script is missing ${attribute}`,
		);
	}
}

console.log("Privacy build contract passed");
