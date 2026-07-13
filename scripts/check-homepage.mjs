import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

for (const required of [
	"Your work. Your models. Your system.",
	"Start without creating an account.",
	"Cloud, open source, or local",
	"Real work, not isolated prompts",
	"Official Homun plugins. Free at launch.",
	"Browse Projects",
]) {
	assert.ok(
		text.toLowerCase().includes(required.toLowerCase()),
		`Homepage is missing required message: ${required}`,
	);
}

for (const forbidden of ["Codex", "Claude Code", "any model", "every platform"]) {
	assert.ok(
		!text.toLowerCase().includes(forbidden.toLowerCase()),
		`Homepage contains forbidden claim or comparison: ${forbidden}`,
	);
}

for (const href of ["/docs", "/marketplace", "/roadmap", "/guides/download/"]) {
	assert.ok(html.includes(`href="${href}`), `Homepage is missing route: ${href}`);
}

assert.ok(
	!html.includes("bg-grid"),
	"Homepage still renders the graph-paper background",
);

console.log("Homepage positioning contract passed");
