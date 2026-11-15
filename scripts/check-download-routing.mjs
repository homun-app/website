import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compareVersions, parseVersion } from "../src/lib/versions.mjs";
import {
	detectPlatform,
	groupInstallers,
	initDownloadControls,
	loadLatestInstallers,
	pickCurrentRelease,
	platformBadge,
	platformRequirement,
	preferredInstaller,
	RELEASES_PAGE_URL,
} from "../src/scripts/downloads.mjs";

assert.equal(platformBadge("windows"), "beta");
assert.equal(platformBadge("linux"), "beta");
assert.equal(platformBadge("macos"), null);
assert.equal(platformBadge("unknown"), null);
assert.equal(platformRequirement("unknown"), null);

const assets = [
	{ name: "Homun-1.2.3-arm64.dmg", browser_download_url: "https://example.test/mac.dmg" },
	{ name: "Homun-1.2.3-x64.exe", browser_download_url: "https://example.test/win.exe" },
	{ name: "Homun-1.2.3-x86_64.AppImage", browser_download_url: "https://example.test/linux.AppImage" },
	{ name: "Homun-1.2.3-amd64.deb", browser_download_url: "https://example.test/linux.deb" },
	{ name: "Homun-1.2.3-arm64.zip", browser_download_url: "https://example.test/mac.zip" },
	{ name: "latest-mac.yml", browser_download_url: "https://example.test/latest-mac.yml" },
	{ name: "Homun-1.2.3-x64.exe.blockmap", browser_download_url: "https://example.test/win.blockmap" },
];

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

const grouped = groupInstallers(assets);
assert.deepEqual(grouped.macos.map((asset) => asset.name), ["Homun-1.2.3-arm64.dmg"]);
assert.deepEqual(grouped.windows.map((asset) => asset.name), ["Homun-1.2.3-x64.exe"]);
assert.deepEqual(grouped.linux.map((asset) => asset.name), [
	"Homun-1.2.3-x86_64.AppImage",
	"Homun-1.2.3-amd64.deb",
]);
assert.equal(preferredInstaller("macos", grouped)?.name, "Homun-1.2.3-arm64.dmg");
assert.equal(preferredInstaller("windows", grouped)?.name, "Homun-1.2.3-x64.exe");
assert.equal(preferredInstaller("linux", grouped)?.name, "Homun-1.2.3-x86_64.AppImage");
assert.equal(preferredInstaller("unknown", grouped), null);
assert.equal(RELEASES_PAGE_URL, "https://github.com/homun-app/homun-releases/releases");

assert.deepEqual(parseVersion("v0.3.1001"), [0, 3, 1001]);
assert.deepEqual(parseVersion("0.3.1001"), [0, 3, 1001]);
assert.equal(parseVersion("v0.3.0-beta.1"), null);
assert.equal(parseVersion("nightly"), null);
assert.ok(compareVersions("v0.3.2", "v0.3.10") < 0);

const rel = (tag, extra = {}) => ({ tag_name: tag, draft: false, prerelease: false, published_at: "2026-11-01T00:00:00Z", assets: [], ...extra });
assert.equal(pickCurrentRelease([rel("v0.2.1004"), rel("v0.1.1078")]), null);
assert.equal(pickCurrentRelease([rel("v0.2.1004"), rel("v0.3.1000"), rel("v0.3.1001")]).tag_name, "v0.3.1001");
assert.equal(pickCurrentRelease([rel("v0.3.1002", { draft: true }), rel("v0.3.1001")]).tag_name, "v0.3.1001");
assert.equal(pickCurrentRelease([rel("v0.3.1002", { prerelease: true }), rel("v0.3.1001")]).tag_name, "v0.3.1001");

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

function responsiveControlFixture() {
	const compactLabel = { textContent: "Download" };
	const fullLabel = { textContent: "Download Homun" };
	const attributes = new Map();
	let clickHandler;
	let textContentWasSet = false;
	const control = {
		set textContent(_value) {
			textContentWasSet = true;
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
			if (selector === "[data-homun-download]") return [control];
			if (selector === "[data-download-platform]") return [];
			return [];
		},
		querySelector() {
			return null;
		},
	};
	return {
		compactLabel,
		control,
		fullLabel,
		root,
		click: (event = { preventDefault() {} }) => clickHandler(event),
		textContentWasSet: () => textContentWasSet,
	};
}

const successControl = responsiveControlFixture();
const pendingInstallers = deferred();
const successDestinations = [];
initDownloadControls(successControl.root, { platform: "MacIntel" }, {
	loadInstallers: () => pendingInstallers.promise,
	navigate: (url) => successDestinations.push(url),
});
assert.equal(successControl.compactLabel.textContent, "Download");
assert.equal(successControl.fullLabel.textContent, "Download for macOS");
assert.equal(successControl.textContentWasSet(), false, "Responsive download control must preserve its child labels");

const successfulClick = successControl.click();
assert.equal(successControl.compactLabel.textContent, "Finding…");
assert.equal(successControl.fullLabel.textContent, "Finding the latest installer…");
assert.equal(successControl.control.getAttribute("aria-busy"), "true");
assert.equal(successControl.textContentWasSet(), false);
pendingInstallers.resolve(grouped);
await successfulClick;
assert.deepEqual(successDestinations, ["https://example.test/mac.dmg"]);
assert.equal(successControl.compactLabel.textContent, "Download");
assert.equal(successControl.fullLabel.textContent, "Download for macOS");
assert.equal(successControl.control.getAttribute("aria-busy"), null);
assert.equal(successControl.textContentWasSet(), false);

const failedControl = responsiveControlFixture();
const failedDestinations = [];
initDownloadControls(failedControl.root, { platform: "MacIntel" }, {
	loadInstallers: async () => {
		throw new Error("release lookup failed");
	},
	navigate: (url) => failedDestinations.push(url),
});
await failedControl.click();
assert.deepEqual(failedDestinations, [RELEASES_PAGE_URL]);
assert.equal(failedControl.compactLabel.textContent, "Download");
assert.equal(failedControl.fullLabel.textContent, "Download for macOS");
assert.equal(failedControl.control.getAttribute("aria-busy"), null);
assert.equal(failedControl.textContentWasSet(), false);

const homun2Assets = [
	{ name: "Homun-0.2.1004-arm64.dmg", browser_download_url: "https://example.test/homun2.dmg" },
	{ name: "Homun-0.2.1004-x64.exe", browser_download_url: "https://example.test/homun2.exe" },
	{ name: "Homun-0.2.1004-x86_64.AppImage", browser_download_url: "https://example.test/homun2.AppImage" },
];

const releasesFetch = async () => ({
	ok: true,
	json: async () => [
		rel("v0.3.1002", { draft: true, assets: homun2Assets }),
		rel("v0.3.1001", { assets }),
		rel("v0.2.1004", { assets: homun2Assets }),
	],
});
const currentInstallers = await loadLatestInstallers(releasesFetch, { useCache: false });
assert.equal(currentInstallers.macos[0]?.browser_download_url, "https://example.test/mac.dmg");
assert.equal(currentInstallers.windows[0]?.browser_download_url, "https://example.test/win.exe");
assert.equal(currentInstallers.linux[0]?.browser_download_url, "https://example.test/linux.AppImage");

const homun2OnlyFetch = async () => ({
	ok: true,
	json: async () => [rel("v0.2.1004", { assets }), rel("v0.1.1078", { assets })],
});
assert.deepEqual(await loadLatestInstallers(homun2OnlyFetch, { useCache: false }), {
	macos: [],
	windows: [],
	linux: [],
});

const homun2OnlyControl = responsiveControlFixture();
const homun2Destinations = [];
initDownloadControls(homun2OnlyControl.root, { platform: "MacIntel" }, {
	loadInstallers: () => loadLatestInstallers(homun2OnlyFetch, { useCache: false }),
	navigate: (url) => homun2Destinations.push(url),
});
await homun2OnlyControl.click();
assert.deepEqual(homun2Destinations, [RELEASES_PAGE_URL]);
assert.equal(homun2OnlyControl.control.getAttribute("aria-busy"), null);

const rateLimitedFetch = async () => ({ ok: false, status: 403 });
const rateLimitedControl = responsiveControlFixture();
const rateLimitedDestinations = [];
initDownloadControls(rateLimitedControl.root, { platform: "MacIntel" }, {
	loadInstallers: () => loadLatestInstallers(rateLimitedFetch, { useCache: false }),
	navigate: (url) => rateLimitedDestinations.push(url),
});
await rateLimitedControl.click();
assert.deepEqual(rateLimitedDestinations, [RELEASES_PAGE_URL]);
assert.equal(rateLimitedControl.control.getAttribute("aria-busy"), null);
assert.equal(rateLimitedControl.compactLabel.textContent, "Download");
assert.equal(rateLimitedControl.fullLabel.textContent, "Download for macOS");

const failedFetch = async () => ({ ok: false, status: 403 });
await assert.rejects(
	() => loadLatestInstallers(failedFetch, { useCache: false }),
	/GitHub release request failed: 403/,
);

// Unknown platform (phone or unrecognized system): the button becomes a
// "Get Homun for your computer" action — it opens the platform list with a
// share control instead of navigating, without any network request.
function unknownPlatformFixture(navigatorLike, dependencies = {}) {
	const shareLabel = { textContent: "Share or copy the link" };
	let shareClick;
	const shareButton = {
		querySelector(selector) {
			return selector === "[data-share-label]" ? shareLabel : null;
		},
		addEventListener(type, handler) {
			if (type === "click") shareClick = handler;
		},
	};
	const options = { hidden: true };
	const block = {
		querySelector(selector) {
			return selector === "[data-download-options]" ? options : null;
		},
	};
	let controlClick;
	const control = {
		textContent: "",
		closest(selector) {
			return selector === "[data-download-block]" ? block : null;
		},
		matches() {
			return true;
		},
		querySelector() {
			return null;
		},
		addEventListener(type, handler) {
			if (type === "click") controlClick = handler;
		},
		setAttribute() {},
		getAttribute() {
			return null;
		},
		removeAttribute() {},
	};
	const root = {
		querySelectorAll(selector) {
			if (selector === "[data-homun-download]") return [control];
			if (selector === "[data-download-options] [data-share-link]") return [shareButton];
			return [];
		},
		querySelector() {
			return null;
		},
	};
	initDownloadControls(root, navigatorLike, dependencies);
	return {
		control,
		options,
		shareLabel,
		click: () => controlClick({ preventDefault() {} }),
		share: () => shareClick({ preventDefault() {} }),
	};
}

const shareCalls = [];
const networkLoads = [];
const shareFixture = unknownPlatformFixture(
	{ platform: "PlayStation", share: async (data) => shareCalls.push(data) },
	{
		loadInstallers: async () => {
			networkLoads.push("share fixture");
			return grouped;
		},
		navigate: () => {
			throw new Error("unknown platform must not navigate away");
		},
	},
);
assert.equal(
	shareFixture.control.textContent,
	"Get Homun for your computer",
	"the unknown-platform button must invite the visitor back to a computer",
);
await shareFixture.click();
assert.deepEqual(networkLoads, [], "opening the platform list must not hit the network");
assert.equal(shareFixture.options.hidden, false, "the click must open the platform list");
await shareFixture.share();
assert.deepEqual(shareCalls, [{ url: "https://homun.app/" }], "Web Share must receive the site link");
assert.equal(shareFixture.shareLabel.textContent, "Link copied");

const copyCalls = [];
const copyFixture = unknownPlatformFixture({
	platform: "PlayStation",
	clipboard: { writeText: async (text) => copyCalls.push(text) },
});
await copyFixture.click();
assert.equal(copyFixture.options.hidden, false);
await copyFixture.share();
assert.deepEqual(copyCalls, ["https://homun.app/"], "without Web Share the link is copied");
assert.equal(copyFixture.shareLabel.textContent, "Link copied");

const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
// "data-download-action" and "Download for another platform" belonged to the
// retired Homun 2 download section; the bot-team homepage routes downloads
// through the hero button and the platform chooser instead.
for (const marker of [
	"data-homun-download",
	"data-download-chooser",
	"data-download-options",
	"https://github.com/homun-app/homun-core",
	RELEASES_PAGE_URL,
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing download integration: ${marker}`);
}

const englishDownload = await readFile(new URL("../dist/guides/download/index.html", import.meta.url), "utf8");
const italianDownload = await readFile(new URL("../dist/it/guides/download/index.html", import.meta.url), "utf8");
for (const page of [englishDownload, italianDownload]) {
	for (const expected of ["homun-releases/releases/latest", ".dmg", ".exe", ".AppImage", ".deb"]) {
		assert.ok(page.includes(expected), `Download guide is missing ${expected}`);
	}
}
const downloadGuides = `${englishDownload} ${italianDownload}`.toLowerCase();
for (const forbidden of ["aren't published", "public release pending", "non sono pubblicati"]) {
	assert.ok(!downloadGuides.includes(forbidden), `Stale release claim remains: ${forbidden}`);
}

console.log("Download resolver contract passed");
