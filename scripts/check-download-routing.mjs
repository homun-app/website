import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
	detectPlatform,
	groupInstallers,
	initDownloadControls,
	loadLatestInstallers,
	preferredInstaller,
	RELEASES_PAGE_URL,
} from "../src/scripts/downloads.mjs";

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
assert.equal(RELEASES_PAGE_URL, "https://github.com/homun-app/homun-releases/releases/latest");

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

const successFetch = async () => ({
	ok: true,
	json: async () => ({ assets }),
});
assert.equal(
	(await loadLatestInstallers(successFetch, { useCache: false })).linux[0].name,
	"Homun-1.2.3-x86_64.AppImage",
);

const failedFetch = async () => ({ ok: false, status: 403 });
await assert.rejects(
	() => loadLatestInstallers(failedFetch, { useCache: false }),
	/GitHub release request failed: 403/,
);

const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
for (const marker of [
	"data-homun-download",
	"data-download-chooser",
	"data-download-options",
	"data-download-action",
	"Download for another platform",
	"https://github.com/homun-app/homun-core",
	"https://github.com/homun-app/homun-releases/releases/latest",
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
