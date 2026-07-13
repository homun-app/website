# Living Roadmap and GitHub Release Stream Design

**Date:** 2026-07-13
**Status:** Approved

## Purpose

Replace the current static four-column roadmap with a living public product map. The new experience must make it immediately clear what Homun is building, what comes next, what has shipped, and how each shipped project relates to a real desktop release.

GitHub is the operational source of truth. Homun.app presents a curated, product-focused projection of that data rather than exposing an engineering board.

## Product principles

- Explain user value before implementation detail.
- Keep the roadmap alive without making Homun look perpetually unfinished.
- Treat roadmap commitments, community ideas, and shipped releases as distinct states.
- Never require registration to view the roadmap, changelog, or use the Homun desktop application.
- Use GitHub reactions and issue forms for first-phase participation. A future Homun account may replace that participation layer without changing the public data model.
- Publish only records explicitly marked for public display.
- Keep a last-known-good snapshot so GitHub availability cannot break the static site.

## Scope

### Included

- A redesigned `/roadmap` page using the approved Living Product Map direction.
- Public project detail pages at `/roadmap/<slug>`.
- A GitHub Project used to manage public product initiatives.
- Synchronization of project metadata, public issues, reaction counts, and releases into validated local data.
- A latest-release module and compact release history on the roadmap.
- A real `/changelog` generated from published GitHub Releases.
- Links from projects to related releases and from releases back to completed projects.
- GitHub-based idea proposals and voting for the first version.
- Loading, empty, stale, invalid-data, and reduced-motion behavior.

### Excluded

- Homun account creation or authentication.
- Native Homun voting, comments, notifications, or statistics.
- Two-way editing from Homun.app into GitHub.
- Exposure of internal engineering tasks, private repositories, assignees, estimates, or confidential dates.
- Automatic AI rewriting of release notes.
- Real-time browser requests to GitHub.

## Source-of-truth structure

Create an organization-level GitHub Project named **Homun Product Roadmap**. Product-level initiatives live as public issues in `homun-app/homun`. Engineering tasks can remain in their appropriate repositories and may be linked from the public initiative without being displayed on the website.

Desktop binaries and published versions continue to come from `homun-app/homun-releases`. `homun-app/homun-core` remains focused on the implementation of the core system rather than acting as the public roadmap.

### Required Project fields

| Field | Type | Public use |
| --- | --- | --- |
| Public | Single select or checkbox | Hard publication gate. Only true/yes is exported. |
| Public status | Single select | `Exploring`, `Next`, `Building`, or `Shipped`. |
| Area | Single select | Product area shown as a card label and filter. |
| Slug | Text | Stable website route identifier. |
| Featured | Single select or checkbox | Selects the single `Currently building` project. |
| Progress | Number | Public 0–100 progress indicator. |
| Target release | Text | Optional planned version; never treated as a promise. |
| Public update | Text | Short, plain-language status update. |
| Community | Single select | `Open`, `Voting`, or `Closed`. |
| Order | Number | Curated order within a status. |

The issue supplies the title, product description, discussion, reaction count, and canonical GitHub URL. A standard issue form will collect the problem, intended user value, and example use case for new community proposals.

### Release note convention

Published releases in `homun-app/homun-releases` use a consistent Markdown structure:

1. Highlights
2. Improvements
3. Fixes
4. Available downloads
5. Shipped roadmap projects

The final section references roadmap issue numbers or stable slugs. Draft releases are never published on Homun.app. Release bodies are curated by maintainers; the website does not rewrite them automatically.

## Public experience

### Hero

The page opens with the message **What we're building. What just shipped.** It describes the roadmap as a living view of Homun's development. A quiet `Synced with GitHub` status and last successful sync time establish freshness without making GitHub the visual focus.

### Currently building

One featured initiative receives a large card with:

- project title and area;
- concise user benefit;
- approved B2-family animated illustration;
- public progress;
- latest public update and its date;
- link to the project detail page.

If no valid featured project exists, the page promotes the first curated `Building` item. It does not render an empty featured shell.

### Latest release

The featured project sits beside the latest published release. The release module shows version, publication date, up to three highlights, supported download families, and a link to complete notes. The module links back to any roadmap initiatives marked as shipped by that release.

### The journey

The primary roadmap is a visual path rather than four equal Kanban columns:

`Exploring → Next → Building → Shipped`

Each status contains a curated number of product cards. Cards show area, title, short benefit, public update date, and progress only when relevant. Filters by area can narrow the view without changing the canonical ordering. Internal counts and engineering metadata are not displayed.

### Project detail

Each public initiative has a detail page containing:

- vision and user problem;
- current status and progress;
- public update history when available;
- intended capabilities;
- linked shipped or target releases;
- GitHub discussion link;
- reaction count and a `Vote on GitHub` action when community voting is open.

Dates and target releases are phrased as direction, not contractual delivery commitments.

### Release history and changelog

The roadmap ends with a compact release history. `/changelog` remains the complete chronological view and is populated with real published GitHub Releases rather than illustrative entries.

Every changelog entry contains version, date, highlights, improvements, fixes, installer families, related projects, and the canonical GitHub release link. Existing RSS output uses the same normalized release records.

### Community ideas

The final roadmap section highlights the most-supported public ideas separately from committed work. Each card shows title, area, reaction count, current evaluation state, and links to GitHub.

`Suggest an idea` opens the standard GitHub issue form. `Vote on GitHub` opens the relevant issue and explains that a GitHub account is required only for participation. Viewing Homun.app and using Homun remain registration-free.

## Visual direction

- Reuse the approved B2 illustration language: abstract isometric objects, restrained outlines, dark teal surfaces, and teal/blue/magenta/amber accents.
- Use slow, purposeful motion to suggest progress and movement through the product path.
- Avoid grids, technical network diagrams, robots, brains, laptops, and literal engineering dashboards.
- Give the featured initiative the highest visual weight, followed by the latest release, the journey, release history, and community ideas.
- Preserve the existing cursor-responsive atmospheric gradient where appropriate.
- Disable non-essential movement under `prefers-reduced-motion`.
- On small screens, turn the journey into a vertical sequence while retaining status order and connections.

## Data pipeline

The website remains a static Astro build. GitHub is accessed during an authenticated synchronization job, never from client-side code.

1. A synchronization script queries the organization Project through GitHub GraphQL.
2. It rejects any project item that does not pass the explicit `Public` gate.
3. It fetches public issue metadata and reaction counts for accepted items.
4. It fetches published, non-draft releases from `homun-app/homun-releases` through the REST API.
5. It normalizes both sources into versioned schemas.
6. It validates cross-links, unique slugs, statuses, progress ranges, and featured-item cardinality.
7. It writes generated snapshots only after the complete dataset passes validation.
8. The normal Astro build consumes those snapshots and generates roadmap, detail, changelog, and RSS pages.

The GitHub token is held only as a repository or deployment secret and must have the minimum scopes required to read the organization Project and public repository data. It is never serialized into build output.

### Synchronization triggers

- Manual `workflow_dispatch` for maintainers.
- A scheduled reconciliation job to recover from missed events.
- A repository dispatch or equivalent trigger after a published desktop release.
- A roadmap update trigger where GitHub supports it; scheduled reconciliation remains the reliable fallback.

The generated snapshot update triggers the existing static-site deployment. Repeated data with no semantic changes does not create a new snapshot or deploy.

## Failure behavior

- **GitHub unavailable:** the job fails without replacing the last-known-good snapshots.
- **Token or scope failure:** the job reports an actionable authentication error and preserves existing site data.
- **Invalid Project item:** the job rejects the new snapshot and identifies the issue and invalid field.
- **Unknown status:** the item is never silently mapped to another public status.
- **Duplicate slug:** the job fails before build to prevent route collisions.
- **Multiple featured items:** validation fails; the website never chooses one nondeterministically.
- **No releases:** the roadmap omits release modules gracefully and the changelog renders a clear empty state.
- **Missing linked project:** the release still renders, but the sync report flags the unresolved reference.
- **Unsafe Markdown:** release and issue content is rendered through the site's sanitized Markdown pipeline; raw executable HTML is not accepted from synchronized content.
- **Stale data:** the website displays the last successful sync time. It does not imply that a failed sync succeeded.

## Component boundaries

- `roadmap-source`: reads and normalizes Project and issue data.
- `release-source`: reads and normalizes published Releases and assets.
- `product-data-schema`: validates normalized snapshots and cross-source relationships.
- `roadmap-content`: exposes ordered public initiatives to Astro pages.
- `release-content`: exposes latest release, history, changelog, and RSS records.
- `RoadmapHero`: owns page introduction and sync freshness.
- `FeaturedProject`: owns the current-building story and illustration.
- `LatestRelease`: owns the release summary and download families.
- `RoadmapJourney`: owns status sequencing, filtering, and mobile adaptation.
- `ProjectCard`: renders one public initiative consistently across views.
- `ReleaseHistory`: renders compact version history.
- `CommunityIdeas`: renders proposals, reaction counts, and GitHub participation actions.

Each UI component receives validated local data and has no knowledge of GitHub authentication or API response shapes.

## Verification

### Data and synchronization tests

- Normalize Project items and published Releases from fixed API fixtures.
- Exclude draft releases, prereleases if not explicitly enabled, private items, and items without `Public` approval.
- Reject invalid statuses, out-of-range progress, duplicate slugs, and multiple featured items.
- Verify asset-family classification for macOS, Windows, and Linux.
- Verify project-to-release linking and unresolved-reference reporting.
- Verify that a failed sync leaves the last-known-good snapshot unchanged.

### Page and build tests

- Generate the roadmap, every project detail route, changelog, and RSS in a production Astro build.
- Ensure there are no illustrative placeholder changelog entries once GitHub data is enabled.
- Verify empty states for no featured project, no community ideas, and no release history.
- Verify external GitHub links use safe new-tab behavior.
- Verify metadata, canonical URLs, and structured page titles.

### Visual and accessibility tests

- Check desktop, tablet, and mobile layouts with real long titles and descriptions.
- Ensure the journey becomes a readable vertical sequence on narrow screens.
- Verify keyboard access to filters, project cards, voting links, and release links.
- Verify visible focus, sufficient contrast, and semantic headings.
- Verify that reduced-motion mode removes ambient and path animations without hiding content.
- Verify that no text, illustration, or progress label is clipped at supported breakpoints.

## Delivery sequence

1. Configure the public GitHub Project fields and public issue form.
2. Add fixture-driven schemas and synchronization scripts.
3. Generate and validate the first real roadmap and release snapshots.
4. Build the Living Product Map and project detail pages.
5. Replace illustrative changelog content and connect RSS.
6. Add GitHub reaction counts, voting links, and idea submission.
7. Add synchronization workflows, reconciliation, and release-triggered deployment.
8. Perform responsive, accessibility, data-failure, and production-build verification.

## Success criteria

- A visitor can identify what Homun is building now, what is next, and what shipped within one screen.
- Every shipped initiative can be traced to a real published release.
- Roadmap and changelog update from GitHub without manual editing of website content files.
- Community ideas cannot be mistaken for committed work.
- Participation may require GitHub, but viewing and using Homun remain registration-free.
- GitHub outages and invalid updates cannot replace the last valid public roadmap.
- The page feels like part of Homun's illustrated product story, not an embedded engineering board.
