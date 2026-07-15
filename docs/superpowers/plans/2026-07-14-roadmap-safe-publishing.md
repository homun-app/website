# Safe Roadmap Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Homun roadmap publish `Ideas -> Next -> Building -> Shipped` from GitHub without empty-snapshot regressions, unapproved public transitions, no-op commits, or unnecessary Docker deployments.

**Architecture:** Keep GitHub access in the Node synchronization job and keep Astro/Docker dependent only on checked-in JSON. Split normalization, publication-policy merging, validation, semantic comparison, and atomic persistence into pure testable modules. The checked-in v2 snapshots remain the last-known-good public state; a candidate reaches them only after policy and cross-source validation pass.

**Tech Stack:** Astro 6, TypeScript, Node.js ESM, Node `assert`, GitHub GraphQL/REST, GitHub Actions, Docker multi-stage build, nginx.

---

## Working boundary

All tasks in this plan run in:

```text
/Users/fabio/Projects/Homun/website/.worktrees/roadmap-governance-sync
```

Do not edit `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign`. Before every commit, run `git status --short` and stage only the files named by the current task.

## Target file structure

- Modify `scripts/fixtures/github-project.json`: model the four public statuses and four publication states.
- Modify `scripts/fixtures/github-releases.json`: cover published, draft, prerelease, linked, and unknown roadmap slugs.
- Modify `scripts/lib/github-product-data.mjs`: normalize GitHub data into version-2 candidates and validate field-level invariants.
- Create `scripts/lib/publication-policy.mjs`: merge candidates with the last published snapshot.
- Create `scripts/lib/snapshot-store.mjs`: semantic comparison, empty guards, and atomic two-file persistence.
- Modify `scripts/sync-product-data.mjs`: orchestrate fetch, merge, validate, dry-run, and conditional write modes.
- Modify `scripts/check-product-data.mjs`: pure data, policy, failure, and persistence contracts.
- Modify `src/data/roadmap.json`: restore the last non-empty data and migrate it to schema version 2.
- Modify `src/data/releases.json`: migrate release records to schema version 2.
- Modify `src/lib/product-data.ts`: expose the v2 domain types and four public stages.
- Modify `src/components/roadmap/RoadmapJourney.astro`: render Ideas, vote controls, and review state in the main journey.
- Modify `src/components/roadmap/CommunityIdeas.astro`: render the participation controls used by the Ideas stage.
- Modify `src/pages/roadmap/index.astro`: remove the duplicate lower Ideas block.
- Modify `src/pages/roadmap/[slug].astro`: show stable public update dates, voting state, and review state.
- Modify `scripts/check-roadmap-pages.mjs`: validate list/detail pages from fixture-backed production output.
- Create `scripts/check-container-runtime.mjs`: build and probe the real nginx image.
- Modify `.github/workflows/sync-product-data.yml`: dry-run reporting, conditional writes, explicit allow-empty input, and no-op behavior.
- Modify `package.json`: expose the new contracts and container smoke command.

### Task 1: Lock the version-2 normalization contract

**Files:**
- Modify: `scripts/fixtures/github-project.json`
- Modify: `scripts/fixtures/github-releases.json`
- Modify: `scripts/check-product-data.mjs`
- Modify: `scripts/lib/github-product-data.mjs`

- [ ] **Step 1: Add failing fixture assertions for the new fields**

Change the Project fixture so its field values use `Public status`, `Publication status`, `Public update date`, and `Voting`. Include one item for each publication state and statuses `Ideas`, `Next`, `Building`, and `Shipped`. Add these assertions before changing production code:

```js
assert.equal(roadmap.schemaVersion, 2);
assert.deepEqual(
	roadmap.candidates.map(({ slug, status, publicationStatus }) => [slug, status, publicationStatus]),
	[
		["shared-spaces", "ideas", "published"],
		["mobile-companion", "next", "published"],
		["apprentice", "building", "review"],
		["connected-actions", "shipped", "published"],
		["voice-capture", "ideas", "draft"],
		["retired-experiment", "ideas", "archived"],
	],
);
assert.equal(roadmap.candidates[0].voting, "open");
assert.equal(roadmap.candidates[0].publicUpdateDate, "2026-07-14");
assert.equal("sourceStatus" in roadmap.candidates[0], false);
```

- [ ] **Step 2: Prove RED**

Run:

```bash
npm run test:product-data
```

Expected: an assertion failure because the current normalizer emits schema version 1, `items`, and `exploring`.

- [ ] **Step 3: Implement strict v2 normalization**

Replace the public-status map and add the publication/voting maps:

```js
export const PUBLIC_STATUSES = new Map([
	["Ideas", "ideas"],
	["Next", "next"],
	["Building", "building"],
	["Shipped", "shipped"],
]);

export const PUBLICATION_STATUSES = new Map([
	["Draft", "draft"],
	["Review", "review"],
	["Published", "published"],
	["Archived", "archived"],
]);

export const VOTING_STATES = new Map([
	["Open", "open"],
	["Closed", "closed"],
]);
```

Return `{ schemaVersion: 2, fetchedAt, candidates }`. Reject missing content, empty or malformed slugs, unknown values, non-integer ordering, out-of-range progress, missing update dates when update text exists, and duplicate slugs. Do not filter `Draft`, `Review`, or `Archived` during normalization; publication policy owns visibility.

- [ ] **Step 4: Prove GREEN**

Run `npm run test:product-data`.

Expected: `Product data contract passed` with exit code 0.

- [ ] **Step 5: Commit normalization**

```bash
git add scripts/fixtures/github-project.json scripts/fixtures/github-releases.json scripts/check-product-data.mjs scripts/lib/github-product-data.mjs
git commit -m "feat: define roadmap publication candidates"
```

### Task 2: Implement the publication-policy merge

**Files:**
- Create: `scripts/lib/publication-policy.mjs`
- Modify: `scripts/check-product-data.mjs`

- [ ] **Step 1: Write the failing policy matrix**

Import `applyPublicationPolicy` and cover every transition:

```js
const previous = { schemaVersion: 2, contentUpdatedAt: "2026-07-13T10:00:00.000Z", items: [publishedApprentice] };

assert.throws(
	() => applyPublicationPolicy(previous, [draftCandidate]),
	{ message: "Published roadmap item cannot return to Draft: apprentice" },
);
assert.deepEqual(
	applyPublicationPolicy(previous, [unchangedApprenticePublished, newDraftCandidate]).items,
	previous.items,
);
assert.deepEqual(
	applyPublicationPolicy(previous, [unchangedApprenticePublished, newReviewCandidate]).items,
	previous.items,
);
assert.deepEqual(
	applyPublicationPolicy(previous, [{ ...changedApprentice, publicationStatus: "review" }]).items,
	[{ ...publishedApprentice, underReview: true }],
);
assert.equal(
	applyPublicationPolicy(previous, [{ ...changedApprentice, publicationStatus: "published" }]).items[0].title,
	changedApprentice.title,
);
assert.deepEqual(
	applyPublicationPolicy(previous, [{ ...changedApprentice, publicationStatus: "archived" }]).items,
	[],
);
assert.throws(() => applyPublicationPolicy(previous, []), /missing from Project source/i);
```

- [ ] **Step 2: Prove RED**

Run `npm run test:product-data`.

Expected: `ERR_MODULE_NOT_FOUND` for `scripts/lib/publication-policy.mjs`.

- [ ] **Step 3: Implement merge by stable slug**

Export:

```js
export function applyPublicationPolicy(previous, candidates) {
	const bySlug = new Map(candidates.map((candidate) => [candidate.slug, candidate]));
	const priorBySlug = new Map(previous.items.map((item) => [item.slug, item]));
	// New Draft/new Review stay hidden; published -> Draft and missing source fail;
	// existing Review preserves approved fields; Published replaces; Archived removes.
}
```

Copy only public fields into output. Never copy `publicationStatus`, archive reason, Project node IDs, labels, or internal metadata. A new `Draft` remains hidden, while a `Draft` candidate whose slug already exists in the public snapshot throws exactly `Published roadmap item cannot return to Draft: <slug>`. This rejection aborts dry-run and write synchronization before snapshot persistence, preserving the previous files byte-for-byte; maintainers use `Review` for changes and `Archived` for removal. For an existing `Review`, derive the result exclusively from the previous item and add `underReview: true`. A previous public slug missing from the Project source always fails. The only normal removal path is an explicit `Archived` candidate.

- [ ] **Step 4: Verify the full policy matrix**

Run `npm run test:product-data`.

Expected: PASS for new-Draft hiding, exact existing-Draft rejection, new Review, existing Review, Published, Archived, and missing-source protection.

- [ ] **Step 5: Commit policy**

```bash
git add scripts/lib/publication-policy.mjs scripts/check-product-data.mjs
git commit -m "feat: preserve approved roadmap state"
```

### Task 3: Enforce roadmap-to-release integrity

**Files:**
- Modify: `scripts/lib/github-product-data.mjs`
- Modify: `scripts/check-product-data.mjs`
- Modify: `scripts/fixtures/github-releases.json`

- [ ] **Step 1: Add failing cross-source assertions**

Add cases proving:

```js
assert.throws(
	() => validateSnapshot(shippedWithoutPublishedRelease, releases),
	/Shipped roadmap item has no published release: connected-actions/,
);
assert.throws(
	() => validateSnapshot(roadmap, releaseWithUnknownSlug),
	/Unknown roadmap slug in release v0.1.1056: missing-project/,
);
assert.throws(
	() => validateSnapshot(shippedLinkedOnlyFromDraft, releasesWithDraftLink),
	/Shipped roadmap item has no published release/,
);
```

- [ ] **Step 2: Prove RED**

Run `npm run test:product-data`.

Expected: the current implementation silently filters the unknown slug and accepts a shipped item without a link.

- [ ] **Step 3: Preserve and validate release references**

Parse `Roadmap: slug-a, slug-b` before matching it to roadmap records. Keep the parsed slugs in the normalized release and validate them afterward. Exclude drafts and prereleases before building the published-link index. Require every `shipped` item to appear in at least one published release.

- [ ] **Step 4: Prove GREEN and commit**

Run `npm run test:product-data`, then:

```bash
git add scripts/lib/github-product-data.mjs scripts/check-product-data.mjs scripts/fixtures/github-releases.json
git commit -m "feat: validate shipped roadmap releases"
```

### Task 4: Add semantic comparison and safe atomic storage

**Files:**
- Create: `scripts/lib/snapshot-store.mjs`
- Modify: `scripts/check-product-data.mjs`
- Modify: `scripts/sync-product-data.mjs`

- [ ] **Step 1: Write failing persistence contracts**

Test all of these before implementing:

```js
assert.equal(hasSemanticChanges(current, { ...current, checkedAt: tomorrow }), false);
assert.equal(hasSemanticChanges(current, changedVotes), true);
await assert.rejects(
	writeSnapshots(nonEmptyCurrent, emptyCandidate, paths),
	/refusing to replace 10 roadmap items with zero/i,
);
assert.equal(await readFile(paths.roadmapPath, "utf8"), originalRoadmap);
await assert.rejects(
	writeSnapshots(nonEmptyCurrent, invalidReleases, paths),
	/Unknown roadmap slug/,
);
```

- [ ] **Step 2: Prove RED**

Run `npm run test:product-data`.

Expected: missing `snapshot-store.mjs` or a timestamp-only result incorrectly reported as changed.

- [ ] **Step 3: Implement semantic content and two-file writes**

Export:

```js
export function semanticSnapshot(snapshot) {
	const { checkedAt, fetchedAt, ...publicContent } = snapshot;
	return publicContent;
}

export function hasSemanticChanges(current, candidate) {
	return JSON.stringify(semanticSnapshot(current)) !== JSON.stringify(semanticSnapshot(candidate));
}

export async function persistSnapshotPair(current, candidate, paths, { allowEmpty = false } = {}) {
	// validate both candidates, guard empty replacement, write both temp files,
	// then rename only after every precondition succeeds.
}
```

Set `contentUpdatedAt` only when public semantic content changes. A no-op must not rewrite either JSON file. Use deterministic ordering before comparison so GraphQL source order cannot cause a deployment.

- [ ] **Step 4: Refactor the CLI into dry-run and write modes**

Support exactly these flags:

```text
--dry-run     fetch, merge, validate, and print summary without writing
--write       persist only semantic changes
--allow-empty permit an intentional empty replacement; valid only with --write
```

Default to `--dry-run`. Exit non-zero if neither Project organization nor Project data is present. Print `NO_CHANGE`, `WOULD_CHANGE`, or `WROTE_CHANGE` so the workflow can report the result without parsing JSON.

- [ ] **Step 5: Prove GREEN and commit**

Run `npm run test:product-data`, then:

```bash
git add scripts/lib/snapshot-store.mjs scripts/sync-product-data.mjs scripts/check-product-data.mjs
git commit -m "feat: make roadmap snapshot writes safe"
```

### Task 5: Restore and migrate the last-known-good snapshots

**Files:**
- Modify: `src/data/roadmap.json`
- Modify: `src/data/releases.json`
- Modify: `src/lib/product-data.ts`
- Modify: `scripts/check-product-data.mjs`

- [ ] **Step 1: Add a failing checked-in snapshot assertion**

Assert that the repository snapshot is non-empty, version 2, and includes the known routes:

```js
assert.equal(checkedInRoadmap.schemaVersion, 2);
assert.ok(checkedInRoadmap.items.length >= 10);
for (const slug of ["apprentice", "shared-spaces", "connected-actions"]) {
	assert.ok(checkedInRoadmap.items.some((item) => item.slug === slug), `Missing ${slug}`);
}
```

- [ ] **Step 2: Prove RED**

Run `npm run test:product-data`.

Expected: schema version 1 and zero roadmap items.

- [ ] **Step 3: Restore the valid dataset and migrate it**

Inspect the known non-empty snapshot in commit `2b9975d`:

```bash
git show 2b9975d:src/data/roadmap.json
```

Apply a reviewed patch to `src/data/roadmap.json` that restores those records, changes `exploring` to `ideas`, removes `sourceStatus`, adds `underReview: false`, converts `community` to `voting`, and sets schema version 2. Preserve titles, descriptions, routes, order, progress, and approved public content. Do not invent new issue URLs; absent links remain absent until Project migration supplies them.

Migrate releases to schema version 2. Add the three already-approved shipped slugs (`connected-actions`, `model-freedom`, and `local-computer`) to the latest checked-in published release record so the last-known-good fallback satisfies the same invariant as future data. This is a migration projection of features already presented publicly as shipped, not a new delivery claim. The live synchronizer must still fail until the corresponding public GitHub release body contains the same `Roadmap:` references; the GitHub rollout plan adds and verifies those source links before live data can replace the fallback.

- [ ] **Step 4: Update website types**

Use:

```ts
export type RoadmapStatus = "ideas" | "next" | "building" | "shipped";
export type VotingState = "open" | "closed";

export interface RoadmapItem {
	slug: string;
	status: RoadmapStatus;
	underReview: boolean;
	voting: VotingState;
	votes: number;
	publicUpdate?: string;
	publicUpdateDate?: string;
}
```

Keep complete existing fields in the interface. Replace `communityIdeas` with `ideasOpenForVoting`, derived from `status === "ideas" && voting === "open"`.

- [ ] **Step 5: Build and commit**

Run:

```bash
npm run test:product-data
npm run build
```

Expected: both commands pass and `/roadmap/apprentice/` is generated again.

Commit:

```bash
git add src/data/roadmap.json src/data/releases.json src/lib/product-data.ts scripts/check-product-data.mjs
git commit -m "fix: restore the public roadmap snapshot"
```

### Task 6: Integrate Ideas and voting into the four-stage journey

**Files:**
- Modify: `src/components/roadmap/RoadmapJourney.astro`
- Modify: `src/components/roadmap/CommunityIdeas.astro`
- Modify: `src/pages/roadmap/index.astro`
- Modify: `src/pages/roadmap/[slug].astro`
- Modify: `scripts/check-roadmap-pages.mjs`

- [ ] **Step 1: Make the page contract fail on the approved experience**

Assert the built roadmap contains `Ideas`, `Vote on GitHub`, `Suggest an idea`, and an idea vote count, contains exactly one `Suggest an idea`, and no longer contains `Exploring`. Assert the apprentice detail includes the stable public update date and an `Under review` badge when fixture data sets the flag.

- [ ] **Step 2: Prove RED**

Run:

```bash
npm run build
npm run test:roadmap
```

Expected: failure because the current journey labels the stage `Exploring` and renders community ideas separately below it.

- [ ] **Step 3: Render Ideas as the first journey stage**

Change the stage definition to:

```ts
const stages = [
	{ key: "ideas", title: "Ideas", subtitle: "Ideas we are evaluating with the community" },
	{ key: "next", title: "Next", subtitle: "Directions we intend to pursue" },
	{ key: "building", title: "Building", subtitle: "Active product work" },
	{ key: "shipped", title: "Shipped", subtitle: "Available in Homun" },
] as const;
```

For Ideas cards, render the thumbs-up count and explicit links for `Vote on GitHub` and discussion when `sourceUrl` exists. Render `Under review` without leaking candidate fields. Keep the full-card detail link but ensure action links are separate accessible anchors.

- [ ] **Step 4: Make `CommunityIdeas` a participation control**

Remove its independent list of idea cards. Make it accept a compact mode used inside the Ideas stage header/footer and link directly to:

```text
https://github.com/homun-app/homun/issues/new?template=roadmap-idea.yml
```

Remove the lower duplicate component from `src/pages/roadmap/index.astro` while retaining release history.

- [ ] **Step 5: Update detail pages**

Display `publicUpdateDate` rather than the issue `updatedAt`. Show voting only for open Ideas. Preserve product problem, intended value, capabilities, target direction, and release links. Do not render publication state, archive reason, internal labels, or Project identifiers.

- [ ] **Step 6: Verify and commit**

Before committing, start the site locally and visually check `/roadmap/` at 1440x900 and 390x844 plus `/roadmap/apprentice/` at 390x844. Confirm that the four stages stay legible, Ideas actions do not overlap the card link, there is one proposal entry point, and no horizontal overflow appears. Save temporary screenshots outside the repository; do not commit them.

Run:

```bash
npm run build
npm run test:roadmap
npm run test:product-data
```

Expected: all pass.

Commit:

```bash
git add src/components/roadmap/RoadmapJourney.astro src/components/roadmap/CommunityIdeas.astro src/pages/roadmap/index.astro 'src/pages/roadmap/[slug].astro' scripts/check-roadmap-pages.mjs
git commit -m "feat: add community ideas to the roadmap journey"
```

### Task 7: Make the workflow no-op safe and recovery explicit

**Files:**
- Modify: `.github/workflows/sync-product-data.yml`
- Modify: `scripts/check-product-data.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add failing workflow text contracts**

Require manual input and explicit write mode:

```js
for (const required of [
	"allow_empty:",
	"npm run sync:product-data -- --write",
	"--allow-empty",
	"repository_dispatch:",
	"types: [product-data-sync]",
]) assert.ok(workflow.includes(required), `Workflow missing: ${required}`);
```

Also assert that scheduled/repository-dispatch runs cannot activate `--allow-empty`.

- [ ] **Step 2: Prove RED**

Run `npm run test:product-data`.

Expected: missing `allow_empty` and `--write`.

- [ ] **Step 3: Implement guarded workflow input**

Use a boolean manual input and two separate steps:

```yaml
on:
  workflow_dispatch:
    inputs:
      allow_empty:
        description: Replace a non-empty roadmap with an intentionally empty one
        required: false
        type: boolean
        default: false

- name: Synchronize roadmap and releases
  if: ${{ github.event_name != 'workflow_dispatch' || !inputs.allow_empty }}
  run: npm run sync:product-data -- --write

- name: Synchronize with explicit empty recovery
  if: ${{ github.event_name == 'workflow_dispatch' && inputs.allow_empty }}
  run: npm run sync:product-data -- --write --allow-empty
```

Keep the existing `git diff --quiet` gate. Because the CLI no longer rewrites timestamp-only snapshots, a no-op produces no commit and no downstream Docker deployment.

- [ ] **Step 4: Verify and commit**

Run `npm run test:product-data` and commit:

```bash
git add .github/workflows/sync-product-data.yml scripts/check-product-data.mjs package.json
git commit -m "ci: guard roadmap synchronization writes"
```

### Task 8: Prove the real Docker delivery seam

**Files:**
- Create: `scripts/check-container-runtime.mjs`
- Modify: `package.json`
- Modify: `scripts/check-container-deployment.mjs`

- [ ] **Step 1: Add the runtime check command before its implementation**

Add:

```json
"test:container-runtime": "node scripts/check-container-runtime.mjs"
```

Run `npm run test:container-runtime`.

Expected: `ERR_MODULE_NOT_FOUND` because the script does not exist.

- [ ] **Step 2: Implement a disposable image-and-nginx smoke**

The script must:

1. build `homun-website-roadmap-smoke:${process.pid}` from the repository Dockerfile;
2. run it on an automatically selected host port;
3. poll `/health`, `/roadmap/`, and `/roadmap/apprentice/` for at most 30 seconds;
4. require HTTP 200 and verify `Ideas` plus `The Apprentice` in returned HTML;
5. always remove the container and image in `finally`.

Use `spawn` with argument arrays, not shell interpolation. Skip only when Docker itself is unavailable, and print `SKIP: Docker unavailable`; any build or runtime failure when Docker is available must exit non-zero.

- [ ] **Step 3: Run the actual container smoke**

Run:

```bash
npm run test:container
npm run test:container-runtime
```

Expected: static contract PASS and live nginx image PASS with all three routes returning 200.

- [ ] **Step 4: Commit runtime proof**

```bash
git add scripts/check-container-runtime.mjs scripts/check-container-deployment.mjs package.json
git commit -m "test: verify roadmap in the Docker image"
```

### Task 9: Final local verification and handoff checkpoint

**Files:**
- Verify only; do not modify unrelated files.

- [ ] **Step 1: Run the complete relevant suite**

```bash
npm run test:product-data
npm run build
npm run test:roadmap
npm run test:container
npm run test:container-runtime
git diff --check
git status --short
```

Expected: all tests pass; the worktree is clean; no file under `homepage-redesign` is touched.

- [ ] **Step 2: Exercise a no-op locally**

With valid GitHub secrets exported, run:

```bash
npm run sync:product-data -- --dry-run
git status --short
```

Expected after Project migration: output `NO_CHANGE` and no changed snapshots. Before Project migration, failure is safer than accepting zero items and must leave the worktree clean.

- [ ] **Step 3: Stop before public integration**

Do not merge, push, enable workflow writes, or modify public Project/Release data in this task. Report the commits and verification evidence, then continue with `2026-07-14-roadmap-project-rollout.md` only after the user confirms the public rollout checkpoint.
