# Adaptive Download Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every primary Homun download action fetch and download the newest installer for the visitor's operating system, while keeping all other platform installers selectable and linking the public source repository separately.

**Architecture:** A browser-safe ES module owns repository URLs, platform detection, GitHub release loading, asset filtering, and control wiring. Astro components expose semantic fallback links through data attributes, while one module script in the shared layout upgrades them into adaptive controls. Pure resolver functions are exercised with fixture assets in Node; rendered-site contract checks cover integration and copy.

**Tech Stack:** Astro 6, browser JavaScript ES modules, GitHub Releases REST API, Node built-in assertions, existing Tailwind/CSS system.

---

## File map

- Create `src/scripts/downloads.mjs`: repository constants, platform detection, release resolution, asset selection, and DOM enhancement.
- Create `scripts/check-download-routing.mjs`: pure resolver fixtures plus rendered HTML integration assertions.
- Modify `src/layouts/Base.astro`: initialize download controls once on every marketing page.
- Modify `src/components/Hero.astro`: adaptive primary download action and accurate platform availability copy.
- Modify `src/components/Nav.astro`: adaptive navigation download action.
- Modify `src/components/Download.astro`: active cards for published platforms and the alternate-platform chooser.
- Modify `src/components/Footer.astro`: separate source-code and release links.
- Modify `src/content/docs/guides/download.md`: describe published installers accurately.
- Modify `src/content/docs/it/guides/download.md`: keep Italian download documentation equivalent.
- Modify `package.json`: add the resolver contract to `npm run check`.

### Task 1: Pure release resolver

**Files:**
- Create: `src/scripts/downloads.mjs`
- Create: `scripts/check-download-routing.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing resolver test**

Create `scripts/check-download-routing.mjs` with fixtures for every supported installer and irrelevant updater assets:

```js
import assert from "node:assert/strict";
import {
	detectPlatform,
	groupInstallers,
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

console.log("Download resolver contract passed");
```

Add the script to `package.json`:

```json
"test:downloads": "node scripts/check-download-routing.mjs",
"check": "npm run build && npm run test:homepage && npm run test:marketing-backgrounds && npm run test:downloads"
```

- [ ] **Step 2: Run the resolver test and verify it fails**

Run: `npm run test:downloads`

Expected: FAIL because `src/scripts/downloads.mjs` does not exist.

- [ ] **Step 3: Implement the pure resolver boundary**

Create `src/scripts/downloads.mjs` with these exports and no automatic DOM side effects:

```js
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
	grouped.linux.sort((a, b) => Number(b.name.toLowerCase().endsWith(".appimage")) - Number(a.name.toLowerCase().endsWith(".appimage")));
	return grouped;
}

export function preferredInstaller(platform, grouped) {
	if (!(platform in grouped)) return null;
	return grouped[platform][0] ?? null;
}
```

- [ ] **Step 4: Run the resolver test and verify it passes**

Run: `npm run test:downloads`

Expected: PASS with `Download resolver contract passed`.

- [ ] **Step 5: Commit the pure resolver**

```bash
git add package.json scripts/check-download-routing.mjs src/scripts/downloads.mjs
git commit -m "feat: resolve latest installers by platform"
```

### Task 2: Adaptive download controls

**Files:**
- Modify: `src/scripts/downloads.mjs`
- Modify: `scripts/check-download-routing.mjs`
- Modify: `src/layouts/Base.astro`
- Modify: `src/components/Hero.astro`
- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Extend the test with loading and fallback cases**

Add imports and assertions for `loadLatestInstallers`:

```js
import { loadLatestInstallers } from "../src/scripts/downloads.mjs";

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
```

- [ ] **Step 2: Run the resolver test and verify it fails**

Run: `npm run test:downloads`

Expected: FAIL because `loadLatestInstallers` is not exported.

- [ ] **Step 3: Add release loading, labels, and DOM enhancement**

Extend `src/scripts/downloads.mjs` with:

```js
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
```

In `src/layouts/Base.astro`, add one bundled module script after the existing scripts:

```astro
<script>
	import { initDownloadControls } from "../scripts/downloads.mjs";
	initDownloadControls();
</script>
```

Replace the hero and navigation download links with fallback links carrying the shared data attribute:

```astro
<a href="https://github.com/homun-app/homun-releases/releases/latest" data-homun-download class="btn btn-primary">
	Download Homun
</a>
```

Keep the navigation-specific sizing classes on its copy of the control. Update the hero availability line to `Installers available for macOS, Windows and Linux`.

- [ ] **Step 4: Run the resolver and build checks**

Run: `npm run test:downloads && npm run build`

Expected: both commands exit 0; the static build completes with 47 pages.

- [ ] **Step 5: Commit adaptive download controls**

```bash
git add src/scripts/downloads.mjs scripts/check-download-routing.mjs src/layouts/Base.astro src/components/Hero.astro src/components/Nav.astro
git commit -m "feat: make primary downloads platform aware"
```

### Task 3: Alternate-platform chooser and release links

**Files:**
- Modify: `src/scripts/downloads.mjs`
- Modify: `src/components/Download.astro`
- Modify: `src/components/Footer.astro`
- Modify: `scripts/check-download-routing.mjs`

- [ ] **Step 1: Add failing rendered integration assertions**

Extend `scripts/check-download-routing.mjs` after reading `dist/index.html`:

```js
import { readFile } from "node:fs/promises";

const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
for (const marker of [
	"data-homun-download",
	"data-download-chooser",
	"data-download-options",
	"Download for another platform",
	"https://github.com/homun-app/homun-core",
	"https://github.com/homun-app/homun-releases/releases/latest",
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing download integration: ${marker}`);
}
```

- [ ] **Step 2: Build and run the contract to verify it fails**

Run: `npm run build && npm run test:downloads`

Expected: FAIL because the chooser and core link do not exist yet.

- [ ] **Step 3: Implement the chooser and current platform cards**

In `src/components/Download.astro`:

- mark macOS, Windows, and Linux as available;
- remove claims about unpublished Windows/Linux builds and Mac Intel;
- make each platform card a standard fallback link with `data-download-platform="macos|windows|linux"`;
- add a button with `data-download-chooser`, `aria-expanded="false"`, and `aria-controls="download-options"`;
- add a hidden `#download-options` container with `data-download-options` and a polite status element.

Use this semantic chooser shell below the cards:

```astro
<div class="reveal mt-8" style="--reveal-delay: 160ms">
	<button type="button" class="btn btn-ghost" data-download-chooser aria-expanded="false" aria-controls="download-options">
		Download for another platform
	</button>
	<div id="download-options" data-download-options hidden class="mx-auto mt-5 max-w-3xl rounded-2xl border border-line bg-surface/70 p-4 text-left">
		<p data-download-status class="text-sm text-muted" aria-live="polite">Choose an installer.</p>
		<div data-download-list class="mt-3 grid gap-2 sm:grid-cols-2"></div>
	</div>
</div>
```

Extend `initDownloadControls` to:

- resolve a fixed `data-download-platform` card using the same release loader;
- toggle `hidden` and `aria-expanded` on the chooser;
- on first expansion, load installer groups and render safe `<a>` elements using DOM APIs;
- label links with platform plus asset type and architecture inferred from the filename;
- render a final `All releases on GitHub` link;
- on errors, render only the GitHub fallback link and announce that the installer list could not be loaded.

No release-provided string may be assigned to `innerHTML`; use `textContent`, `href`, and `append`.

In `src/components/Footer.astro`, replace the generic GitHub item with:

```js
{ label: "Source code", href: "https://github.com/homun-app/homun-core" },
{ label: "All releases", href: "https://github.com/homun-app/homun-releases/releases/latest" },
```

- [ ] **Step 4: Build and run download contracts**

Run: `npm run build && npm run test:downloads && npm run test:homepage`

Expected: PASS for the static build, resolver contract, and homepage positioning contract.

- [ ] **Step 5: Commit the chooser and repository links**

```bash
git add src/scripts/downloads.mjs src/components/Download.astro src/components/Footer.astro scripts/check-download-routing.mjs
git commit -m "feat: add alternate platform downloads"
```

### Task 4: Accurate download documentation

**Files:**
- Modify: `src/content/docs/guides/download.md`
- Modify: `src/content/docs/it/guides/download.md`
- Modify: `src/content/docs/guides/getting-started.md`
- Modify: `src/content/docs/it/guides/getting-started.md`
- Modify: `scripts/check-download-routing.mjs`

- [ ] **Step 1: Add failing documentation assertions**

Read both rendered download guides and assert that each contains the latest-release URL, `.dmg`, `.exe`, `.AppImage`, `.deb`, and no longer contains `public release pending`, `aren't published`, or `non sono pubblicati`.

```js
const englishDownload = await readFile(new URL("../dist/guides/download/index.html", import.meta.url), "utf8");
const italianDownload = await readFile(new URL("../dist/it/guides/download/index.html", import.meta.url), "utf8");
for (const page of [englishDownload, italianDownload]) {
	for (const expected of ["homun-releases/releases/latest", ".dmg", ".exe", ".AppImage", ".deb"]) {
		assert.ok(page.includes(expected), `Download guide is missing ${expected}`);
	}
}
for (const forbidden of ["aren't published", "public release pending", "non sono pubblicati"]) {
	assert.ok(!`${englishDownload} ${italianDownload}`.toLowerCase().includes(forbidden), `Stale release claim remains: ${forbidden}`);
}
```

- [ ] **Step 2: Build and run the contract to verify it fails**

Run: `npm run build && npm run test:downloads`

Expected: FAIL because the guides still describe Windows and Linux as unpublished.

- [ ] **Step 3: Update English and Italian release instructions**

State in both languages:

- macOS currently offers the signed/notarized Apple Silicon `.dmg` present in the public feed;
- Windows offers the `.exe`, with a possible SmartScreen warning until Windows signing is confirmed;
- Linux offers `.AppImage` and `.deb`, with the executable-bit instruction for AppImage;
- the latest release page is the canonical manual fallback;
- local-model hardware requirements remain model-dependent.

Update both getting-started guides so their first step points to the adaptive homepage download section (`/#download`) and keeps the release page as the manual alternative.

- [ ] **Step 4: Run the documentation and full site checks**

Run: `npm run check`

Expected: 47 pages build and every contract prints `passed`.

- [ ] **Step 5: Commit accurate download documentation**

```bash
git add src/content/docs/guides/download.md src/content/docs/it/guides/download.md src/content/docs/guides/getting-started.md src/content/docs/it/guides/getting-started.md scripts/check-download-routing.mjs
git commit -m "docs: describe public installers accurately"
```

### Task 5: Browser verification and final audit

**Files:**
- Verify only; modify the smallest responsible file if a browser check exposes a defect.

- [ ] **Step 1: Run the complete verification suite**

Run: `npm run check && git diff --check`

Expected: build exits 0 for 47 pages, homepage positioning passes, marketing background contract passes, download resolver contract passes, and no whitespace errors are reported.

- [ ] **Step 2: Verify the live download section at desktop width**

Open `http://127.0.0.1:4321/#download` at `1440 × 1000` and verify:

- the primary labels match the browser operating system;
- all three platform cards are available;
- `Download for another platform` expands without navigation;
- the chooser lists only `.dmg`, `.exe`, `.AppImage`, and `.deb` assets from the latest release;
- `Source code` targets `homun-core` and `All releases` targets the latest-release page;
- no horizontal overflow or console errors occur.

Do not activate a large installer download during visual verification; inspect the resolved chooser link destinations instead.

- [ ] **Step 3: Verify mobile layout and fallback semantics**

At `390 × 844`, verify that the chooser, cards, and adaptive navigation action remain readable and keyboard-accessible with no horizontal overflow. Confirm all adaptive links retain `https://github.com/homun-app/homun-releases/releases/latest` as their HTML fallback before JavaScript enhancement.

- [ ] **Step 4: Review scope and repository state**

Run: `git status --short && git log --oneline -6`

Expected: the worktree is clean and the latest commits cover resolver, controls, chooser, and documentation without unrelated files.
