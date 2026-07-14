import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
	normalizeProject,
	normalizeReleases,
	validateSnapshot,
} from "./lib/github-product-data.mjs";

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

export async function fetchProductData(config, fetchImpl = fetch) {
	const syncedAt = new Date().toISOString();
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

export async function writeSnapshots(roadmap, releases, paths = {}) {
	validateSnapshot(roadmap, releases);
	const roadmapPath = resolve(paths.roadmapPath ?? "src/data/roadmap.json");
	const releasesPath = resolve(paths.releasesPath ?? "src/data/releases.json");
	await mkdir(dirname(roadmapPath), { recursive: true });
	await mkdir(dirname(releasesPath), { recursive: true });
	const nonce = `${process.pid}-${Date.now()}`;
	const roadmapTemp = `${roadmapPath}.${nonce}.tmp`;
	const releasesTemp = `${releasesPath}.${nonce}.tmp`;
	try {
		await writeFile(roadmapTemp, `${JSON.stringify(roadmap, null, 2)}\n`);
		await writeFile(releasesTemp, `${JSON.stringify(releases, null, 2)}\n`);
		await rename(roadmapTemp, roadmapPath);
		await rename(releasesTemp, releasesPath);
	} finally {
		await Promise.all([
			rm(roadmapTemp, { force: true }),
			rm(releasesTemp, { force: true }),
		]);
	}
}

export async function syncProductData(env = process.env, fetchImpl = fetch, paths) {
	const config = readConfig(env);
	const snapshots = await fetchProductData(config, fetchImpl);
	await writeSnapshots(snapshots.roadmap, snapshots.releases, paths);
	return snapshots;
}

export function formatSyncSummary(snapshots) {
	return `Synced ${snapshots.roadmap.candidates.length} roadmap candidates and ${snapshots.releases.items.length} releases`;
}

const isCli = process.argv[1]
	&& import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
	try {
		const snapshots = await syncProductData();
		console.log(formatSyncSummary(snapshots));
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
