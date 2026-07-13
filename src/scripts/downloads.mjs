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

const platformNames = {
	macos: "macOS",
	windows: "Windows",
	linux: "Linux",
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

function installerKind(name) {
	const lower = name.toLowerCase();
	if (lower.endsWith(".dmg")) return "DMG";
	if (lower.endsWith(".exe")) return "EXE";
	if (lower.endsWith(".appimage")) return "AppImage";
	if (lower.endsWith(".deb")) return "DEB";
	return "Installer";
}

function wireDownloadControl(control, platform) {
	control.addEventListener("click", async (event) => {
		event.preventDefault();
		if (control.getAttribute("aria-busy") === "true") return;
		control.setAttribute("aria-busy", "true");
		const statusLabel = control.matches("[data-homun-download]")
			? control
			: control.querySelector("[data-download-action]");
		const original = statusLabel?.textContent;
		if (statusLabel) statusLabel.textContent = "Finding the latest installer…";
		try {
			const grouped = await loadLatestInstallers();
			const asset = preferredInstaller(platform, grouped);
			navigateTo(asset?.browser_download_url ?? RELEASES_PAGE_URL);
		} catch {
			navigateTo(RELEASES_PAGE_URL);
		} finally {
			control.removeAttribute("aria-busy");
			if (statusLabel && original) statusLabel.textContent = original;
		}
	});
}

function appendFallbackLink(list) {
	const link = document.createElement("a");
	link.href = RELEASES_PAGE_URL;
	link.target = "_blank";
	link.rel = "noopener";
	link.className = "link-accent px-3 py-2 text-sm";
	link.textContent = "All releases on GitHub →";
	list.append(link);
}

function renderInstallerLinks(list, grouped) {
	list.replaceChildren();
	for (const platform of ["macos", "windows", "linux"]) {
		for (const asset of grouped[platform]) {
			const link = document.createElement("a");
			link.href = asset.browser_download_url;
			link.className = "flex items-center justify-between rounded-xl border border-line bg-bg/45 px-4 py-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-cream";
			const label = document.createElement("span");
			label.textContent = `${platformNames[platform]} · ${installerKind(asset.name)}`;
			const arrow = document.createElement("span");
			arrow.className = "text-accent-bright";
			arrow.textContent = "↓";
			link.append(label, arrow);
			list.append(link);
		}
	}
	appendFallbackLink(list);
}

export function initDownloadControls(root = document, navigatorLike = navigator) {
	const platform = detectPlatform(navigatorLike);
	for (const control of root.querySelectorAll("[data-homun-download]")) {
		control.textContent = platformLabels[platform];
		wireDownloadControl(control, platform);
	}
	for (const control of root.querySelectorAll("[data-download-platform]")) {
		wireDownloadControl(control, control.dataset.downloadPlatform);
	}

	const chooser = root.querySelector("[data-download-chooser]");
	const options = root.querySelector("[data-download-options]");
	const list = root.querySelector("[data-download-list]");
	const status = root.querySelector("[data-download-status]");
	if (!chooser || !options || !list || !status) return;

	chooser.addEventListener("click", async () => {
		const opening = options.hidden;
		options.hidden = !opening;
		chooser.setAttribute("aria-expanded", String(opening));
		if (!opening || list.dataset.loaded === "true") return;

		chooser.setAttribute("aria-busy", "true");
		status.textContent = "Finding the latest installers…";
		try {
			const grouped = await loadLatestInstallers();
			renderInstallerLinks(list, grouped);
			list.dataset.loaded = "true";
			status.textContent = "Choose the installer that matches your system.";
		} catch {
			list.replaceChildren();
			appendFallbackLink(list);
			status.textContent = "The installer list could not be loaded. Open all releases on GitHub.";
		} finally {
			chooser.removeAttribute("aria-busy");
		}
	});
	}
