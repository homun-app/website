import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeProject, validateSnapshot } from "./lib/github-product-data.mjs";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const fixture = await readJson("./fixtures/roadmap-v3-project.json");
const preview = await readJson("./fixtures/roadmap-v3-preview.json");
const releases = await readJson("./fixtures/releases-v3-preview.json");

const normalized = normalizeProject(fixture);
const flow = normalized.candidates.find(({ slug }) => slug === "homun-flow");
const clientWork = normalized.candidates.find(({ slug }) => slug === "client-work");

assert.equal(normalized.schemaVersion, 3);
assert.equal(flow.itemType, "strategic_program");
assert.equal(flow.stage, "building");
assert.equal(flow.evaluationState, null);
assert.equal(flow.outcome, "Turn recurring work into a visible process that people and Homun can complete, review and hand over together.");
assert.deepEqual(flow.milestones, [
	{ title: "Durable task and approval foundations", completed: true },
	{ title: "Visible process board", completed: false },
]);
assert.deepEqual(flow.firstRelease, [
	"Processes with explicit activities and dependencies",
	"A lightweight board derived from canonical process state",
]);
assert.equal(clientWork.itemType, "workflow_idea");
assert.equal(clientWork.evaluationState, "evaluating");
assert.equal(clientWork.votes, 7);
assert.equal(clientWork.targetTeam, "Agencies, consultants and small service companies.");
assert.deepEqual(clientWork.exampleProcess, [
	"Request", "Brief", "Research", "Draft", "Review", "Approval", "Delivery", "Follow-up",
]);
assert.deepEqual(clientWork.likelySystems, ["Email", "Documents and cloud drives"]);
assert.equal(clientWork.expectedOutput, "A reviewed client deliverable with evidence and approval history.");
assert.doesNotThrow(() => validateSnapshot(preview, releases));

function withField(payload, itemIndex, fieldName, value) {
	const clone = structuredClone(payload);
	const nodes = clone.data.organization.projectV2.items.nodes[itemIndex].fieldValues.nodes;
	const field = nodes.find((candidate) => candidate.field.name === fieldName);
	if (value === undefined) nodes.splice(nodes.indexOf(field), 1);
	else if (Object.hasOwn(field, "name")) field.name = value;
	else if (Object.hasOwn(field, "text")) field.text = value;
	else field.number = value;
	return clone;
}

assert.throws(() => normalizeProject(withField(fixture, 0, "Roadmap stage", "Soon")), /Unknown roadmap stage/);
assert.throws(() => normalizeProject(withField(fixture, 0, "Item type", undefined)), /Missing item type/);
assert.throws(() => normalizeProject(withField(fixture, 1, "Evaluation status", undefined)), /Missing evaluation status/);
assert.throws(() => normalizeProject(withField(fixture, 0, "Voting", "Open")), /Voting is not allowed/);

const featuredExploring = withField(fixture, 0, "Roadmap stage", "Exploring");
assert.throws(() => normalizeProject(featuredExploring), /Featured roadmap item must be Building/);

const noMilestones = structuredClone(fixture);
noMilestones.data.organization.projectV2.items.nodes[0].content.body = noMilestones.data.organization.projectV2.items.nodes[0].content.body
	.replace("- [x] Durable task and approval foundations\n- [ ] Visible process board", "");
assert.throws(() => normalizeProject(noMilestones), /Building program must define milestones/);

const malformedMilestone = structuredClone(fixture);
malformedMilestone.data.organization.projectV2.items.nodes[0].content.body = malformedMilestone.data.organization.projectV2.items.nodes[0].content.body
	.replace("- [x] Durable task and approval foundations", "- Durable task and approval foundations");
assert.throws(() => normalizeProject(malformedMilestone), /Invalid milestone list/);

const noEvidence = structuredClone(releases);
noEvidence.items.find(({ version }) => version === "v0.1.1059").projectSlugs = [
	"connected-actions", "local-computer", "model-freedom",
];
assert.throws(() => validateSnapshot(preview, noEvidence), /Available roadmap item has no published release/);

console.log("Roadmap v3 product data contract passed");
