export const PUBLIC_STATUSES = new Map([
	["Ideas", "ideas"],
	["Next", "next"],
	["Building", "building"],
	["Shipped", "shipped"],
]);

export const PUBLICATION_STATUSES = new Map([
	["Draft", "draft"],
	["Review", "review"],
	["Published", "published"],
	["Archived", "archived"],
]);

export const VOTING_STATES = new Map([
	["Open", "open"],
	["Closed", "closed"],
]);

const ROADMAP_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isIsoDate(value) {
	if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year
		&& date.getUTCMonth() === month - 1
		&& date.getUTCDate() === day;
}

function isIsoTimestamp(value) {
	return typeof value === "string"
		&& ISO_TIMESTAMP.test(value)
		&& isIsoDate(value.slice(0, 10))
		&& Number.isFinite(Date.parse(value));
}

function compareText(left, right) {
	if (left < right) return -1;
	if (left > right) return 1;
	return 0;
}

function fieldMap(node) {
	return new Map(
		(node?.fieldValues?.nodes ?? [])
			.filter((value) => value?.field?.name)
			.map((value) => [
				value.field.name,
				value.name ?? value.text ?? value.number ?? value.date ?? null,
			]),
	);
}

function firstParagraph(markdown = "") {
	return markdown
		.split(/^##\s+/m)[0]
		.replace(/\s+/g, " ")
		.trim();
}

function markdownSections(markdown = "") {
	const sections = new Map();
	const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const start = match.index + match[0].length;
		const end = matches[index + 1]?.index ?? markdown.length;
		sections.set(match[1].trim().toLowerCase(), markdown.slice(start, end).trim());
	}
	return sections;
}

function listItems(value = "") {
	return value
		.split("\n")
		.map((line) => line.match(/^[-*]\s+(.+)$/)?.[1]?.trim())
		.filter(Boolean);
}

function optionalText(fields, fieldName, slug, errorLabel) {
	if (!fields.has(fieldName) || fields.get(fieldName) == null) return null;
	const value = fields.get(fieldName);
	if (typeof value !== "string") throw new Error(`Invalid ${errorLabel}: ${slug}`);
	return value.trim() || null;
}

function normalizeProjectNode(node) {
	const fields = fieldMap(node);
	const content = node?.content;
	if (!content?.title || !content?.url) throw new Error("Missing roadmap content");
	const publicStatus = fields.get("Public status") ?? "";
	const status = PUBLIC_STATUSES.get(publicStatus);
	if (!status) throw new Error(`Unknown public status: ${publicStatus || "(empty)"}`);
	const sourcePublicationStatus = fields.get("Publication status") ?? "";
	const publicationStatus = PUBLICATION_STATUSES.get(sourcePublicationStatus);
	if (!publicationStatus) {
		throw new Error(`Unknown publication status: ${sourcePublicationStatus || "(empty)"}`);
	}
	const sourceVoting = fields.get("Voting") ?? "";
	const voting = VOTING_STATES.get(sourceVoting);
	if (!voting) throw new Error(`Unknown voting state: ${sourceVoting || "(empty)"}`);
	const sourceSlug = fields.get("Slug");
	if (sourceSlug != null && typeof sourceSlug !== "string") {
		throw new Error(`Invalid roadmap slug: ${sourceSlug}`);
	}
	const slug = (sourceSlug ?? "").trim();
	if (!slug) throw new Error(`Missing roadmap slug: ${content.title}`);
	if (!ROADMAP_SLUG.test(slug)) throw new Error(`Invalid roadmap slug: ${slug}`);
	const order = fields.get("Order");
	if (!Number.isInteger(order)) throw new Error(`Invalid order: ${slug}`);
	if (!fields.has("Area") || fields.get("Area") == null || fields.get("Area") === "") {
		throw new Error(`Missing area: ${slug}`);
	}
	if (typeof fields.get("Area") !== "string") throw new Error(`Invalid area: ${slug}`);
	const area = fields.get("Area").trim();
	if (!area) throw new Error(`Missing area: ${slug}`);
	if (!fields.has("Featured")) throw new Error(`Missing featured: ${slug}`);
	const sourceFeatured = fields.get("Featured");
	if (sourceFeatured !== "Yes" && sourceFeatured !== "No") {
		throw new Error(`Invalid featured: ${slug}`);
	}
	const featured = sourceFeatured === "Yes";
	if (featured && status !== "building") {
		throw new Error(`Featured roadmap item must be Building: ${slug}`);
	}
	if (!fields.has("Progress") || fields.get("Progress") == null) {
		throw new Error(`Missing progress: ${slug}`);
	}
	const progress = fields.get("Progress");
	if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
		throw new Error(`Invalid progress: ${slug}`);
	}
	const targetRelease = optionalText(fields, "Target release", slug, "target release");
	const publicUpdate = optionalText(fields, "Public update", slug, "public update");
	const sourcePublicUpdateDate = fields.get("Public update date");
	let publicUpdateDate = null;
	if (sourcePublicUpdateDate != null) {
		if (
			typeof sourcePublicUpdateDate !== "string"
			|| !sourcePublicUpdateDate.trim()
			|| !isIsoDate(sourcePublicUpdateDate.trim())
		) {
			throw new Error(`Invalid public update date: ${slug}`);
		}
		publicUpdateDate = sourcePublicUpdateDate.trim();
	}
	if (publicUpdate && !publicUpdateDate) throw new Error(`Missing public update date: ${slug}`);
	if (!content.reactions || !Object.hasOwn(content.reactions, "totalCount")) {
		throw new Error(`Missing votes: ${slug}`);
	}
	const votes = content.reactions.totalCount;
	if (!Number.isInteger(votes) || votes < 0) throw new Error(`Invalid votes: ${slug}`);
	const body = content.body ?? "";
	const sections = markdownSections(body);
	return {
		slug,
		title: content.title,
		status,
		publicationStatus,
		area,
		description: firstParagraph(body),
		capabilities: listItems(sections.get("intended capabilities")),
		featured,
		progress,
		targetRelease,
		publicUpdate,
		publicUpdateDate,
		voting,
		order,
		updatedAt: content.updatedAt,
		githubUrl: content.url,
		issueNumber: content.number,
		votes,
	};
}

export function normalizeProject(payload) {
	const nodes = payload?.data?.organization?.projectV2?.items?.nodes ?? [];
	const candidates = nodes
		.map(normalizeProjectNode)
		.sort((a, b) => a.order - b.order || compareText(a.slug, b.slug));
	const slugs = new Set();
	for (const candidate of candidates) {
		if (slugs.has(candidate.slug)) throw new Error(`Duplicate roadmap slug: ${candidate.slug}`);
		slugs.add(candidate.slug);
	}
	return { schemaVersion: 2, fetchedAt: payload.syncedAt, candidates };
}

function platformsForAssets(assets = []) {
	const found = new Set();
	for (const asset of assets) {
		const name = asset.name.toLowerCase();
		if (name.endsWith(".deb") || name.endsWith(".appimage")) found.add("Linux");
		if (name.endsWith(".dmg") || (name.endsWith(".zip") && name.includes("arm64"))) found.add("macOS");
		if (name.endsWith(".exe")) found.add("Windows");
	}
	return ["Linux", "macOS", "Windows"].filter((platform) => found.has(platform));
}

function projectSlugsFromBody(body = "") {
	const match = String(body ?? "").match(/^Roadmap:\s*(.+)$/im);
	if (!match) return [];
	return match[1]
		.split(",")
		.map((slug) => slug.trim())
		.filter(Boolean)
		.sort(compareText);
}

function normalizeRelease(release) {
	const sections = markdownSections(release.body ?? "");
	return {
		version: release.tag_name,
		name: release.name || release.tag_name,
		publishedAt: release.published_at,
		githubUrl: release.html_url,
		highlights: listItems(sections.get("highlights")),
		improvements: listItems(sections.get("improvements")),
		fixes: listItems(sections.get("fixes")),
		platforms: platformsForAssets(release.assets),
		assets: (release.assets ?? [])
			.map((asset) => ({
				name: asset.name,
				downloadUrl: asset.browser_download_url,
			}))
			.sort(
				(a, b) => compareText(a.name, b.name)
					|| compareText(a.downloadUrl, b.downloadUrl),
			),
		projectSlugs: projectSlugsFromBody(release.body),
	};
}

export function normalizeReleases(payload, _roadmapCandidates, syncedAt = new Date().toISOString()) {
	const items = payload
		.filter((release) => !release.draft && !release.prerelease && release.published_at)
		.map(normalizeRelease)
		.sort(
			(a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
				|| compareText(a.version, b.version),
		);
	return { schemaVersion: 2, fetchedAt: syncedAt, items };
}

export function validateSnapshot(
	roadmap,
	releases,
	{ knownRoadmapSlugs = [] } = {},
) {
	const warnings = [];
	if (roadmap?.schemaVersion !== 2 || releases?.schemaVersion !== 2) {
		throw new Error("Unsupported product data schema");
	}
	const hasCandidates = Object.hasOwn(roadmap, "candidates");
	const hasItems = Object.hasOwn(roadmap, "items");
	if (
		hasCandidates === hasItems ||
		(hasCandidates && !Array.isArray(roadmap.candidates)) ||
		(hasItems && !Array.isArray(roadmap.items))
	) {
		throw new Error("Invalid roadmap snapshot shape");
	}
	const isRawRoadmap = hasCandidates;
	const isPublicRoadmap = hasItems;
	if (
		isRawRoadmap
		&& !isIsoTimestamp(roadmap.fetchedAt)
	) {
		throw new Error("Invalid raw roadmap fetchedAt");
	}
	if (isRawRoadmap && Object.hasOwn(roadmap, "contentUpdatedAt")) {
		throw new Error("Raw roadmap must not contain contentUpdatedAt");
	}
	if (
		isPublicRoadmap
		&& !isIsoTimestamp(roadmap.contentUpdatedAt)
	) {
		throw new Error("Invalid public roadmap contentUpdatedAt");
	}
	if (isPublicRoadmap && Object.hasOwn(roadmap, "fetchedAt")) {
		throw new Error("Public roadmap must not contain fetchedAt");
	}
	const expectedReleaseTimestamp = isRawRoadmap ? "fetchedAt" : "contentUpdatedAt";
	const unexpectedReleaseTimestamp = isRawRoadmap ? "contentUpdatedAt" : "fetchedAt";
	if (
		!Array.isArray(releases.items)
		|| !Object.hasOwn(releases, expectedReleaseTimestamp)
		|| !isIsoTimestamp(releases[expectedReleaseTimestamp])
		|| Object.hasOwn(releases, unexpectedReleaseTimestamp)
	) {
		throw new Error("Invalid releases snapshot shape");
	}
	const roadmapEntries = isRawRoadmap ? roadmap.candidates : roadmap.items;
	const slugs = new Set();
	let featured = 0;
	for (const item of roadmapEntries ?? []) {
		if (item.slug == null || item.slug === "") throw new Error("Missing roadmap slug");
		if (typeof item.slug !== "string") {
			throw new Error(`Invalid roadmap slug: ${item.slug}`);
		}
		if (!item.slug.trim()) throw new Error("Missing roadmap slug");
		if (!ROADMAP_SLUG.test(item.slug)) throw new Error(`Invalid roadmap slug: ${item.slug}`);
		if (slugs.has(item.slug)) throw new Error(`Duplicate roadmap slug: ${item.slug}`);
		slugs.add(item.slug);
		if (isRawRoadmap) {
				if (Object.hasOwn(item, "underReview")) {
					throw new Error(`Raw roadmap candidate must not contain underReview: ${item.slug}`);
				}
				if (!isIsoTimestamp(item.updatedAt)) {
					throw new Error(`Invalid roadmap updatedAt: ${item.slug}`);
				}
		}
		if (isPublicRoadmap) {
				for (const field of ["publicationStatus", "archiveReason", "projectItemId", "labels"]) {
					if (Object.hasOwn(item, field)) {
						throw new Error(`Public roadmap item must not contain ${field}: ${item.slug}`);
					}
				}
				if (Object.hasOwn(item, "updatedAt")) {
					throw new Error(`Public roadmap item must not contain updatedAt: ${item.slug}`);
				}
		}
		if (typeof item.title !== "string" || !item.title.trim()) {
			throw new Error(`Invalid roadmap title: ${item.slug}`);
		}
		if (typeof item.area !== "string" || !item.area.trim()) {
			throw new Error(`Invalid roadmap area: ${item.slug}`);
		}
		if (typeof item.description !== "string" || !item.description.trim()) {
			throw new Error(`Invalid roadmap description: ${item.slug}`);
		}
		if (typeof item.githubUrl !== "string" || !item.githubUrl.trim()) {
			throw new Error(`Invalid roadmap GitHub URL: ${item.slug}`);
		}
		if (
			!Array.isArray(item.capabilities)
			|| item.capabilities.some(
				(capability) => typeof capability !== "string" || !capability.trim(),
			)
		) {
			throw new Error(`Invalid capabilities: ${item.slug}`);
		}
		if (typeof item.featured !== "boolean") {
			throw new Error(`Invalid featured: ${item.slug}`);
		}
		if (!Number.isInteger(item.votes) || item.votes < 0) {
			throw new Error(`Invalid votes: ${item.slug}`);
		}
		if (
			item.issueNumber !== null
			&& (!Number.isInteger(item.issueNumber) || item.issueNumber < 1)
		) {
			throw new Error(`Invalid issue number: ${item.slug}`);
		}
		if (isPublicRoadmap) {
			for (const field of ["targetRelease", "publicUpdate", "publicUpdateDate"]) {
				if (!Object.hasOwn(item, field)) {
					throw new Error(`Missing ${field}: ${item.slug}`);
				}
			}
		}
		if (item.targetRelease !== null && typeof item.targetRelease !== "string") {
			throw new Error(`Invalid target release: ${item.slug}`);
		}
		if (item.publicUpdate !== null && typeof item.publicUpdate !== "string") {
			throw new Error(`Invalid public update: ${item.slug}`);
		}
		if (item.publicUpdateDate !== null && !isIsoDate(item.publicUpdateDate)) {
			throw new Error(`Invalid public update date: ${item.slug}`);
		}
		if (isPublicRoadmap && typeof item.underReview !== "boolean") {
			throw new Error(`Invalid underReview: ${item.slug}`);
		}
		if (![...PUBLIC_STATUSES.values()].includes(item.status)) {
			throw new Error(`Unknown public status: ${item.status}`);
		}
		if (item.featured && item.status !== "building") {
			throw new Error(`Featured roadmap item must be Building: ${item.slug}`);
		}
		if (
			isRawRoadmap
			&& ![...PUBLICATION_STATUSES.values()].includes(item.publicationStatus)
		) {
			throw new Error(`Unknown publication status: ${item.publicationStatus}`);
		}
		if (![...VOTING_STATES.values()].includes(item.voting)) {
			throw new Error(`Unknown voting state: ${item.voting}`);
		}
		if (!Number.isInteger(item.order)) throw new Error(`Invalid order: ${item.slug}`);
		if (item.publicUpdate && !item.publicUpdateDate) {
			throw new Error(`Missing public update date: ${item.slug}`);
		}
		if (!Number.isFinite(item.progress) || item.progress < 0 || item.progress > 100) {
			throw new Error(`Invalid progress: ${item.slug}`);
		}
		if (item.featured) featured += 1;
	}
	if (featured > 1) throw new Error("Multiple featured roadmap items");
	const versions = new Set();
	const publishedReleasesByRoadmapSlug = new Map();
	const knownSlugs = new Set([...slugs, ...knownRoadmapSlugs]);
	for (const release of releases.items) {
		if (!release || typeof release !== "object" || Array.isArray(release)) {
			throw new Error("Invalid release item");
		}
		if (typeof release.version !== "string" || !release.version.trim()) {
			throw new Error("Invalid release version");
		}
		if (typeof release.name !== "string" || !release.name.trim()) {
			throw new Error(`Invalid release name: ${release.version}`);
		}
		if (typeof release.githubUrl !== "string" || !release.githubUrl.trim()) {
			throw new Error(`Invalid release GitHub URL: ${release.version}`);
		}
		if (!isIsoTimestamp(release.publishedAt)) {
			throw new Error(`Invalid release publishedAt: ${release.version}`);
		}
		for (const field of ["highlights", "improvements", "fixes", "platforms"]) {
			if (
				!Array.isArray(release[field])
				|| release[field].some(
					(value) => typeof value !== "string" || !value.trim(),
				)
			) {
				throw new Error(`Invalid release ${field}: ${release.version}`);
			}
		}
		if (!Array.isArray(release.assets)) {
			throw new Error(`Invalid release assets: ${release.version}`);
		}
		for (const asset of release.assets) {
			if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
				throw new Error(`Invalid release asset: ${release.version}`);
			}
			if (typeof asset.name !== "string" || !asset.name.trim()) {
				throw new Error(`Invalid release asset name: ${release.version}`);
			}
			if (typeof asset.downloadUrl !== "string" || !asset.downloadUrl.trim()) {
				throw new Error(`Invalid release asset download URL: ${release.version}`);
			}
		}
		if (
			!Array.isArray(release.projectSlugs) ||
			release.projectSlugs.some(
				(projectSlug) =>
					typeof projectSlug !== "string" || !ROADMAP_SLUG.test(projectSlug),
			)
		) {
			throw new Error(`Invalid project slugs in release ${release.version}`);
		}
		if (versions.has(release.version)) throw new Error(`Duplicate release: ${release.version}`);
		versions.add(release.version);
		const releaseSlugs = new Set();
		const projectSlugs = release.projectSlugs ?? [];
		for (const projectSlug of projectSlugs) {
			if (releaseSlugs.has(projectSlug)) {
				throw new Error(
					`Duplicate roadmap slug in release ${release.version}: ${projectSlug}`,
				);
			}
			releaseSlugs.add(projectSlug);
		}
		if (!isPublicRoadmap) continue;
		for (const projectSlug of projectSlugs) {
			if (!knownSlugs.has(projectSlug)) {
				warnings.push(
					`Unknown roadmap slug in release ${release.version}: ${projectSlug}`,
				);
				continue;
			}
			if (!slugs.has(projectSlug)) continue;
			const linkedReleases = publishedReleasesByRoadmapSlug.get(projectSlug) ?? [];
			linkedReleases.push(release);
			publishedReleasesByRoadmapSlug.set(projectSlug, linkedReleases);
		}
	}
	if (isPublicRoadmap) {
		for (const item of roadmapEntries) {
			if (item.status === "shipped" && !publishedReleasesByRoadmapSlug.has(item.slug)) {
				throw new Error(`Shipped roadmap item has no published release: ${item.slug}`);
			}
		}
	}
	return { warnings };
}
