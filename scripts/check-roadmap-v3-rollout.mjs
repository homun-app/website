import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
	buildPublishPlan,
	buildRolloutPlan,
	issueBodyFor,
	parseRolloutArgs,
	reconcileUntilZero,
} from "./roadmap-v3-rollout.mjs";

const manifest = JSON.parse(await readFile(
	new URL("./fixtures/roadmap-v3-manifest.json", import.meta.url),
	"utf8",
));

const legacySlugs = new Map([
	[2, "marketplace"], [3, "long-horizon"], [4, "mobile-companion"],
	[5, "chat-branching"], [6, "shared-spaces"], [7, "voice-capture"],
	[8, "connected-actions"], [9, "model-freedom"], [10, "local-computer"],
	[11, "future-experiment"],
]);
const inventory = {
	project: { id: "PVT_roadmap", number: 1, title: "Homun public roadmap" },
	fields: [
		{ id: "F_publication", name: "Publication status", dataType: "SINGLE_SELECT", options: ["Draft", "Review", "Published", "Archived"].map((name) => ({ id: `O_${name}`, name })) },
		{ id: "F_slug", name: "Slug", dataType: "TEXT" },
		{ id: "F_featured", name: "Featured", dataType: "SINGLE_SELECT", options: ["Yes", "No"].map((name) => ({ id: `O_${name}`, name })) },
		{ id: "F_update", name: "Public update", dataType: "TEXT" },
		{ id: "F_date", name: "Public update date", dataType: "DATE" },
		{ id: "F_voting", name: "Voting", dataType: "SINGLE_SELECT", options: ["Open", "Closed"].map((name) => ({ id: `O_${name}`, name })) },
		{ id: "F_order", name: "Order", dataType: "NUMBER" },
	],
	items: [...legacySlugs].map(([number, slug]) => ({
		id: `PVTI_${number}`,
		content: { number, title: `Legacy ${slug}`, url: `https://github.com/homun-app/homun/issues/${number}` },
		fields: { Slug: slug, "Publication status": "Published" },
	})),
};
const issues = [...legacySlugs].map(([number, slug]) => ({
	number,
	title: `Legacy ${slug}`,
	body: `<!-- roadmap-slug: ${slug} -->\n\nLegacy body`,
	url: `https://github.com/homun-app/homun/issues/${number}`,
	state: "OPEN",
}));

const plan = buildRolloutPlan(inventory, manifest, issues);
assert.deepEqual(plan.fieldsToCreate.map(({ name }) => name), [
	"Roadmap stage", "Item type", "Evaluation status", "Public area",
]);
assert.equal(plan.issuesToCreate.length, 10);
assert.equal(plan.issuesToTransform.length, 3);
assert.deepEqual(plan.issuesToTransform.map(({ number, slug }) => [number, slug]), [
	[5, "homun-mobile"], [7, "team-spaces-roles"], [8, "voice-meeting-capture"],
]);
assert.equal(plan.itemsToArchive.length, 7);
assert.deepEqual(plan.itemsToArchive.map(({ number }) => number), [2, 3, 4, 6, 9, 10, 11]);
assert.match(plan.itemsToArchive.find(({ number }) => number === 2).comment, /homun-flow/);
assert.match(plan.itemsToArchive.find(({ number }) => number === 6).comment, /retained for historical context/i);
assert.match(issueBodyFor(manifest.items.find(({ slug }) => slug === "client-work")), /## Target team/);
assert.match(issueBodyFor(manifest.items.find(({ slug }) => slug === "homun-flow")), /- \[ \] Visible board/);

const reusedIssues = [...issues, ...manifest.items.slice(0, 10).map((item, index) => ({
	number: 100 + index,
	title: item.title,
	body: issueBodyFor(item),
	url: `https://github.com/homun-app/homun/issues/${100 + index}`,
	state: "OPEN",
}))];
assert.ok(buildRolloutPlan(inventory, manifest, reusedIssues).issuesToCreate.length < 10);

const convergedInventory = {
	...inventory,
	fields: [
		...inventory.fields,
		...plan.fieldsToCreate.map((field) => ({ ...field, id: `F_${field.name}`, options: field.options?.map((name) => ({ id: `O_${name}`, name })) })),
	],
	items: [
		...inventory.items.filter((item) => ![5, 7, 8].includes(item.content.number)).map((item) => {
			if (!manifest.legacy.archive[String(item.content.number)]) return item;
			return { ...item, fields: { ...item.fields, "Publication status": "Archived" }, content: { ...item.content, state: "CLOSED" } };
		}),
		...manifest.items.map((item, index) => {
			const number = Number(Object.entries(manifest.legacy.transform).find(([, slug]) => slug === item.slug)?.[0] ?? 200 + index);
			return {
			id: `PVTI_active_${index}`,
			content: { number, title: item.title, url: `https://github.com/homun-app/homun/issues/${number}` },
			fields: {
				Slug: item.slug,
				"Publication status": "Review",
				"Roadmap stage": { available: "Available", building: "Building now", next: "Up next", exploring: "Exploring" }[item.stage],
				"Item type": item.itemType === "strategic_program" ? "Strategic program" : "Workflow idea",
				"Evaluation status": item.evaluationState ? { evaluating: "Evaluating", selected_for_pilot: "Selected for pilot", removed: "Removed" }[item.evaluationState] : null,
				"Public area": item.area,
				Featured: item.featured ? "Yes" : "No",
				"Public update": item.publicUpdate,
				"Public update date": item.publicUpdateDate,
				Voting: item.voting === "open" ? "Open" : "Closed",
				Order: item.order,
			},
			};
		}),
	],
};
const convergedIssues = [
	...issues.filter(({ number }) => ![5, 7, 8].includes(number)).map((issue) => ({ ...issue, state: "CLOSED" })),
	...manifest.items.map((item, index) => {
		const number = Number(Object.entries(manifest.legacy.transform).find(([, slug]) => slug === item.slug)?.[0] ?? 200 + index);
		return { number, title: item.title, body: issueBodyFor(item), url: `https://github.com/homun-app/homun/issues/${number}`, state: "OPEN" };
	}),
];
const noOp = buildRolloutPlan(convergedInventory, manifest, convergedIssues);
assert.equal(noOp.operationCount, 0);
const publish = buildPublishPlan(convergedInventory, manifest);
assert.equal(publish.itemsToPublish.length, 13);
assert.ok(publish.itemsToPublish.every(({ from, to }) => from === "Review" && to === "Published"));
assert.deepEqual(parseRolloutArgs(["--project-number", "1", "--dry-run"]), { projectNumber: 1, mode: "dry-run" });
assert.deepEqual(parseRolloutArgs(["--project-number", "1", "--apply"]), { projectNumber: 1, mode: "apply" });
assert.deepEqual(parseRolloutArgs(["--project-number", "1", "--publish"]), { projectNumber: 1, mode: "publish" });
assert.throws(() => parseRolloutArgs(["--project-number", "1", "--apply", "--publish"]), /mutually exclusive/i);

let reconciliationReads = 0;
let reconciliationApplies = 0;
const reconciled = await reconcileUntilZero({
	readState: async () => ({ operationCount: reconciliationReads++ === 0 ? 11 : 0 }),
	applyState: async () => { reconciliationApplies += 1; },
	wait: async () => {},
});
assert.equal(reconciled.operationCount, 0);
assert.equal(reconciliationReads, 2);
assert.equal(reconciliationApplies, 1);
await assert.rejects(
	() => reconcileUntilZero({
		readState: async () => ({ operationCount: 1 }),
		applyState: async () => {},
		wait: async () => {},
		maxAttempts: 2,
	}),
	/did not converge; 1 operations remain/,
);

console.log("Roadmap v3 rollout contract passed");
