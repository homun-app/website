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

function relativeLuminance(hex) {
	const channels = hex
		.slice(1)
		.match(/.{2}/g)
		.map((channel) => Number.parseInt(channel, 16) / 255)
		.map((channel) =>
			channel <= 0.04045
				? channel / 12.92
				: ((channel + 0.055) / 1.055) ** 2.4,
		);
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
	const [lighter, darker] = [
		relativeLuminance(foreground),
		relativeLuminance(background),
	].sort((a, b) => b - a);
	return (lighter + 0.05) / (darker + 0.05);
}

const englishPrivacy = await read("privacy/index.html");
const normalizedEnglishPrivacy = englishPrivacy.replace(/\s+/g, " ");
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
	"designed not to identify individual visitors",
]) {
	assert.ok(
		normalizedEnglishPrivacy.includes(content),
		`English privacy page is missing: ${content}`,
	);
}
assert.ok(
	!englishPrivacy.includes("designed to be anonymous"),
	"English privacy page must not claim analytics are designed to be anonymous",
);

const italianPrivacy = await read("it/privacy/index.html");
const normalizedItalianPrivacy = italianPrivacy.replace(/\s+/g, " ");
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
	"progettate per non identificare i singoli visitatori",
]) {
	assert.ok(
		normalizedItalianPrivacy.includes(content),
		`Italian privacy page is missing: ${content}`,
	);
}
assert.ok(
	!italianPrivacy.includes("progettate per essere anonime"),
	"Italian privacy page must not claim analytics are designed to be anonymous",
);

const docsFooter = await readFile(
	new URL("../src/components/docs/Footer.astro", import.meta.url),
	"utf8",
);
assert.match(
	docsFooter,
	/color:\s*var\(--sl-color-gray-2\)/,
	"Docs legal footer must use at least the gray-2 text token",
);
assert.match(
	docsFooter,
	/\.homun-legal-footer a:focus-visible\s*{[^}]*outline:[^;}]*var\(--sl-color-text-accent\)/s,
	"Docs legal footer links must have a visible token-based focus indicator",
);

const starlightTheme = await readFile(
	new URL("../src/styles/starlight-theme.css", import.meta.url),
	"utf8",
);
const lightTheme = starlightTheme.match(
	/:root\[data-theme="light"\]\s*{(?<variables>[^}]+)}/,
)?.groups?.variables;
assert.ok(lightTheme, "Starlight theme must define light-mode tokens");
const tokenValue = (name) =>
	lightTheme.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
const footerText = tokenValue("--sl-color-gray-2");
const footerBackground = tokenValue("--sl-color-black");
assert.ok(footerText && footerBackground, "Light footer color tokens must be hex");
assert.ok(
	contrastRatio(footerText, footerBackground) >= 4.5,
	`Light docs footer contrast must be at least 4.5:1; got ${contrastRatio(footerText, footerBackground).toFixed(2)}:1`,
);

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
