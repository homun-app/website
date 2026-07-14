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
	"Propose ideas and vote through public GitHub discussions.",
	"No Homun account is required.",
]) {
	assert.ok(
		text.toLowerCase().includes(required.toLowerCase()),
		`Homepage is missing required message: ${required}`,
	);
}

assert.ok(
	html.includes("GitHub voting &amp; suggestions · Available now"),
	"Homepage does not identify GitHub voting and suggestions as available",
);

for (const obsolete of [
	"Exploring",
	"Community voting and suggestions will use an optional Homun account when enabled.",
	"Voting &amp; suggestions · Coming later",
]) {
	assert.ok(!html.includes(obsolete), `Homepage contains obsolete roadmap message: ${obsolete}`);
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
