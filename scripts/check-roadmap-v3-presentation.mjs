import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { roadmapPresentation, selectFeaturedProject } from "../src/lib/roadmap-presentation.mjs";

const roadmap = JSON.parse(
	await readFile(new URL("./fixtures/roadmap-v3-preview.json", import.meta.url), "utf8"),
);
const programs = roadmap.items.filter(({ itemType }) => itemType === "strategic_program");
const workflows = roadmap.items.filter(({ itemType }) => itemType === "workflow_idea");
const flow = programs.find(({ slug }) => slug === "homun-flow");
const clientWork = workflows.find(({ slug }) => slug === "client-work");
const voice = programs.find(({ slug }) => slug === "voice-meeting-capture");

assert.equal(programs.length, 8);
assert.equal(workflows.length, 5);
assert.equal(selectFeaturedProject(programs).slug, "homun-flow");
assert.equal(roadmapPresentation(flow).canVote, false);

const linkedClientWork = {
	...clientWork,
	issueNumber: 42,
	githubUrl: "https://github.com/homun-app/homun/issues/42",
};
assert.deepEqual(roadmapPresentation(linkedClientWork), {
	underReview: false,
	hasIssue: true,
	canDiscuss: true,
	canVote: true,
});

const linkedVoice = {
	...voice,
	issueNumber: 43,
	githubUrl: "https://github.com/homun-app/homun/issues/43",
};
assert.equal(roadmapPresentation(linkedVoice).canVote, true);
assert.equal(roadmapPresentation({ ...linkedVoice, stage: "next" }).canVote, false);
assert.equal(roadmapPresentation({ ...linkedClientWork, voting: "closed" }).canVote, false);

console.log("Roadmap v3 presentation policy passed");
