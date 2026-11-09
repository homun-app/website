import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Scene UI primitives contract (Task 3): the /dev/primitives preview renders
// every primitive — app window with computer panel, the three chat message
// kinds, the approval card actions, the highlight scene section — and stays
// out of search (noindex meta) and out of the sitemap.

const html = await readFile(
	new URL("../dist/dev/primitives/index.html", import.meta.url),
	"utf8",
);

assert.ok(
	html.includes("data-app-window"),
	"primitives preview is missing [data-app-window]",
);
assert.ok(
	html.includes("data-computer-panel"),
	"primitives preview is missing [data-computer-panel] inside an app window",
);

for (const from of ["user", "bot", "system"]) {
	assert.ok(
		html.includes(`data-from="${from}"`),
		`primitives preview is missing a data-from="${from}" chat message`,
	);
}

assert.ok(
	html.includes("data-approval-card"),
	"primitives preview is missing [data-approval-card]",
);
for (const action of ["Allow once", "Always allow", "Deny"]) {
	assert.ok(
		html.includes(action),
		`approval card is missing the "${action}" action`,
	);
}

assert.ok(
	/<section\b(?=[^>]*\bdata-scene\b)(?=[^>]*\bdata-variant="highlight")[^>]*>/.test(
		html,
	),
	'primitives preview is missing a section[data-scene][data-variant="highlight"]',
);

assert.ok(
	/<meta\s+name="robots"\s+content="noindex"\s*\/?>/.test(html),
	'primitives preview is missing <meta name="robots" content="noindex">',
);

const sitemap = await readFile(
	new URL("../dist/sitemap-0.xml", import.meta.url),
	"utf8",
);
assert.ok(
	!sitemap.includes("/dev/primitives"),
	"the /dev/primitives preview must be excluded from the sitemap",
);

console.log("Scene primitives contract passed");
