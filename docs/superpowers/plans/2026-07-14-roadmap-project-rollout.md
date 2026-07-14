# GitHub Roadmap Project Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the public GitHub operating model behind Homun's roadmap: moderated idea submissions, advisory thumbs-up voting, explicit publication review, published-release evidence, and reliable website synchronization triggers.

**Architecture:** The public `homun-app/homun` repository owns structured idea issues, one organization Project owns public curation fields, and `homun-app/homun-releases` emits a repository dispatch only after a release is actually published. A tested rollout CLI in the website repository inventories and migrates Project data by stable slug, defaults to dry-run, and requires `--apply` for public writes.

**Tech Stack:** GitHub Issue Forms, GitHub Projects v2, GitHub GraphQL API, GitHub CLI, Node.js ESM, GitHub Actions, repository dispatch events.

---

## Authorization and working boundary

This plan includes public external changes. Local preparation and dry-runs are safe to execute, but these steps require an explicit user checkpoint immediately before they run:

- pushing branches or opening pull requests in `homun-app/homun` and `homun-app/homun-releases`;
- changing Project fields or Project items with `--apply`;
- editing published GitHub Release notes;
- creating or changing repository secrets;
- manually dispatching the website workflow with writes enabled.

Use these local paths:

```text
/Users/fabio/Projects/Homun/github-rollout/homun
/Users/fabio/Projects/Homun/github-rollout/homun-releases
/Users/fabio/Projects/Homun/website/.worktrees/roadmap-governance-sync
```

Use branches `fabio/roadmap-idea-submissions` and `fabio/release-roadmap-dispatch` in the two external repositories. Never add a `Co-Authored-By` trailer.

## Target file structure

- Create `homun/.github/ISSUE_TEMPLATE/roadmap-idea.yml`: structured public proposal form.
- Modify `homun/.github/ISSUE_TEMPLATE/config.yml`: route product ideas to the form while retaining security and documentation contacts.
- Create `homun-releases/.github/workflows/notify-website-product-sync.yml`: dispatch after a release is published.
- Create `website/scripts/roadmap-project-rollout.mjs`: Project inventory, field validation, migration planning, and opt-in application.
- Create `website/scripts/fixtures/roadmap-project-inventory.json`: representative Project field/item inventory.
- Create `website/scripts/check-roadmap-project-rollout.mjs`: dry-run and migration contracts.
- Create `website/docs/roadmap-operations.md`: maintainer procedure for moderation, review transitions, archiving, and release linkage.
- Modify `website/package.json`: expose the Project rollout check and CLI.
- Modify published release notes only through GitHub after the local/data dry-run is approved.

### Task 1: Prepare read-only GitHub access and isolated repositories

**Files:**
- Create local clone: `/Users/fabio/Projects/Homun/github-rollout/homun`
- Create local clone: `/Users/fabio/Projects/Homun/github-rollout/homun-releases`

- [ ] **Step 1: Verify current authentication without changing scopes**

Run:

```bash
gh auth status
gh repo view homun-app/homun --json nameWithOwner,defaultBranchRef,viewerPermission
gh repo view homun-app/homun-releases --json nameWithOwner,defaultBranchRef,viewerPermission
gh repo view homun-app/website --json nameWithOwner,defaultBranchRef,viewerPermission
```

Expected: all three repositories resolve. Record whether the current identity has write/admin permission; do not infer it from local Git credentials.

- [ ] **Step 2: Verify Project scope read-only**

Run:

```bash
gh project list --owner homun-app --format json
```

Expected: the organization Project list is returned. If GitHub reports missing `read:project`, stop and ask the user before running `gh auth refresh -s read:project,project`; scope expansion is not implicit.

- [ ] **Step 3: Clone and branch in isolated folders**

Run:

```bash
mkdir -p /Users/fabio/Projects/Homun/github-rollout
git clone https://github.com/homun-app/homun.git /Users/fabio/Projects/Homun/github-rollout/homun
git clone https://github.com/homun-app/homun-releases.git /Users/fabio/Projects/Homun/github-rollout/homun-releases
git -C /Users/fabio/Projects/Homun/github-rollout/homun switch -c fabio/roadmap-idea-submissions
git -C /Users/fabio/Projects/Homun/github-rollout/homun-releases switch -c fabio/release-roadmap-dispatch
```

Expected: both branches are local and neither repository has uncommitted files.

### Task 2: Add the moderated idea submission form

**Files:**
- Create: `/Users/fabio/Projects/Homun/github-rollout/homun/.github/ISSUE_TEMPLATE/roadmap-idea.yml`
- Modify: `/Users/fabio/Projects/Homun/github-rollout/homun/.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create the form with the approved moderation boundary**

Use this complete structure:

```yaml
name: Product idea
description: Suggest a user problem or direction for Homun to explore
title: "[Idea]: "
labels:
  - idea
body:
  - type: markdown
    attributes:
      value: |
        Thanks for helping shape Homun. Ideas are reviewed before they appear on the public roadmap. Votes are advisory and do not create delivery commitments.
  - type: textarea
    id: problem
    attributes:
      label: What problem would this solve?
      description: Describe the situation and who experiences it.
      placeholder: When I am..., I need..., because...
    validations:
      required: true
  - type: textarea
    id: value
    attributes:
      label: What would become easier or possible?
      description: Focus on the user outcome rather than a technical implementation.
    validations:
      required: true
  - type: textarea
    id: current_alternative
    attributes:
      label: What do you do today?
      description: Share any workaround or alternative you currently use.
    validations:
      required: false
  - type: dropdown
    id: area
    attributes:
      label: Product area
      options:
        - Agent
        - Apps
        - Automations
        - Chat
        - Collaboration
        - Input
        - Local computer
        - Models
        - Plugins
        - Other
    validations:
      required: true
  - type: checkboxes
    id: checks
    attributes:
      label: Before submitting
      options:
        - label: I searched existing issues and did not find the same idea.
          required: true
        - label: I understand this proposal may be merged, archived, or kept off the public roadmap after moderation.
          required: true
```

- [ ] **Step 2: Update the chooser configuration**

Keep `blank_issues_enabled: false`. Remove only the feature-request Discussion contact link. Keep the security and documentation/help links unchanged; the new issue form automatically appears in the chooser.

- [ ] **Step 3: Validate YAML and required semantics**

Run from the Homun clone:

```bash
ruby -e 'require "yaml"; Dir[".github/ISSUE_TEMPLATE/*.{yml,yaml}"].each { |f| YAML.load_file(f); puts "valid #{f}" }'
rg -n "Votes are advisory|reviewed before|id: problem|id: value|id: area" .github/ISSUE_TEMPLATE/roadmap-idea.yml
git diff --check
```

Expected: every template parses; the five required strings are found; no whitespace errors.

- [ ] **Step 4: Commit locally**

```bash
git add .github/ISSUE_TEMPLATE/roadmap-idea.yml .github/ISSUE_TEMPLATE/config.yml
git commit -m "feat: add moderated roadmap idea form"
```

Do not push yet.

### Task 3: Dispatch website synchronization on published releases

**Files:**
- Create: `/Users/fabio/Projects/Homun/github-rollout/homun-releases/.github/workflows/notify-website-product-sync.yml`

- [ ] **Step 1: Add the release-published workflow**

Use:

```yaml
name: Notify website of published release

on:
  release:
    types: [published]

permissions:
  contents: read

jobs:
  notify:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Dispatch product data synchronization
        env:
          GH_TOKEN: ${{ secrets.WEBSITE_PRODUCT_SYNC_TOKEN }}
          RELEASE_TAG: ${{ github.event.release.tag_name }}
        run: |
          gh api --method POST \
            repos/homun-app/website/dispatches \
            -f event_type=product-data-sync \
            -f "client_payload[release_tag]=$RELEASE_TAG"
```

The secret must be a fine-grained token or GitHub App token able to send repository dispatches to `homun-app/website`. Do not reuse the Project read token unless its scope and rotation policy already match.

- [ ] **Step 2: Add a structural contract before publishing**

Run:

```bash
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/notify-website-product-sync.yml"); puts "valid workflow"'
rg -n "types: \[published\]|WEBSITE_PRODUCT_SYNC_TOKEN|product-data-sync|homun-app/website" .github/workflows/notify-website-product-sync.yml
git diff --check
```

Expected: YAML parses and all four dispatch-boundary strings are found.

- [ ] **Step 3: Commit locally**

```bash
git add .github/workflows/notify-website-product-sync.yml
git commit -m "ci: sync website after release publication"
```

Do not push or create the secret yet.

### Task 4: Build a dry-run-first Project migration tool

**Files:**
- Create: `/Users/fabio/Projects/Homun/website/.worktrees/roadmap-governance-sync/scripts/fixtures/roadmap-project-inventory.json`
- Create: `/Users/fabio/Projects/Homun/website/.worktrees/roadmap-governance-sync/scripts/check-roadmap-project-rollout.mjs`
- Create: `/Users/fabio/Projects/Homun/website/.worktrees/roadmap-governance-sync/scripts/roadmap-project-rollout.mjs`
- Create: `/Users/fabio/Projects/Homun/website/.worktrees/roadmap-governance-sync/docs/roadmap-operations.md`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/roadmap-governance-sync/package.json`

- [ ] **Step 1: Write a failing inventory/migration contract**

The fixture must include old `Status`, `Public`, and the approved v2 fields plus representative items. Assert:

```js
const plan = buildMigrationPlan(inventory, restoredRoadmap);
assert.deepEqual(plan.fieldsToCreate.map((field) => field.name), [
	"Public status",
	"Publication status",
	"Public update date",
	"Voting",
	"Archive reason",
]);
assert.deepEqual(plan.items.find((item) => item.slug === "shared-spaces").set, {
	"Public status": "Ideas",
	"Publication status": "Published",
	Voting: "Open",
});
assert.equal(plan.items.find((item) => item.slug === "apprentice").set["Public status"], "Building");
assert.throws(() => buildMigrationPlan(inventoryWithDuplicateSlug, restoredRoadmap), /duplicate slug/i);
assert.throws(() => buildMigrationPlan(inventoryMissingPublicItem, restoredRoadmap), /missing Project item/i);
```

- [ ] **Step 2: Prove RED**

Add these package scripts:

```json
"test:roadmap-rollout": "node scripts/check-roadmap-project-rollout.mjs",
"roadmap:project-rollout": "node scripts/roadmap-project-rollout.mjs"
```

Run `npm run test:roadmap-rollout`.

Expected: module-not-found failure for the rollout implementation.

- [ ] **Step 3: Implement read-only inventory and deterministic planning**

The CLI must query Project metadata and items with `gh api graphql`, or use an injected executor in tests. It must support exactly:

```text
--project-number <integer>   required; use the value already configured for website sync
--inventory <path>           optional offline inventory input
--dry-run                    default; print field/item operations without mutation
--apply                      perform the displayed operations after confirmation
```

Export `buildMigrationPlan` as a pure function. Match items by stable slug, never title. Fail on missing/duplicate slugs, unknown status values, more than one featured Building item, or any proposed empty public result.

- [ ] **Step 4: Implement idempotent Project mutations**

For `--apply`, create absent fields with the GitHub CLI:

```bash
gh project field-create "$PROJECT_NUMBER" --owner homun-app --name "Public status" --data-type SINGLE_SELECT --single-select-options "Ideas,Next,Building,Shipped"
gh project field-create "$PROJECT_NUMBER" --owner homun-app --name "Publication status" --data-type SINGLE_SELECT --single-select-options "Draft,Review,Published,Archived"
gh project field-create "$PROJECT_NUMBER" --owner homun-app --name "Public update date" --data-type DATE
gh project field-create "$PROJECT_NUMBER" --owner homun-app --name "Voting" --data-type SINGLE_SELECT --single-select-options "Open,Closed"
gh project field-create "$PROJECT_NUMBER" --owner homun-app --name "Archive reason" --data-type TEXT
```

Use `gh project item-edit` with resolved Project, item, field, and option IDs for item updates. Re-fetch after mutation and require that the resulting inventory produces no remaining operations. Do not delete old fields during this rollout; leave `Public` and the old status field available for rollback until the website has completed one successful no-op reconciliation.

- [ ] **Step 5: Prove GREEN and commit**

Before committing, create `docs/roadmap-operations.md` with these exact operational rules:

1. A new `idea` issue remains outside the Project until a maintainer checks duplicates, fit, clarity, and safety.
2. The maintainer adds an accepted proposal to the Project and sets `Publication status: Draft` before setting any other public field. A temporary missing required field is allowed to fail synchronization and preserve the old snapshot; it must never be inferred as Published.
3. First publication requires complete `Slug`, `Area`, `Public status: Ideas`, `Voting`, `Order`, and public copy, followed by `Publication status: Published`.
4. Promotion to Next, Building, or Shipped requires `Review` first. During Review the website keeps the last approved record and shows only `Under review`.
5. Shipped requires a verified `Roadmap: slug` line in a non-draft, non-prerelease release before returning to Published.
6. Removal uses `Archived` plus `Archive reason`; deleting or merely removing an item from the Project is an error.
7. Votes are advisory and never move, order, feature, or publish an item automatically.

Run:

```bash
npm run test:roadmap-rollout
npm run test:product-data
git diff --check
```

Expected: both suites pass.

Commit:

```bash
git add package.json scripts/fixtures/roadmap-project-inventory.json scripts/check-roadmap-project-rollout.mjs scripts/roadmap-project-rollout.mjs docs/roadmap-operations.md
git commit -m "feat: add guarded roadmap Project migration"
```

### Task 5: Produce and review the live migration dry-run

**Files:**
- Read only: live organization Project
- Read only: `src/data/roadmap.json`

- [ ] **Step 1: Identify the configured Project number without exposing secrets**

Use the value already installed as `HOMUN_PROJECT_NUMBER` for the website workflow. If it is not available locally, list organization Projects after obtaining approved `read:project` scope and match the live roadmap by its visible title and items. Never print token values.

- [ ] **Step 2: Inventory the Project and run the migration dry-run**

Run:

```bash
npm run roadmap:project-rollout -- --project-number "$HOMUN_PROJECT_NUMBER" --dry-run
```

Expected: a non-empty plan with field creations/updates, no duplicate or missing stable slugs, `Exploring -> Ideas`, `Public: Yes -> Publication status: Published`, and voting open only for approved Ideas.

- [ ] **Step 3: Compare every public route**

Require the dry-run report to account for at least these restored public slugs:

```text
apprentice
marketplace
long-horizon
mobile-companion
chat-branching
shared-spaces
voice-capture
connected-actions
model-freedom
local-computer
```

For any Project item not present in the restored public snapshot, default to `Publication status: Draft`; do not publish it by inference.

- [ ] **Step 4: Present the public-write checkpoint**

Show the user:

- fields that will be created;
- items that will become Published, Draft, or Archived;
- release notes that need `Roadmap:` lines;
- the two local commits waiting to be pushed;
- any requested token scopes/secrets.

Stop for explicit confirmation before Task 6.

### Task 6: Apply the approved GitHub rollout

**Files/external state:**
- Organization Project fields/items
- `homun-app/homun` branch and pull request
- `homun-app/homun-releases` branch and pull request
- Published Release notes in `homun-app/homun-releases`
- `WEBSITE_PRODUCT_SYNC_TOKEN` secret in `homun-app/homun-releases`

- [ ] **Step 1: Push the reviewed repository branches**

```bash
gh label create idea --repo homun-app/homun --description "Community product idea awaiting roadmap moderation" --color 0E8A16 --force
git -C /Users/fabio/Projects/Homun/github-rollout/homun push -u origin fabio/roadmap-idea-submissions
git -C /Users/fabio/Projects/Homun/github-rollout/homun-releases push -u origin fabio/release-roadmap-dispatch
```

The label creation is part of this approved public-write checkpoint and ensures the issue form does not reference a missing label. Open focused pull requests, merge only through the user's normal repository policy, and verify the issue form appears in the public chooser after merge.

- [ ] **Step 2: Configure the release-dispatch credential**

Create `WEBSITE_PRODUCT_SYNC_TOKEN` in `homun-app/homun-releases` using an approved fine-grained token or GitHub App credential. Grant only the target repository permission needed for dispatch. Do not print, copy into a file, or commit the credential.

- [ ] **Step 3: Apply and re-verify Project migration**

Run:

```bash
npm run roadmap:project-rollout -- --project-number "$HOMUN_PROJECT_NUMBER" --apply
npm run roadmap:project-rollout -- --project-number "$HOMUN_PROJECT_NUMBER" --dry-run
```

Expected: apply succeeds and the second command reports zero remaining Project operations.

- [ ] **Step 4: Add stable roadmap links to published releases**

Edit release bodies through `gh release edit --repo homun-app/homun-releases`. Use one exact metadata line per relevant published release:

```text
Roadmap: connected-actions, model-freedom, local-computer
```

Split slugs across their actual first published versions if release history proves different versions. Do not attach a slug to a version without confirming the feature was available in that release. Keep all existing release notes and assets intact.

- [ ] **Step 5: Verify the public sources**

Check that:

- the Project returns at least ten Published items;
- every Published item has one stable unique slug;
- no Draft or new Review item enters the public candidate set;
- every Shipped slug appears in a non-draft, non-prerelease release body;
- the idea form creates issues with the `idea` label;
- the release-published workflow is present on the default branch.

### Task 7: Enable synchronization and prove no-op deployment behavior

**Files/external state:**
- Website GitHub Actions
- Website snapshots and resulting deployment

- [ ] **Step 1: Run a website dry-run against live data**

From the website worktree with the approved Project token exported:

```bash
npm run sync:product-data -- --dry-run
```

Expected: `WOULD_CHANGE` with a non-empty candidate on the first v2 rollout. Inspect the summary and route list before allowing a write.

- [ ] **Step 2: Run all local delivery checks before enabling the workflow**

```bash
npm run test:roadmap-rollout
npm run test:product-data
npm run build
npm run test:roadmap
npm run test:container-runtime
```

Expected: all pass, including real nginx delivery of `/roadmap/` and `/roadmap/apprentice/`.

- [ ] **Step 3: Perform the first controlled write**

Run `npm run sync:product-data -- --write` locally or manually dispatch `Sync public product data` with `allow_empty: false`. Review and commit the resulting semantic snapshot change through the normal website branch/PR workflow.

- [ ] **Step 4: Prove the second run is a no-op**

Run the same sync again without changing Project votes/content:

```bash
npm run sync:product-data -- --write
git status --short
```

Expected: `NO_CHANGE`, a clean worktree, no sync commit, and therefore no new Docker deployment caused by reconciliation alone.

- [ ] **Step 5: Prove release dispatch without publishing a fake release**

Use `workflow_dispatch` only if a manual test hook was separately approved; otherwise verify the next real published release. Confirm the `release: published` workflow sends `product-data-sync`, the website workflow completes, and either a semantic snapshot commit is created or the run reports a true no-op.

- [ ] **Step 6: Retain rollback fields for one observation window**

Keep the legacy Project `Public`/old status fields for at least one successful scheduled reconciliation after production verification. Remove them only in a later explicit cleanup after the user confirms the v2 roadmap is stable.
