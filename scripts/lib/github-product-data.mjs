export const PUBLIC_STATUSES = new Map([
	["Exploring", "exploring"],
	["Next", "next"],
	["Building", "building"],
	["Shipped", "shipped"],
]);

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
	if (String(fields.get("Public") ?? "").toLowerCase() !== "yes") return null;
	const content = node?.content;
	if (!content?.title || !content?.url) return null;
	const sourceStatus = String(fields.get("Public status") ?? "");
	const status = PUBLIC_STATUSES.get(sourceStatus);
	if (!status) throw new Error(`Unknown public status: ${sourceStatus || "(empty)"}`);
	const slug = String(fields.get("Slug") ?? "").trim();
	if (!slug) throw new Error(`Missing roadmap slug: ${content.title}`);
	const body = content.body ?? "";
	const sections = markdownSections(body);
	return {
		slug,
		title: content.title,
		status,
		sourceStatus,
		area: String(fields.get("Area") ?? "Product"),
		description: firstParagraph(body),
		capabilities: listItems(sections.get("intended capabilities")),
		featured: String(fields.get("Featured") ?? "").toLowerCase() === "yes",
		progress: Number(fields.get("Progress") ?? 0),
		targetRelease: String(fields.get("Target release") ?? "").trim() || null,
		publicUpdate: String(fields.get("Public update") ?? "").trim() || null,
		community: String(fields.get("Community") ?? "Closed").toLowerCase(),
		order: Number(fields.get("Order") ?? 0),
		updatedAt: content.updatedAt,
		githubUrl: content.url,
		issueNumber: content.number,
		votes: Number(content.reactions?.totalCount ?? 0),
	};
}

export function normalizeProject(payload) {
	const nodes = payload?.data?.organization?.projectV2?.items?.nodes ?? [];
	const items = nodes
		.map(normalizeProjectNode)
		.filter(Boolean)
		.sort((a, b) => a.order - b.order);
	return { schemaVersion: 1, syncedAt: payload.syncedAt, items };
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
	const match = body.match(/^Roadmap:\s*(.+)$/im);
	if (!match) return [];
	return match[1]
		.split(",")
		.map((slug) => slug.trim())
		.filter((slug) => slug && knownSlugs.has(slug));
}

function normalizeRelease(release, roadmapItems) {
	const sections = markdownSections(release.body ?? "");
	const knownSlugs = new Set(roadmapItems.map((item) => item.slug));
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

export function normalizeReleases(payload, roadmapItems, syncedAt = new Date().toISOString()) {
	const items = payload
		.filter((release) => !release.draft && !release.prerelease && release.published_at)
		.map((release) => normalizeRelease(release, roadmapItems))
		.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
	return { schemaVersion: 1, syncedAt, items };
}

export function validateSnapshot(roadmap, releases) {
	if (roadmap?.schemaVersion !== 1 || releases?.schemaVersion !== 1) {
		throw new Error("Unsupported product data schema");
	}
	const slugs = new Set();
	let featured = 0;
	for (const item of roadmap.items ?? []) {
		if (slugs.has(item.slug)) throw new Error(`Duplicate roadmap slug: ${item.slug}`);
		slugs.add(item.slug);
		if (!PUBLIC_STATUSES.has(item.sourceStatus)) {
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
