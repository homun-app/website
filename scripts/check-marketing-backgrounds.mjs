import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

// Marketing theme contract: light palette as the default, the dark palette
// redefined under prefers-color-scheme, and document metas to match.

const astroDir = new URL("../dist/_astro/", import.meta.url);
const cssFiles = (await readdir(astroDir)).filter((file) => file.endsWith(".css"));
assert.ok(cssFiles.length > 0, "no built CSS found in dist/_astro/");

let css = "";
for (const file of cssFiles) {
	css += await readFile(new URL(file, astroDir), "utf8");
}
// Whitespace-free view: whether the minifier keeps spaces must not change the contract.
const compact = css.replace(/\s+/g, "");

const lightTokens = {
	"--color-bg": "#f7f9f8",
	"--color-cream": "#0d1512",
	"--color-muted": "#53655f",
	"--color-accent": "#0e7a67",
	"--color-highlight": "#ecf4f0",
};
for (const [token, value] of Object.entries(lightTokens)) {
	assert.ok(
		compact.includes(`${token}:${value}`),
		`default (light) palette is missing ${token}: ${value}`,
	);
}
// #ffffff may be minified to #fff; both spellings mean a white surface.
assert.ok(
	compact.includes("--color-surface:#ffffff") || compact.includes("--color-surface:#fff"),
	"default (light) palette is missing a white --color-surface",
);

const darkQuery = compact.indexOf("@media(prefers-color-scheme:dark)");
assert.ok(
	darkQuery !== -1,
	"built CSS has no prefers-color-scheme: dark media block",
);
const afterDarkQuery = compact.slice(darkQuery);
const darkTokens = {
	"--color-bg": "#050807",
	"--color-surface": "#0b1512",
	"--color-cream": "#f3fbf8",
	"--color-accent": "#20a991",
	"--color-highlight": "#081310",
};
for (const [token, value] of Object.entries(darkTokens)) {
	assert.ok(
		afterDarkQuery.includes(`${token}:${value}`),
		`dark palette does not redefine ${token}: ${value} under prefers-color-scheme: dark`,
	);
}

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
assert.ok(
	/<meta\s+name="color-scheme"\s+content="light dark"\s*\/?>/.test(html),
	'index.html is missing <meta name="color-scheme" content="light dark">',
);
assert.ok(
	/<meta\s+name="theme-color"\s+media="\(prefers-color-scheme: light\)"\s+content="#f7f9f8"\s*\/?>/.test(html),
	"index.html is missing the light theme-color meta with media",
);
assert.ok(
	/<meta\s+name="theme-color"\s+media="\(prefers-color-scheme: dark\)"\s+content="#050807"\s*\/?>/.test(html),
	"index.html is missing the dark theme-color meta with media",
);

console.log("Marketing theme contract passed");
