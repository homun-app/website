import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// The navigation follows the product of the page. Homun's mark and download
// everywhere, except Engramma's page and Engramma's docs: there the blue jelly,
// the "engramma" wordmark, and an "Install Engramma" button. The docs header is
// Starlight's own, overridden with the same rule.
const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");

const cases = [
	{ path: "index.html", product: "homun", kind: "marketing" },
	{ path: "engramma/index.html", product: "engramma", kind: "marketing" },
	{ path: "docs/index.html", product: "homun", kind: "docs" },
	{ path: "docs/engramma/index.html", product: "engramma", kind: "docs" },
];

for (const { path, product, kind } of cases) {
	let html;
	try {
		html = await read(path);
	} catch {
		assert.fail(`Build is missing ${path}`);
	}
	const other = product === "homun" ? "engramma" : "homun";
	assert.ok(html.includes(`data-nav-product="${product}"`), `${path}: the nav must follow the product (${product})`);
	assert.ok(!html.includes(`data-nav-product="${other}"`), `${path}: only one product mark in the nav`);

	const nav = kind === "marketing"
		? html.slice(html.indexOf('<nav aria-label="Primary navigation"'), html.indexOf("</nav>"))
		: html.slice(Math.max(0, html.indexOf('data-nav-product=') - 600), html.indexOf('</header>', html.indexOf('data-nav-product=')));
	assert.ok(nav.includes("site-title") || nav.includes("nav-mark"), `${path}: the nav markup is not where the test expects it`);
	// The mark is the jelly of its product, and the wordmark says its name.
	assert.ok(nav.includes(`data-product="${product}"`), `${path}: the jelly must be ${product}'s`);
	assert.ok(nav.includes(`>${product}<`) || nav.includes(`>${product}</span>`), `${path}: the wordmark must say “${product}”`);

	if (product === "engramma") {
		assert.ok(nav.includes('href="/engramma/#install"'), `${path}: the button must install Engramma`);
		assert.ok(/Install Engramma/.test(nav), `${path}: the button must say “Install Engramma”`);
		assert.ok(!nav.includes("data-homun-download"), `${path}: Homun's download stays out of Engramma's pages`);
	} else {
		assert.ok(!nav.includes("/engramma/#install"), `${path}: the Engramma install button stays on Engramma's pages`);
		// The download button belongs to the marketing nav; the docs header
		// never carried one, and keeps Homun's mark.
		if (kind === "marketing") {
			assert.ok(nav.includes("data-homun-download"), `${path}: Homun's pages keep Homun's download`);
		}
	}
}

console.log("Product navigation contract passed");
