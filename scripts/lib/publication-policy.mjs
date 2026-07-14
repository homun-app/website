const PUBLICATION_STATUSES = new Set(["draft", "review", "published", "archived"]);

function cloneCapabilities(capabilities) {
	return [...capabilities];
}

function cloneApprovedRecord(record) {
	return {
		...record,
		capabilities: cloneCapabilities(record.capabilities),
	};
}

function publicRecord(candidate) {
	return {
		slug: candidate.slug,
		title: candidate.title,
		status: candidate.status,
		area: candidate.area,
		description: candidate.description,
		capabilities: cloneCapabilities(candidate.capabilities),
		featured: candidate.featured,
		progress: candidate.progress,
		targetRelease: candidate.targetRelease,
		publicUpdate: candidate.publicUpdate,
		publicUpdateDate: candidate.publicUpdateDate,
		voting: candidate.voting,
		order: candidate.order,
		githubUrl: candidate.githubUrl,
		issueNumber: candidate.issueNumber,
		votes: candidate.votes,
		underReview: false,
	};
}

function byOrderThenSlug(left, right) {
	if (left.order !== right.order) return left.order - right.order;
	if (left.slug < right.slug) return -1;
	if (left.slug > right.slug) return 1;
	return 0;
}

export function assertNoPublishedDraftRegression(previous, candidates) {
	const previouslyPublishedSlugs = new Set(previous.items.map(({ slug }) => slug));
	for (const candidate of candidates) {
		if (
			candidate.publicationStatus === "draft"
			&& previouslyPublishedSlugs.has(candidate.slug)
		) {
			throw new Error(`Published roadmap item cannot return to Draft: ${candidate.slug}`);
		}
	}
}

export function applyPublicationPolicy(previous, candidates) {
	const previousBySlug = new Map(previous.items.map((item) => [item.slug, item]));
	const candidatesBySlug = new Map();

	for (const candidate of candidates) {
		if (candidatesBySlug.has(candidate.slug)) {
			throw new Error(`Duplicate roadmap candidate slug: ${candidate.slug}`);
		}
		if (!PUBLICATION_STATUSES.has(candidate.publicationStatus)) {
			throw new Error(`Unknown publication status: ${candidate.publicationStatus}`);
		}
		candidatesBySlug.set(candidate.slug, candidate);
	}
	assertNoPublishedDraftRegression(previous, candidates);

	for (const item of previous.items) {
		if (!candidatesBySlug.has(item.slug)) {
			throw new Error(`Roadmap item missing from Project source: ${item.slug}`);
		}
	}

	const items = [];

	for (const candidate of candidates) {
		const approved = previousBySlug.get(candidate.slug);
		switch (candidate.publicationStatus) {
			case "draft":
				break;
			case "review":
				if (approved) {
					items.push({ ...cloneApprovedRecord(approved), underReview: true });
				}
				break;
			case "published":
				items.push(publicRecord(candidate));
				break;
			case "archived":
				break;
		}
	}

	items.sort(byOrderThenSlug);
	return {
		schemaVersion: 2,
		contentUpdatedAt: previous.contentUpdatedAt,
		items,
	};
}
