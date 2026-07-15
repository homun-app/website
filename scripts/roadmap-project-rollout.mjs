import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";

const execFileAsync = promisify(execFile);
const OWNER = "homun-app";

const FIELD_SPECS = [
	{
		name: "Public status",
		dataType: "SINGLE_SELECT",
		options: ["Ideas", "Next", "Building", "Shipped"],
	},
	{
		name: "Publication status",
		dataType: "SINGLE_SELECT",
		options: ["Draft", "Review", "Published", "Archived"],
	},
	{ name: "Public update date", dataType: "DATE" },
	{ name: "Voting", dataType: "SINGLE_SELECT", options: ["Open", "Closed"] },
	{ name: "Archive reason", dataType: "TEXT" },
];

const PUBLIC_STATUS_LABELS = new Map([
	["ideas", "Ideas"],
	["next", "Next"],
	["building", "Building"],
	["shipped", "Shipped"],
]);

const VOTING_LABELS = new Map([
	["open", "Open"],
	["closed", "Closed"],
]);

const LEGACY_STATUSES = new Set(["Exploring", "Next", "Building", "Shipped"]);

const PROJECT_QUERY = `
query HomunRoadmapRollout($owner: String!, $number: Int!, $after: String) {
  organization(login: $owner) {
    projectV2(number: $number) {
      id
      number
      title
      fields(first: 100) {
        nodes {
          ... on ProjectV2Field { id name dataType }
          ... on ProjectV2SingleSelectField { id name dataType options { id name } }
          ... on ProjectV2IterationField { id name dataType }
        }
      }
      items(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content {
            ... on Issue { number title body url updatedAt repository { nameWithOwner } }
            ... on DraftIssue { title body }
          }
          fieldValues(first: 100) {
            nodes {
              ... on ProjectV2ItemFieldTextValue {
                text
                field { ... on ProjectV2Field { id name dataType } }
              }
              ... on ProjectV2ItemFieldNumberValue {
                number
                field { ... on ProjectV2Field { id name dataType } }
              }
              ... on ProjectV2ItemFieldDateValue {
                date
                field { ... on ProjectV2Field { id name dataType } }
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                optionId
                field { ... on ProjectV2SingleSelectField { id name dataType } }
              }
            }
          }
        }
      }
    }
  }
}`;

function optionNames(field) {
	return (field.options ?? []).map((option) =>
		typeof option === "string" ? option : option.name,
	);
}

function assertCompatibleField(actual, expected) {
	if (actual.dataType !== expected.dataType) {
		throw new Error(
			`Incompatible Project field ${expected.name}: expected ${expected.dataType}, got ${actual.dataType}`,
		);
	}
	if (expected.options) {
		const actualOptions = new Set(optionNames(actual));
		for (const option of expected.options) {
			if (!actualOptions.has(option)) {
				throw new Error(`Missing option ${option} in Project field ${expected.name}`);
			}
		}
	}
}

function assertRoadmapShape(roadmap) {
	if (roadmap?.schemaVersion !== 2 || !Array.isArray(roadmap.items)) {
		throw new Error("Invalid restored roadmap snapshot");
	}
	if (roadmap.items.length === 0) {
		throw new Error("Refusing an empty public roadmap migration");
	}
	const featured = roadmap.items.filter(
		(item) => item.featured && item.status === "building",
	);
	if (featured.length > 1) {
		throw new Error("More than one featured Building item");
	}
	for (const item of roadmap.items) {
		if (!PUBLIC_STATUS_LABELS.has(item.status)) {
			throw new Error(`Unknown public status: ${item.status}`);
		}
		if (!VOTING_LABELS.has(item.voting)) {
			throw new Error(`Unknown voting state: ${item.voting}`);
		}
	}
}

function indexItemsBySlug(items, { requireLegacyStatus = true } = {}) {
	const bySlug = new Map();
	for (const item of items ?? []) {
		const slug = typeof item.fields?.Slug === "string" ? item.fields.Slug.trim() : "";
		if (!slug) throw new Error(`Missing slug in Project item: ${item.content?.title ?? item.id}`);
		if (requireLegacyStatus && !LEGACY_STATUSES.has(item.fields?.Status)) {
			throw new Error(`Unknown legacy status for ${slug}: ${item.fields?.Status ?? "(empty)"}`);
		}
		if (bySlug.has(slug)) throw new Error(`Duplicate slug in Project: ${slug}`);
		bySlug.set(slug, item);
	}
	return bySlug;
}

function setWhenDifferent(target, currentFields, field, value) {
	if (currentFields[field] !== value) target[field] = value;
}

export function buildMigrationPlan(inventory, restoredRoadmap) {
	assertRoadmapShape(restoredRoadmap);
	if (!inventory?.project?.id || !Array.isArray(inventory.fields) || !Array.isArray(inventory.items)) {
		throw new Error("Invalid Project inventory");
	}

	const existingFields = new Map(inventory.fields.map((field) => [field.name, field]));
	const fieldsToCreate = [];
	for (const spec of FIELD_SPECS) {
		const existing = existingFields.get(spec.name);
		if (!existing) fieldsToCreate.push(structuredClone(spec));
		else assertCompatibleField(existing, spec);
	}

	const projectItems = indexItemsBySlug(inventory.items, {
		requireLegacyStatus: existingFields.has("Public"),
	});
	const restoredSlugs = new Set(restoredRoadmap.items.map((item) => item.slug));
	const items = [];
	const backfills = [];

	for (const roadmapItem of restoredRoadmap.items) {
		const projectItem = projectItems.get(roadmapItem.slug);
		if (!projectItem) {
			throw new Error(`Missing Project item for public slug: ${roadmapItem.slug}`);
		}
		const set = {};
		setWhenDifferent(
			set,
			projectItem.fields,
			"Public status",
			PUBLIC_STATUS_LABELS.get(roadmapItem.status),
		);
		setWhenDifferent(set, projectItem.fields, "Publication status", "Published");
		setWhenDifferent(
			set,
			projectItem.fields,
			"Voting",
			VOTING_LABELS.get(roadmapItem.voting),
		);
		if (Object.keys(set).length > 0) {
			items.push({ itemId: projectItem.id, slug: roadmapItem.slug, set });
		}
		if (
			roadmapItem.publicUpdateDate
			&& projectItem.fields["Public update date"] !== roadmapItem.publicUpdateDate
		) {
			backfills.push({
				itemId: projectItem.id,
				slug: roadmapItem.slug,
				field: "Public update date",
				value: roadmapItem.publicUpdateDate,
			});
		}
	}

	for (const [slug, projectItem] of projectItems) {
		if (restoredSlugs.has(slug)) continue;
		const set = {};
		setWhenDifferent(set, projectItem.fields, "Publication status", "Draft");
		if (Object.keys(set).length > 0) {
			items.push({ itemId: projectItem.id, slug, set });
		}
	}

	items.sort((left, right) => left.slug.localeCompare(right.slug));
	backfills.sort((left, right) => left.slug.localeCompare(right.slug));
	return {
		project: structuredClone(inventory.project),
		fieldsToCreate,
		items,
		backfills,
	};
}

export function parseRolloutArgs(argv) {
	let projectNumber = null;
	let inventoryPath = null;
	let mode = "dry-run";
	let selectedMode = null;

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === "--project-number") {
			const raw = argv[++index];
			projectNumber = Number(raw);
			if (!Number.isInteger(projectNumber) || projectNumber <= 0) {
				throw new Error("--project-number must be a positive integer");
			}
		} else if (argument === "--inventory") {
			inventoryPath = argv[++index] ?? null;
			if (!inventoryPath) throw new Error("--inventory requires a path");
		} else if (argument === "--dry-run" || argument === "--apply") {
			const requested = argument.slice(2);
			if (selectedMode && selectedMode !== requested) {
				throw new Error("--apply and --dry-run are mutually exclusive");
			}
			selectedMode = requested;
			mode = requested;
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}

	if (!projectNumber) throw new Error("--project-number is required");
	return { projectNumber, inventoryPath, mode };
}

async function runGh(args) {
	const { stdout } = await execFileAsync("gh", args, {
		maxBuffer: 10 * 1024 * 1024,
	});
	return stdout;
}

function fieldValue(node) {
	if (Object.hasOwn(node, "text")) return node.text;
	if (Object.hasOwn(node, "number")) return node.number;
	if (Object.hasOwn(node, "date")) return node.date;
	if (Object.hasOwn(node, "name")) return node.name;
	return null;
}

function normalizeInventory(project, itemNodes) {
	return {
		project: { id: project.id, number: project.number, title: project.title },
		fields: project.fields.nodes.filter(Boolean).map((field) => ({
			id: field.id,
			name: field.name,
			dataType: field.dataType,
			...(field.options ? { options: field.options.map(({ id, name }) => ({ id, name })) } : {}),
		})),
		items: itemNodes.map((item) => ({
			id: item.id,
			content: item.content,
			fields: Object.fromEntries(
				(item.fieldValues?.nodes ?? [])
					.filter((value) => value?.field?.name)
					.map((value) => [value.field.name, fieldValue(value)]),
			),
		})),
	};
}

export async function fetchProjectInventory(projectNumber, gh = runGh) {
	let after = null;
	let project = null;
	const items = [];
	do {
		const args = [
			"api",
			"graphql",
			"-f",
			`query=${PROJECT_QUERY}`,
			"-F",
			`owner=${OWNER}`,
			"-F",
			`number=${projectNumber}`,
		];
		if (after) args.push("-F", `after=${after}`);
		const payload = JSON.parse(await gh(args));
		project = payload?.data?.organization?.projectV2;
		if (!project) throw new Error(`GitHub Project ${OWNER}/${projectNumber} was not found`);
		items.push(...project.items.nodes);
		after = project.items.pageInfo.hasNextPage ? project.items.pageInfo.endCursor : null;
	} while (after);
	return normalizeInventory(project, items);
}

function formatSet(set) {
	return Object.entries(set).map(([field, value]) => `${field}=${value}`).join(", ");
}

export function formatMigrationPlan(plan, mode = "dry-run") {
	const lines = [mode === "apply" ? "APPLY PLAN" : "DRY RUN"];
	lines.push(`Project: ${plan.project.title} (#${plan.project.number})`);
	lines.push(`Fields to create: ${plan.fieldsToCreate.length}`);
	for (const field of plan.fieldsToCreate) lines.push(`  + ${field.name} (${field.dataType})`);
	lines.push(`Item updates: ${plan.items.length}`);
	for (const item of plan.items) lines.push(`  ~ ${item.slug}: ${formatSet(item.set)}`);
	lines.push(`Date backfills: ${plan.backfills.length}`);
	for (const entry of plan.backfills) {
		lines.push(`  ~ ${entry.slug}: ${entry.field}=${entry.value}`);
	}
	return lines.join("\n");
}

function fieldCreateArgs(projectNumber, spec) {
	const args = [
		"project",
		"field-create",
		String(projectNumber),
		"--owner",
		OWNER,
		"--name",
		spec.name,
		"--data-type",
		spec.dataType,
	];
	if (spec.options) args.push("--single-select-options", spec.options.join(","));
	return args;
}

function fieldEditArgs(projectId, itemId, field, value) {
	const args = [
		"project",
		"item-edit",
		"--id",
		itemId,
		"--project-id",
		projectId,
		"--field-id",
		field.id,
	];
	if (field.dataType === "SINGLE_SELECT") {
		const option = (field.options ?? []).find((candidate) => candidate.name === value);
		if (!option) throw new Error(`Missing option ${value} in ${field.name}`);
		args.push("--single-select-option-id", option.id);
	} else if (field.dataType === "DATE") {
		args.push("--date", String(value));
	} else if (field.dataType === "NUMBER") {
		args.push("--number", String(value));
	} else if (field.dataType === "TEXT") {
		args.push("--text", String(value));
	} else {
		throw new Error(`Unsupported field type ${field.dataType}: ${field.name}`);
	}
	return args;
}

async function applyItemValues(plan, inventory, gh) {
	const fields = new Map(inventory.fields.map((field) => [field.name, field]));
	for (const item of plan.items) {
		for (const [fieldName, value] of Object.entries(item.set)) {
			const field = fields.get(fieldName);
			if (!field) throw new Error(`Missing Project field after creation: ${fieldName}`);
			await gh(fieldEditArgs(inventory.project.id, item.itemId, field, value));
		}
	}
	for (const entry of plan.backfills) {
		const field = fields.get(entry.field);
		if (!field) throw new Error(`Missing Project field after creation: ${entry.field}`);
		await gh(fieldEditArgs(inventory.project.id, entry.itemId, field, entry.value));
	}
}

async function confirmApply() {
	const input = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await input.question('Type "apply" to modify the GitHub Project: ');
		if (answer.trim() !== "apply") throw new Error("Project migration cancelled");
	} finally {
		input.close();
	}
}

export async function applyMigrationPlan({
	projectNumber,
	roadmap,
	initialPlan,
	gh = runGh,
	fetchInventory = (number) => fetchProjectInventory(number, gh),
}) {
	for (const field of initialPlan.fieldsToCreate) {
		await gh(fieldCreateArgs(projectNumber, field));
	}
	let inventory = await fetchInventory(projectNumber);
	let plan = buildMigrationPlan(inventory, roadmap);
	await applyItemValues(plan, inventory, gh);
	inventory = await fetchInventory(projectNumber);
	plan = buildMigrationPlan(inventory, roadmap);
	if (plan.fieldsToCreate.length || plan.items.length || plan.backfills.length) {
		throw new Error("Project migration was not idempotent; operations remain after apply");
	}
	return plan;
}

export async function applyMigration(projectNumber, roadmap, initialPlan, gh = runGh) {
	await confirmApply();
	return applyMigrationPlan({ projectNumber, roadmap, initialPlan, gh });
}

async function main(argv = process.argv.slice(2)) {
	const options = parseRolloutArgs(argv);
	if (options.mode === "apply" && options.inventoryPath) {
		throw new Error("--apply cannot use an offline --inventory snapshot");
	}
	const roadmap = JSON.parse(
		await readFile(new URL("../src/data/roadmap.json", import.meta.url)),
	);
	const inventory = options.inventoryPath
		? JSON.parse(await readFile(options.inventoryPath, "utf8"))
		: await fetchProjectInventory(options.projectNumber);
	const plan = buildMigrationPlan(inventory, roadmap);
	console.log(formatMigrationPlan(plan, options.mode));
	if (options.mode === "apply") {
		await applyMigration(options.projectNumber, roadmap, plan);
		console.log("Project migration applied; follow-up dry-run has no operations.");
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
