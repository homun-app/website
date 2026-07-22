const DOWNLOAD_FORMATS = [
	[".appimage", "appimage", "linux"],
	[".dmg", "dmg", "macos"],
	[".exe", "exe", "windows"],
	[".deb", "deb", "linux"],
];

const ROADMAP_ACTIONS = new Set(["vote", "discuss", "suggest"]);
const PLATFORMS = new Set(["macos", "windows", "linux", "unknown"]);
const DOWNLOAD_SOURCES = new Set([
	"hero",
	"navigation",
	"download_section",
	"footer",
	"download_selector",
]);
const ROADMAP_SOURCES = new Set([
	"roadmap_overview",
	"roadmap_card",
	"roadmap_detail",
]);
export const ROADMAP_PROJECT_ALLOWLIST = new Set([
	"operational-workspace",
	"homun-flow",
	"team-spaces-roles",
	"homun-mobile",
	"more-ways-to-reach-homun",
	"adaptive-company-intelligence",
	"voice-meeting-capture",
	"developer-platform",
	"client-work",
	"sales-operations",
	"content-marketing",
	"internal-operations",
	"customer-support",
	"new",
]);
function normalizedUrl(href) {
	try {
		return new URL(href, "https://homun.app");
	} catch {
		return null;
	}
}

function installerDetails(pathname) {
	const lower = pathname.toLowerCase();
	for (const [suffix, format, platform] of DOWNLOAD_FORMATS) {
		if (lower.endsWith(suffix)) return { format, platform };
	}
	return { format: "release_page", platform: "unknown" };
}

function detectPlatform(navigatorLike = {}) {
	const value = `${navigatorLike.userAgentData?.platform ?? ""} ${navigatorLike.platform ?? ""} ${navigatorLike.userAgent ?? ""}`.toLowerCase();
	if (value.includes("mac")) return "macos";
	if (value.includes("win")) return "windows";
	if (value.includes("linux") || value.includes("x11")) return "linux";
	return "unknown";
}

function sourceFromPath(pathname) {
	if (pathname === "/") return "homepage";
	if (pathname === "/roadmap" || pathname === "/roadmap/") return "roadmap_overview";
	if (pathname.startsWith("/roadmap/")) return "roadmap";
	if (pathname.startsWith("/changelog")) return "changelog";
	if (pathname.startsWith("/marketplace")) return "marketplace";
	return "documentation";
}

function normalizedPlatform(value) {
	return PLATFORMS.has(value) ? value : "unknown";
}

export function classifyAnalyticsClick({
	href,
	currentPath = "/",
	dataset = {},
	detectedPlatform = "unknown",
	inDownloadList = false,
}) {
	const url = normalizedUrl(href);
	if (!url) return null;

	const isHomunGithub =
		url.hostname === "github.com" && url.pathname.startsWith("/homun-app/");
	const isRelease =
		isHomunGithub &&
		url.pathname.startsWith("/homun-app/homun-releases/releases");
	const downloadSource = DOWNLOAD_SOURCES.has(dataset.analyticsDownloadSource)
		? dataset.analyticsDownloadSource
		: inDownloadList
			? "download_selector"
			: "";

	if (downloadSource || isRelease) {
		const details = installerDetails(url.pathname);
		const explicitPlatform = normalizedPlatform(
			dataset.downloadPlatform ?? dataset.analyticsDownloadPlatform,
		);
		const platform =
			explicitPlatform !== "unknown"
				? explicitPlatform
				: details.platform !== "unknown"
					? details.platform
					: normalizedPlatform(detectedPlatform);
		return {
			name: "download_click",
			data: {
				platform,
				format: details.format,
				source: downloadSource || sourceFromPath(currentPath),
			},
		};
	}

	const action = dataset.analyticsRoadmapAction;
	if (ROADMAP_ACTIONS.has(action)) {
		const project = ROADMAP_PROJECT_ALLOWLIST.has(dataset.analyticsRoadmapProject)
			? dataset.analyticsRoadmapProject
			: "unknown";
		return {
			name: "roadmap_participation",
			data: {
				action,
				project,
				source: ROADMAP_SOURCES.has(dataset.analyticsRoadmapSource)
					? dataset.analyticsRoadmapSource
					: sourceFromPath(currentPath),
			},
		};
	}

	if (isHomunGithub) {
		let destination = "other";
		if (url.pathname.startsWith("/homun-app/homun-core")) {
			destination = "core_repository";
		} else if (url.pathname.startsWith("/homun-app/homun-releases")) {
			destination = "releases";
		} else if (url.pathname.includes("/issues/")) {
			destination = "issue";
		}
		return {
			name: "github_click",
			data: { destination, source: sourceFromPath(currentPath) },
		};
	}

	if (url.origin === "https://homun.app") {
		const match = url.pathname.match(
			/^\/roadmap\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/,
		);
		if (match) {
			return {
				name: "roadmap_project_open",
				data: {
					project: ROADMAP_PROJECT_ALLOWLIST.has(match[1]) ? match[1] : "unknown",
					source: sourceFromPath(currentPath),
				},
			};
		}
	}

	return null;
}

export function initAnalyticsTracking(root = document, browserWindow = window) {
	root.addEventListener("click", (event) => {
		const anchor = event.target?.closest?.("a[href]");
		if (!anchor) return;

		const classified = classifyAnalyticsClick({
			href: anchor.href,
			currentPath: browserWindow.location?.pathname ?? "/",
			dataset: anchor.dataset ?? {},
			detectedPlatform: detectPlatform(browserWindow.navigator),
			inDownloadList: Boolean(
				anchor.closest?.("[data-download-list]"),
			),
		});
		if (!classified) return;

		try {
			const trackingResult = browserWindow.umami?.track(
				classified.name,
				classified.data,
			);
			if (trackingResult && typeof trackingResult.then === "function") {
				if (typeof trackingResult.catch === "function") {
					trackingResult.catch(() => {});
				} else {
					Promise.resolve(trackingResult).catch(() => {});
				}
			}
		} catch {
			// Analytics must never interfere with navigation.
		}
	});
}
