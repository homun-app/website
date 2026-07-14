# Roadmap Governance, Community Ideas, and Safe Publishing Design

**Date:** 2026-07-14
**Status:** Approved
**Extends:** `2026-07-13-living-roadmap-github-design.md`

## Purpose

Turn the existing GitHub-backed Homun roadmap into a reliable operating system for
public product direction. The design separates public commitments from internal
engineering work, adds moderated community ideas and voting, and prevents invalid or
unchanged synchronization runs from creating website commits and Docker deployments.

The public journey remains intentionally simple:

`Ideas -> Next -> Building -> Shipped`

## Approved decisions

- One organization-level GitHub Project is the source of truth for the public product
  roadmap.
- `docs/roadmap.md` in `homun-core` remains the detailed internal engineering roadmap
  and is never published automatically.
- GitHub Issues hold initiative content, discussion, and thumbs-up votes.
- GitHub Releases are the evidence for shipped work and the source of the public
  changelog.
- Homun.app is a validated, curated projection of GitHub data, not an editable board.
- Docker only builds and deploys the website after a real public-data change.
- Routine public updates synchronize automatically. Public commitments require an
  explicit review step in the GitHub Project.
- Anyone may propose an idea. A maintainer moderates it before it appears publicly.
- Votes inform prioritization but never promote an idea automatically.

## Source-of-truth boundaries

| Surface | Responsibility | Must not own |
| --- | --- | --- |
| GitHub Project | Public status, publication state, order, progress, target direction, public update | Internal task execution |
| GitHub Issues | Product problem, intended value, capabilities, discussion, reactions | Delivery promises |
| `homun-core/docs/roadmap.md` | Internal technical sequencing and current implementation work | Public community voting |
| GitHub Releases | Published versions, assets, release notes, shipped-roadmap links | Future commitments |
| Website snapshots | Last-known-good public projection | Manually authored roadmap truth |
| Docker deployment | Static build and nginx delivery | Roadmap or approval logic |

Engineering issues may be linked from a public initiative, but repository-level tasks,
assignees, estimates, private dates, and internal notes never enter the website
snapshot.

## GitHub Project model

The existing binary `Public` field is replaced by a publication lifecycle that can
preserve the previously approved website state.

### Public status

| Value | Meaning |
| --- | --- |
| `Ideas` | Moderated proposal open for evaluation or voting |
| `Next` | Product direction Homun intends to pursue |
| `Building` | Active product work, not merely open engineering issues |
| `Shipped` | Available in a published Homun release |

### Publication status

| Value | Website behavior |
| --- | --- |
| `Draft` | Never public |
| `Review` | Preserve the previously published item; a new item stays hidden |
| `Published` | Publish the current approved representation |
| `Archived` | Remove from the main roadmap while preserving the issue and history |

Maintainers must set an already published item to `Review` before changing a sensitive
field. After reviewing the complete candidate, they set it back to `Published`.
Setting an item to `Archived` is itself the explicit approval to remove it.

Sensitive changes are:

- first publication;
- movement to `Next`, `Building`, or `Shipped`;
- target-release changes;
- featured-project changes;
- removal from the public roadmap.

Description, progress, vote count, and public-update text may synchronize while the
item remains `Published`.

### Required fields

| Field | Type | Purpose |
| --- | --- | --- |
| `Public status` | Single select | `Ideas`, `Next`, `Building`, or `Shipped` |
| `Publication status` | Single select | `Draft`, `Review`, `Published`, or `Archived` |
| `Area` | Single select | Public product grouping and filter |
| `Slug` | Text | Stable website route and release-link identifier |
| `Featured` | Single select | Select at most one featured `Building` initiative |
| `Progress` | Number | Public 0-100 progress indication |
| `Target release` | Text | Optional direction, never a contractual promise |
| `Public update` | Text | Short plain-language status update |
| `Public update date` | Date | Stable displayed update date, independent of comments |
| `Voting` | Single select | `Open` or `Closed` |
| `Order` | Number | Curated order inside a public status |
| `Archive reason` | Text | Maintainer explanation retained in GitHub |

## Idea submission, moderation, and voting

1. A visitor opens a structured GitHub issue form from `Suggest an idea`.
2. The issue is added to the Project as `Draft`.
3. A maintainer checks clarity, duplicates, fit with Homun, safety, and whether the
   proposal describes user value rather than an implementation request.
4. A rejected or duplicate proposal becomes `Archived` with an archive reason.
5. An accepted proposal receives a stable slug, area, `Public status: Ideas`, voting
   state, public order, and `Publication status: Published`.
6. The website displays the idea, its thumbs-up reaction count, `Vote on GitHub`, and
   a discussion link.
7. Votes remain advisory. No threshold or ranking rule changes the roadmap status.
8. To promote an idea, a maintainer moves it through `Review`, updates its public
   direction, changes it to `Next`, and then returns it to `Published`.

GitHub participation requires a GitHub account. Viewing the roadmap and using Homun
remain registration-free.

## Public website experience

The existing four-stage journey is retained, with `Exploring` renamed to `Ideas`:

`Ideas -> Next -> Building -> Shipped`

The `Ideas` column uses the same card language as the rest of the roadmap and adds:

- thumbs-up vote count;
- `Vote on GitHub`;
- discussion link;
- optional `Under review` badge for a public item being evaluated;
- a visible `Suggest an idea` entry point.

Current exploring initiatives such as shared spaces and voice capture migrate to
`Ideas` when they pass moderation. Archived items do not appear in the primary journey.
The site does not add a fifth column or expose moderation queues.

Project detail pages show the product problem, user value, intended capabilities,
status, progress, public update, votes, discussion, target direction, and related
published releases. Internal engineering tasks remain absent.

## Release relationship

Published release notes use a stable line such as:

```text
Roadmap: apprentice, connected-actions
```

The synchronizer resolves each slug against the public roadmap. A release may publish
without a roadmap link, but an initiative cannot publish as `Shipped` unless at least
one non-draft, non-prerelease release references its slug.

The synchronizer reports a release that references an unknown slug. It does not change
an initiative to `Shipped` automatically; the maintainer still performs the explicit
review and publication transition.

## Synchronization pipeline

The website remains a static Astro build. Authentication and GitHub API access stay in
the synchronization job.

1. Fetch Project items, issue content, reactions, and published Releases.
2. Normalize them into versioned candidate records.
3. Apply publication rules by stable slug:
   - ignore `Draft` items;
   - retain the previous published record for `Review` items;
   - use the candidate for `Published` items;
   - remove `Archived` items from the public result.
4. Validate the complete candidate and its release relationships.
5. Compare semantic public content with the checked-in snapshots.
6. Atomically replace snapshots only when validation passes.
7. Commit and push only when semantic public content changed.
8. Let the existing Docker deployment rebuild from that commit.

Synchronization runs after a published release, by manual dispatch, and on a scheduled
reconciliation cadence. Scheduled checks are recovery, not a reason to redeploy.

`syncedAt`, check timestamps, temporary request metadata, and source ordering that does
not affect the curated public order are excluded from the semantic comparison. The
website displays the last public content update, not every no-op reconciliation time.

Vote-count changes are semantic public changes and may update the static snapshot on
the scheduled cadence.

For an existing item in `Review`, the public record may add only an `underReview: true`
presentation flag. Unapproved title, description, status, progress, target, ordering,
or release changes remain absent until publication. A new item in `Review` has no
previous public record and therefore remains invisible.

## Failure behavior

- A candidate with zero public roadmap items cannot replace a non-empty snapshot unless
  a maintainer uses an explicit allow-empty recovery action.
- A missing Project, wrong Project number, insufficient token scope, or missing
  organization data fails synchronization and preserves the previous snapshot.
- Unknown statuses, missing slugs, duplicate slugs, invalid progress, multiple featured
  items, and invalid publication states fail before any write.
- A `Review` item never disappears if a published version with the same slug exists.
- A new `Review` item stays hidden until it becomes `Published`.
- A `Shipped` item without a linked published release fails validation.
- Draft and prerelease GitHub Releases never satisfy the shipped invariant.
- A release with an unknown roadmap slug remains visible in the changelog only after
  the unresolved reference is reported; it cannot satisfy a shipped link.
- GitHub unavailability never replaces the last-known-good snapshots.
- A no-op semantic result produces no commit and therefore no Docker deployment.

## Component boundaries

- `roadmap-source`: fetch Project fields, issue content, and reaction counts.
- `release-source`: fetch published Releases and assets.
- `product-data-normalizer`: convert GitHub responses into stable candidate records.
- `publication-policy`: merge candidates with the last published snapshot using
  publication status and slug.
- `product-data-validator`: enforce schema, cardinality, state, and cross-source rules.
- `semantic-diff`: ignore operational timestamps and detect actual public changes.
- `snapshot-writer`: atomically replace both snapshots after full validation.
- `product-data`: expose ordered, validated domain records to Astro.
- `RoadmapJourney` and `ProjectCard`: render the four public stages consistently.
- `CommunityIdeas`: render voting and proposal entry points without owning data access.
- `sync-product-data` workflow: schedule, manual/release triggers, reporting, and commit.
- Dockerfile/nginx image: build and serve static output only.

Each UI component receives validated local records and has no GitHub credentials or
knowledge of GraphQL response shapes.

## Migration and rollout

The field and state migration must not run against the public site as one unguarded
step:

1. Pause automatic snapshot commits while keeping the current website available.
2. Restore or preserve the last non-empty valid roadmap snapshot.
3. Create the new Project fields and the structured idea issue form.
4. Map existing public items from `Exploring` to `Ideas` and from `Public: Yes` to
   `Publication status: Published`; assign stable slugs before enabling the new reader.
5. Run the new synchronizer in dry-run mode and compare its proposed public records and
   routes with the preserved snapshot.
6. Populate required release links for every initiative intended to remain `Shipped`.
7. Enable snapshot writes only after the dry run, data contracts, page build, and
   container smoke pass.
8. Re-enable scheduled reconciliation and verify the first no-op run creates no commit.

This sequence prevents a partially configured or empty Project from replacing the
public roadmap during migration.

## Verification

### Data contracts

- Normalize each public and publication status from fixed fixtures.
- Prove that `Draft`, new `Review`, existing `Review`, `Published`, and `Archived`
  produce the specified public result.
- Reject empty replacement of a non-empty snapshot.
- Reject invalid fields and multiple featured items.
- Verify that a no-op sync with a new check timestamp produces no file diff.
- Verify vote changes remain semantic.
- Verify shipped-to-release linking, including draft-release and unknown-slug failures.
- Prove failed validation leaves both previous snapshot files byte-for-byte intact.

### Website contracts

- Build roadmap, detail pages, changelog, and RSS from representative snapshots.
- Assert the journey labels are `Ideas`, `Next`, `Building`, and `Shipped`.
- Assert idea cards expose votes, GitHub voting, discussion, and idea submission.
- Assert archived and draft records generate no public route.
- Check empty states without allowing an unexpected empty production replacement.
- Check desktop, tablet, mobile, keyboard navigation, focus, contrast, and reduced motion.

### Deployment contracts

- Build the production Docker image.
- Run the nginx container and request roadmap, detail, changelog, and static assets.
- Verify a no-op synchronization creates no commit and no deployment trigger.
- After rollout, verify the live site and the GitHub Actions run rather than relying only
  on local output.

The current baseline has a known failing roadmap page contract because the live
synchronization wrote an empty roadmap snapshot. That failure is evidence for this
design's empty-replacement guard and must be corrected during implementation, not
treated as a documentation regression.

## Success criteria

- A visitor understands the path from community idea to shipped product in one view.
- Anyone can propose and vote without making votes an automatic product commitment.
- Maintainers control publication and important state transitions in one GitHub Project.
- Public and internal roadmaps have clear, non-overlapping ownership.
- Every shipped initiative is traceable to a real published release.
- Invalid, empty, failed, or no-op synchronization runs cannot damage or redeploy the
  public site.
- Parallel website work remains independent because implementation can be developed and
  reviewed on an isolated branch before integration.

## Out of scope

- Native Homun accounts, voting, comments, or notifications.
- A database-backed dynamic roadmap service.
- Automatic prioritization from vote totals.
- Automatic promotion to `Next`, `Building`, or `Shipped`.
- Publishing internal engineering boards or `docs/roadmap.md`.
- Replacing GitHub issue moderation with AI moderation.
