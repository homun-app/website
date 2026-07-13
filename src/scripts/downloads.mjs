export const RELEASES_REPOSITORY_URL = "https://github.com/homun-app/homun-releases";
export const RELEASES_PAGE_URL = `${RELEASES_REPOSITORY_URL}/releases/latest`;
export const RELEASES_API_URL = "https://api.github.com/repos/homun-app/homun-releases/releases/latest";
export const CORE_REPOSITORY_URL = "https://github.com/homun-app/homun-core";

export function detectPlatform(navigatorLike = {}) {
	const value = `${navigatorLike.userAgentData?.platform ?? ""} ${navigatorLike.platform ?? ""} ${navigatorLike.userAgent ?? ""}`.toLowerCase();
	if (value.includes("mac")) return "macos";
	if (value.includes("win")) return "windows";
	if (value.includes("linux") || value.includes("x11")) return "linux";
	return "unknown";
}

export function groupInstallers(assets = []) {
	const grouped = { macos: [], windows: [], linux: [] };
	for (const asset of assets) {
		if (!asset?.name || !asset?.browser_download_url) continue;
		const lower = asset.name.toLowerCase();
		if (lower.endsWith(".dmg")) grouped.macos.push(asset);
		else if (lower.endsWith(".exe")) grouped.windows.push(asset);
		else if (lower.endsWith(".appimage") || lower.endsWith(".deb")) grouped.linux.push(asset);
	}
	grouped.linux.sort(
		(a, b) =>
			Number(b.name.toLowerCase().endsWith(".appimage")) -
			Number(a.name.toLowerCase().endsWith(".appimage")),
	);
	return grouped;
}

export function preferredInstaller(platform, grouped) {
	if (!(platform in grouped)) return null;
	return grouped[platform][0] ?? null;
}
