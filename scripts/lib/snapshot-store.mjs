import {
	mkdir,
	readFile,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateSnapshot } from "./github-product-data.mjs";

const OPERATIONAL_METADATA = new Set([
	"checkedAt",
	"fetchedAt",
	"syncedAt",
	"contentUpdatedAt",
]);

export function semanticSnapshot(snapshot) {
	if (Array.isArray(snapshot)) return snapshot.map(semanticSnapshot);
	if (snapshot === null || typeof snapshot !== "object") return snapshot;
	return Object.fromEntries(
		Object.keys(snapshot)
			.filter((key) => !OPERATIONAL_METADATA.has(key))
			.sort()
			.map((key) => [key, semanticSnapshot(snapshot[key])]),
	);
}

export function hasSemanticChanges(current, candidate) {
	return JSON.stringify(semanticSnapshot(current))
		!== JSON.stringify(semanticSnapshot(candidate));
}

export function assertSafeReplacement(
	current,
	candidate,
	{ allowEmpty = false } = {},
) {
	const currentCount = current.roadmap?.items?.length ?? 0;
	const candidateCount = candidate.roadmap?.items?.length ?? 0;
	if (!allowEmpty && currentCount > 0 && candidateCount === 0) {
		throw new Error(`Refusing to replace ${currentCount} roadmap items with zero`);
	}
}

export async function persistSnapshotPair(
	current,
	candidate,
	paths = {},
	{ allowEmpty = false, fileOps = {} } = {},
) {
	validateSnapshot(candidate.roadmap, candidate.releases);
	assertSafeReplacement(current, candidate, { allowEmpty });
	if (!hasSemanticChanges(current, candidate)) return { status: "NO_CHANGE" };

	const ops = { mkdir, readFile, rename, rm, writeFile, ...fileOps };
	const roadmapPath = resolve(paths.roadmapPath ?? "src/data/roadmap.json");
	const releasesPath = resolve(paths.releasesPath ?? "src/data/releases.json");
	await Promise.all([
		ops.mkdir(dirname(roadmapPath), { recursive: true }),
		ops.mkdir(dirname(releasesPath), { recursive: true }),
	]);
	const [originalRoadmap, originalReleases] = await Promise.all([
		ops.readFile(roadmapPath),
		ops.readFile(releasesPath),
	]);
	const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	const roadmapTemp = `${roadmapPath}.${nonce}.tmp`;
	const releasesTemp = `${releasesPath}.${nonce}.tmp`;
	const roadmapBackup = `${roadmapPath}.${nonce}.bak`;
	const releasesBackup = `${releasesPath}.${nonce}.bak`;
	let backupsReady = false;
	let replacementStarted = false;
	try {
		await Promise.all([
			ops.writeFile(roadmapTemp, `${JSON.stringify(candidate.roadmap, null, 2)}\n`),
			ops.writeFile(releasesTemp, `${JSON.stringify(candidate.releases, null, 2)}\n`),
		]);
		await Promise.all([
			ops.writeFile(roadmapBackup, originalRoadmap),
			ops.writeFile(releasesBackup, originalReleases),
		]);
		backupsReady = true;
		replacementStarted = true;
		await ops.rename(roadmapTemp, roadmapPath);
		await ops.rename(releasesTemp, releasesPath);
		return { status: "WROTE_CHANGE" };
	} catch (error) {
		if (backupsReady && replacementStarted) {
			const rollback = await Promise.allSettled([
				ops.rename(roadmapBackup, roadmapPath),
				ops.rename(releasesBackup, releasesPath),
			]);
			const rollbackErrors = rollback
				.filter(({ status }) => status === "rejected")
				.map(({ reason }) => reason);
			if (rollbackErrors.length > 0) {
				throw new AggregateError(
					[error, ...rollbackErrors],
					"Snapshot replacement failed and rollback was incomplete",
				);
			}
		}
		throw error;
	} finally {
		await Promise.allSettled([
			ops.rm(roadmapTemp, { force: true }),
			ops.rm(releasesTemp, { force: true }),
			ops.rm(roadmapBackup, { force: true }),
			ops.rm(releasesBackup, { force: true }),
		]);
	}
}
