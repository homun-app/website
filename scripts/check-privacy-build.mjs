import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const tracker = "https://cloud.umami.is/script.js";
const websiteId = "f3bdb523-4352-430b-b2a2-c7fdf4c0131f";

function read(path) {
	return readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
}

async function htmlFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const path = new URL(entry.name, directory);
			if (entry.isDirectory()) return htmlFiles(new URL(`${entry.name}/`, directory));
			return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
		}),
	);
	return files.flat();
}

function isRedirectStub(html) {
	return (
		!html.includes("<html") &&
		/<title>Redirecting to: [^<]+<\/title>/.test(html) &&
		redirectTarget(html) !== undefined
	);
}

function redirectTarget(html) {
	const refresh = (html.match(/<meta\b[^>]*>/gi) ?? []).find((tag) => {
		const httpEquiv = tag.match(/\bhttp-equiv=(["'])(.*?)\1/i)?.[2];
		return httpEquiv?.toLowerCase() === "refresh";
	});
	const content = refresh?.match(/\bcontent=(["'])(.*?)\1/i)?.[2];
	return content?.match(/^0;\s*url=(.+)$/i)?.[1];
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

const italianHomeRedirect = await read("it/index.html");
assert.ok(
	isRedirectStub(italianHomeRedirect),
	"it/index.html must be an Astro redirect stub",
);
assert.equal(
	redirectTarget(italianHomeRedirect),
	"/it/docs/",
	"it/index.html must redirect exactly to /it/docs/",
);

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

for (const output of await htmlFiles(new URL("../dist/", import.meta.url))) {
	const html = await readFile(output, "utf8");
	const scripts = (html.match(/<script\b[^>]*>/g) ?? []).filter((script) =>
		script.includes(tracker),
	);
	if (isRedirectStub(html)) {
		assert.equal(scripts.length, 0, `${output.pathname} must not load Umami`);
		continue;
	}

	assert.equal(scripts.length, 1, `${output.pathname} must load Umami exactly once`);

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
			`${output.pathname} Umami script is missing ${attribute}`,
		);
	}
}

console.log("Privacy build contract passed");
