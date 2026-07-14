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

const compactLabel = { textContent: "Download" };
const fullLabel = { textContent: "Download Homun" };
let primaryTextContentWasSet = false;
const primaryControl = {
	set textContent(_value) {
		primaryTextContentWasSet = true;
	},
	querySelector(selector) {
		if (selector === '[data-download-label="compact"]') return compactLabel;
		if (selector === '[data-download-label="full"]') return fullLabel;
		return null;
	},
	matches() {
		return true;
	},
	addEventListener() {},
};
const fakeRoot = {
	querySelectorAll(selector) {
		if (selector === "[data-homun-download]") return [primaryControl];
		if (selector === "[data-download-platform]") return [];
		return [];
	},
	querySelector() {
		return null;
	},
};
initDownloadControls(fakeRoot, { platform: "MacIntel" });
assert.equal(compactLabel.textContent, "Download");
assert.equal(fullLabel.textContent, "Download for macOS");
assert.equal(primaryTextContentWasSet, false, "Responsive download control must preserve its child labels");

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
