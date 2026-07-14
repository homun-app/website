import { assertNoPublishedDraftRegression } from "./publication-policy.mjs";

export function applyReleasePublicationPolicy(
	previousReleases,
	rawReleases,
	candidates,
	previousRoadmap,
) {
	const candidatesBySlug = new Map();
	for (const candidate of candidates) {
		if (candidatesBySlug.has(candidate.slug)) {
			throw new Error(`Duplicate roadmap candidate slug: ${candidate.slug}`);
		}
		candidatesBySlug.set(candidate.slug, candidate);
	}
	assertNoPublishedDraftRegression(previousRoadmap, candidates);
	const previouslyPublicSlugs = new Set(
		previousRoadmap.items.map(({ slug }) => slug),
	);
	const previousLinksByVersion = new Map(
		previousReleases.items.map((release) => [
			release.version,
			new Set(release.projectSlugs),
		]),
	);
	const warnings = [];
	const warningKeys = new Set();

	const items = rawReleases.items.map((rawRelease) => {
		const previousLinks = previousLinksByVersion.get(rawRelease.version) ?? new Set();
		const projectSlugs = [];

		for (const slug of rawRelease.projectSlugs) {
			const candidate = candidatesBySlug.get(slug);
			if (!candidate) {
				projectSlugs.push(slug);
				const warning = `Unknown roadmap slug in release ${rawRelease.version}: ${slug}`;
				if (!warningKeys.has(warning)) {
					warningKeys.add(warning);
					warnings.push(warning);
				}
				continue;
			}
			if (candidate.publicationStatus === "published") {
				projectSlugs.push(slug);
				continue;
			}
			if (candidate.publicationStatus === "archived") {
				projectSlugs.push(slug);
			}
		}

		for (const [slug, candidate] of candidatesBySlug) {
			const wasApproved = previouslyPublicSlugs.has(slug);
			const hadPreviousLink = previousLinks.has(slug);
			const preservesApprovedLinks = wasApproved
				&& candidate.publicationStatus === "review";
			const preservesArchivedHistory = candidate.publicationStatus === "archived";
			if (
				hadPreviousLink
				&& (preservesApprovedLinks || preservesArchivedHistory)
				&& !projectSlugs.includes(slug)
			) {
				projectSlugs.push(slug);
			}
		}

		projectSlugs.sort();
		return { ...structuredClone(rawRelease), projectSlugs };
	});

	return {
		releases: {
			schemaVersion: 2,
			contentUpdatedAt: previousReleases.contentUpdatedAt,
			items,
		},
		warnings,
	};
}
