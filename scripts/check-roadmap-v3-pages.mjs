import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");

function assertNoNestedAnchors(html) {
	let depth = 0;
	for (const [token] of html.matchAll(/<\/?a\b[^>]*>/gi)) {
		depth += token.startsWith("</") ? -1 : 1;
		assert.ok(depth >= 0 && depth <= 1, "Roadmap contains nested or unmatched links");
	}
	assert.equal(depth, 0, "Roadmap contains an unmatched link");
}

const [roadmapHtml, flowHtml, clientHtml, adaptiveHtml, mobileHtml, changelogHtml, rss] = await Promise.all([
	read("roadmap/index.html"),
	read("roadmap/homun-flow/index.html"),
	read("roadmap/client-work/index.html"),
	read("roadmap/adaptive-company-intelligence/index.html"),
	read("roadmap/homun-mobile/index.html"),
	read("changelog/index.html"),
	read("changelog/rss.xml"),
]);
const roadmapText = plain(roadmapHtml);
const flowText = plain(flowHtml);
const clientText = plain(clientHtml);
const adaptiveText = plain(adaptiveHtml);
const mobileText = plain(mobileHtml);

for (const required of [
	"BUILT FOR SMALL TEAMS",
	"AI that keeps work moving.",
	"Homun turns requests, messages and recurring work into visible processes",
	"One operational foundation. Multiple business workflows.",
	"Remember", "Coordinate", "Connect", "Adapt",
	"Available today", "Building now", "Up next", "Exploring",
	"Business workflows we are evaluating",
	"Client Work", "Sales Operations", "Content & Marketing", "Internal Operations", "Customer Support",
	"Release history", "v0.1.1060",
]) assert.ok(roadmapText.includes(required), `Roadmap missing: ${required}`);

const orderedSections = [
	"Remember",
	"Available today",
	"Homun Flow",
	"Up next",
	"Business workflows we are evaluating",
	"Adaptive Company Intelligence",
	"Release history",
];
for (let index = 1; index < orderedSections.length; index += 1) {
	assert.ok(
		roadmapText.indexOf(orderedSections[index - 1]) < roadmapText.indexOf(orderedSections[index]),
		`Roadmap section order is wrong at ${orderedSections[index]}`,
	);
}

assert.ok(!/\d+% complete/.test(roadmapText), "Roadmap exposes an arbitrary percentage");
assert.equal((roadmapText.match(/Suggest an idea/g) ?? []).length, 1);
assertNoNestedAnchors(roadmapHtml);
assertNoNestedAnchors(flowHtml);
assertNoNestedAnchors(clientHtml);

for (const required of [
	"Homun Flow", "Why now", "First usable release", "Milestones", "Process foundation",
	"Review handoffs", "Connected execution", "Not included yet", "Strategic role",
]) assert.ok(flowText.includes(required), `Homun Flow detail missing: ${required}`);
assert.ok(!flowText.includes("Intended capabilities"));
assert.ok(!/\d+% complete/.test(flowText));

for (const required of [
	"Client Work", "Evaluation status", "Evaluating", "Target team", "Example process",
	"Likely connected systems", "Expected output", "Request", "Follow-up",
]) assert.ok(clientText.includes(required), `Workflow detail missing: ${required}`);

for (const required of [
	"Company Profile", "Company Knowledge", "Process Learning", "Evaluation", "Specialized SLM",
]) assert.ok(adaptiveText.includes(required), `Adaptive intelligence detail missing: ${required}`);

for (const required of ["Homun Mobile", "Review and approval", "Secure pairing", "Photo and document capture"]) {
	assert.ok(mobileText.includes(required), `Mobile detail missing: ${required}`);
}

assert.ok(changelogHtml.includes("v0.1.1060"), "Changelog is missing the latest release");
assert.ok(changelogHtml.indexOf("v0.1.1060") < changelogHtml.indexOf("v0.1.1059"), "Changelog release order is wrong");
assert.ok(rss.indexOf("Homun v0.1.1060") < rss.indexOf("Homun v0.1.1059"), "RSS release order is wrong");

console.log("Roadmap v3 rendered page contract passed");
