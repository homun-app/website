import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

for (const marker of [
	'data-illustration="workshop"',
	'data-illustration="engines"',
	'data-illustration="work-code"',
	'data-illustration="work-deliverables"',
	'data-illustration="work-local"',
	'data-illustration="work-continuity"',
	'data-illustration="ecosystem"',
	"prefers-reduced-motion:reduce",
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing illustration contract: ${marker}`);
}

for (const forbidden of ["ai-brain", "robot-mascot", "laptop-illustration", "bg-grid"]) {
	assert.ok(!homepage.includes(forbidden), `Homepage contains banned illustration metaphor: ${forbidden}`);
}

for (const preserved of [
	"Your work. Your models. Your system.",
	"Real work, not isolated prompts.",
	"Your system remains yours to direct.",
	"Start without creating an account.",
	"data-homun-download",
]) {
	assert.ok(homepage.includes(preserved), `Homepage lost required content: ${preserved}`);
}

console.log("Homepage illustration contract passed");
