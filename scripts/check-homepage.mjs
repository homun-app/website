import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const roadmap = JSON.parse(
	await readFile(new URL("../src/data/roadmap.json", import.meta.url), "utf8"),
);

for (const required of [
	"Your work. Your models. Your system.",
	"Start without creating an account.",
	"Cloud, open source, or local",
	"Real work, not isolated prompts",
	"Official Homun plugins. Free at launch.",
	"Browse Projects",
	"Submit ideas through GitHub now.",
	"Voting opens after moderation, when an idea has a public GitHub discussion.",
	"Browsing the roadmap does not require a Homun account.",
	"Proposing ideas and voting require a GitHub account.",
]) {
	assert.ok(
		text.toLowerCase().includes(required.toLowerCase()),
		`Homepage is missing required message: ${required}`,
	);
}

assert.ok(
	html.includes("GitHub idea submissions · Available now"),
	"Homepage does not identify GitHub idea submissions as available",
);

for (const obsolete of [
	"Exploring",
	"Community voting and suggestions will use an optional Homun account when enabled.",
	"Propose ideas and vote through public GitHub discussions.",
	"GitHub voting &amp; suggestions · Available now",
	"No Homun account is required.",
	"Voting &amp; suggestions · Coming later",
]) {
	assert.ok(!html.includes(obsolete), `Homepage contains obsolete roadmap message: ${obsolete}`);
}

for (const status of ["ideas", "building", "shipped"]) {
	const expectedCount = roadmap.items.filter((item) => item.status === status).length;
	const metric = html.match(
		new RegExp(
			`<div[^>]*data-status="${status}"[^>]*data-count="${expectedCount}"[^>]*>([\\s\\S]*?)<\\/div>`,
		),
	);
	assert.ok(metric, `Homepage ${status} count is not derived from the roadmap snapshot`);
	assert.ok(
		metric[1].includes(String(expectedCount).padStart(2, "0")),
		`Homepage ${status} card does not display the roadmap snapshot count`,
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
