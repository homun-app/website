const EXPECTED_STRATEGIC_COUNT = 8;
const EXPECTED_WORKFLOW_COUNT = 5;

function publicRecord(candidate) {
	const { publicationStatus, updatedAt, ...record } = structuredClone(candidate);
	return { ...record, underReview: false };
}

export function upgradePublishedRoadmap(previous, candidates, manifest) {
	if (previous?.schemaVersion !== 2 || !Array.isArray(previous.items)) {
		throw new Error("Roadmap schema upgrade requires a version 2 public snapshot");
	}
	if (manifest?.schemaVersion !== 3 || !Array.isArray(manifest.items)) {
		throw new Error("Roadmap schema upgrade requires the version 3 manifest");
	}
	const expectedSlugs = new Set(manifest.items.map(({ slug }) => slug));
	const candidatesBySlug = new Map();
	for (const candidate of candidates) {
		if (candidatesBySlug.has(candidate.slug)) {
			throw new Error(`Duplicate roadmap v3 candidate: ${candidate.slug}`);
		}
		candidatesBySlug.set(candidate.slug, candidate);
	}
	for (const slug of expectedSlugs) {
		if (!candidatesBySlug.has(slug)) throw new Error(`Missing roadmap v3 candidate: ${slug}`);
	}
	for (const candidate of candidates) {
		if (!expectedSlugs.has(candidate.slug) && candidate.publicationStatus === "published") {
			throw new Error(`Unexpected Published roadmap v3 candidate: ${candidate.slug}`);
		}
	}
	const active = candidates.filter(({ slug }) => expectedSlugs.has(slug));
	if (active.some(({ publicationStatus }) => publicationStatus !== "published")) {
		throw new Error("All roadmap v3 candidates must be Published during schema upgrade");
	}
	const items = active.map(publicRecord).sort(
		(left, right) => left.order - right.order || left.slug.localeCompare(right.slug),
	);
	if (items.filter(({ itemType }) => itemType === "strategic_program").length !== EXPECTED_STRATEGIC_COUNT) {
		throw new Error(`Roadmap v3 upgrade requires ${EXPECTED_STRATEGIC_COUNT} strategic programs`);
	}
	if (items.filter(({ itemType }) => itemType === "workflow_idea").length !== EXPECTED_WORKFLOW_COUNT) {
		throw new Error(`Roadmap v3 upgrade requires ${EXPECTED_WORKFLOW_COUNT} workflow ideas`);
	}
	return {
		schemaVersion: 3,
		contentUpdatedAt: previous.contentUpdatedAt,
		items,
	};
}
