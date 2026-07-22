# Umami analytics integration design

**Date:** 2026-07-22  
**Status:** Approved for implementation planning

## Objective

Add privacy-oriented website analytics to `homun.app` using the supplied Umami Cloud website ID. Measure page views across the marketing site and documentation, plus the product actions that matter: download intent, outbound GitHub navigation, roadmap project exploration, and roadmap participation.

The integration must remain small, understandable, and compatible with the free Umami Cloud plan. A single click must produce at most one custom event.

## Scope

The integration covers:

- automatic Umami page views on every generated HTML page;
- marketing pages rendered through `src/layouts/Base.astro`;
- Starlight documentation pages configured through `astro.config.mjs`;
- static and dynamically generated download links;
- non-download outbound links to GitHub;
- internal links that open a roadmap project;
- roadmap vote, discussion, and proposal actions;
- a factual privacy-documentation disclosure for Umami Cloud.

Marketplace traffic is represented by automatic page views. Marketplace-specific custom events are outside this change.

## Architecture

### Global Umami script

Load the following deferred script on every HTML page:

```html
<script defer src="https://cloud.umami.is/script.js" data-website-id="f3bdb523-4352-430b-b2a2-c7fdf4c0131f"></script>
```

Marketing pages receive the script through `Base.astro`. Documentation receives the equivalent Starlight `head` entry in `astro.config.mjs`. The production build must contain exactly one Umami tracker script per generated page.

### Event tracking

Use a hybrid tracker:

- explicit analytics data attributes identify business-critical controls and provide stable properties;
- a delegated click listener covers links created after page load;
- URL and route classification provides a fallback for ordinary GitHub links in Markdown documentation;
- event classification is mutually exclusive and follows the precedence described below.

The tracker must fail open. If Umami is blocked, unavailable, or not yet initialized, navigation and downloads continue normally without errors or delays.

## Event taxonomy

### `download_click`

Records an attempt to obtain Homun or open the release download destination.

Properties:

- `platform`: `macos`, `windows`, `linux`, or `unknown`;
- `format`: `dmg`, `exe`, `appimage`, `deb`, or `release_page`;
- `source`: stable placement such as `hero`, `navigation`, `download_section`, `download_selector`, `documentation`, or `footer`.

This event takes precedence over generic GitHub tracking because release links also point to GitHub.

### `roadmap_participation`

Records a roadmap action that leaves Homun for GitHub.

Properties:

- `action`: `vote`, `discuss`, or `suggest`;
- `project`: the roadmap project slug when available;
- `source`: `roadmap_card`, `roadmap_detail`, or `roadmap_overview`.

This event takes precedence over generic GitHub tracking.

### `github_click`

Records other outbound navigation to a `github.com/homun-app` destination.

Properties:

- `destination`: stable category such as `core_repository`, `releases`, `issue`, or `other`;
- `source`: the current page category, such as `homepage`, `documentation`, `changelog`, `roadmap`, `marketplace`, or `footer`.

Do not send complete destination URLs as event properties.

### `roadmap_project_open`

Records an internal click that opens `/roadmap/<slug>/`.

Properties:

- `project`: the project slug;
- `source`: the originating section, such as `roadmap_overview`, `homepage`, or `changelog`.

Normal page-view tracking remains the canonical measure of visits to the resulting project page. This event measures the interaction that led there.

## Classification precedence

For each click, select the first matching event only:

1. `download_click`;
2. `roadmap_participation`;
3. `github_click`;
4. `roadmap_project_open`.

Clicks that match none of these categories produce no custom event. The download chooser button itself is not a conversion; only selecting or initiating a download is tracked.

## Privacy and data minimization

- Do not introduce cookies, advertising identifiers, or user identifiers.
- Do not send query strings, complete URLs, link text, filenames beyond normalized installer format, or other free-form user-controlled values.
- Use fixed enumerations and roadmap slugs already published by the site.
- Do not block navigation to wait for analytics delivery.

The public privacy documentation should disclose the use of Umami Cloud and describe the aggregate access and interaction data collected. Legal wording is limited to a factual product disclosure and must not make unverified compliance guarantees.

## Failure behavior

- Missing `window.umami` results in a no-op.
- A tracking exception is contained and must not escape the click handler.
- GitHub API failure in the existing download selector retains its current fallback to the releases page and still records the initiating download intent.
- Dynamically rendered installer links receive the same classification and normalized properties as static controls.

## Verification

Automated tests must prove:

1. a marketing page contains exactly one Umami script with the supplied website ID;
2. a documentation page contains exactly one equivalent script;
3. download controls classify platform, format, and source correctly;
4. dynamically generated installer links are tracked;
5. roadmap vote, discussion, suggestion, and project-open actions map to the intended events;
6. other Homun GitHub links map to `github_click`;
7. overlapping GitHub release and roadmap-participation links emit only the higher-priority event;
8. analytics absence or failure does not prevent navigation;
9. the existing build and website checks remain green.

After the static build, inspect representative generated marketing and documentation HTML to confirm the script is rendered once in each shell. No deployment is included in this change unless separately requested.
