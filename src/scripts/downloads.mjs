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

const platformLabels = {
	macos: "Download for macOS",
	windows: "Download for Windows",
	linux: "Download for Linux",
	unknown: "Download Homun",
};

let installersPromise;

export async function loadLatestInstallers(fetchImpl = fetch, { useCache = true } = {}) {
	if (useCache && installersPromise) return installersPromise;
	const request = (async () => {
		const response = await fetchImpl(RELEASES_API_URL, {
			headers: { Accept: "application/vnd.github+json" },
		});
		if (!response.ok) throw new Error(`GitHub release request failed: ${response.status}`);
		const release = await response.json();
		return groupInstallers(release.assets);
	})();
	if (useCache) installersPromise = request;
	try {
		return await request;
	} catch (error) {
		if (useCache) installersPromise = undefined;
		throw error;
	}
}

function navigateTo(url) {
	window.location.assign(url);
}

export function initDownloadControls(root = document, navigatorLike = navigator) {
	const platform = detectPlatform(navigatorLike);
	for (const control of root.querySelectorAll("[data-homun-download]")) {
		control.textContent = platformLabels[platform];
		control.addEventListener("click", async (event) => {
			event.preventDefault();
			if (control.getAttribute("aria-busy") === "true") return;
			control.setAttribute("aria-busy", "true");
			const original = control.textContent;
			control.textContent = "Finding the latest installer…";
			try {
				const grouped = await loadLatestInstallers();
				const asset = preferredInstaller(platform, grouped);
				navigateTo(asset?.browser_download_url ?? RELEASES_PAGE_URL);
			} catch {
				navigateTo(RELEASES_PAGE_URL);
			} finally {
				control.removeAttribute("aria-busy");
				control.textContent = original;
			}
		});
	}
}
