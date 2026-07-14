import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
	normalizeProject,
	normalizeReleases,
	validateSnapshot,
} from "./lib/github-product-data.mjs";
import { applyPublicationPolicy } from "./lib/publication-policy.mjs";
import {
	assertSafeReplacement,
	hasSemanticChanges,
	persistSnapshotPair,
} from "./lib/snapshot-store.mjs";

const PROJECT_QUERY = `
query HomunPublicRoadmap($owner: String!, $number: Int!) {
  organization(login: $owner) {
    projectV2(number: $number) {
      items(first: 100) {
        nodes {
          fieldValues(first: 30) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
              ... on ProjectV2ItemFieldTextValue {
                text
                field { ... on ProjectV2Field { name } }
              }
              ... on ProjectV2ItemFieldNumberValue {
                number
                field { ... on ProjectV2Field { name } }
              }
              ... on ProjectV2ItemFieldDateValue {
                date
                field { ... on ProjectV2Field { name } }
              }
            }
          }
          content {
            ... on Issue {
              number
              title
              body
              url
              updatedAt
              reactions(content: THUMBS_UP) { totalCount }
              labels(first: 20) { nodes { name } }
            }
          }
        }
      }
    }
  }
}`;

export function readConfig(env = process.env) {
	const token = env.HOMUN_GITHUB_TOKEN ?? env.GITHUB_TOKEN;
	if (!token) throw new Error("Missing HOMUN_GITHUB_TOKEN");
	const owner = env.HOMUN_PROJECT_OWNER ?? "homun-app";
	const projectNumber = Number(env.HOMUN_PROJECT_NUMBER);
	if (!Number.isInteger(projectNumber) || projectNumber < 1) {
		throw new Error("Missing HOMUN_PROJECT_NUMBER");
	}
	return {
		token,
		owner,
		projectNumber,
		releasesRepo: env.HOMUN_RELEASES_REPO ?? "homun-app/homun-releases",
	};
}

export function parseSyncArgs(args = []) {
	const supported = new Set(["--dry-run", "--write", "--allow-empty"]);
	for (const arg of args) {
		if (!supported.has(arg)) throw new Error(`Unknown option: ${arg}`);
	}
	if (new Set(args).size !== args.length) {
		const duplicate = args.find((arg, index) => args.indexOf(arg) !== index);
		throw new Error(`Duplicate option: ${duplicate}`);
	}
	const dryRun = args.includes("--dry-run");
	const write = args.includes("--write");
	const allowEmpty = args.includes("--allow-empty");
	if (dryRun && write) throw new Error("Cannot combine --dry-run and --write");
	if (allowEmpty && !write) throw new Error("--allow-empty requires --write");
	return { mode: write ? "write" : "dry-run", allowEmpty };
}

async function githubRequest(url, token, init = {}, fetchImpl = fetch) {
	const response = await fetchImpl(url, {
		...init,
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${token}`,
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "homun-website-product-sync",
			...init.headers,
		},
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`GitHub request failed (${response.status}): ${message.slice(0, 300)}`);
	}
	return response.json();
}

export async function fetchProductData(
	config,
	fetchImpl = fetch,
	clock = () => new Date().toISOString(),
) {
	const syncedAt = clock();
	const projectPayload = await githubRequest(
		"https://api.github.com/graphql",
		config.token,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: PROJECT_QUERY,
				variables: { owner: config.owner, number: config.projectNumber },
			}),
		},
		fetchImpl,
	);
	if (projectPayload.errors?.length) {
		throw new Error(`GitHub Project query failed: ${projectPayload.errors[0].message}`);
	}
	const organization = projectPayload?.data?.organization;
	if (organization == null) {
		throw new Error(`GitHub organization not found: ${config.owner}`);
	}
	const project = organization.projectV2;
	if (project == null) {
		throw new Error(`GitHub Project ${config.projectNumber} not found`);
	}
	if (!Array.isArray(project.items?.nodes)) {
		throw new Error("GitHub Project response is missing items.nodes");
	}
	projectPayload.syncedAt = syncedAt;
	const releasePayload = await githubRequest(
		`https://api.github.com/repos/${config.releasesRepo}/releases?per_page=100`,
		config.token,
		{},
		fetchImpl,
	);
	const roadmap = normalizeProject(projectPayload);
	const releases = normalizeReleases(releasePayload, roadmap.candidates, syncedAt);
	validateSnapshot(roadmap, releases);
	return { roadmap, releases };
}

function resolvedSnapshotPaths(paths = {}) {
	return {
		roadmapPath: resolve(paths.roadmapPath ?? "src/data/roadmap.json"),
		releasesPath: resolve(paths.releasesPath ?? "src/data/releases.json"),
	};
}

async function readSnapshotPair(paths = {}) {
	const resolved = resolvedSnapshotPaths(paths);
	const [roadmap, releases] = await Promise.all([
		readFile(resolved.roadmapPath, "utf8").then(JSON.parse),
		readFile(resolved.releasesPath, "utf8").then(JSON.parse),
	]);
	return { roadmap, releases };
}

export async function writeSnapshots(roadmap, releases, paths = {}, options = {}) {
	validateSnapshot(roadmap, releases);
	const current = await readSnapshotPair(paths);
	return persistSnapshotPair(current, { roadmap, releases }, paths, options);
}

export async function syncProductData({
	env = process.env,
	fetchImpl = fetch,
	paths = {},
	clock = () => new Date().toISOString(),
	mode = "dry-run",
	allowEmpty = false,
} = {}) {
	if (!new Set(["dry-run", "write"]).has(mode)) {
		throw new Error(`Unknown sync mode: ${mode}`);
	}
	if (allowEmpty && mode !== "write") {
		throw new Error("allowEmpty requires write mode");
	}
	const current = await readSnapshotPair(paths);
	if (current.roadmap?.schemaVersion !== 2 || !Array.isArray(current.roadmap.items)) {
		throw new Error("Previous roadmap must use schemaVersion 2 with public items");
	}
	validateSnapshot(current.roadmap, current.releases);

	const config = readConfig(env);
	const syncedAt = clock();
	const raw = await fetchProductData(config, fetchImpl, () => syncedAt);
	const publishedRoadmap = raw.roadmap.candidates.length === 0
		? {
			schemaVersion: 2,
			contentUpdatedAt: current.roadmap.contentUpdatedAt,
			items: [],
		}
		: applyPublicationPolicy(current.roadmap, raw.roadmap.candidates);
	const candidate = {
		roadmap: publishedRoadmap,
		releases: raw.releases,
	};
	validateSnapshot(candidate.roadmap, candidate.releases);
	assertSafeReplacement(current, candidate, {
		allowEmpty: mode === "write" && allowEmpty,
	});
	const changed = hasSemanticChanges(current, candidate);
	if (!changed) {
		return {
			status: "NO_CHANGE",
			snapshots: current,
			roadmapCount: current.roadmap.items.length,
			releaseCount: current.releases.items.length,
		};
	}
	candidate.roadmap.contentUpdatedAt = syncedAt;
	if (mode === "dry-run") {
		return {
			status: "WOULD_CHANGE",
			snapshots: candidate,
			roadmapCount: candidate.roadmap.items.length,
			releaseCount: candidate.releases.items.length,
		};
	}
	const persisted = await persistSnapshotPair(current, candidate, paths, { allowEmpty });
	return {
		status: persisted.status,
		snapshots: candidate,
		roadmapCount: candidate.roadmap.items.length,
		releaseCount: candidate.releases.items.length,
	};
}

export function formatSyncSummary(result) {
	if (result?.status) {
		return `${result.status} ${result.roadmapCount} roadmap items and ${result.releaseCount} releases`;
	}
	return `Synced ${result.roadmap.candidates.length} roadmap candidates and ${result.releases.items.length} releases`;
}

const isCli = process.argv[1]
	&& import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
	try {
		const options = parseSyncArgs(process.argv.slice(2));
		const result = await syncProductData(options);
		console.log(formatSyncSummary(result));
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
