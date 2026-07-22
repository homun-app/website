import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const tracker = "https://cloud.umami.is/script.js";
const websiteId = "f3bdb523-4352-430b-b2a2-c7fdf4c0131f";
const knownRedirects = new Map([
	["/it/", "/it/docs/"],
	["/roadmap/mobile-companion/", "/roadmap/homun-mobile"],
	["/roadmap/shared-spaces/", "/roadmap/team-spaces-roles"],
	["/roadmap/voice-capture/", "/roadmap/voice-meeting-capture"],
]);
const trackerAttributes = new Map([
	["data-website-id", websiteId],
	["data-do-not-track", "true"],
	["data-exclude-search", "true"],
	["data-exclude-hash", "true"],
	["data-domains", "homun.app,www.homun.app"],
]);

function read(path) {
	return readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
}

async function htmlFiles(directory, prefix = "") {
	const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
		a.name.localeCompare(b.name),
	);
	const files = await Promise.all(
		entries.map(async (entry) => {
			const outputPath = `${prefix}${entry.name}`;
			const url = new URL(entry.name, directory);
			if (entry.isDirectory()) {
				return htmlFiles(new URL(`${entry.name}/`, directory), `${outputPath}/`);
			}
			return entry.isFile() && entry.name.endsWith(".html")
				? [{ outputPath, url }]
				: [];
		}),
	);
	return files.flat();
}

function publicPath(outputPath) {
	if (outputPath === "index.html") return "/";
	if (outputPath.endsWith("/index.html")) {
		return `/${outputPath.slice(0, -"index.html".length)}`;
	}
	return `/${outputPath}`;
}

function openingTags(html, name) {
	return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function attributesFor(openingTag) {
	const attributes = new Map();
	const body = openingTag
		.replace(/^<\s*[a-z][\w:-]*/i, "")
		.replace(/\/?\s*>$/, "");
	const attributePattern =
		/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
	for (const match of body.matchAll(attributePattern)) {
		const name = match[1].toLowerCase();
		const value = match[2] ?? match[3] ?? match[4] ?? null;
		const values = attributes.get(name) ?? [];
		values.push(value);
		attributes.set(name, values);
	}
	return attributes;
}

function singleAttribute(attributes, name) {
	const values = attributes.get(name);
	return values?.length === 1 ? values[0] : undefined;
}

function refreshTargets(html) {
	return openingTags(html, "meta")
		.map(attributesFor)
		.filter(
			(attributes) =>
				singleAttribute(attributes, "http-equiv")?.toLowerCase() === "refresh",
		)
		.map((attributes) => {
			const content = singleAttribute(attributes, "content");
			return content?.match(/^0;\s*url=(.+)$/i)?.[1];
		});
}

function countOccurrences(value, search) {
	return value.split(search).length - 1;
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

function assertNotice(name, html, markers, forbiddenMarker) {
	const text = visibleText(html);
	for (const marker of markers) {
		assert.ok(text.includes(marker), `${name} privacy page is missing: ${marker}`);
	}
	assert.ok(
		!text.includes(forbiddenMarker),
		`${name} privacy page must not contain: ${forbiddenMarker}`,
	);
}

function visibleSectionText(html, headingId) {
	const headings = [...html.matchAll(/<h2\b[^>]*>/gi)];
	const headingIndex = headings.findIndex(
		([tag]) => singleAttribute(attributesFor(tag), "id") === headingId,
	);
	assert.notEqual(headingIndex, -1, `Privacy page is missing section #${headingId}`);
	const heading = headings[headingIndex];
	const start = heading.index + heading[0].length;
	const end = headings[headingIndex + 1]?.index ?? html.length;
	return visibleText(html.slice(start, end));
}

function assertSectionIncludes(name, html, headingId, expectedText) {
	assert.ok(
		visibleSectionText(html, headingId).includes(expectedText),
		`${name} privacy section #${headingId} is missing: ${expectedText}`,
	);
}

async function filesContaining(directory, prefix, search) {
	const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
		a.name.localeCompare(b.name),
	);
	const matches = await Promise.all(
		entries.map(async (entry) => {
			const relativePath = `${prefix}${entry.name}`;
			const url = new URL(entry.name, directory);
			if (entry.isDirectory()) {
				return filesContaining(
					new URL(`${entry.name}/`, directory),
					`${relativePath}/`,
					search,
				);
			}
			if (!entry.isFile() || !/\.(?:astro|js|json|md|mjs|ts)$/.test(entry.name)) {
				return [];
			}
			return (await readFile(url, "utf8")).includes(search) ? [relativePath] : [];
		}),
	);
	return matches.flat();
}

function assertPrivacyLink(path, html) {
	const expectedHref = path.startsWith("/it/") ? "/it/privacy/" : "/privacy/";
	const hasExpectedLink = openingTags(html, "a").some(
		(tag) => singleAttribute(attributesFor(tag), "href") === expectedHref,
	);
	assert.ok(hasExpectedLink, `${path} must link to ${expectedHref}`);
}

function parsedScripts(html) {
	return openingTags(html, "script").map((tag) => ({
		tag,
		attributes: attributesFor(tag),
	}));
}

function scriptSources(script) {
	return script.attributes.get("src") ?? [];
}

function assertUniqueScriptSources(path, scripts) {
	for (const script of scripts) {
		assert.ok(
			scriptSources(script).length <= 1,
			`${path} scripts must not contain duplicate src attributes`,
		);
	}
}

function isUmamiScriptSource(source) {
	if (typeof source !== "string") return false;
	try {
		const hostname = new URL(source, "https://homun.app").hostname.toLowerCase();
		return hostname === "umami.is" || hostname.endsWith(".umami.is");
	} catch {
		return false;
	}
}

function assertTrackedPage(path, html) {
	assert.equal(
		countOccurrences(html, tracker),
		1,
		`${path} must contain the exact Umami tracker URL once`,
	);
	assert.equal(
		countOccurrences(html, websiteId),
		1,
		`${path} must contain the exact website ID once`,
	);

	const scripts = parsedScripts(html);
	assertUniqueScriptSources(path, scripts);
	const exactTrackerScripts = scripts.filter(
		({ attributes }) => singleAttribute(attributes, "src") === tracker,
	);
	assert.equal(
		exactTrackerScripts.length,
		1,
		`${path} must have exactly one script with src=${JSON.stringify(tracker)}`,
	);

	const [trackerScript] = exactTrackerScripts;
	for (const [name, expectedValue] of trackerAttributes) {
		assert.deepEqual(
			trackerScript.attributes.get(name),
			[expectedValue],
			`${path} tracker must set ${name} exactly to ${JSON.stringify(expectedValue)}`,
		);
	}

	const websiteIdScripts = scripts.filter(({ attributes }) =>
		attributes.has("data-website-id"),
	);
	assert.equal(
		websiteIdScripts.length,
		1,
		`${path} must not place data-website-id on an alternate script`,
	);
	assert.equal(
		websiteIdScripts[0].tag,
		trackerScript.tag,
		`${path} website ID must belong to the exact Umami tracker script`,
	);

	const umamiSourceScripts = scripts.filter((script) =>
		scriptSources(script).some(isUmamiScriptSource),
	);
	assert.equal(
		umamiSourceScripts.length,
		1,
		`${path} must not load an alternate Umami script source`,
	);
	assert.equal(
		umamiSourceScripts[0].tag,
		trackerScript.tag,
		`${path} Umami source must be the exact configured tracker script`,
	);
}

function assertNoAnalytics(path, html) {
	const scripts = parsedScripts(html);
	assertUniqueScriptSources(path, scripts);
	assert.equal(
		countOccurrences(html, websiteId),
		0,
		`${path} must not contain the configured website ID anywhere`,
	);
	assert.equal(
		scripts.filter(({ attributes }) => attributes.has("data-website-id")).length,
		0,
		`${path} must not include any website ID script attribute`,
	);
	assert.equal(
		scripts.filter((script) =>
			scriptSources(script).some(isUmamiScriptSource),
		).length,
		0,
		`${path} must not load any Umami-hosted script source`,
	);
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
assertNotice(
	"English",
	englishPrivacy,
	[
		"Effective date: 22 July 2026",
		"Fabio Cantone",
		"responsible for the Homun project, Italy",
		"hello@homun.app",
		"aggregate analytics",
		"downloads",
		"GitHub resources",
		"public roadmap",
		"legitimate interest",
		"Page path and title",
		"referrer",
		"browser language",
		"screen size",
		"Browser",
		"operating system",
		"device type",
		"site hostname",
		"approximate country, region, and city",
		"timestamps",
		"pageviews",
		"visits",
		"session duration",
		"download intent",
		"outbound GitHub links",
		"opening or participating in a roadmap project",
		"anonymous session hash",
		"IP address itself is not stored",
		"Query parameters and URL fragments are excluded",
		"account data",
		"workspace content",
		"prompts",
		"files",
		"personal names",
		"email addresses",
		"advertising identifiers",
		"custom distinct IDs",
		"session replay data",
		"do not identify visitors across websites",
		"do not use analytics cookies",
		"Umami Software, Inc.",
		"Umami Cloud",
		"EU and the US",
		"data processing agreement",
		"Standard Contractual Clauses (SCCs)",
		"24 months",
		"access",
		"rectification",
		"erasure",
		"restriction",
		"portability",
		"right to object",
		"Garante per la protezione dei dati personali",
		"designed not to identify individual visitors",
		"If website analytics or this notice changes materially, we will update this notice and its effective date.",
	],
	"designed to be anonymous",
);
assertSectionIncludes(
	"English",
	englishPrivacy,
	"what-is-excluded",
	"Website analytics do not collect Homun account data, workspace content, prompts, files, personal names, email addresses, advertising identifiers, custom distinct IDs, or session replay data.",
);

const italianPrivacy = await read("it/privacy/index.html");
assertNotice(
	"Italian",
	italianPrivacy,
	[
		"Data di efficacia: 22 luglio 2026",
		"Titolare del trattamento",
		"Fabio Cantone",
		"responsabile del progetto Homun, Italia",
		"hello@homun.app",
		"analisi aggregate",
		"download",
		"risorse GitHub",
		"roadmap pubblica",
		"legittimo interesse",
		"Percorso e titolo della pagina",
		"referrer",
		"lingua del browser",
		"dimensione dello schermo",
		"Browser",
		"sistema operativo",
		"tipo di dispositivo",
		"hostname del sito",
		"paese, regione e città approssimativi",
		"timestamp",
		"visualizzazioni",
		"visite",
		"durata della sessione",
		"intenzione di download",
		"link GitHub in uscita",
		"apertura o partecipazione a un progetto della roadmap",
		"hash anonimo della sessione",
		"indirizzo IP",
		"non viene conservato",
		"Parametri di query e frammenti URL sono esclusi",
		"dati dell’account Homun",
		"contenuti degli spazi di lavoro",
		"prompt",
		"file",
		"nomi personali",
		"indirizzi email",
		"identificatori pubblicitari",
		"ID distinti personalizzati",
		"dati di session replay",
		"non identificano i visitatori tra siti diversi",
		"Non usano cookie di analisi",
		"Umami Software, Inc.",
		"Umami Cloud",
		"UE e negli Stati Uniti",
		"data processing agreement del fornitore",
		"Clausole Contrattuali Standard (SCC)",
		"24 mesi",
		"accesso",
		"rettifica",
		"cancellazione",
		"limitazione",
		"portabilità",
		"diritto di opposizione",
		"Garante per la protezione dei dati personali",
		"progettate per non identificare i singoli visitatori",
		"Se le analisi del sito o questa informativa cambiano in modo sostanziale, aggiorneremo questa informativa e la sua data di efficacia.",
	],
	"progettate per essere anonime",
);
assertSectionIncludes(
	"Italian",
	italianPrivacy,
	"cosa-è-escluso",
	"Le analisi del sito non raccolgono dati dell’account Homun, contenuti degli spazi di lavoro, prompt, file, nomi personali, indirizzi email, identificatori pubblicitari, ID distinti personalizzati o dati di session replay.",
);

const expectedWebsiteIdLocations = [
	"docs/operations/umami-retention.md",
	"scripts/check-analytics-build.mjs",
	"scripts/check-container-runtime.mjs",
	"scripts/check-privacy-build.mjs",
	"src/components/docs/AnalyticsHead.astro",
	"src/layouts/Base.astro",
];
const actualWebsiteIdLocations = (
	await Promise.all([
		filesContaining(
			new URL("../docs/operations/", import.meta.url),
			"docs/operations/",
			websiteId,
		),
		filesContaining(
			new URL("../scripts/", import.meta.url),
			"scripts/",
			websiteId,
		),
		filesContaining(new URL("../src/", import.meta.url), "src/", websiteId),
	])
).flat();
assert.deepEqual(
	actualWebsiteIdLocations.sort(),
	expectedWebsiteIdLocations,
	"Active website ID locations changed; update the integration, tests, and retention runbook together",
);

const retentionRunbook = await readFile(
	new URL("../docs/operations/umami-retention.md", import.meta.url),
	"utf8",
);
assert.match(
	retentionRunbook,
	/all six ID-bearing locations/,
	"Retention runbook must state the exact active ID-location count",
);
for (const location of expectedWebsiteIdLocations) {
	assert.ok(
		retentionRunbook.includes(`\`${location}\``),
		`Retention runbook must list ${location}`,
	);
}

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

const builtPages = await htmlFiles(new URL("../dist/", import.meta.url));
assert.ok(builtPages.length > 0, "Privacy contract found no built HTML pages");
const seenRedirects = new Set();
let substantivePages = 0;
let trackedPages = 0;

for (const output of builtPages) {
	const path = publicPath(output.outputPath);
	const html = await readFile(output.url, "utf8");
	const expectedRedirect = knownRedirects.get(path);
	const redirects = refreshTargets(html);

	if (expectedRedirect) {
		seenRedirects.add(path);
		assert.equal(
			redirects.length,
			1,
			`${path} must contain exactly one refresh redirect`,
		);
		assert.equal(
			redirects[0],
			expectedRedirect,
			`${path} must redirect exactly to ${expectedRedirect}`,
		);
		assertNoAnalytics(path, html);
		continue;
	}

	assert.equal(
		redirects.length,
		0,
		`${path} contains refresh metadata but is not an approved redirect`,
	);
	assert.match(html, /<html\b/i, `${path} must be a substantive HTML page`);
	substantivePages += 1;
	assertPrivacyLink(path, html);

	if (output.outputPath === "404.html") {
		assertNoAnalytics(path, html);
	} else {
		assertTrackedPage(path, html);
		trackedPages += 1;
	}
}

assert.deepEqual(
	[...seenRedirects].sort(),
	[...knownRedirects.keys()].sort(),
	"Every known redirect must have a generated HTML stub",
);
assert.equal(
	substantivePages + knownRedirects.size,
	builtPages.length,
	"Every built HTML file must be classified",
);

console.log(
	`Privacy build contract passed (${builtPages.length} HTML: ${substantivePages} substantive, ${trackedPages} tracked, ${knownRedirects.size} redirects, 1 untracked 404)`,
);
