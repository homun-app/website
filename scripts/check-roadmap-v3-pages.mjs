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

for (const [legacy, target] of [
	["mobile-companion", "/roadmap/homun-mobile"],
	["shared-spaces", "/roadmap/team-spaces-roles"],
	["voice-capture", "/roadmap/voice-meeting-capture"],
]) {
	const redirectHtml = await read(`roadmap/${legacy}/index.html`);
	assert.ok(redirectHtml.includes(target), `Legacy route ${legacy} does not redirect to ${target}`);
}

for (const required of [
	"BUILT FOR SMALL COMPANIES AND TEAMS",
	"AI that keeps your company moving.",
	"Homun coordinates requests, recurring work and reviews across people and AI",
	"One operational foundation. Official workflow products. Company intelligence under your control.",
	"Where Homun is today",
	"From capable workspace to coordinated work.",
	"Available",
	"Homun Operational Workspace",
	"Building now",
	"Homun Flow",
	"Request", "Work", "Review", "Deliver",
]) assert.ok(roadmapText.includes(required), `Roadmap current-product story missing: ${required}`);

for (const required of [
	"Client Work", "Sales Operations", "Content & Marketing", "Internal Operations", "Customer Support",
	"Exploring",
	"Release history",
	"v0.1.1060",
]) assert.ok(roadmapText.includes(required), `Roadmap downstream section missing: ${required}`);

for (const required of [
	"How the system expands",
	"One core. Three directions.",
	"Adoption layer", "Team & Reach", "Up next",
	"Commercial layer", "Workflow Products", "Evaluate → Pilot",
	"Intelligence layer", "Company Intelligence", "Research · Long term",
	"Team processes", "Verified outcomes", "Better company-specific assistance",
]) assert.ok(roadmapText.includes(required), `Roadmap direction missing: ${required}`);

for (const required of [
	"Official workflow products",
	"Where should Homun work first?",
	"First pilot candidate",
	"Client Work", "Sales Operations", "Content & Marketing", "Internal Operations", "Customer Support",
]) assert.ok(roadmapText.includes(required), `Workflow product section missing: ${required}`);
assert.ok(!roadmapText.includes("Business workflows we are evaluating"));

for (const removed of ["Decided product direction", "Long-term product advantage"]) {
	assert.ok(!roadmapText.includes(removed), `Roadmap still renders legacy direction band: ${removed}`);
}

for (const removed of ["One continuous product journey", "Available today"]) {
	assert.ok(!roadmapText.includes(removed), `Roadmap still renders removed section: ${removed}`);
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
