# Umami Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Umami page-view tracking across homun.app and custom events for downloads, GitHub exits, roadmap project opens, and roadmap participation.

**Architecture:** A focused `analytics.mjs` module owns pure click classification and a delegated, fail-open browser listener. Marketing and Starlight documentation shells each load the same Umami website and initialize the same bundled listener; stable data attributes provide CTA context while URL classification covers Markdown and dynamically rendered links.

**Tech Stack:** Astro 6, Starlight, browser JavaScript modules, Node.js contract tests, Umami Cloud.

---

## File structure

- Create `src/scripts/analytics.mjs`: pure event classification, normalized properties, and delegated click tracking.
- Create `scripts/check-analytics-events.mjs`: classifier, precedence, dynamic-link, and fail-open contract tests.
- Create `scripts/check-analytics-build.mjs`: generated marketing/docs script-count and rendered-marker assertions.
- Create `src/components/docs/AnalyticsHead.astro`: extend Starlight's default head with the Umami script and tracker initialization.
- Modify `src/layouts/Base.astro`: load Umami and initialize tracking on marketing pages.
- Modify `astro.config.mjs`: select the Starlight analytics head override.
- Modify `src/components/Hero.astro`, `src/components/Nav.astro`, `src/components/Download.astro`, and `src/components/Footer.astro`: identify download CTA placement.
- Modify `src/components/roadmap/RoadmapParticipation.astro` and `src/components/roadmap/WorkflowProducts.astro`: identify vote, discuss, and suggestion actions.
- Modify `src/content/docs/guides/security.md` and `src/content/docs/it/guides/security.md`: disclose aggregate website analytics factually.
- Modify `package.json`: expose analytics contract tests and include them in `check`.

### Task 1: Event classifier and fail-open delegated tracker

**Files:**
- Create: `scripts/check-analytics-events.mjs`
- Create: `src/scripts/analytics.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing event-classification test**

Create `scripts/check-analytics-events.mjs` with representative assertions:

```js
import assert from "node:assert/strict";
import { classifyAnalyticsClick, initAnalyticsTracking } from "../src/scripts/analytics.mjs";

assert.deepEqual(classifyAnalyticsClick({
  href: "https://github.com/homun-app/homun-releases/releases/latest",
  currentPath: "/",
  dataset: { analyticsDownloadSource: "hero" },
  detectedPlatform: "macos",
}), {
  name: "download_click",
  data: { platform: "macos", format: "release_page", source: "hero" },
});

assert.deepEqual(classifyAnalyticsClick({
  href: "https://github.com/homun-app/homun-releases/releases/download/v1/Homun.exe",
  currentPath: "/",
  inDownloadList: true,
}), {
  name: "download_click",
  data: { platform: "windows", format: "exe", source: "download_selector" },
});

assert.deepEqual(classifyAnalyticsClick({
  href: "https://github.com/homun-app/homun/issues/42",
  currentPath: "/roadmap/client-work/",
  dataset: {
    analyticsRoadmapAction: "discuss",
    analyticsRoadmapProject: "client-work",
    analyticsRoadmapSource: "roadmap_detail",
  },
}), {
  name: "roadmap_participation",
  data: { action: "discuss", project: "client-work", source: "roadmap_detail" },
});

assert.deepEqual(classifyAnalyticsClick({
  href: "https://github.com/homun-app/homun-core",
  currentPath: "/guides/security/",
  dataset: {},
}), {
  name: "github_click",
  data: { destination: "core_repository", source: "documentation" },
});

assert.deepEqual(classifyAnalyticsClick({
  href: "/roadmap/client-work/",
  currentPath: "/roadmap/",
  dataset: {},
}), {
  name: "roadmap_project_open",
  data: { project: "client-work", source: "roadmap_overview" },
});

const listeners = new Map();
const root = { addEventListener: (type, listener) => listeners.set(type, listener) };
const anchor = {
  href: "https://github.com/homun-app/homun-core",
  dataset: {},
  closest: (selector) => selector === "a[href]" ? anchor : null,
};
const browserWindow = {
  location: { pathname: "/" },
  umami: { track: () => { throw new Error("blocked"); } },
};
initAnalyticsTracking(root, browserWindow);
assert.doesNotThrow(() => listeners.get("click")({ target: anchor }));

console.log("Analytics event contract passed");
```

Add `"test:analytics-events": "node scripts/check-analytics-events.mjs"` to `package.json`.

- [ ] **Step 2: Run the event test and verify RED**

Run: `npm run test:analytics-events`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/scripts/analytics.mjs`.

- [ ] **Step 3: Implement the minimal classifier and listener**

Create `src/scripts/analytics.mjs` with these public contracts:

```js
const DOWNLOAD_FORMATS = [
  [".appimage", "appimage", "linux"],
  [".dmg", "dmg", "macos"],
  [".exe", "exe", "windows"],
  [".deb", "deb", "linux"],
];
const ROADMAP_ACTIONS = new Set(["vote", "discuss", "suggest"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizedUrl(href) {
  try { return new URL(href, "https://homun.app"); } catch { return null; }
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
  if (pathname.startsWith("/roadmap")) return ["/roadmap", "/roadmap/"].includes(pathname) ? "roadmap_overview" : "roadmap";
  if (pathname.startsWith("/changelog")) return "changelog";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  return "documentation";
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

  const isHomunGithub = url.hostname === "github.com" && url.pathname.startsWith("/homun-app/");
  const isRelease = isHomunGithub && url.pathname.startsWith("/homun-app/homun-releases/releases");
  const downloadSource = dataset.analyticsDownloadSource || (inDownloadList ? "download_selector" : "");
  if (downloadSource || isRelease) {
    const details = installerDetails(url.pathname);
    const explicitPlatform = dataset.downloadPlatform || dataset.analyticsDownloadPlatform;
    return {
      name: "download_click",
      data: {
        platform: explicitPlatform || (details.platform === "unknown" ? detectedPlatform : details.platform),
        format: details.format,
        source: downloadSource || sourceFromPath(currentPath),
      },
    };
  }

  const action = dataset.analyticsRoadmapAction;
  if (ROADMAP_ACTIONS.has(action)) {
    const project = SLUG.test(dataset.analyticsRoadmapProject ?? "")
      ? dataset.analyticsRoadmapProject
      : "unknown";
    return {
      name: "roadmap_participation",
      data: {
        action,
        project,
        source: dataset.analyticsRoadmapSource || sourceFromPath(currentPath),
      },
    };
  }

  if (isHomunGithub) {
    let destination = "other";
    if (url.pathname.startsWith("/homun-app/homun-core")) destination = "core_repository";
    else if (url.pathname.startsWith("/homun-app/homun-releases")) destination = "releases";
    else if (url.pathname.includes("/issues/")) destination = "issue";
    return {
      name: "github_click",
      data: { destination, source: sourceFromPath(currentPath) },
    };
  }

  if (url.origin === "https://homun.app") {
    const match = url.pathname.match(/^\/roadmap\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
    if (match) {
      return {
        name: "roadmap_project_open",
        data: { project: match[1], source: sourceFromPath(currentPath) },
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
      inDownloadList: Boolean(anchor.closest?.("[data-download-list]")),
    });
    if (!classified) return;
    try { browserWindow.umami?.track(classified.name, classified.data); } catch {}
  });
}
```

The implementation must infer installer format/platform from normalized pathname suffixes, treat Homun release URLs as downloads, restrict generic GitHub tracking to `github.com/homun-app`, and extract only a single `/roadmap/<slug>/` segment.

- [ ] **Step 4: Run the event test and verify GREEN**

Run: `npm run test:analytics-events`

Expected: `Analytics event contract passed`.

- [ ] **Step 5: Commit the classifier**

```bash
git add package.json scripts/check-analytics-events.mjs src/scripts/analytics.mjs
git commit -m "feat: classify website analytics events"
```

### Task 2: Global tracking in marketing and documentation shells

**Files:**
- Create: `scripts/check-analytics-build.mjs`
- Create: `src/components/docs/AnalyticsHead.astro`
- Modify: `src/layouts/Base.astro`
- Modify: `astro.config.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing built-HTML test**

Create `scripts/check-analytics-build.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tracker = "https://cloud.umami.is/script.js";
const websiteId = "f3bdb523-4352-430b-b2a2-c7fdf4c0131f";
for (const output of ["../dist/index.html", "../dist/docs/index.html"]) {
  const html = await readFile(new URL(output, import.meta.url), "utf8");
  assert.equal(html.split(tracker).length - 1, 1, `${output} must load Umami once`);
  assert.equal(html.split(websiteId).length - 1, 1, `${output} must include the website ID once`);
}

console.log("Analytics build contract passed");
```

Add `"test:analytics-build": "node scripts/check-analytics-build.mjs"` to `package.json` and place both analytics tests in the main `check` command after `npm run build`.

- [ ] **Step 2: Run build test and verify RED**

Run: `npm run build && npm run test:analytics-build`

Expected: FAIL with `dist/index.html must load Umami once`.

- [ ] **Step 3: Add the marketing integration**

In `src/layouts/Base.astro`, add the supplied deferred script to `<head>` and initialize the local listener in the existing client-script area:

```astro
<script defer src="https://cloud.umami.is/script.js" data-website-id="f3bdb523-4352-430b-b2a2-c7fdf4c0131f"></script>
```

```astro
<script>
  import { initAnalyticsTracking } from "../scripts/analytics.mjs";
  initAnalyticsTracking();
</script>
```

- [ ] **Step 4: Add the documentation integration**

Create `src/components/docs/AnalyticsHead.astro`:

```astro
---
import Head from "@astrojs/starlight/components/Head.astro";
---

<Head />
<script defer src="https://cloud.umami.is/script.js" data-website-id="f3bdb523-4352-430b-b2a2-c7fdf4c0131f"></script>
<script>
  import { initAnalyticsTracking } from "../../scripts/analytics.mjs";
  initAnalyticsTracking();
</script>
```

Set `Head: './src/components/docs/AnalyticsHead.astro'` beside the existing `ThemeProvider` override in `astro.config.mjs`.

- [ ] **Step 5: Run build test and verify GREEN**

Run: `npm run build && npm run test:analytics-build && npm run test:analytics-events`

Expected: both analytics contracts pass.

- [ ] **Step 6: Commit shell integration**

```bash
git add package.json scripts/check-analytics-build.mjs src/layouts/Base.astro src/components/docs/AnalyticsHead.astro astro.config.mjs
git commit -m "feat: load Umami across the public site"
```

### Task 3: Stable CTA metadata and precedence coverage

**Files:**
- Modify: `scripts/check-analytics-events.mjs`
- Modify: `scripts/check-analytics-build.mjs`
- Modify: `src/components/Hero.astro`
- Modify: `src/components/Nav.astro`
- Modify: `src/components/Download.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/roadmap/RoadmapParticipation.astro`
- Modify: `src/components/roadmap/WorkflowProducts.astro`

- [ ] **Step 1: Add failing precedence and rendered-marker assertions**

Extend `check-analytics-events.mjs` to prove a release URL marked as a download returns only `download_click`, and a GitHub issue marked with `analyticsRoadmapAction` returns only `roadmap_participation`.

Extend `check-analytics-build.mjs`:

```js
const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
for (const source of ["hero", "navigation", "download_section", "footer"]) {
  assert.ok(homepage.includes(`data-analytics-download-source="${source}"`));
}

const roadmap = await readFile(new URL("../dist/roadmap/index.html", import.meta.url), "utf8");
for (const action of ["vote", "discuss", "suggest"]) {
  assert.ok(roadmap.includes(`data-analytics-roadmap-action="${action}"`));
}
```

- [ ] **Step 2: Run rendered-marker test and verify RED**

Run: `npm run build && npm run test:analytics-build`

Expected: FAIL because the CTA attributes are absent.

- [ ] **Step 3: Add download placement attributes**

Set `data-analytics-download-source` to:

- `hero` on the Hero download anchor;
- `navigation` on the navigation download anchor;
- `download_section` on each platform card;
- `footer` on the “All releases” footer link.

The delegated listener supplies `download_selector` for anchors inside `[data-download-list]`, including links rendered after page load.

- [ ] **Step 4: Add roadmap participation attributes**

On vote/discuss links in `RoadmapParticipation.astro`, emit:

```astro
data-analytics-roadmap-action="vote"
data-analytics-roadmap-project={item.slug}
data-analytics-roadmap-source={variant === "detail" ? "roadmap_detail" : "roadmap_card"}
```

Use `discuss` for discussion links. On the proposal link in `WorkflowProducts.astro`, set action `suggest`, project `new`, and source `roadmap_overview`.

- [ ] **Step 5: Run analytics tests and verify GREEN**

Run: `npm run build && npm run test:analytics-events && npm run test:analytics-build && npm run test:downloads && npm run test:roadmap`

Expected: all five commands pass.

- [ ] **Step 6: Commit CTA tracking**

```bash
git add scripts/check-analytics-events.mjs scripts/check-analytics-build.mjs src/components/Hero.astro src/components/Nav.astro src/components/Download.astro src/components/Footer.astro src/components/roadmap/RoadmapParticipation.astro src/components/roadmap/WorkflowProducts.astro
git commit -m "feat: track download and roadmap actions"
```

### Task 4: Factual privacy disclosure

**Files:**
- Modify: `scripts/check-analytics-build.mjs`
- Modify: `src/content/docs/guides/security.md`
- Modify: `src/content/docs/it/guides/security.md`

- [ ] **Step 1: Add a failing disclosure assertion**

In `check-analytics-build.mjs`, read both generated security pages and require `Umami Cloud`, `page views`, and `visualizzazioni di pagina` in the appropriate locale.

- [ ] **Step 2: Run disclosure test and verify RED**

Run: `npm run build && npm run test:analytics-build`

Expected: FAIL because neither security guide names Umami Cloud.

- [ ] **Step 3: Add concise English and Italian disclosures**

Append an English “Website analytics” section stating that Homun uses Umami Cloud for aggregate page views and selected interactions, does not send account or Homun workspace data, and does not use the analytics to identify individual visitors.

Append the equivalent Italian “Analisi del sito” section using factual language and avoiding unverified legal guarantees.

- [ ] **Step 4: Run disclosure test and verify GREEN**

Run: `npm run build && npm run test:analytics-build`

Expected: `Analytics build contract passed`.

- [ ] **Step 5: Commit disclosure**

```bash
git add scripts/check-analytics-build.mjs src/content/docs/guides/security.md src/content/docs/it/guides/security.md
git commit -m "docs: disclose aggregate website analytics"
```

### Task 5: Full verification and rendered-output inspection

**Files:**
- Verify all modified files; no new production behavior is added in this task.

- [ ] **Step 1: Run formatting and placeholder checks**

Run:

```bash
git diff --check
rg -n 'not implemented|throw new Error\("stub"\)' src/scripts/analytics.mjs scripts/check-analytics-*.mjs src/components/docs/AnalyticsHead.astro
```

Expected: no output and exit code 0 for `git diff --check`; no placeholder matches.

- [ ] **Step 2: Run the complete repository gate**

Run: `npm run check`

Expected: exit code 0, including both analytics contracts and all existing website checks. The pre-existing Vite projection message may appear only if the enclosing test still exits successfully; report it explicitly rather than calling that line itself green.

- [ ] **Step 3: Inspect representative generated output**

Run:

```bash
for page in dist/index.html dist/docs/index.html; do
  rg -o 'https://cloud\.umami\.is/script\.js|f3bdb523-4352-430b-b2a2-c7fdf4c0131f' "$page"
done
rg -o 'data-analytics-(download-source|roadmap-action)="[^"]+"' dist/index.html dist/roadmap/index.html | sort -u
```

Expected: each representative page prints one tracker URL and one website ID; CTA output contains the intended normalized markers.

- [ ] **Step 4: Confirm the branch is clean apart from the plan if not yet committed**

Run: `git status --short && git log --oneline -5`

Expected: the worktree is clean and feature commits are visible.
