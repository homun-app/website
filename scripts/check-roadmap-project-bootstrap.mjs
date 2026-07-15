import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
	buildBootstrapPlan,
	issueBodyFor,
	parseBootstrapArgs,
} from "./bootstrap-roadmap-project.mjs";

const roadmap = JSON.parse(
	await readFile(new URL("../src/data/roadmap.json", import.meta.url)),
);
const emptyInventory = {
	project: { id: "PVT_empty", number: 1, title: "Homun Roadmap" },
	fields: [
		{ id: "PVTF_title", name: "Title", dataType: "TEXT" },
		{
			id: "PVTSSF_status",
			name: "Status",
			dataType: "SINGLE_SELECT",
			options: [
				{ id: "todo", name: "Todo" },
				{ id: "progress", name: "In Progress" },
				{ id: "done", name: "Done" },
			],
		},
	],
	items: [],
};

const plan = buildBootstrapPlan(emptyInventory, roadmap, []);
assert.deepEqual(plan.fieldsToCreate.map((field) => field.name), [
	"Public status",
	"Publication status",
	"Area",
	"Slug",
	"Featured",
	"Progress",
	"Target release",
	"Public update",
	"Public update date",
	"Voting",
	"Order",
	"Archive reason",
]);
assert.equal(plan.issuesToCreate.length, 10);
assert.deepEqual(
	plan.issuesToCreate.find((entry) => entry.slug === "shared-spaces").labels,
	["idea", "roadmap"],
);
assert.deepEqual(
	plan.issuesToCreate.find((entry) => entry.slug === "apprentice").labels,
	["roadmap"],
);
assert.match(issueBodyFor(roadmap.items[0]), /<!-- roadmap-slug: apprentice -->/);
assert.match(issueBodyFor(roadmap.items[0]), /## Intended capabilities/);
assert.match(issueBodyFor(roadmap.items[0]), /Observe recurring routines/);

const existingIssue = {
	number: 42,
	title: "The Apprentice",
	body: issueBodyFor(roadmap.items[0]),
	url: "https://github.com/homun-app/homun/issues/42",
	state: "OPEN",
};
const reusePlan = buildBootstrapPlan(emptyInventory, roadmap, [existingIssue]);
assert.equal(reusePlan.issuesToCreate.length, 9);
assert.deepEqual(reusePlan.issuesToReuse, [
	{ slug: "apprentice", number: 42, url: existingIssue.url },
]);

assert.throws(
	() => buildBootstrapPlan(emptyInventory, roadmap, [existingIssue, { ...existingIssue, number: 43 }]),
	/duplicate issue.*apprentice/i,
);
assert.deepEqual(parseBootstrapArgs(["--project-number", "1"]), {
	projectNumber: 1,
	mode: "dry-run",
});
assert.deepEqual(parseBootstrapArgs(["--project-number", "1", "--apply"]), {
	projectNumber: 1,
	mode: "apply",
});
assert.throws(() => parseBootstrapArgs([]), /project-number/);
assert.throws(
	() => parseBootstrapArgs(["--project-number", "1", "--apply", "--dry-run"]),
	/apply.*dry-run/i,
);

console.log("Empty roadmap Project bootstrap contract passed");
