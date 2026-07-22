import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tracker = "https://cloud.umami.is/script.js";
const websiteId = "f3bdb523-4352-430b-b2a2-c7fdf4c0131f";

for (const output of ["../dist/index.html", "../dist/docs/index.html"]) {
	const html = await readFile(new URL(output, import.meta.url), "utf8");
	assert.equal(
		html.split(tracker).length - 1,
		1,
		`${output} must load Umami once`,
	);
	assert.equal(
		html.split(websiteId).length - 1,
		1,
		`${output} must include the website ID once`,
	);
}

console.log("Analytics build contract passed");
