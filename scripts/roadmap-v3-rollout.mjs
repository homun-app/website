import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const OWNER = "homun-app";
const REPOSITORY = "homun-app/homun";

const FIELD_SPECS = [
	{ name: "Roadmap stage", dataType: "SINGLE_SELECT", options: ["Available", "Building now", "Up next", "Exploring"] },
	{ name: "Item type", dataType: "SINGLE_SELECT", options: ["Strategic program", "Workflow idea"] },
	{ name: "Evaluation status", dataType: "SINGLE_SELECT", options: ["Evaluating", "Selected for pilot", "Removed"] },
	{ name: "Public area", dataType: "TEXT" },
];

const STAGE_LABELS = { available: "Available", building: "Building now", next: "Up next", exploring: "Exploring" };
const TYPE_LABELS = { strategic_program: "Strategic program", workflow_idea: "Workflow idea" };
const EVALUATION_LABELS = { evaluating: "Evaluating", selected_for_pilot: "Selected for pilot", removed: "Removed" };
const VOTING_LABELS = { open: "Open", closed: "Closed" };

function markerFor(slug) {
	return `<!-- roadmap-slug: ${slug} -->`;
}

function bullets(values) {
	return values.map((value) => `- ${value}`).join("\n");
}

export function issueBodyFor(item) {
	const sections = [
		markerFor(item.slug), "", item.outcome, "",
		"## Why now", "", item.whyNow, "",
		"## First release", "", bullets(item.firstRelease), "",
		"## Milestones", "", item.milestones.map(({ title, completed }) => `- [${completed ? "x" : " "}] ${title}`).join("\n"), "",
		"## Not included yet", "", bullets(item.notIncludedYet), "",
	];
	if (item.strategicRole) sections.push("## Strategic role", "", item.strategicRole, "");
	if (item.itemType === "workflow_idea") {
		sections.push(
			"## Target team", "", item.targetTeam, "",
			"## Example process", "", bullets(item.exampleProcess), "",
			"## Likely connected systems", "", bullets(item.likelySystems), "",
			"## Expected output", "", item.expectedOutput, "",
		);
	}
	sections.push(
		"## Roadmap participation", "",
		"Use this issue to add context and, when voting is open, react with 👍. Votes are advisory and do not create delivery commitments.",
	);
	return sections.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function issueSlug(issue) {
	return String(issue.body ?? "").match(/<!--\s*roadmap-slug:\s*([a-z0-9-]+)\s*-->/i)?.[1] ?? null;
}

function desiredFields(item, publicationStatus = "Review") {
	return {
		Slug: item.slug,
		"Publication status": publicationStatus,
		"Roadmap stage": STAGE_LABELS[item.stage],
		"Item type": TYPE_LABELS[item.itemType],
		"Evaluation status": item.evaluationState ? EVALUATION_LABELS[item.evaluationState] : null,
		"Public area": item.area,
		Featured: item.featured ? "Yes" : "No",
		"Public update": item.publicUpdate,
		"Public update date": item.publicUpdateDate,
		Voting: VOTING_LABELS[item.voting],
		Order: item.order,
	};
}

function differentFields(current, desired) {
	return Object.fromEntries(Object.entries(desired).filter(([name, value]) =>
		value !== null && current?.[name] !== value));
}

function fieldOptions(field) {
	return (field.options ?? []).map((option) => typeof option === "string" ? option : option.name);
}

function assertFieldCompatibility(actual, expected) {
	if (actual.dataType !== expected.dataType) throw new Error(`Incompatible Project field: ${expected.name}`);
	for (const option of expected.options ?? []) {
		if (!fieldOptions(actual).includes(option)) throw new Error(`Missing option ${option} in ${expected.name}`);
	}
}

function archiveComment(number, replacements) {
	if (replacements.length === 0) {
		return "This roadmap item is archived and retained for historical context. It is not part of the current public product plan.";
	}
	return `This roadmap item is archived and retained for historical context. Its direction is now represented by: ${replacements.map((slug) => `\`${slug}\``).join(", ")}.`;
}

export function buildRolloutPlan(inventory, manifest, issues) {
	if (manifest?.schemaVersion !== 3 || manifest.items?.length !== 13) throw new Error("Invalid roadmap v3 manifest");
	if (!inventory?.project?.id || !Array.isArray(inventory.fields) || !Array.isArray(inventory.items)) throw new Error("Invalid Project inventory");
	const fieldsByName = new Map(inventory.fields.map((field) => [field.name, field]));
	const fieldsToCreate = FIELD_SPECS.filter((spec) => {
		const existing = fieldsByName.get(spec.name);
		if (existing) assertFieldCompatibility(existing, spec);
		return !existing;
	}).map((field) => structuredClone(field));

	const issuesByNumber = new Map(issues.map((issue) => [issue.number, issue]));
	const issuesBySlug = new Map(issues.map((issue) => [issueSlug(issue), issue]).filter(([slug]) => slug));
	const transformBySlug = new Map(Object.entries(manifest.legacy.transform).map(([number, slug]) => [slug, Number(number)]));
	const issuesToCreate = [];
	const issuesToTransform = [];
	const activeIssues = new Map();
	for (const item of manifest.items) {
		const transformNumber = transformBySlug.get(item.slug);
		const issue = transformNumber ? issuesByNumber.get(transformNumber) : issuesBySlug.get(item.slug);
		if (!issue) {
			issuesToCreate.push({ slug: item.slug, title: item.title, body: issueBodyFor(item), labels: ["roadmap", ...(item.itemType === "workflow_idea" ? ["idea"] : [])] });
			continue;
		}
		activeIssues.set(item.slug, issue);
		const body = issueBodyFor(item);
		if (issue.title !== item.title || issue.body.trim() !== body) {
			issuesToTransform.push({ number: issue.number, url: issue.url, slug: item.slug, title: item.title, body });
		}
	}
	issuesToTransform.sort((left, right) => left.number - right.number);

	const itemsByUrl = new Map(inventory.items.map((item) => [item.content?.url, item]));
	const activeItemUpdates = [];
	for (const item of manifest.items) {
		const issue = activeIssues.get(item.slug);
		const projectItem = issue ? itemsByUrl.get(issue.url) : null;
		if (!projectItem) continue;
		const set = differentFields(projectItem.fields, desiredFields(item));
		if (Object.keys(set).length) activeItemUpdates.push({ itemId: projectItem.id, slug: item.slug, set });
	}

	const transformedNumbers = new Set(Object.keys(manifest.legacy.transform).map(Number));
	const itemsToArchive = Object.entries(manifest.legacy.archive).map(([rawNumber, replacements]) => {
		const number = Number(rawNumber);
		const issue = issuesByNumber.get(number);
		const projectItem = inventory.items.find((item) => item.content?.number === number || item.content?.url === issue?.url);
		if (transformedNumbers.has(number) || !issue || !projectItem) return null;
		const needsStatus = projectItem.fields?.["Publication status"] !== "Archived";
		const needsClose = issue.state !== "CLOSED";
		if (!needsStatus && !needsClose) return null;
		return { number, issueUrl: issue.url, itemId: projectItem.id, replacements, comment: archiveComment(number, replacements), needsStatus, needsClose };
	}).filter(Boolean).sort((a, b) => a.number - b.number);

	const operationCount = fieldsToCreate.length + issuesToCreate.length + issuesToTransform.length
		+ activeItemUpdates.reduce((total, entry) => total + Object.keys(entry.set).length, 0)
		+ itemsToArchive.reduce((total, entry) => total + Number(entry.needsStatus) + Number(entry.needsClose), 0);
	return { project: structuredClone(inventory.project), fieldsToCreate, issuesToCreate, issuesToTransform, activeItemUpdates, itemsToArchive, operationCount };
}

export function buildPublishPlan(inventory, manifest) {
	const activeSlugs = new Set(manifest.items.map(({ slug }) => slug));
	const projectSlugs = new Set(inventory.items.map((item) => item.fields?.Slug).filter(Boolean));
	const missing = [...activeSlugs].filter((slug) => !projectSlugs.has(slug));
	if (missing.length) throw new Error(`Active roadmap records are missing from the Project: ${missing.join(", ")}`);
	const itemsToPublish = inventory.items.filter((item) =>
		activeSlugs.has(item.fields?.Slug) && item.fields?.["Publication status"] === "Review")
		.map((item) => ({ itemId: item.id, slug: item.fields.Slug, from: "Review", to: "Published" }))
		.sort((a, b) => a.slug.localeCompare(b.slug));
	const invalid = inventory.items.filter((item) =>
		activeSlugs.has(item.fields?.Slug) && !["Review", "Published"].includes(item.fields?.["Publication status"]));
	if (invalid.length) throw new Error(`Active roadmap records are not ready for publication: ${invalid.map((item) => item.fields.Slug).join(", ")}`);
	return { project: structuredClone(inventory.project), itemsToPublish, operationCount: itemsToPublish.length };
}

export function parseRolloutArgs(argv) {
	let projectNumber = null;
	let mode = "dry-run";
	let selected = null;
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === "--project-number") {
			projectNumber = Number(argv[++index]);
			if (!Number.isInteger(projectNumber) || projectNumber < 1) throw new Error("--project-number must be a positive integer");
		} else if (["--dry-run", "--apply", "--publish"].includes(argument)) {
			const requested = argument.slice(2);
			if (selected && selected !== requested) throw new Error("Rollout modes are mutually exclusive");
			selected = requested;
			mode = requested;
		} else throw new Error(`Unknown argument: ${argument}`);
	}
	if (!projectNumber) throw new Error("--project-number is required");
	return { projectNumber, mode };
}

async function runGh(args) {
	const { stdout } = await execFileAsync("gh", args, { maxBuffer: 10 * 1024 * 1024 });
	return stdout.trim();
}

const PROJECT_QUERY = `query($owner:String!,$number:Int!,$after:String){organization(login:$owner){projectV2(number:$number){id number title fields(first:100){nodes{... on ProjectV2Field{id name dataType}... on ProjectV2SingleSelectField{id name dataType options{id name}}}}items(first:100,after:$after){pageInfo{hasNextPage endCursor}nodes{id content{... on Issue{number title body url state updatedAt reactions(content:THUMBS_UP){totalCount}}}fieldValues(first:100){nodes{... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2Field{id name dataType}}}... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{id name dataType}}}... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2Field{id name dataType}}}... on ProjectV2ItemFieldSingleSelectValue{name optionId field{... on ProjectV2SingleSelectField{id name dataType}}}}}}}}}}`;

function fieldValue(node) {
	return node?.name ?? node?.text ?? node?.number ?? node?.date ?? null;
}

export async function fetchProjectInventory(projectNumber, gh = runGh) {
	let after = null;
	let project;
	const items = [];
	do {
		const args = ["api", "graphql", "-f", `query=${PROJECT_QUERY}`, "-F", `owner=${OWNER}`, "-F", `number=${projectNumber}`];
		if (after) args.push("-F", `after=${after}`);
		const payload = JSON.parse(await gh(args));
		project = payload?.data?.organization?.projectV2;
		if (!project) throw new Error(`GitHub Project ${OWNER}/${projectNumber} was not found`);
		items.push(...project.items.nodes);
		after = project.items.pageInfo.hasNextPage ? project.items.pageInfo.endCursor : null;
	} while (after);
	return {
		project: { id: project.id, number: project.number, title: project.title },
		fields: project.fields.nodes.filter(Boolean).map((field) => ({ ...field, options: field.options?.map(({ id, name }) => ({ id, name })) })),
		items: items.map((item) => ({ id: item.id, content: item.content, fields: Object.fromEntries((item.fieldValues?.nodes ?? []).filter((value) => value?.field?.name).map((value) => [value.field.name, fieldValue(value)])) })),
	};
}

export async function listIssues(gh = runGh) {
	return JSON.parse(await gh(["issue", "list", "--repo", REPOSITORY, "--state", "all", "--limit", "200", "--json", "number,title,body,url,state"]));
}

function fieldCreateArgs(projectNumber, field) {
	const args = ["project", "field-create", String(projectNumber), "--owner", OWNER, "--name", field.name, "--data-type", field.dataType];
	if (field.options) args.push("--single-select-options", field.options.join(","));
	return args;
}

function fieldEditArgs(projectId, itemId, field, value) {
	const args = ["project", "item-edit", "--id", itemId, "--project-id", projectId, "--field-id", field.id];
	if (field.dataType === "SINGLE_SELECT") {
		const option = field.options?.find((candidate) => candidate.name === value);
		if (!option) throw new Error(`Missing option ${value} in ${field.name}`);
		args.push("--single-select-option-id", option.id);
	} else if (field.dataType === "TEXT") args.push("--text", String(value));
	else if (field.dataType === "DATE") args.push("--date", String(value));
	else if (field.dataType === "NUMBER") args.push("--number", String(value));
	else throw new Error(`Unsupported Project field type: ${field.dataType}`);
	return args;
}

async function confirmExact(expected, message) {
	const input = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await input.question(`${message} Type "${expected}" to continue: `);
		if (answer.trim() !== expected) throw new Error("Roadmap rollout cancelled");
	} finally { input.close(); }
}

export async function reconcileUntilZero({
	readState,
	applyState,
	maxAttempts = 4,
	wait = () => new Promise((resolve) => setTimeout(resolve, 1_000)),
}) {
	let state;
	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		state = await readState();
		if (state.operationCount === 0) return state;
		await applyState(state);
		await wait(attempt);
	}
	state = await readState();
	if (state.operationCount !== 0) {
		throw new Error(`Roadmap v3 rollout did not converge; ${state.operationCount} operations remain`);
	}
	return state;
}

async function setFields(inventory, entries, gh) {
	const fields = new Map(inventory.fields.map((field) => [field.name, field]));
	for (const entry of entries) {
		for (const [name, value] of Object.entries(entry.set)) {
			const field = fields.get(name);
			if (!field) throw new Error(`Missing Project field: ${name}`);
			await gh(fieldEditArgs(inventory.project.id, entry.itemId, field, value));
		}
	}
}

async function ensureActiveIssuesAndItems(projectNumber, manifest, gh) {
	let issues = await listIssues(gh);
	const byNumber = new Map(issues.map((issue) => [issue.number, issue]));
	const bySlug = new Map(issues.map((issue) => [issueSlug(issue), issue]).filter(([slug]) => slug));
	const transformBySlug = new Map(Object.entries(manifest.legacy.transform).map(([number, slug]) => [slug, Number(number)]));
	for (const item of manifest.items) {
		let issue = transformBySlug.has(item.slug) ? byNumber.get(transformBySlug.get(item.slug)) : bySlug.get(item.slug);
		if (issue) {
			if (issue.title !== item.title || issue.body.trim() !== issueBodyFor(item)) {
				await gh(["issue", "edit", String(issue.number), "--repo", REPOSITORY, "--title", item.title, "--body", issueBodyFor(item), "--add-label", "roadmap"]);
			}
		} else {
			const args = ["issue", "create", "--repo", REPOSITORY, "--title", item.title, "--body", issueBodyFor(item), "--label", "roadmap"];
			if (item.itemType === "workflow_idea") args.push("--label", "idea");
			const url = await gh(args);
			issue = { number: Number(url.split("/").at(-1)), url, title: item.title, body: issueBodyFor(item), state: "OPEN" };
		}
		let inventory = await fetchProjectInventory(projectNumber, gh);
		if (!inventory.items.some((entry) => entry.content?.url === issue.url)) {
			await gh(["project", "item-add", String(projectNumber), "--owner", OWNER, "--url", issue.url]);
		}
	}
}

export async function applyRollout(projectNumber, manifest, gh = runGh) {
	await confirmExact("roadmap-v3", "This creates or updates roadmap issues and Project fields, archives seven legacy records, and leaves thirteen active records in Review.");
	let inventory = await fetchProjectInventory(projectNumber, gh);
	let plan = buildRolloutPlan(inventory, manifest, await listIssues(gh));
	for (const field of plan.fieldsToCreate) await gh(fieldCreateArgs(projectNumber, field));
	await reconcileUntilZero({
		readState: async () => {
			const currentInventory = await fetchProjectInventory(projectNumber, gh);
			const currentPlan = buildRolloutPlan(currentInventory, manifest, await listIssues(gh));
			return { ...currentPlan, inventory: currentInventory };
		},
		applyState: async (state) => {
			if (state.issuesToCreate.length || state.issuesToTransform.length) {
				await ensureActiveIssuesAndItems(projectNumber, manifest, gh);
			}
			await setFields(state.inventory, state.activeItemUpdates, gh);
			const publicationField = state.inventory.fields.find(({ name }) => name === "Publication status");
			for (const item of state.itemsToArchive) {
				if (item.needsClose) {
					await gh(["issue", "comment", String(item.number), "--repo", REPOSITORY, "--body", item.comment]);
					await gh(["issue", "close", String(item.number), "--repo", REPOSITORY, "--reason", "not planned"]);
				}
				if (item.needsStatus) {
					if (!publicationField) throw new Error("Missing Publication status field");
					await gh(fieldEditArgs(state.inventory.project.id, item.itemId, publicationField, "Archived"));
				}
			}
		},
	});
}

export async function publishRollout(projectNumber, manifest, gh = runGh) {
	await confirmExact("publish-v3", "This publishes the thirteen reviewed roadmap v3 records.");
	let inventory = await fetchProjectInventory(projectNumber, gh);
	const plan = buildPublishPlan(inventory, manifest);
	await setFields(inventory, plan.itemsToPublish.map((item) => ({ ...item, set: { "Publication status": "Published" } })), gh);
	inventory = await fetchProjectInventory(projectNumber, gh);
	if (buildPublishPlan(inventory, manifest).operationCount !== 0) throw new Error("Roadmap v3 publication did not converge");
}

export function formatPlan(plan, mode) {
	const lines = [`ROADMAP V3 ${mode.toUpperCase()}`, `Project: ${plan.project.title} (#${plan.project.number})`];
	if (mode === "publish") return [...lines, `Records to publish: ${plan.itemsToPublish.length}`, ...plan.itemsToPublish.map((item) => `  ~ ${item.slug}: Review -> Published`)].join("\n");
	lines.push(`Fields to create: ${plan.fieldsToCreate.length}`, ...plan.fieldsToCreate.map((field) => `  + ${field.name}`));
	lines.push(`Issues to create: ${plan.issuesToCreate.length}`, ...plan.issuesToCreate.map((item) => `  + ${item.slug}`));
	lines.push(`Issues to transform: ${plan.issuesToTransform.length}`, ...plan.issuesToTransform.map((item) => `  ~ #${item.number} -> ${item.slug}`));
	lines.push(`Active item field updates: ${plan.activeItemUpdates.length}`, ...plan.activeItemUpdates.map((item) => `  ~ ${item.slug}: ${Object.entries(item.set).map(([name, value]) => `${name}=${value}`).join(", ")}`));
	lines.push(`Legacy items to archive: ${plan.itemsToArchive.length}`, ...plan.itemsToArchive.map((item) => `  - #${item.number}`));
	lines.push(`Total operations: ${plan.operationCount}`);
	return lines.join("\n");
}

async function main(argv = process.argv.slice(2)) {
	const { projectNumber, mode } = parseRolloutArgs(argv);
	const manifest = JSON.parse(await readFile(new URL("./fixtures/roadmap-v3-manifest.json", import.meta.url), "utf8"));
	const inventory = await fetchProjectInventory(projectNumber);
	if (mode === "publish") {
		console.log(formatPlan(buildPublishPlan(inventory, manifest), mode));
		await publishRollout(projectNumber, manifest);
		return;
	}
	const plan = buildRolloutPlan(inventory, manifest, await listIssues());
	console.log(formatPlan(plan, mode));
	if (mode === "apply") await applyRollout(projectNumber, manifest);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
