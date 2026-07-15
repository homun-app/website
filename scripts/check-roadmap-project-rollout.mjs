import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
	applyMigrationPlan,
	buildMigrationPlan,
	parseRolloutArgs,
} from "./roadmap-project-rollout.mjs";

const inventory = JSON.parse(
	await readFile(new URL("./fixtures/roadmap-project-inventory.json", import.meta.url)),
);
const restoredRoadmap = JSON.parse(
	await readFile(new URL("../src/data/roadmap.json", import.meta.url)),
);

const plan = buildMigrationPlan(inventory, restoredRoadmap);
assert.deepEqual(plan.fieldsToCreate.map((field) => field.name), [
	"Public status",
	"Publication status",
	"Public update date",
	"Voting",
	"Archive reason",
]);
assert.deepEqual(plan.items.find((item) => item.slug === "shared-spaces").set, {
	"Public status": "Ideas",
	"Publication status": "Published",
	Voting: "Open",
});
assert.equal(
	plan.items.find((item) => item.slug === "apprentice").set["Public status"],
	"Building",
);
assert.deepEqual(
	plan.items.find((item) => item.slug === "future-experiment").set,
	{ "Publication status": "Draft" },
);
assert.equal(plan.backfills.length, restoredRoadmap.items.length);
assert.deepEqual(
	plan.backfills.find((item) => item.slug === "shared-spaces"),
	{
		itemId: "PVTI_shared_spaces",
		slug: "shared-spaces",
		field: "Public update date",
		value: "2026-07-10",
	},
);

const duplicateSlug = structuredClone(inventory);
duplicateSlug.items[1].fields.Slug = duplicateSlug.items[0].fields.Slug;
assert.throws(() => buildMigrationPlan(duplicateSlug, restoredRoadmap), /duplicate slug/i);

const missingSlug = structuredClone(inventory);
delete missingSlug.items.at(-1).fields.Slug;
assert.throws(() => buildMigrationPlan(missingSlug, restoredRoadmap), /missing slug/i);

const unknownLegacyStatus = structuredClone(inventory);
unknownLegacyStatus.items[0].fields.Status = "Maybe";
assert.throws(() => buildMigrationPlan(unknownLegacyStatus, restoredRoadmap), /unknown legacy status/i);

const missingPublicItem = structuredClone(inventory);
missingPublicItem.items = missingPublicItem.items.filter(
	(item) => item.fields.Slug !== "shared-spaces",
);
assert.throws(() => buildMigrationPlan(missingPublicItem, restoredRoadmap), /missing Project item/i);

const unknownStatus = structuredClone(restoredRoadmap);
unknownStatus.items[0].status = "maybe";
assert.throws(() => buildMigrationPlan(inventory, unknownStatus), /unknown public status/i);

const multipleFeatured = structuredClone(restoredRoadmap);
multipleFeatured.items.find((item) => item.slug === "marketplace").featured = true;
assert.throws(() => buildMigrationPlan(inventory, multipleFeatured), /featured Building/i);

assert.throws(
	() => buildMigrationPlan(inventory, { ...restoredRoadmap, items: [] }),
	/empty public roadmap/i,
);

assert.deepEqual(parseRolloutArgs(["--project-number", "7"]), {
	projectNumber: 7,
	inventoryPath: null,
	mode: "dry-run",
});
assert.deepEqual(
	parseRolloutArgs([
		"--project-number",
		"7",
		"--inventory",
		"inventory.json",
		"--apply",
	]),
	{ projectNumber: 7, inventoryPath: "inventory.json", mode: "apply" },
);
assert.throws(() => parseRolloutArgs([]), /project-number/);
assert.throws(
	() => parseRolloutArgs(["--project-number", "7", "--apply", "--dry-run"]),
	/apply.*dry-run/i,
);
assert.throws(
	() => parseRolloutArgs(["--project-number", "7", "--unknown"]),
	/unknown argument/i,
);

const offline = spawnSync(
	process.execPath,
	[
		fileURLToPath(new URL("./roadmap-project-rollout.mjs", import.meta.url)),
		"--project-number",
		"1",
		"--inventory",
		fileURLToPath(new URL("./fixtures/roadmap-project-inventory.json", import.meta.url)),
		"--dry-run",
	],
	{ encoding: "utf8" },
);
assert.equal(offline.status, 0, offline.stderr);
assert.match(offline.stdout, /DRY RUN/);
assert.match(offline.stdout, /Public status/);
assert.match(offline.stdout, /shared-spaces/);

const appliedInventory = structuredClone(inventory);
const commands = [];
const valueAfter = (args, flag) => args[args.indexOf(flag) + 1];
const fakeGh = async (args) => {
	commands.push(args);
	if (args[0] === "project" && args[1] === "field-create") {
		const name = valueAfter(args, "--name");
		const dataType = valueAfter(args, "--data-type");
		const optionList = args.includes("--single-select-options")
			? valueAfter(args, "--single-select-options").split(",")
			: [];
		appliedInventory.fields.push({
			id: `FIELD_${name}`,
			name,
			dataType,
			...(optionList.length
				? { options: optionList.map((option) => ({ id: `OPTION_${name}_${option}`, name: option })) }
				: {}),
		});
		return "";
	}
	if (args[0] === "project" && args[1] === "item-edit") {
		const item = appliedInventory.items.find(
			(candidate) => candidate.id === valueAfter(args, "--id"),
		);
		const field = appliedInventory.fields.find(
			(candidate) => candidate.id === valueAfter(args, "--field-id"),
		);
		assert.ok(item);
		assert.ok(field);
		if (args.includes("--single-select-option-id")) {
			const optionId = valueAfter(args, "--single-select-option-id");
			item.fields[field.name] = field.options.find((option) => option.id === optionId).name;
		} else if (args.includes("--date")) {
			item.fields[field.name] = valueAfter(args, "--date");
		} else {
			assert.fail(`Unexpected item-edit command: ${args.join(" ")}`);
		}
		return "";
	}
	assert.fail(`Unexpected gh command: ${args.join(" ")}`);
};

const applied = await applyMigrationPlan({
	projectNumber: 1,
	roadmap: restoredRoadmap,
	initialPlan: plan,
	gh: fakeGh,
	fetchInventory: async () => structuredClone(appliedInventory),
});
assert.deepEqual(applied.fieldsToCreate, []);
assert.deepEqual(applied.items, []);
assert.deepEqual(applied.backfills, []);
assert.equal(
	commands.filter((args) => args[0] === "project" && args[1] === "field-create").length,
	5,
);
assert.ok(
	commands.some(
		(args) => args.includes("--date") && args.includes("2026-07-10"),
	),
);

console.log("Roadmap Project rollout contract passed");
