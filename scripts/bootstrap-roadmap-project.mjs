import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import {
	buildMigrationPlan,
	fetchProjectInventory,
} from "./roadmap-project-rollout.mjs";

const execFileAsync = promisify(execFile);
const OWNER = "homun-app";
const REPOSITORY = "homun-app/homun";

const FIELD_SPECS = [
	{ name: "Public status", dataType: "SINGLE_SELECT", options: ["Ideas", "Next", "Building", "Shipped"] },
	{ name: "Publication status", dataType: "SINGLE_SELECT", options: ["Draft", "Review", "Published", "Archived"] },
	{ name: "Area", dataType: "SINGLE_SELECT", options: ["Agent", "Apps", "Automations", "Chat", "Collaboration", "Input", "Local computer", "Models", "Plugins", "Other"] },
	{ name: "Slug", dataType: "TEXT" },
	{ name: "Featured", dataType: "SINGLE_SELECT", options: ["Yes", "No"] },
	{ name: "Progress", dataType: "NUMBER" },
	{ name: "Target release", dataType: "TEXT" },
	{ name: "Public update", dataType: "TEXT" },
	{ name: "Public update date", dataType: "DATE" },
	{ name: "Voting", dataType: "SINGLE_SELECT", options: ["Open", "Closed"] },
	{ name: "Order", dataType: "NUMBER" },
	{ name: "Archive reason", dataType: "TEXT" },
];

const STATUS_LABELS = new Map([
	["ideas", "Ideas"],
	["next", "Next"],
	["building", "Building"],
	["shipped", "Shipped"],
]);

const VOTING_LABELS = new Map([
	["open", "Open"],
	["closed", "Closed"],
]);

function markerFor(slug) {
	return `<!-- roadmap-slug: ${slug} -->`;
}

export function issueBodyFor(item) {
	const capabilities = item.capabilities.map((capability) => `- ${capability}`).join("\n");
	return [
		markerFor(item.slug),
		"",
		item.description,
		"",
		"## Intended capabilities",
		"",
		capabilities,
		"",
		"## Roadmap participation",
		"",
		"Use this issue to add public context and, when voting is open, react with 👍. Votes are advisory and do not create delivery commitments.",
	].join("\n");
}

function issueSlug(issue) {
	const match = String(issue.body ?? "").match(/<!--\s*roadmap-slug:\s*([a-z0-9-]+)\s*-->/i);
	return match?.[1] ?? null;
}

export function buildBootstrapPlan(inventory, roadmap, issues) {
	if (!inventory?.project?.id || !Array.isArray(inventory.fields) || !Array.isArray(inventory.items)) {
		throw new Error("Invalid Project inventory");
	}
	if (roadmap?.schemaVersion !== 2 || !Array.isArray(roadmap.items) || roadmap.items.length === 0) {
		throw new Error("Invalid public roadmap snapshot");
	}
	const existingFields = new Set(inventory.fields.map((field) => field.name));
	const fieldsToCreate = FIELD_SPECS
		.filter((field) => !existingFields.has(field.name))
		.map((field) => structuredClone(field));

	const issuesBySlug = new Map();
	for (const issue of issues) {
		const slug = issueSlug(issue);
		if (!slug) continue;
		if (issuesBySlug.has(slug)) throw new Error(`Duplicate issue for roadmap slug: ${slug}`);
		issuesBySlug.set(slug, issue);
	}

	const issuesToCreate = [];
	const issuesToReuse = [];
	for (const item of roadmap.items) {
		const issue = issuesBySlug.get(item.slug);
		if (issue) {
			issuesToReuse.push({ slug: item.slug, number: issue.number, url: issue.url });
			continue;
		}
		issuesToCreate.push({
			slug: item.slug,
			title: item.title,
			body: issueBodyFor(item),
			labels: item.status === "ideas" ? ["idea", "roadmap"] : ["roadmap"],
		});
	}
	return {
		project: structuredClone(inventory.project),
		fieldsToCreate,
		issuesToCreate,
		issuesToReuse,
	};
}

export function parseBootstrapArgs(argv) {
	let projectNumber = null;
	let mode = "dry-run";
	let selectedMode = null;
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === "--project-number") {
			projectNumber = Number(argv[++index]);
			if (!Number.isInteger(projectNumber) || projectNumber < 1) {
				throw new Error("--project-number must be a positive integer");
			}
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
	return { projectNumber, mode };
}

async function runGh(args) {
	const { stdout } = await execFileAsync("gh", args, { maxBuffer: 10 * 1024 * 1024 });
	return stdout.trim();
}

async function listRoadmapIssues(gh = runGh) {
	return JSON.parse(await gh([
		"issue", "list", "--repo", REPOSITORY, "--state", "all", "--limit", "200",
		"--json", "number,title,body,url,state,labels",
	]));
}

function fieldCreateArgs(projectNumber, field) {
	const args = [
		"project", "field-create", String(projectNumber), "--owner", OWNER,
		"--name", field.name, "--data-type", field.dataType,
	];
	if (field.options) args.push("--single-select-options", field.options.join(","));
	return args;
}

function fieldEditArgs(projectId, itemId, field, value) {
	const args = [
		"project", "item-edit", "--id", itemId, "--project-id", projectId,
		"--field-id", field.id,
	];
	if (field.dataType === "SINGLE_SELECT") {
		const option = field.options?.find((candidate) => candidate.name === value);
		if (!option) throw new Error(`Missing option ${value} in ${field.name}`);
		args.push("--single-select-option-id", option.id);
	} else if (field.dataType === "TEXT") {
		args.push("--text", String(value));
	} else if (field.dataType === "NUMBER") {
		args.push("--number", String(value));
	} else if (field.dataType === "DATE") {
		args.push("--date", String(value));
	} else {
		throw new Error(`Unsupported Project field type: ${field.dataType}`);
	}
	return args;
}

function desiredFields(item) {
	return {
		"Public status": STATUS_LABELS.get(item.status),
		"Publication status": "Published",
		Area: item.area,
		Slug: item.slug,
		Featured: item.featured ? "Yes" : "No",
		Progress: item.progress,
		...(item.targetRelease ? { "Target release": item.targetRelease } : {}),
		"Public update": item.publicUpdate,
		"Public update date": item.publicUpdateDate,
		Voting: VOTING_LABELS.get(item.voting),
		Order: item.order,
	};
}

function formatPlan(plan, mode) {
	const lines = [mode === "apply" ? "BOOTSTRAP APPLY PLAN" : "BOOTSTRAP DRY RUN"];
	lines.push(`Project: ${plan.project.title} (#${plan.project.number})`);
	lines.push(`Fields to create: ${plan.fieldsToCreate.length}`);
	for (const field of plan.fieldsToCreate) lines.push(`  + ${field.name}`);
	lines.push(`Issues to create: ${plan.issuesToCreate.length}`);
	for (const issue of plan.issuesToCreate) lines.push(`  + ${issue.slug}: ${issue.title}`);
	lines.push(`Issues to reuse: ${plan.issuesToReuse.length}`);
	for (const issue of plan.issuesToReuse) lines.push(`  = ${issue.slug}: #${issue.number}`);
	return lines.join("\n");
}

async function confirmApply() {
	const input = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await input.question('Type "bootstrap" to create public roadmap issues and Project data: ');
		if (answer.trim() !== "bootstrap") throw new Error("Roadmap bootstrap cancelled");
	} finally {
		input.close();
	}
}

async function ensureIssue(item, issueMap, gh) {
	let issue = issueMap.get(item.slug);
	const labels = item.status === "ideas" ? ["idea", "roadmap"] : ["roadmap"];
	if (!issue) {
		const args = [
			"issue", "create", "--repo", REPOSITORY, "--title", item.title,
			"--body", issueBodyFor(item),
		];
		for (const label of labels) args.push("--label", label);
		const url = await gh(args);
		issue = { number: Number(url.split("/").at(-1)), url, state: "OPEN" };
		issueMap.set(item.slug, issue);
	} else {
		const editArgs = ["issue", "edit", String(issue.number), "--repo", REPOSITORY];
		for (const label of labels) editArgs.push("--add-label", label);
		await gh(editArgs);
	}
	return issue;
}

async function ensureProjectItem(projectNumber, projectId, issue, inventory, gh) {
	const existing = inventory.items.find((item) => item.content?.url === issue.url);
	if (existing) return existing.id;
	const created = JSON.parse(await gh([
		"project", "item-add", String(projectNumber), "--owner", OWNER,
		"--url", issue.url, "--format", "json",
	]));
	if (!created.id) throw new Error(`Project item creation returned no id for ${issue.url}`);
	return created.id;
}

export async function applyBootstrap({ projectNumber, roadmap, initialPlan, gh = runGh }) {
	await confirmApply();
	await gh([
		"label", "create", "roadmap", "--repo", REPOSITORY, "--color", "1D76DB",
		"--description", "Accepted public product roadmap initiative", "--force",
	]);
	for (const field of initialPlan.fieldsToCreate) await gh(fieldCreateArgs(projectNumber, field));

	const issues = await listRoadmapIssues(gh);
	const issueMap = new Map(issues.map((issue) => [issueSlug(issue), issue]).filter(([slug]) => slug));
	let inventory = await fetchProjectInventory(projectNumber, gh);
	const fields = new Map(inventory.fields.map((field) => [field.name, field]));
	for (const item of roadmap.items) {
		const issue = await ensureIssue(item, issueMap, gh);
		const projectItemId = await ensureProjectItem(
			projectNumber,
			inventory.project.id,
			issue,
			inventory,
			gh,
		);
		for (const [fieldName, value] of Object.entries(desiredFields(item))) {
			if (value == null) throw new Error(`Missing ${fieldName}: ${item.slug}`);
			const field = fields.get(fieldName);
			if (!field) throw new Error(`Missing Project field after creation: ${fieldName}`);
			await gh(fieldEditArgs(inventory.project.id, projectItemId, field, value));
		}
		if (item.status === "shipped" && issue.state !== "CLOSED") {
			await gh(["issue", "close", String(issue.number), "--repo", REPOSITORY, "--reason", "completed"]);
		}
	}

	inventory = await fetchProjectInventory(projectNumber, gh);
	const remaining = buildMigrationPlan(inventory, roadmap);
	if (remaining.fieldsToCreate.length || remaining.items.length || remaining.backfills.length) {
		throw new Error("Bootstrap completed with remaining migration operations");
	}
	return remaining;
}

async function main(argv = process.argv.slice(2)) {
	const options = parseBootstrapArgs(argv);
	const roadmap = JSON.parse(await readFile(new URL("../src/data/roadmap.json", import.meta.url)));
	const [inventory, issues] = await Promise.all([
		fetchProjectInventory(options.projectNumber),
		listRoadmapIssues(),
	]);
	const plan = buildBootstrapPlan(inventory, roadmap, issues);
	console.log(formatPlan(plan, options.mode));
	if (options.mode === "apply") {
		await applyBootstrap({ projectNumber: options.projectNumber, roadmap, initialPlan: plan });
		console.log("Public roadmap bootstrap applied; migration plan is empty.");
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
