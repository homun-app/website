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
const LEGACY_PUBLIC_STATUSES = new Set(["Exploring", "Next", "Building", "Shipped"]);

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

function normalizeProjectNode(node) {
	const fields = fieldMap(node);
	const content = node?.content;
	if (!content?.title || !content?.url) throw new Error("Missing roadmap content");
	const publicStatus = String(fields.get("Public status") ?? "");
	const status = PUBLIC_STATUSES.get(publicStatus);
	if (!status) throw new Error(`Unknown public status: ${publicStatus || "(empty)"}`);
	const sourcePublicationStatus = String(fields.get("Publication status") ?? "");
	const publicationStatus = PUBLICATION_STATUSES.get(sourcePublicationStatus);
	if (!publicationStatus) {
		throw new Error(`Unknown publication status: ${sourcePublicationStatus || "(empty)"}`);
	}
	const sourceVoting = String(fields.get("Voting") ?? "");
	const voting = VOTING_STATES.get(sourceVoting);
	if (!voting) throw new Error(`Unknown voting state: ${sourceVoting || "(empty)"}`);
	const slug = String(fields.get("Slug") ?? "").trim();
	if (!slug) throw new Error(`Missing roadmap slug: ${content.title}`);
	if (!ROADMAP_SLUG.test(slug)) throw new Error(`Invalid roadmap slug: ${slug}`);
	const order = Number(fields.get("Order"));
	if (!Number.isInteger(order)) throw new Error(`Invalid order: ${slug}`);
	const progress = Number(fields.get("Progress") ?? 0);
	if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
		throw new Error(`Invalid progress: ${slug}`);
	}
	const publicUpdate = String(fields.get("Public update") ?? "").trim() || null;
	const publicUpdateDate = String(fields.get("Public update date") ?? "").trim() || null;
	if (publicUpdate && !publicUpdateDate) throw new Error(`Missing public update date: ${slug}`);
	const body = content.body ?? "";
	const sections = markdownSections(body);
	return {
		slug,
		title: content.title,
		status,
		publicationStatus,
		area: String(fields.get("Area") ?? "Product"),
		description: firstParagraph(body),
		capabilities: listItems(sections.get("intended capabilities")),
		featured: String(fields.get("Featured") ?? "").toLowerCase() === "yes",
		progress,
		targetRelease: String(fields.get("Target release") ?? "").trim() || null,
		publicUpdate,
		publicUpdateDate,
		voting,
		order,
		updatedAt: content.updatedAt,
		githubUrl: content.url,
		issueNumber: content.number,
		votes: Number(content.reactions?.totalCount ?? 0),
	};
}

export function normalizeProject(payload) {
	const nodes = payload?.data?.organization?.projectV2?.items?.nodes ?? [];
	const candidates = nodes
		.map(normalizeProjectNode)
		.sort((a, b) => a.order - b.order);
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

function projectSlugsFromBody(body = "", knownSlugs) {
	const match = String(body ?? "").match(/^Roadmap:\s*(.+)$/im);
	if (!match) return [];
	return match[1]
		.split(",")
		.map((slug) => slug.trim())
		.filter((slug) => slug && knownSlugs.has(slug));
}

function normalizeRelease(release, roadmapCandidates) {
	const sections = markdownSections(release.body ?? "");
	const knownSlugs = new Set(roadmapCandidates.map((candidate) => candidate.slug));
	return {
		version: release.tag_name,
		name: release.name || release.tag_name,
		publishedAt: release.published_at,
		githubUrl: release.html_url,
		highlights: listItems(sections.get("highlights")),
		improvements: listItems(sections.get("improvements")),
		fixes: listItems(sections.get("fixes")),
		platforms: platformsForAssets(release.assets),
		assets: (release.assets ?? []).map((asset) => ({
			name: asset.name,
			downloadUrl: asset.browser_download_url,
		})),
		projectSlugs: projectSlugsFromBody(release.body, knownSlugs),
	};
}

export function normalizeReleases(payload, roadmapCandidates, syncedAt = new Date().toISOString()) {
	const items = payload
		.filter((release) => !release.draft && !release.prerelease && release.published_at)
		.map((release) => normalizeRelease(release, roadmapCandidates))
		.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
	return { schemaVersion: 1, syncedAt, items };
}

export function validateSnapshot(roadmap, releases) {
	if (![1, 2].includes(roadmap?.schemaVersion) || releases?.schemaVersion !== 1) {
		throw new Error("Unsupported product data schema");
	}
	const roadmapEntries = roadmap.schemaVersion === 2 ? roadmap.candidates : roadmap.items;
	const slugs = new Set();
	let featured = 0;
	for (const item of roadmapEntries ?? []) {
		if (!item.slug) throw new Error("Missing roadmap slug");
		if (!ROADMAP_SLUG.test(item.slug)) throw new Error(`Invalid roadmap slug: ${item.slug}`);
		if (slugs.has(item.slug)) throw new Error(`Duplicate roadmap slug: ${item.slug}`);
		slugs.add(item.slug);
		if (roadmap.schemaVersion === 2) {
			if (![...PUBLIC_STATUSES.values()].includes(item.status)) {
				throw new Error(`Unknown public status: ${item.status}`);
			}
			if (![...PUBLICATION_STATUSES.values()].includes(item.publicationStatus)) {
				throw new Error(`Unknown publication status: ${item.publicationStatus}`);
			}
			if (![...VOTING_STATES.values()].includes(item.voting)) {
				throw new Error(`Unknown voting state: ${item.voting}`);
			}
			if (!Number.isInteger(item.order)) throw new Error(`Invalid order: ${item.slug}`);
			if (item.publicUpdate && !item.publicUpdateDate) {
				throw new Error(`Missing public update date: ${item.slug}`);
			}
		} else if (!LEGACY_PUBLIC_STATUSES.has(item.sourceStatus)) {
			throw new Error(`Unknown public status: ${item.sourceStatus}`);
		}
		if (!Number.isFinite(item.progress) || item.progress < 0 || item.progress > 100) {
			throw new Error(`Invalid progress: ${item.slug}`);
		}
		if (item.featured) featured += 1;
	}
	if (featured > 1) throw new Error("Multiple featured roadmap items");
	const versions = new Set();
	for (const release of releases.items ?? []) {
		if (versions.has(release.version)) throw new Error(`Duplicate release: ${release.version}`);
		versions.add(release.version);
	}
	return true;
}
