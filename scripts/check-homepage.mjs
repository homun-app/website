import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");

for (const required of [
	"Your work. Your models. Your system.",
	"Start without creating an account.",
	"A memory inspired by how we remember.",
	"Fast recall, meaningful connections, and a narrative you can read and correct.",
	"Inspect · Correct · Consolidate · Forget · Export",
	"Security and control",
	"Useful memory requires ownership.",
	"Homun makes the storage, access boundary and activity visible—so persistent context remains something you direct.",
	"Keep knowledge local and in scope",
	"Memory is stored locally by default and separated by user and project, so one workspace does not silently become another's context.",
	"Grant access explicitly",
	"Tools and connectors begin denied and operate through permissions you approve.",
	"Inspect what happened",
	"Homun surfaces plans, tool use and connector activity while work is in progress.",
	"Protect secrets by design",
	"Sensitive credentials belong behind the Vault boundary, not inside readable memory.",
	"Retain the final say",
	"Correct, export or remove knowledge from active recall when it no longer belongs in the system.",
	"Cloud, open source, or local",
	"Real work, not isolated prompts",
	"Official Homun plugins. Free at launch.",
	"Browse Projects",
]) {
	assert.ok(
		text.includes(required),
		`Homepage is missing required message: ${required}`,
	);
}

for (const forbidden of ["Codex", "Claude Code", "any model", "every platform"]) {
	assert.ok(
		!text.toLowerCase().includes(forbidden.toLowerCase()),
		`Homepage contains forbidden claim or comparison: ${forbidden}`,
	);
}

for (const href of ["/docs", "/marketplace", "/roadmap", "/guides/download/", "/#memory"]) {
	assert.ok(html.includes(`href="${href}"`), `Homepage is missing route: ${href}`);
}

assert.ok(
	!html.includes("bg-grid"),
	"Homepage still renders the graph-paper background",
);

const modelsPosition = html.indexOf('id="models"');
const memoryPosition = html.indexOf('id="memory"');
const productPosition = html.indexOf('id="product"');
const controlPosition = html.indexOf('id="control"');

assert.ok(modelsPosition >= 0, "Homepage is missing the Models section");
assert.ok(memoryPosition >= 0, "Homepage is missing the Memory section");
assert.ok(productPosition >= 0, "Homepage is missing the Product section");
assert.ok(controlPosition >= 0, "Homepage is missing the Security section");
assert.ok(
	modelsPosition < memoryPosition && memoryPosition < productPosition && productPosition < controlPosition,
	"Memory must render after Models and before Product, with Security later in the story",
);

console.log("Homepage positioning contract passed");
