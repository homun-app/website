# Living Roadmap and GitHub Release Stream Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static roadmap and sample changelog with an illustrated product map backed by validated GitHub Project and Release snapshots.

**Architecture:** A fixture-tested Node synchronization layer converts GitHub GraphQL/REST responses into two versioned JSON snapshots. Static Astro pages consume those snapshots through a small typed data module, so no credential or live API dependency reaches the browser. A GitHub Actions reconciliation workflow refreshes snapshots and commits only semantic changes, while the checked-in snapshots remain the last-known-good fallback.

**Tech Stack:** Astro 6, TypeScript, Node.js ESM, GitHub GraphQL and REST APIs, Tailwind CSS 4, Node `assert` contract tests, GitHub Actions.

---

## File structure

- Create `src/data/roadmap.json`: generated, checked-in public roadmap snapshot.
- Create `src/data/releases.json`: generated, checked-in published release snapshot.
- Create `src/lib/product-data.ts`: typed local data access, ordering, latest-release, and cross-link helpers.
- Create `scripts/lib/github-product-data.mjs`: pure normalization and validation functions.
- Create `scripts/sync-product-data.mjs`: authenticated GitHub CLI that writes snapshots atomically after complete validation.
- Create `scripts/fixtures/github-project.json`: representative GraphQL fixture.
- Create `scripts/fixtures/github-releases.json`: representative REST fixture with draft exclusion and assets.
- Create `scripts/check-product-data.mjs`: red/green contract for normalization and failure behavior.
- Create `scripts/check-roadmap-pages.mjs`: production-page content and link contract.
- Create `src/components/illustrations/RoadmapOrbitIllustration.astro`: approved B2-style animated roadmap artwork.
- Create `src/components/roadmap/FeaturedProject.astro`: currently-building card.
- Create `src/components/roadmap/LatestRelease.astro`: latest published version summary.
- Create `src/components/roadmap/RoadmapJourney.astro`: ordered status path and project cards.
- Create `src/components/roadmap/ReleaseHistory.astro`: compact release list.
- Create `src/components/roadmap/CommunityIdeas.astro`: GitHub proposal and voting entry points.
- Replace `src/pages/roadmap.astro` with `src/pages/roadmap/index.astro` and `src/pages/roadmap/[slug].astro`.
- Modify `src/pages/changelog.astro` and `src/pages/changelog/rss.xml.ts` to consume release snapshots.
- Modify `src/content.config.ts` to remove superseded roadmap/changelog collections.
- Delete `src/content/roadmap.json` and illustrative `src/content/changelog/*.md` after snapshot-backed routes pass.
- Create `.github/workflows/sync-product-data.yml`: scheduled/manual reconciliation and deploy-triggering snapshot commit.
- Modify `package.json`: add synchronization and contract-test scripts to `npm run check`.

### Task 1: Define and test the normalized product-data contract

**Files:**
- Create: `scripts/fixtures/github-project.json`
- Create: `scripts/fixtures/github-releases.json`
- Create: `scripts/check-product-data.mjs`
- Create: `scripts/lib/github-product-data.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing normalization contract**

Create fixtures containing one item for each public status, one non-public item, one featured building item, one community-voting item, one published release, and one draft release. In `scripts/check-product-data.mjs`, import the missing normalizers and assert:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizeProject,
  normalizeReleases,
  validateSnapshot,
} from "./lib/github-product-data.mjs";

const projectFixture = JSON.parse(await readFile(new URL("./fixtures/github-project.json", import.meta.url)));
const releaseFixture = JSON.parse(await readFile(new URL("./fixtures/github-releases.json", import.meta.url)));
const roadmap = normalizeProject(projectFixture);
const releases = normalizeReleases(releaseFixture, roadmap.items);

assert.equal(roadmap.schemaVersion, 1);
assert.equal(roadmap.items.some((item) => item.slug === "private-internal-work"), false);
assert.equal(roadmap.items.filter((item) => item.featured).length, 1);
assert.deepEqual(roadmap.items.map((item) => item.status), ["exploring", "next", "building", "shipped", "exploring"]);
assert.equal(roadmap.items.find((item) => item.slug === "voice-capture").votes, 184);
assert.equal(releases.items.length, 1);
assert.equal(releases.items[0].version, "v0.1.1055");
assert.deepEqual(releases.items[0].platforms, ["Linux", "macOS", "Windows"]);
assert.deepEqual(releases.items[0].projectSlugs, ["connected-actions"]);
assert.doesNotThrow(() => validateSnapshot(roadmap, releases));

const duplicate = structuredClone(roadmap);
duplicate.items.push({ ...duplicate.items[0] });
assert.throws(() => validateSnapshot(duplicate, releases), /Duplicate roadmap slug/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/check-product-data.mjs`

Expected: failure with `ERR_MODULE_NOT_FOUND` for `scripts/lib/github-product-data.mjs`.

- [ ] **Step 3: Implement minimal normalizers and validators**

Create `scripts/lib/github-product-data.mjs` with exported functions that:

```js
export const PUBLIC_STATUSES = new Map([
  ["Exploring", "exploring"],
  ["Next", "next"],
  ["Building", "building"],
  ["Shipped", "shipped"],
]);

export function normalizeProject(payload) {
  const nodes = payload?.data?.organization?.projectV2?.items?.nodes ?? [];
  const items = nodes
    .map(normalizeProjectNode)
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
  return { schemaVersion: 1, syncedAt: payload.syncedAt, items };
}

export function normalizeReleases(payload, roadmapItems) {
  const items = payload
    .filter((release) => !release.draft && !release.prerelease)
    .map((release) => normalizeRelease(release, roadmapItems));
  return { schemaVersion: 1, syncedAt: payload.syncedAt ?? new Date(0).toISOString(), items };
}

export function validateSnapshot(roadmap, releases) {
  const slugs = new Set();
  let featured = 0;
  for (const item of roadmap.items) {
    if (slugs.has(item.slug)) throw new Error(`Duplicate roadmap slug: ${item.slug}`);
    slugs.add(item.slug);
    if (!PUBLIC_STATUSES.has(item.sourceStatus)) throw new Error(`Unknown public status: ${item.sourceStatus}`);
    if (item.progress < 0 || item.progress > 100) throw new Error(`Invalid progress: ${item.slug}`);
    if (item.featured) featured += 1;
  }
  if (featured > 1) throw new Error("Multiple featured roadmap items");
  return true;
}
```

The private publication gate must be applied before any source fields are copied to output. Release normalization must parse the five agreed Markdown headings, classify `.dmg`/mac zip, `.exe`, `.deb`/`.AppImage`, and recognize `Roadmap: slug-a, slug-b` references.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node scripts/check-product-data.mjs`

Expected: `Product data contract passed` and exit code 0.

- [ ] **Step 5: Add the contract to package scripts**

Add:

```json
"test:product-data": "node scripts/check-product-data.mjs"
```

Run: `npm run test:product-data`

Expected: PASS.

- [ ] **Step 6: Commit the contract**

```bash
git add package.json scripts/fixtures scripts/check-product-data.mjs scripts/lib/github-product-data.mjs
git commit -m "feat: define GitHub product data contract"
```

### Task 2: Add synchronization CLI and last-known-good snapshots

**Files:**
- Create: `scripts/sync-product-data.mjs`
- Create: `src/data/roadmap.json`
- Create: `src/data/releases.json`
- Modify: `scripts/check-product-data.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add failing atomic-write and authentication tests**

Extend `scripts/check-product-data.mjs` to import `writeSnapshots` and assert that a validation error leaves pre-existing files unchanged. Export an injected-fetch `syncProductData` API and assert missing configuration produces `Missing HOMUN_GITHUB_TOKEN`, `Missing HOMUN_PROJECT_OWNER`, or `Missing HOMUN_PROJECT_NUMBER`.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:product-data`

Expected: import failure because `scripts/sync-product-data.mjs` does not exist.

- [ ] **Step 3: Implement the synchronization CLI**

The CLI must:

```js
const config = {
  token: process.env.HOMUN_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN,
  owner: process.env.HOMUN_PROJECT_OWNER ?? "homun-app",
  projectNumber: Number(process.env.HOMUN_PROJECT_NUMBER),
  releasesRepo: process.env.HOMUN_RELEASES_REPO ?? "homun-app/homun-releases",
};
```

Use GitHub GraphQL for `organization(login: $owner) { projectV2(number: $number) { items(first: 100) { nodes { fieldValues(first: 30) ... content { ... on Issue { number title body url updatedAt reactions(content: THUMBS_UP) { totalCount } labels(first: 20) { nodes { name } } } } } } } }` and REST for `/repos/{owner}/{repo}/releases?per_page=50`.

Normalize and validate the complete result before writing temporary files beside the target snapshots, then rename both temporary files. If any request or validation fails, remove temporary files and preserve the checked-in snapshots.

- [ ] **Step 4: Generate initial real release and curated roadmap snapshots**

Use the current static roadmap entries as the initial last-known-good roadmap dataset, mapping `planned` to `next` and `in-progress` to `building`. Fetch published releases from `homun-app/homun-releases`, with `v0.1.1055` as the current latest version. Use curated plain-language release highlights where the GitHub body does not yet follow the agreed headings.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm run test:product-data`

Expected: PASS, including preservation of the last-known-good fixture files after induced failure.

- [ ] **Step 6: Add CLI commands and commit**

Add:

```json
"sync:product-data": "node scripts/sync-product-data.mjs"
```

Commit:

```bash
git add package.json scripts/sync-product-data.mjs scripts/check-product-data.mjs src/data
git commit -m "feat: sync roadmap and release snapshots"
```

### Task 3: Add typed website data access

**Files:**
- Create: `src/lib/product-data.ts`
- Create: `scripts/check-roadmap-pages.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing production-page contract**

Create `scripts/check-roadmap-pages.mjs` that reads `dist/roadmap/index.html`, `dist/changelog/index.html`, and `dist/changelog/rss.xml` and asserts the required messages and real version:

```js
for (const required of [
  "What we're building. What just shipped.",
  "Currently building",
  "The journey",
  "Community ideas",
  "v0.1.1055",
  "Synced with GitHub",
]) assert.ok(roadmapText.includes(required), `Roadmap missing: ${required}`);

assert.ok(changelogText.includes("v0.1.1055"));
assert.ok(!changelogText.includes("illustrative samples"));
assert.ok(rss.includes("v0.1.1055"));
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `npm run build && node scripts/check-roadmap-pages.mjs`

Expected: failure because the current roadmap lacks the new hero and latest-release content.

- [ ] **Step 3: Implement `product-data.ts`**

Import both checked-in JSON files and export:

```ts
export type RoadmapStatus = "exploring" | "next" | "building" | "shipped";
export const roadmapItems: RoadmapItem[];
export const releases: ReleaseItem[];
export const featuredProject: RoadmapItem | undefined;
export const latestRelease: ReleaseItem | undefined;
export const communityIdeas: RoadmapItem[];
export function itemsByStatus(status: RoadmapStatus): RoadmapItem[];
export function projectBySlug(slug: string): RoadmapItem | undefined;
export function releasesForProject(slug: string): ReleaseItem[];
```

Keep all sorting and cross-link logic here. Astro components receive already ordered domain objects and never import raw snapshots.

- [ ] **Step 4: Type-check through the Astro build**

Run: `npm run build`

Expected: build exits 0 with unchanged pages.

- [ ] **Step 5: Commit data access and failing page contract**

```bash
git add src/lib/product-data.ts scripts/check-roadmap-pages.mjs package.json
git commit -m "test: define living roadmap page contract"
```

### Task 4: Build the Living Product Map

**Files:**
- Create: `src/components/illustrations/RoadmapOrbitIllustration.astro`
- Create: `src/components/roadmap/FeaturedProject.astro`
- Create: `src/components/roadmap/LatestRelease.astro`
- Create: `src/components/roadmap/RoadmapJourney.astro`
- Create: `src/components/roadmap/ReleaseHistory.astro`
- Create: `src/components/roadmap/CommunityIdeas.astro`
- Delete: `src/pages/roadmap.astro`
- Create: `src/pages/roadmap/index.astro`

- [ ] **Step 1: Run the page contract and confirm it remains RED**

Run: `npm run build && node scripts/check-roadmap-pages.mjs`

Expected: failure on `What we're building. What just shipped.`.

- [ ] **Step 2: Implement the approved B2 roadmap illustration**

Create an Astro SVG/CSS illustration using floating isometric blocks and one elliptical path. Use teal, blue, magenta, and amber accents, no grid, robot, brain, laptop, or literal network diagram. Add scoped keyframes and disable transforms under `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 3: Implement focused roadmap components**

Each component accepts typed props only. `FeaturedProject` renders the illustration, benefit, progress, and update. `LatestRelease` renders version, date, three highlights, platforms, and changelog link. `RoadmapJourney` renders statuses in the fixed order and changes from a horizontal four-stage path to a vertical sequence below the desktop breakpoint. `CommunityIdeas` links voting items to their GitHub issue URLs and provides a `Suggest an idea` link to `https://github.com/homun-app/homun/issues/new`.

- [ ] **Step 4: Replace the roadmap page**

Compose the page in this order:

```astro
<RoadmapHero syncedAt={roadmapSyncedAt} />
<div class="grid lg:grid-cols-[1.2fr_.8fr]">
  {featuredProject && <FeaturedProject project={featuredProject} />}
  {latestRelease && <LatestRelease release={latestRelease} />}
</div>
<RoadmapJourney items={roadmapItems} />
<div class="grid lg:grid-cols-[1.35fr_.65fr]">
  <ReleaseHistory releases={releases.slice(0, 4)} />
  <CommunityIdeas items={communityIdeas} />
</div>
```

Display `Synced with GitHub` with the snapshot timestamp and use the first `building` item if there is no featured item. Omit release and idea modules cleanly when their arrays are empty.

- [ ] **Step 5: Run the page contract**

Run: `npm run build && node scripts/check-roadmap-pages.mjs`

Expected: roadmap assertions pass; changelog or RSS assertions may remain red until Task 6.

- [ ] **Step 6: Commit the roadmap page**

```bash
git add src/components/roadmap src/components/illustrations/RoadmapOrbitIllustration.astro src/pages/roadmap
git rm src/pages/roadmap.astro
git commit -m "feat: build living product roadmap"
```

### Task 5: Add public project detail pages

**Files:**
- Create: `src/pages/roadmap/[slug].astro`
- Modify: `scripts/check-roadmap-pages.mjs`

- [ ] **Step 1: Add a failing detail-page contract**

Assert `dist/roadmap/apprentice/index.html` exists and includes the project title, status, progress, GitHub discussion link, and related release heading. Assert no route exists for the fixture's private item.

- [ ] **Step 2: Run and verify RED**

Run: `npm run build && node scripts/check-roadmap-pages.mjs`

Expected: failure reading `dist/roadmap/apprentice/index.html`.

- [ ] **Step 3: Implement static detail routes**

Use `getStaticPaths()` over `roadmapItems`. Render vision, benefit, status, public update, progress, intended capabilities, related releases, and GitHub participation. Target releases must be labeled as direction rather than a guaranteed date.

- [ ] **Step 4: Run and verify GREEN**

Run: `npm run build && node scripts/check-roadmap-pages.mjs`

Expected: all detail-page assertions pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/roadmap/[slug].astro scripts/check-roadmap-pages.mjs
git commit -m "feat: add roadmap project detail pages"
```

### Task 6: Replace sample changelog and RSS with published Releases

**Files:**
- Modify: `src/pages/changelog.astro`
- Modify: `src/pages/changelog/rss.xml.ts`
- Modify: `src/content.config.ts`
- Delete: `src/content/roadmap.json`
- Delete: `src/content/changelog/2026-04-15-memory-graph.md`
- Delete: `src/content/changelog/2026-05-20-contained-computer.md`
- Delete: `src/content/changelog/2026-06-17-docs-and-brand.md`

- [ ] **Step 1: Verify changelog and RSS contract are RED**

Run: `npm run build && node scripts/check-roadmap-pages.mjs`

Expected: failure because changelog still contains illustrative samples and RSS lacks the real release.

- [ ] **Step 2: Render snapshot-backed changelog**

Replace content collections with `releases` from `product-data.ts`. Render version, publication date, highlights, improvements, fixes, platforms, related project links, and canonical GitHub release link. If there are no releases, render `No public releases yet.`.

- [ ] **Step 3: Render RSS from the same release records**

Generate RSS items with canonical `/changelog/#<version-slug>` links, release summary text, and publication date. Never include draft releases.

- [ ] **Step 4: Remove superseded content collections and samples**

Keep only `addons` and `docs` collections in `src/content.config.ts`, then remove the static roadmap JSON and sample Markdown releases.

- [ ] **Step 5: Run and verify GREEN**

Run: `npm run build && node scripts/check-roadmap-pages.mjs`

Expected: `Living roadmap and release contract passed`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/changelog.astro src/pages/changelog/rss.xml.ts src/content.config.ts
git rm src/content/roadmap.json src/content/changelog/*.md
git commit -m "feat: generate changelog from GitHub releases"
```

### Task 7: Add GitHub reconciliation workflow

**Files:**
- Create: `.github/workflows/sync-product-data.yml`
- Modify: `scripts/check-product-data.mjs`

- [ ] **Step 1: Add a failing workflow contract**

Assert the workflow contains `workflow_dispatch`, a schedule, `HOMUN_PROJECT_NUMBER`, `npm run sync:product-data`, a no-diff exit, and a commit restricted to `src/data/roadmap.json` and `src/data/releases.json`.

- [ ] **Step 2: Run and verify RED**

Run: `npm run test:product-data`

Expected: failure because the workflow file is missing.

- [ ] **Step 3: Implement the workflow**

Use Node 22, `npm ci`, and repository secrets `ROADMAP_GITHUB_TOKEN` and `HOMUN_PROJECT_NUMBER`. Run the sync, exit successfully when snapshots are unchanged, otherwise commit only the two generated snapshots with message `chore: sync public product data`. Use a concurrency group to prevent overlapping reconciliation runs.

- [ ] **Step 4: Run and verify GREEN**

Run: `npm run test:product-data`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/sync-product-data.yml scripts/check-product-data.mjs
git commit -m "ci: reconcile public GitHub product data"
```

### Task 8: Complete production and browser verification

**Files:**
- Modify: `package.json`
- Modify only if a verified regression is found: roadmap components, pages, or global styles touched above.

- [ ] **Step 1: Add all new tests to the full check**

Append `npm run test:product-data && npm run test:roadmap` to `npm run check`, where:

```json
"test:roadmap": "node scripts/check-roadmap-pages.mjs"
```

- [ ] **Step 2: Run the complete automated verification**

Run: `npm run check`

Expected: production build succeeds and every contract prints its PASS message with exit code 0.

- [ ] **Step 3: Inspect the generated routes**

Confirm the build includes `/roadmap/`, every public `/roadmap/<slug>/`, `/changelog/`, and `/changelog/rss.xml`, and excludes the private fixture slug.

- [ ] **Step 4: Verify in a real browser**

At desktop, tablet, and mobile widths inspect `/roadmap/`, one project detail page, and `/changelog/`. Verify no clipped titles, readable stage order, keyboard focus, correct external links, stable long content, and reduced-motion behavior.

- [ ] **Step 5: Re-run automated verification after any visual fix**

Run: `npm run check`

Expected: all checks still pass after the final browser-tested state.

- [ ] **Step 6: Commit verification wiring**

```bash
git add package.json
git commit -m "test: verify living roadmap integration"
```

## External GitHub setup after merge

The code can be implemented and verified locally with checked-in snapshots and API fixtures. Live Project synchronization also requires organization configuration that cannot be inferred from source code:

1. Create the `Homun Product Roadmap` organization Project and the fields named in the design.
2. Create or select the public product issues in `homun-app/homun` and mark only approved items as Public.
3. Add the idea issue form to `homun-app/homun`.
4. Store a minimum-scope token as `ROADMAP_GITHUB_TOKEN` in the website repository.
5. Store the numeric project identifier as `HOMUN_PROJECT_NUMBER`.
6. Run the workflow manually once and review its generated diff before enabling the schedule.
7. Add a release-published repository dispatch from `homun-app/homun-releases` if immediate cross-repository updates are required; the scheduled reconciliation remains the fallback.
