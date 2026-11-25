import { baseVersion, compareVersions, MIN_PUBLIC_VERSION } from "../lib/versions.mjs";

export const RELEASES_REPOSITORY_URL = "https://github.com/homun-app/homun-releases";
export const RELEASES_PAGE_URL = `${RELEASES_REPOSITORY_URL}/releases`;
export const RELEASES_API_URL = "https://api.github.com/repos/homun-app/homun-releases/releases?per_page=30";
export const CORE_REPOSITORY_URL = "https://github.com/homun-app/homun-core";

export function detectPlatform(navigatorLike = {}) {
	const value = `${navigatorLike.userAgentData?.platform ?? ""} ${navigatorLike.platform ?? ""} ${navigatorLike.userAgent ?? ""}`.toLowerCase();
	// Phones and tablets first: iOS user agents say "like Mac OS X", Android
	// ones say "Linux", and iPadOS Safari poses as a Mac with a touch screen.
	// None of them can run a desktop installer.
	if (navigatorLike.userAgentData?.mobile === true) return "unknown";
	if (/android|iphone|ipad|ipod|mobile/.test(value)) return "unknown";
	if (value.includes("mac") && (navigatorLike.maxTouchPoints ?? 0) > 1) return "unknown";
	if (value.includes("mac")) return "macos";
	if (value.includes("win")) return "windows";
	if (value.includes("linux") || value.includes("x11")) return "linux";
	return "unknown";
}

export const SITE_URL = "https://homun.app/";

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

const platformNames = {
	macos: "macOS",
	windows: "Windows",
	linux: "Linux",
};

// The channel of a release the site may speak about: pre-releases are «beta»,
// everything else is stable. Drafts are nothing.
export function releaseChannel(release) {
	if (!release || release.draft || typeof release.tag_name !== "string") return null;
	return release.prerelease ? "beta" : "stable";
}

// A release the site may offer: not a draft, and on the 0.3 line or later.
// MIN_PUBLIC_VERSION draws the line: everything below is the retired Homun 2.
function isOfferable(release, min) {
	if (!release || release.draft) return false;
	if (typeof release.tag_name !== "string") return false;
	return compareVersions(baseVersion(release.tag_name), min) >= 0;
}

// Newer by line first ("v0.3.1002-beta.1" follows "v0.3.1001-beta.20"), then
// by publication date — a re-published tag does not lose its place.
function supersedes(release, current) {
	const comparison = compareVersions(baseVersion(release.tag_name), baseVersion(current.tag_name));
	if (comparison !== 0) return comparison > 0;
	return Date.parse(release.published_at ?? "") > Date.parse(current.published_at ?? "");
}

// The release the site offers: the latest stable ≥ MIN_PUBLIC_VERSION when one
// exists; while it does not, the latest pre-release ≥ MIN_PUBLIC_VERSION,
// which the site marks «beta». A 0.2 is never offered. When a 0.3 stable
// ships, the offer moves to it on its own, without touching this code.
export function pickCurrentRelease(releases = [], min = MIN_PUBLIC_VERSION) {
	if (!Array.isArray(releases)) return null;
	let stable = null;
	let beta = null;
	for (const release of releases) {
		if (!isOfferable(release, min)) continue;
		if (release.prerelease) {
			if (!beta || supersedes(release, beta)) beta = release;
		} else if (!stable || supersedes(release, stable)) stable = release;
	}
	return stable ?? beta ?? null;
}

// The Macs a macOS installer fits, read from its file name: the 0.3 beta
// ships an arm64 .dmg only, and an Intel Mac must not receive it unannounced.
export function macInstallerArch(grouped) {
	const name = grouped?.macos?.[0]?.name;
	if (typeof name !== "string") return null;
	const lower = name.toLowerCase();
	if (lower.includes("universal")) return "universal";
	if (lower.includes("arm64") || lower.includes("aarch64")) return "arm64";
	if (lower.includes("x64") || lower.includes("x86_64") || lower.includes("amd64")) return "x64";
	return null;
}

// Everything the download UI needs to say about the release on offer: its
// channel, the installers it ships, which platforms it covers. The chips and
// the badges come from here, never from a hand-written platform list.
export function offerFromRelease(release) {
	const installers = groupInstallers(release?.assets ?? []);
	return {
		release: release ?? null,
		channel: releaseChannel(release),
		installers,
		available: {
			macos: installers.macos.length > 0,
			windows: installers.windows.length > 0,
			linux: installers.linux.length > 0,
		},
		macArch: macInstallerArch(installers),
	};
}

// A platform chip's badge: «beta» while the offered release is a pre-release,
// «soon» while the offered release has no installer for it.
export function platformBadge(platform, offer) {
	if (!(platform in platformNames) || !offer?.release) return null;
	if (!offer.available[platform]) return "soon";
	return offer.channel === "beta" ? "beta" : null;
}

// The small line under a platform: while the macOS installer is arm64-only,
// the chip says which Macs it fits.
export function platformRequirement(platform, offer) {
	if (platform !== "macos" || !offer?.available?.macos) return null;
	if (offer.macArch === "arm64") return "Apple Silicon";
	if (offer.macArch === "x64") return "Intel";
	return null;
}

// What a button says it downloads. When the offered release covers none of
// the visitor's platform, the button invites them to choose instead.
export function downloadLabel(platform, offer = null) {
	const name = platformNames[platform];
	if (!name || (offer && !offer.available[platform])) return "Get Homun for your computer";
	const beta = offer?.channel === "beta" ? " the beta" : "";
	return `Download${beta} for ${name}`;
}

let offerPromise;

export async function loadCurrentOffer(fetchImpl = fetch, { useCache = true } = {}) {
	if (useCache && offerPromise) return offerPromise;
	const request = (async () => {
		const response = await fetchImpl(RELEASES_API_URL, {
			headers: { Accept: "application/vnd.github+json" },
		});
		if (!response.ok) throw new Error(`GitHub release request failed: ${response.status}`);
		const releases = await response.json();
		return offerFromRelease(pickCurrentRelease(releases));
	})();
	if (useCache) offerPromise = request;
	try {
		return await request;
	} catch (error) {
		if (useCache) offerPromise = undefined;
		throw error;
	}
}

function navigateTo(url) {
	window.location.assign(url);
}

// Which Mac is asking. Chromium answers through the high-entropy UA-CH hints;
// Safari and Firefox do not, and there an Intel Mac cannot be told from an
// Apple Silicon one — the button then keeps its «Apple Silicon» note and the
// choice stays with the visitor.
export async function detectMacArch(navigatorLike = navigator) {
	const hints = navigatorLike?.userAgentData?.getHighEntropyValues;
	if (typeof hints !== "function") return null;
	try {
		const { architecture } = await hints.call(navigatorLike.userAgentData, ["architecture"]);
		if (architecture === "arm") return "arm64";
		if (architecture === "x86") return "x64";
	} catch {
		// A hint that does not answer is no hint: the note on the chip decides.
	}
	return null;
}

// What a click may download: the installer when the offered release ships one
// that fits this computer, the chooser otherwise. An Intel Mac never receives
// the arm64 .dmg of the beta as if it ran.
async function resolveDownloadPlan(platform, offer, navigatorLike) {
	if (!(platform in platformNames) || !offer?.available?.[platform]) return { kind: "choose" };
	if (platform === "macos" && offer.macArch === "arm64" && (await detectMacArch(navigatorLike)) === "x64") {
		return { kind: "choose" };
	}
	return { kind: "installer", asset: preferredInstaller(platform, offer.installers) };
}

function installerKind(name) {
	const lower = name.toLowerCase();
	if (lower.endsWith(".dmg")) return "DMG";
	if (lower.endsWith(".exe")) return "EXE";
	if (lower.endsWith(".appimage")) return "AppImage";
	if (lower.endsWith(".deb")) return "DEB";
	return "Installer";
}

function responsiveDownloadLabels(control) {
	const compact = control.querySelector('[data-download-label="compact"]');
	const full = control.querySelector('[data-download-label="full"]');
	return compact && full ? { compact, full } : null;
}

// The options panel that belongs to a control: the enclosing download block
// when there is one, otherwise the control's own container.
function scopedDownloadOptions(element, root = document) {
	const scope = element.closest?.("[data-download-block]") ?? element.parentElement ?? root;
	return scope?.querySelector?.("[data-download-options]") ?? null;
}

function wireDownloadControl(control, platform, root = document, navigatorLike = navigator, dependencies = {}) {
	const { loadOffer = loadCurrentOffer, navigate = navigateTo } = dependencies;
	const isPrimary = control.matches?.("[data-homun-download]") ?? false;
	control.addEventListener("click", async (event) => {
		event.preventDefault();
		if (control.getAttribute("aria-busy") === "true") return;
		const openOptions = () => {
			const options = scopedDownloadOptions(control, root);
			if (!options) return false;
			const opening = options.hidden;
			options.hidden = !opening;
			control.setAttribute("aria-expanded", String(opening));
			return true;
		};
		// A phone or an unrecognized system opens the chooser without touching
		// the network; no installer is invented for it.
		if (!(platform in platformNames) && isPrimary && openOptions()) return;
		control.setAttribute("aria-busy", "true");
		const responsiveLabels = isPrimary ? responsiveDownloadLabels(control) : null;
		const statusLabel = responsiveLabels
			? null
			: isPrimary
				? control
				: control.querySelector("[data-download-action]");
		const original = responsiveLabels
			? { compact: responsiveLabels.compact.textContent, full: responsiveLabels.full.textContent }
			: statusLabel?.textContent;
		if (responsiveLabels) {
			responsiveLabels.compact.textContent = "Finding…";
			responsiveLabels.full.textContent = "Finding the latest installer…";
		} else if (statusLabel) {
			statusLabel.textContent = "Finding the latest installer…";
		}
		// The label the offer itself dictates: what the button goes back to.
		let refreshedLabel = null;
		try {
			const offer = await loadOffer();
			refreshedLabel = downloadLabel(platform, offer);
			const plan = await resolveDownloadPlan(platform, offer, navigatorLike);
			if (plan.kind === "installer") {
				navigate(plan.asset?.browser_download_url ?? RELEASES_PAGE_URL);
			} else if (!(isPrimary && openOptions())) {
				// A platform row inside the panel already points at the
				// releases page; a primary control without a panel goes there.
				navigate(RELEASES_PAGE_URL);
			}
		} catch {
			navigate(RELEASES_PAGE_URL);
		} finally {
			control.removeAttribute("aria-busy");
			if (responsiveLabels && typeof original === "object") {
				responsiveLabels.compact.textContent = "Download";
				responsiveLabels.full.textContent = refreshedLabel ?? original.full;
			} else if (statusLabel && original) {
				statusLabel.textContent = refreshedLabel ?? original;
			}
		}
	});
}

// Phone or unknown system: no installer to offer, so the visitor shares or
// copies the site link instead. Web Share when the browser has it, clipboard
// otherwise; no network request either way.
function wireShareControls(root = document, navigatorLike = navigator) {
	for (const shareButton of root.querySelectorAll("[data-download-options] [data-share-link]")) {
		shareButton.addEventListener("click", async () => {
			const label = shareButton.querySelector("[data-share-label]") ?? shareButton;
			const share = navigatorLike?.share;
			const writeText = navigatorLike?.clipboard?.writeText;
			try {
				if (typeof share === "function") {
					await share.call(navigatorLike, { url: SITE_URL });
				} else if (typeof writeText === "function") {
					await writeText.call(navigatorLike.clipboard, SITE_URL);
				} else {
					return;
				}
			} catch {
				return;
			}
			label.textContent = "Link copied";
		});
	}
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

function renderInstallerLinks(list, offer) {
	list.replaceChildren();
	for (const platform of ["macos", "windows", "linux"]) {
		for (const asset of offer.installers[platform]) {
			const link = document.createElement("a");
			link.href = asset.browser_download_url;
			link.className = "flex items-center justify-between rounded-xl border border-line bg-bg/45 px-4 py-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-cream";
			const label = document.createElement("span");
			const badge = platformBadge(platform, offer);
			const requirement = platformRequirement(platform, offer);
			const details = [installerKind(asset.name), requirement].filter(Boolean).join(" · ");
			label.textContent = `${platformNames[platform]}${badge ? ` (${badge})` : ""} · ${details}`;
			const arrow = document.createElement("span");
			arrow.className = "text-accent-bright";
			arrow.textContent = "↓";
			link.append(label, arrow);
			list.append(link);
		}
	}
	appendFallbackLink(list);
}

export function initDownloadControls(root = document, navigatorLike = navigator, dependencies = {}) {
	const { loadOffer = loadCurrentOffer } = dependencies;
	const platform = detectPlatform(navigatorLike);
	for (const control of root.querySelectorAll("[data-homun-download]")) {
		wireDownloadControl(control, platform, root, navigatorLike, dependencies);
	}
	for (const control of root.querySelectorAll("[data-download-platform]")) {
		wireDownloadControl(control, control.dataset.downloadPlatform, root, navigatorLike, dependencies);
	}
	wireShareControls(root, navigatorLike);

	// The markup already says what the build-time offer ships; the live offer
	// can only know more (a stable 0.3, a Windows build joining), so the
	// labels follow it when it arrives.
	const applyLabel = (offer) => {
		const label = downloadLabel(platform, offer);
		for (const control of root.querySelectorAll("[data-homun-download]")) {
			const responsiveLabels = responsiveDownloadLabels(control);
			if (responsiveLabels) {
				responsiveLabels.compact.textContent = "Download";
				responsiveLabels.full.textContent = label;
			} else {
				control.textContent = label;
			}
		}
	};
	if (platform in platformNames) {
		loadOffer().then(applyLabel).catch(() => {});
	} else {
		applyLabel(null);
	}

	for (const chooser of root.querySelectorAll("[data-download-chooser]")) {
		const options = scopedDownloadOptions(chooser, root);
		if (!options) continue;
		const list = options.querySelector?.("[data-download-list]");
		const status = options.querySelector?.("[data-download-status]");

		chooser.addEventListener("click", async (event) => {
			// A link-shaped chooser keeps its href as the no-JS fallback.
			event?.preventDefault?.();
			const opening = options.hidden;
			options.hidden = !opening;
			chooser.setAttribute("aria-expanded", String(opening));
			if (!opening || !list || !status || list.dataset.loaded === "true") return;

			chooser.setAttribute("aria-busy", "true");
			status.textContent = "Finding the latest installers…";
			try {
				renderInstallerLinks(list, await loadOffer());
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
}
