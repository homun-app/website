import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const text = html
	.replace(/<[^>]+>/g, " ")
	.replace(/&#39;/g, "'")
	.replace(/&quot;/g, '"')
	.replace(/\s+/g, " ");

// Homepage "bot team" contract (Task 5 rewrite). The page tells the Homun 0.3
// story: the Task 4 hero, then the #computer and #memory scenes. Tasks 6 and 7
// extend this contract with the remaining sections; the slogans of the retired
// Homun 2 homepage must stay gone for good.

const heading = html
	.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]
	?.replace(/<[^>]+>/g, " ")
	.replace(/\s+/g, " ");
assert.ok(heading?.includes("Your bot team."), 'homepage h1 must keep "Your bot team."');
assert.ok(heading?.includes("On your computer."), 'homepage h1 must keep "On your computer."');

function section(id) {
	const start = html.indexOf(`<section id="${id}"`);
	assert.ok(start !== -1, `homepage is missing section#${id}`);
	const next = html.indexOf("<section", start + 1);
	return html.slice(start, next === -1 ? undefined : next);
}

const computer = section("computer");
assert.ok(
	computer.includes("data-approval-card"),
	"section#computer must show an approval card",
);

const memory = section("memory");
assert.ok(
	memory.includes('data-variant="highlight"'),
	"section#memory must be the highlight variant",
);
assert.ok(
	memory.replace(/<[^>]+>/g, " ").includes("Engramma"),
	'section#memory must name "Engramma"',
);

// The Homun 2 homepage is retired: none of its slogans may come back, not
// even through the default page title.
for (const slogan of [
	"Your work. Your models. Your system.",
	"Independent AI workspace",
	"An AI workspace for people who build",
	"Official Homun workflow packs.",
]) {
	assert.ok(!text.includes(slogan), `homepage still contains the retired slogan: ${slogan}`);
}

console.log("Homepage bot-team contract passed");
