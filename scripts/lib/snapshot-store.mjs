import {
	readFile,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { validateSnapshot } from "./github-product-data.mjs";

const OPERATIONAL_METADATA = new Set([
	"checkedAt",
	"fetchedAt",
	"syncedAt",
	"contentUpdatedAt",
]);

function transactionPaths(paths = {}) {
	const roadmapPath = resolve(paths.roadmapPath ?? "src/data/roadmap.json");
	const releasesPath = resolve(paths.releasesPath ?? "src/data/releases.json");
	const journalPath = resolve(
		paths.transactionPath
			?? join(dirname(roadmapPath), ".product-data-transaction.json"),
	);
	return {
		journalPath,
		journalTempPath: `${journalPath}.tmp`,
		roadmap: {
			targetPath: roadmapPath,
			tempPath: `${roadmapPath}.product-data.tmp`,
			backupPath: `${roadmapPath}.product-data.bak`,
		},
		releases: {
			targetPath: releasesPath,
			tempPath: `${releasesPath}.product-data.tmp`,
			backupPath: `${releasesPath}.product-data.bak`,
		},
	};
}

// Snapshot targets are versioned last-known-good files; callers must never synthesize them.
async function readRequiredTarget(ops, path, encoding) {
	try {
		return await ops.readFile(path, encoding);
	} catch (error) {
		if (error?.code === "ENOENT") {
			const missing = new Error(`Snapshot target missing: ${path}`);
			missing.code = "SNAPSHOT_TARGET_MISSING";
			throw missing;
		}
		throw error;
	}
}

export async function readSnapshotPair(paths = {}, { fileOps = {} } = {}) {
	const ops = { readFile, ...fileOps };
	const transaction = transactionPaths(paths);
	const [roadmap, releases] = await Promise.all([
		readRequiredTarget(ops, transaction.roadmap.targetPath, "utf8").then(JSON.parse),
		readRequiredTarget(ops, transaction.releases.targetPath, "utf8").then(JSON.parse),
	]);
	return { roadmap, releases };
}

function journalRecord(transaction) {
	return {
		schemaVersion: 1,
		roadmap: transaction.roadmap,
		releases: transaction.releases,
	};
}

function assertExpectedJournal(record, expected) {
	const expectedRecord = journalRecord(expected);
	if (
		record?.schemaVersion !== 1
		|| JSON.stringify(record) !== JSON.stringify(expectedRecord)
	) {
		throw new Error(`Invalid snapshot transaction journal: ${expected.journalPath}`);
	}
}

export async function recoverSnapshotPair(paths = {}, { fileOps = {} } = {}) {
	const ops = { readFile, rename, rm, writeFile, ...fileOps };
	const transaction = transactionPaths(paths);
	let record;
	try {
		record = JSON.parse(await ops.readFile(transaction.journalPath, "utf8"));
	} catch (error) {
		if (error?.code === "ENOENT") return { status: "NO_RECOVERY" };
		throw error;
	}
	assertExpectedJournal(record, transaction);
	const [roadmapBackup, releasesBackup] = await Promise.all([
		ops.readFile(transaction.roadmap.backupPath),
		ops.readFile(transaction.releases.backupPath),
	]);
	const roadmapRecovery = `${transaction.roadmap.targetPath}.product-data.recovery.tmp`;
	const releasesRecovery = `${transaction.releases.targetPath}.product-data.recovery.tmp`;
	await Promise.all([
		ops.writeFile(roadmapRecovery, roadmapBackup),
		ops.writeFile(releasesRecovery, releasesBackup),
	]);
	await ops.rename(roadmapRecovery, transaction.roadmap.targetPath);
	await ops.rename(releasesRecovery, transaction.releases.targetPath);
	await ops.rm(transaction.journalPath, { force: true });
	await Promise.all([
		ops.rm(transaction.roadmap.tempPath, { force: true }),
		ops.rm(transaction.releases.tempPath, { force: true }),
		ops.rm(transaction.roadmap.backupPath, { force: true }),
		ops.rm(transaction.releases.backupPath, { force: true }),
		ops.rm(transaction.journalTempPath, { force: true }),
		ops.rm(roadmapRecovery, { force: true }),
		ops.rm(releasesRecovery, { force: true }),
	]);
	return { status: "RECOVERED" };
}

function canonicalSnapshotValue(value, stripOperationalMetadata = false) {
	if (Array.isArray(value)) return value.map((item) => canonicalSnapshotValue(item));
	if (value === null || typeof value !== "object") return value;
	return Object.fromEntries(
		Object.keys(value)
			.filter(
				(key) => !stripOperationalMetadata || !OPERATIONAL_METADATA.has(key),
			)
			.sort()
			.map((key) => [key, canonicalSnapshotValue(value[key])]),
	);
}

export function semanticSnapshot(snapshot) {
	const isPair = snapshot !== null
		&& typeof snapshot === "object"
		&& !Array.isArray(snapshot)
		&& Object.hasOwn(snapshot, "roadmap")
		&& Object.hasOwn(snapshot, "releases");
	if (!isPair) return canonicalSnapshotValue(snapshot, true);
	return Object.fromEntries(
		Object.keys(snapshot)
			.sort()
			.map((key) => [
				key,
				canonicalSnapshotValue(
					snapshot[key],
					key === "roadmap" || key === "releases",
				),
			]),
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

async function assertSnapshotTargetsUnchanged(ops, transaction, current) {
	let diskPair;
	try {
		const [roadmap, releases] = await Promise.all([
			readRequiredTarget(ops, transaction.roadmap.targetPath, "utf8").then(JSON.parse),
			readRequiredTarget(ops, transaction.releases.targetPath, "utf8").then(JSON.parse),
		]);
		diskPair = { roadmap, releases };
	} catch (error) {
		if (error?.code === "SNAPSHOT_TARGET_MISSING") throw error;
		throw new Error("Snapshot changed since it was read");
	}
	if (hasSemanticChanges(current, diskPair)) {
		throw new Error("Snapshot changed since it was read");
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

	const ops = { readFile, rename, rm, writeFile, ...fileOps };
	const transaction = transactionPaths(paths);
	const [originalRoadmap, originalReleases] = await Promise.all([
		readRequiredTarget(ops, transaction.roadmap.targetPath),
		readRequiredTarget(ops, transaction.releases.targetPath),
	]);
	let journalActive = false;
	try {
		await Promise.all([
			ops.writeFile(
				transaction.roadmap.tempPath,
				`${JSON.stringify(candidate.roadmap, null, 2)}\n`,
			),
			ops.writeFile(
				transaction.releases.tempPath,
				`${JSON.stringify(candidate.releases, null, 2)}\n`,
			),
		]);
		await Promise.all([
			ops.writeFile(transaction.roadmap.backupPath, originalRoadmap),
			ops.writeFile(transaction.releases.backupPath, originalReleases),
		]);
		await ops.writeFile(
			transaction.journalTempPath,
			`${JSON.stringify(journalRecord(transaction), null, 2)}\n`,
		);
		await assertSnapshotTargetsUnchanged(ops, transaction, current);
		await ops.rename(transaction.journalTempPath, transaction.journalPath);
		journalActive = true;
		await ops.rename(transaction.roadmap.tempPath, transaction.roadmap.targetPath);
		await ops.rename(transaction.releases.tempPath, transaction.releases.targetPath);
		await ops.rm(transaction.journalPath, { force: true });
		journalActive = false;
		return { status: "WROTE_CHANGE" };
	} catch (error) {
		if (journalActive) {
			try {
				await recoverSnapshotPair(paths, { fileOps: ops });
				journalActive = false;
			} catch (rollbackError) {
				throw new AggregateError(
					[error, rollbackError],
					"Snapshot replacement failed and rollback was incomplete",
				);
			}
		}
		throw error;
	} finally {
		if (!journalActive) {
			await Promise.allSettled([
				ops.rm(transaction.roadmap.tempPath, { force: true }),
				ops.rm(transaction.releases.tempPath, { force: true }),
				ops.rm(transaction.roadmap.backupPath, { force: true }),
				ops.rm(transaction.releases.backupPath, { force: true }),
				ops.rm(transaction.journalTempPath, { force: true }),
			]);
		}
	}
}
