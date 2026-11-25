import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compareVersions, parseVersion } from "../src/lib/versions.mjs";
import {
	detectMacArch,
	detectPlatform,
	downloadLabel,
	groupInstallers,
	initDownloadControls,
	loadCurrentOffer,
	macInstallerArch,
	offerFromRelease,
	pickCurrentRelease,
	platformBadge,
	platformRequirement,
	preferredInstaller,
	releaseChannel,
	RELEASES_PAGE_URL,
} from "../src/scripts/downloads.mjs";

// ── The resolver: stable first, beta while no stable exists, never a 0.2 ────
const rel = (tag, extra = {}) => ({ tag_name: tag, draft: false, prerelease: false, published_at: "2026-11-01T00:00:00Z", assets: [], ...extra });

// No stable ≥ 0.3: the latest pre-release is offered, marked «beta».
const betas = [
	rel("v0.3.1001-beta.19", { prerelease: true, published_at: "2026-11-23T16:14:37Z" }),
	rel("v0.3.1001-beta.20", { prerelease: true, published_at: "2026-11-24T18:00:27Z" }),
];
const beta = pickCurrentRelease(betas);
assert.equal(beta.tag_name, "v0.3.1001-beta.20");
assert.equal(releaseChannel(beta), "beta");
// A pre-release of a higher line follows one of a lower line.
assert.equal(
	pickCurrentRelease([rel("v0.3.1002-beta.1", { prerelease: true, published_at: "2026-11-20T00:00:00Z" }), ...betas]).tag_name,
	"v0.3.1002-beta.1",
);

// A stable ≥ 0.3 wins over any pre-release, and carries no badge.
const stable = pickCurrentRelease([rel("v0.3.1000"), rel("v0.3.1002-beta.1", { prerelease: true })]);
assert.equal(stable.tag_name, "v0.3.1000");
assert.equal(releaseChannel(stable), "stable");

// A 0.2 is never offered, stable or pre-release.
assert.equal(pickCurrentRelease([rel("v0.2.1004"), rel("v0.1.1078")]), null);
assert.equal(pickCurrentRelease([rel("v0.2.1005-beta.1", { prerelease: true })]), null);
// Drafts never leave the list, pre-release or not.
assert.equal(pickCurrentRelease([rel("v0.3.1002-beta.1", { prerelease: true, draft: true }), ...betas]).tag_name, "v0.3.1001-beta.20");
assert.equal(pickCurrentRelease([rel("v0.3.1002", { draft: true }), rel("v0.3.1000")]).tag_name, "v0.3.1000");

// ── The offer: platforms and architecture come from the release's assets ────
const macBetaAssets = [
	{ name: "Homun-0.3.1001-beta.20-arm64.dmg", browser_download_url: "https://example.test/beta.dmg" },
	{ name: "Homun-0.3.1001-beta.20-arm64.zip", browser_download_url: "https://example.test/beta.zip" },
	{ name: "SHA256SUMS-mac.txt", browser_download_url: "https://example.test/sums.txt" },
];
const betaOffer = offerFromRelease(rel("v0.3.1001-beta.20", { prerelease: true, assets: macBetaAssets }));
assert.equal(betaOffer.channel, "beta");
assert.deepEqual(betaOffer.available, { macos: true, windows: false, linux: false });
assert.equal(betaOffer.macArch, "arm64");
assert.equal(macInstallerArch(groupInstallers([{ name: "Homun-1.2.3-universal.dmg", browser_download_url: "x" }])), "universal");
assert.equal(macInstallerArch(groupInstallers([{ name: "Homun-1.2.3-x64.dmg", browser_download_url: "x" }])), "x64");

assert.equal(platformBadge("macos", betaOffer), "beta");
assert.equal(platformBadge("windows", betaOffer), "soon");
assert.equal(platformBadge("linux", betaOffer), "soon");
assert.equal(platformBadge("unknown", betaOffer), null);
assert.equal(platformBadge("macos", null), null);
assert.equal(platformRequirement("macos", betaOffer), "Apple Silicon");
assert.equal(platformRequirement("windows", betaOffer), null);
assert.equal(platformRequirement("macos", offerFromRelease(null)), null);
assert.equal(
	platformRequirement("macos", offerFromRelease(rel("v0.3.1000", { assets: [{ name: "Homun-0.3.1000-universal.dmg", browser_download_url: "x" }] }))),
	null,
	"a universal installer fits every Mac: no note",
);

// The buttons say what they download.
assert.equal(downloadLabel("macos", betaOffer), "Download the beta for macOS");
assert.equal(downloadLabel("macos", null), "Download for macOS");
assert.equal(downloadLabel("windows", betaOffer), "Get Homun for your computer");
assert.equal(downloadLabel("unknown", betaOffer), "Get Homun for your computer");

const allAssets = [
	{ name: "Homun-1.2.3-arm64.dmg", browser_download_url: "https://example.test/mac.dmg" },
	{ name: "Homun-1.2.3-x64.exe", browser_download_url: "https://example.test/win.exe" },
	{ name: "Homun-1.2.3-x86_64.AppImage", browser_download_url: "https://example.test/linux.AppImage" },
	{ name: "Homun-1.2.3-amd64.deb", browser_download_url: "https://example.test/linux.deb" },
	{ name: "Homun-1.2.3-arm64.zip", browser_download_url: "https://example.test/mac.zip" },
	{ name: "latest-mac.yml", browser_download_url: "https://example.test/latest-mac.yml" },
	{ name: "Homun-1.2.3-x64.exe.blockmap", browser_download_url: "https://example.test/win.blockmap" },
];
const stableOffer = offerFromRelease(rel("v0.3.1002", { assets: allAssets }));
assert.equal(stableOffer.channel, "stable");
assert.deepEqual(stableOffer.available, { macos: true, windows: true, linux: true });
assert.equal(platformBadge("windows", stableOffer), null);
assert.equal(downloadLabel("windows", stableOffer), "Download for Windows");

const grouped = groupInstallers(allAssets);
assert.deepEqual(grouped.macos.map((asset) => asset.name), ["Homun-1.2.3-arm64.dmg"]);
assert.deepEqual(grouped.windows.map((asset) => asset.name), ["Homun-1.2.3-x64.exe"]);
assert.deepEqual(grouped.linux.map((asset) => asset.name), ["Homun-1.2.3-x86_64.AppImage", "Homun-1.2.3-amd64.deb"]);
assert.equal(preferredInstaller("macos", grouped)?.name, "Homun-1.2.3-arm64.dmg");
assert.equal(preferredInstaller("windows", grouped)?.name, "Homun-1.2.3-x64.exe");
assert.equal(preferredInstaller("linux", grouped)?.name, "Homun-1.2.3-x86_64.AppImage");
assert.equal(preferredInstaller("unknown", grouped), null);
assert.equal(RELEASES_PAGE_URL, "https://github.com/homun-app/homun-releases/releases");

// ── The visitor's system ────────────────────────────────────────────────────
assert.equal(detectPlatform({ userAgentData: { platform: "macOS" } }), "macos");
assert.equal(detectPlatform({ userAgentData: { platform: "Windows" } }), "windows");
assert.equal(detectPlatform({ platform: "Linux x86_64" }), "linux");
assert.equal(detectPlatform({ platform: "PlayStation" }), "unknown");
// Phones and tablets never get a desktop installer.
assert.equal(
	detectPlatform({
		platform: "iPhone",
		userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
	}),
	"unknown",
);
assert.equal(
	detectPlatform({
		platform: "Linux armv81",
		userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
		userAgentData: { platform: "Android", mobile: true },
	}),
	"unknown",
);
assert.equal(
	detectPlatform({
		platform: "MacIntel",
		maxTouchPoints: 5,
		userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
	}),
	"unknown",
	"iPadOS Safari poses as a Mac with a touch screen",
);
assert.equal(
	detectPlatform({
		platform: "MacIntel",
		maxTouchPoints: 0,
		userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
	}),
	"macos",
);

// Which Mac: Chromium tells, Safari and Firefox stay silent.
assert.equal(await detectMacArch({ userAgentData: { getHighEntropyValues: async () => ({ architecture: "arm" }) } }), "arm64");
assert.equal(await detectMacArch({ userAgentData: { getHighEntropyValues: async () => ({ architecture: "x86" }) } }), "x64");
assert.equal(await detectMacArch({ platform: "MacIntel" }), null);
assert.equal(await detectMacArch({ userAgentData: { getHighEntropyValues: async () => { throw new Error("no"); } } }), null);

assert.deepEqual(parseVersion("v0.3.1001"), [0, 3, 1001]);
assert.deepEqual(parseVersion("0.3.1001"), [0, 3, 1001]);
assert.equal(parseVersion("v0.3.0-beta.1"), null);
assert.equal(parseVersion("nightly"), null);
assert.ok(compareVersions("v0.3.2", "v0.3.10") < 0);

// ── The controls ────────────────────────────────────────────────────────────
function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

function responsiveControlFixture({ withOptions = false } = {}) {
	const compactLabel = { textContent: "Download" };
	const fullLabel = { textContent: "Download for macOS" };
	const attributes = new Map();
	const options = { hidden: true };
	const block = {
		querySelector(selector) {
			return selector === "[data-download-options]" && withOptions ? options : null;
		},
	};
	let clickHandler;
	let textContentWasSet = false;
	const control = {
		set textContent(_value) {
			textContentWasSet = true;
		},
		closest(selector) {
			return selector === "[data-download-block]" ? block : null;
		},
		querySelector(selector) {
			if (selector === '[data-download-label="compact"]') return compactLabel;
			if (selector === '[data-download-label="full"]') return fullLabel;
			return null;
		},
		matches() {
			return true;
		},
		addEventListener(type, handler) {
			if (type === "click") clickHandler = handler;
		},
		setAttribute(name, value) {
			attributes.set(name, String(value));
		},
		getAttribute(name) {
			return attributes.get(name) ?? null;
		},
		removeAttribute(name) {
			attributes.delete(name);
		},
	};
	const root = {
		querySelectorAll(selector) {
			return selector === "[data-homun-download]" ? [control] : [];
		},
		querySelector() {
			return null;
		},
	};
	return {
		compactLabel,
		control,
		fullLabel,
		options,
		root,
		click: (event = { preventDefault() {} }) => clickHandler(event),
		textContentWasSet: () => textContentWasSet,
	};
}

// An Apple Silicon Mac downloads the beta's .dmg; the label says the beta.
const siliconControl = responsiveControlFixture();
const pendingOffer = deferred();
const siliconDestinations = [];
initDownloadControls(siliconControl.root, {
	platform: "MacIntel",
	userAgentData: { platform: "macOS", getHighEntropyValues: async () => ({ architecture: "arm" }) },
}, {
	loadOffer: () => pendingOffer.promise,
	navigate: (url) => siliconDestinations.push(url),
});
assert.equal(siliconControl.compactLabel.textContent, "Download");
assert.equal(siliconControl.fullLabel.textContent, "Download for macOS");
assert.equal(siliconControl.textContentWasSet(), false, "Responsive download control must preserve its child labels");

const siliconClick = siliconControl.click();
assert.equal(siliconControl.compactLabel.textContent, "Finding…");
assert.equal(siliconControl.fullLabel.textContent, "Finding the latest installer…");
assert.equal(siliconControl.control.getAttribute("aria-busy"), "true");
pendingOffer.resolve(betaOffer);
await siliconClick;
await Promise.resolve();
assert.deepEqual(siliconDestinations, ["https://example.test/beta.dmg"]);
assert.equal(siliconControl.compactLabel.textContent, "Download");
assert.equal(siliconControl.fullLabel.textContent, "Download the beta for macOS");
assert.equal(siliconControl.control.getAttribute("aria-busy"), null);
assert.equal(siliconControl.textContentWasSet(), false);

// An Intel Mac never receives the arm64 .dmg of the beta: the chooser opens.
const intelControl = responsiveControlFixture({ withOptions: true });
const intelDestinations = [];
initDownloadControls(intelControl.root, {
	platform: "MacIntel",
	userAgentData: { platform: "macOS", getHighEntropyValues: async () => ({ architecture: "x86" }) },
}, {
	loadOffer: async () => betaOffer,
	navigate: (url) => intelDestinations.push(url),
});
await intelControl.click();
assert.deepEqual(intelDestinations, [], "an Intel Mac must not get the arm64 installer");
assert.equal(intelControl.options.hidden, false, "the chooser opens instead");
assert.equal(intelControl.control.getAttribute("aria-busy"), null);

// A Mac without high-entropy hints (Safari, Firefox) still downloads: the
// button itself says «Apple Silicon».
const safariControl = responsiveControlFixture();
const safariDestinations = [];
initDownloadControls(safariControl.root, { platform: "MacIntel" }, {
	loadOffer: async () => betaOffer,
	navigate: (url) => safariDestinations.push(url),
});
await safariControl.click();
assert.deepEqual(safariDestinations, ["https://example.test/beta.dmg"]);
assert.equal(safariControl.fullLabel.textContent, "Download the beta for macOS");

// A Windows visitor, while the offered release ships no Windows build, gets
// the chooser — not a trip to a releases page that has nothing for them.
const windowsControl = responsiveControlFixture({ withOptions: true });
const windowsDestinations = [];
initDownloadControls(windowsControl.root, { userAgentData: { platform: "Windows" } }, {
	loadOffer: async () => betaOffer,
	navigate: (url) => windowsDestinations.push(url),
});
await windowsControl.click();
assert.deepEqual(windowsDestinations, []);
assert.equal(windowsControl.options.hidden, false);
assert.equal(windowsControl.fullLabel.textContent, "Get Homun for your computer", "the label tells the truth: nothing to download yet");

// A failed lookup falls back to the releases page.
const failedControl = responsiveControlFixture();
const failedDestinations = [];
initDownloadControls(failedControl.root, { platform: "MacIntel" }, {
	loadOffer: async () => {
		throw new Error("release lookup failed");
	},
	navigate: (url) => failedDestinations.push(url),
});
await failedControl.click();
assert.deepEqual(failedDestinations, [RELEASES_PAGE_URL]);
assert.equal(failedControl.control.getAttribute("aria-busy"), null);

// Nothing offerable at all (a Homun 2 world): no installer is invented.
const homun2OnlyControl = responsiveControlFixture();
const homun2Destinations = [];
initDownloadControls(homun2OnlyControl.root, { platform: "MacIntel" }, {
	loadOffer: async () => offerFromRelease(null),
	navigate: (url) => homun2Destinations.push(url),
});
await homun2OnlyControl.click();
assert.deepEqual(homun2Destinations, [RELEASES_PAGE_URL]);
assert.equal(homun2OnlyControl.fullLabel.textContent, "Get Homun for your computer");

// ── The offer from the network ──────────────────────────────────────────────
const homun2Assets = [
	{ name: "Homun-0.2.1004-arm64.dmg", browser_download_url: "https://example.test/homun2.dmg" },
	{ name: "Homun-0.2.1004-x64.exe", browser_download_url: "https://example.test/homun2.exe" },
	{ name: "Homun-0.2.1004-x86_64.AppImage", browser_download_url: "https://example.test/homun2.AppImage" },
];
const releasesFetch = async () => ({
	ok: true,
	json: async () => [
		rel("v0.3.1002-beta.21", { draft: true, prerelease: true, assets: allAssets }),
		rel("v0.3.1001-beta.20", { prerelease: true, assets: macBetaAssets }),
		rel("v0.2.1004", { assets: homun2Assets }),
	],
});
const currentOffer = await loadCurrentOffer(releasesFetch, { useCache: false });
assert.equal(currentOffer.release.tag_name, "v0.3.1001-beta.20");
assert.equal(currentOffer.channel, "beta");
assert.equal(currentOffer.installers.macos[0]?.browser_download_url, "https://example.test/beta.dmg");
assert.equal(currentOffer.available.windows, false);

const homun2OnlyFetch = async () => ({
	ok: true,
	json: async () => [rel("v0.2.1004", { assets: allAssets }), rel("v0.1.1078", { assets: allAssets })],
});
const emptyOffer = await loadCurrentOffer(homun2OnlyFetch, { useCache: false });
assert.equal(emptyOffer.release, null);
assert.deepEqual(emptyOffer.available, { macos: false, windows: false, linux: false });

const failedFetch = async () => ({ ok: false, status: 403 });
await assert.rejects(
	() => loadCurrentOffer(failedFetch, { useCache: false }),
	/GitHub release request failed: 403/,
);

// ── The built pages ─────────────────────────────────────────────────────────
const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
for (const marker of [
	"data-homun-download",
	"data-download-chooser",
	"data-download-options",
	"https://github.com/homun-app/homun-core",
	RELEASES_PAGE_URL,
	"Download the beta for macOS",
	"Apple Silicon",
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing download integration: ${marker}`);
}
// The hero chips follow the offer: macOS is the beta, the others say «soon».
const heroPlatforms = homepage.match(/<div\b[^>]*\bdata-hero-platforms(?=[\s>])[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "";
const heroPlatformText = heroPlatforms.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
assert.equal((heroPlatformText.match(/\bbeta\b/gi) ?? []).length, 1, "only the offered platform is the beta");
assert.equal((heroPlatformText.match(/\bsoon\b/gi) ?? []).length, 2, "the platforms the offer does not cover say «soon»");
assert.match(heroPlatformText, /Apple Silicon/);
assert.ok(!/Windows\s+beta|Linux\s+beta/.test(homepage), "no platform is called beta unless the offer ships it");

const englishDownload = await readFile(new URL("../dist/guides/download/index.html", import.meta.url), "utf8");
const italianDownload = await readFile(new URL("../dist/it/guides/download/index.html", import.meta.url), "utf8");
for (const page of [englishDownload, italianDownload]) {
	for (const expected of ["homun-releases/releases", ".dmg", "Apple Silicon", "beta"]) {
		assert.ok(page.includes(expected), `Download guide is missing ${expected}`);
	}
	// GitHub's «latest» skips pre-releases: today it would lead to the retired 0.2.
	for (const forbidden of ["releases/latest", "aren't published", "public release pending", "non sono pubblicati", "Windows (beta)", "Linux (beta)"]) {
		assert.ok(!page.includes(forbidden), `Stale download claim remains: ${forbidden}`);
	}
}

console.log("Download resolver contract passed");
