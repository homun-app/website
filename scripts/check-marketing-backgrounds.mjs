import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pages = ["index.html", "roadmap/index.html", "marketplace/index.html"];

for (const page of pages) {
	const html = await readFile(new URL(`../dist/${page}`, import.meta.url), "utf8");
	assert.ok(
		!html.includes("bg-grid"),
		`${page} still renders the graph-paper background`,
	);
	assert.ok(
		html.includes("atmosphere"),
		`${page} is missing the pattern-free atmosphere`,
	);
	assert.ok(
		html.includes("pointermove"),
		`${page} is missing pointer spotlight support`,
	);
	assert.ok(
		html.includes("prefers-reduced-motion: reduce"),
		`${page} is missing reduced-motion protection`,
	);
	assert.ok(
		html.includes("(pointer: fine)"),
		`${page} is missing fine-pointer protection`,
	);
}

console.log("Marketing background contract passed");
