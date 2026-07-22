import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
const releases = JSON.parse(
	await readFile(new URL("../src/data/releases.json", import.meta.url), "utf8"),
);
const visibleRoadmapReleases = releases.items.slice(0, 4).map(({ version }) => version);
const [latestVersion, previousVersion] = visibleRoadmapReleases;

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

const requiredMainCopy = [
	"BUILT FOR SMALL COMPANIES AND TEAMS",
	"AI that keeps your company moving.",
	"Where Homun is today",
	"From capable workspace to coordinated work.",
	"Homun Operational Workspace",
	"Homun Flow",
	"How the system expands",
	"One core. Three directions.",
	"Team & Reach",
	"Workflow Products",
	"Company Intelligence",
	"Where should Homun work first?",
	"First pilot candidate",
	"Evidence and future directions",
	"Product evidence",
];
for (const required of requiredMainCopy) assert.ok(roadmapText.includes(required), `Roadmap missing: ${required}`);
for (const version of visibleRoadmapReleases) {
	assert.ok(roadmapText.includes(version), `Roadmap is missing visible release: ${version}`);
}

const orderedSections = [
	"AI that keeps your company moving.",
	"Where Homun is today",
	"Homun Flow",
	"How the system expands",
	"Team & Reach",
	"Workflow Products",
	"Company Intelligence",
	"Where should Homun work first?",
	"Evidence and future directions",
];
for (let index = 1; index < orderedSections.length; index += 1) {
	assert.ok(roadmapText.indexOf(orderedSections[index - 1]) < roadmapText.indexOf(orderedSections[index]), `Roadmap section order is wrong at ${orderedSections[index]}`);
}

for (const removed of [
	"One continuous product journey",
	"Available today",
	"Decided product direction",
	"Business workflows we are evaluating",
	"Long-term product advantage",
	"Research, not commitments",
	"Release history",
]) assert.ok(!roadmapText.includes(removed), `Roadmap still renders removed section: ${removed}`);

for (const slug of [
	"operational-workspace", "homun-flow", "team-spaces-roles", "homun-mobile",
	"more-ways-to-reach-homun", "adaptive-company-intelligence", "voice-meeting-capture",
	"developer-platform", "client-work", "sales-operations", "content-marketing",
	"internal-operations", "customer-support",
]) assert.ok(roadmapHtml.includes(`/roadmap/${slug}/`), `Published roadmap item is not reachable from the main page: ${slug}`);

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

assert.ok(changelogHtml.includes(latestVersion), "Changelog is missing the latest release");
assert.ok(changelogHtml.includes(previousVersion), "Changelog is missing the previous release");
assert.ok(changelogHtml.indexOf(latestVersion) < changelogHtml.indexOf(previousVersion), "Changelog release order is wrong");
assert.ok(rss.includes(latestVersion), "RSS is missing the latest release");
assert.ok(rss.includes(previousVersion), "RSS is missing the previous release");
assert.ok(rss.indexOf(latestVersion) < rss.indexOf(previousVersion), "RSS release order is wrong");

console.log("Roadmap v3 rendered page contract passed");
