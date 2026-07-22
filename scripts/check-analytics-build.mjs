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

const homepage = await readFile(
	new URL("../dist/index.html", import.meta.url),
	"utf8",
);
for (const source of ["hero", "navigation", "download_section", "footer"]) {
	assert.ok(
		homepage.includes(`data-analytics-download-source="${source}"`),
		`Homepage is missing the ${source} download marker`,
	);
}

const roadmap = await readFile(
	new URL("../dist/roadmap/index.html", import.meta.url),
	"utf8",
);
for (const action of ["vote", "discuss", "suggest"]) {
	assert.ok(
		roadmap.includes(`data-analytics-roadmap-action="${action}"`),
		`Roadmap is missing the ${action} analytics marker`,
	);
}

const englishSecurity = await readFile(
	new URL("../dist/guides/security/index.html", import.meta.url),
	"utf8",
);
assert.ok(englishSecurity.includes("Umami Cloud"));
assert.ok(englishSecurity.includes("page views"));

const italianSecurity = await readFile(
	new URL("../dist/it/guides/security/index.html", import.meta.url),
	"utf8",
);
assert.ok(italianSecurity.includes("Umami Cloud"));
assert.ok(italianSecurity.includes("visualizzazioni di pagina"));

console.log("Analytics build contract passed");
