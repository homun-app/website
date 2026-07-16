# Public Roadmap Visual Hierarchy Design

**Date:** 2026-07-16

**Status:** Approved in visual review

**Primary audience:** small companies and small teams

**Secondary audience:** investors and commercial partners

## Purpose

Restructure the public roadmap so that it communicates Homun's complete product vision
without presenting every initiative as an independent, equally mature product bet.

The page must make one connected argument:

1. Homun already provides a useful operational workspace.
2. Homun Flow turns those capabilities into visible, reviewable team processes.
3. The same core expands through team adoption, official workflow products, and
   company-specific intelligence.

The redesign changes information hierarchy and presentation. It does not change the
roadmap governance model, GitHub synchronization contract, publication states, voting
rules, or the underlying commitment level of any initiative.

## Problem With the Current Page

The current roadmap contains the right strategic material but divides it into too many
visually equivalent sections:

- `One continuous product journey` is abstract and repeats ideas explained later;
- `Available today` occupies a full section despite containing one foundation card;
- `Homun Flow` is visually prominent but not structurally connected to the future layers;
- `Up next`, workflow ideas, `Adaptive Company Intelligence`, and `Exploring` read as
  separate roadmaps;
- large single-card sections create empty space and make the page feel unfinished;
- status, product architecture, commercial direction, and long-term research are mixed
  at the same visual level.

The result is a long page that requires the visitor to reconstruct the product strategy.

## Design Principles

### One core product story

Homun Flow is the center of the roadmap. Available capabilities are its foundation, and
future initiatives either expand adoption, package commercial outcomes, or improve
company-specific intelligence.

### Vision first, evidence immediately after

The hero communicates the full ambition. The next section immediately grounds that
ambition in available product capabilities and the current building program.

### Maturity inside the architecture

The page no longer uses large status bands as its primary structure. Status remains
explicit inside each program or direction through the existing public states and
evaluation states.

### Different visual weight for different certainty

- available product evidence is compact and concrete;
- Homun Flow is the dominant program;
- decided extensions are clearly marked `Up next`;
- workflow candidates show their evaluation state;
- company intelligence and other research remain explicitly non-committal.

### Customer value first, investor leverage second

The main copy explains operational value for a small business. Reusable workflow
distribution and company intelligence provide the second reading for investors without
replacing the customer story.

## Final Page Architecture

The page is organized into five main sections followed by the existing footer.

### 1. Vision hero

The hero introduces the complete company-level ambition.

**Eyebrow**

> BUILT FOR SMALL COMPANIES AND TEAMS

**Headline**

> AI that keeps your company moving.

**Primary copy**

> Homun coordinates requests, recurring work and reviews across people and AI—then
> learns from the knowledge and outcomes your company chooses to preserve.

**Strategic line**

> One operational foundation. Official workflow products. Company intelligence under
> your control.

The GitHub synchronization date remains visible but subordinate to the headline.

### 2. Where Homun is today

This section replaces the separate `Available today` block and the standalone featured
project block. It uses a two-part composition.

#### Operational Workspace

**Status:** Available

**Role:** compact proof of the current product

It summarizes the currently available foundation through named capability evidence:

- persistent memory and project continuity;
- documents and presentations;
- controlled computer and browser use;
- model-independent routing;
- channels, connected tools, approvals, and automations.

The card links to the existing Operational Workspace detail page. It does not repeat all
milestones or compete visually with Homun Flow.

#### Homun Flow

**Status:** Building now

**Role:** dominant product program

The card explains the process lifecycle through a compact visual sequence:

```text
Request -> Work -> Review -> Deliver
```

It retains the public update date and links to the complete milestone page. The first
three milestones may appear in compact form, but the full milestone history remains on
the detail page.

### 3. One core, three directions

This is the strategic center of the page. Three connected directions sit below Homun
Flow, but they do not imply equal timing or certainty.

#### Team & Reach

**Role:** adoption layer

**Public state:** Up next

This direction answers: who can participate, and where?

It contains:

- Team Spaces & Roles;
- Homun Mobile;
- additional communication channels.

Customer outcome: Homun becomes usable by a small team throughout daily work, not only
by an individual operator at a desk.

#### Workflow Products

**Role:** commercial layer

**Public state:** evaluation and pilot progression

This direction answers: which repeatable business outcome does the customer buy?

It contains official Homun workflow packs. These are built and maintained by Homun
before any broader developer marketplace is opened.

Customer outcome: the company buys a controlled operational result rather than generic
AI capability.

#### Company Intelligence

**Role:** intelligence layer

**Public state:** Research / long term

This direction answers: how does Homun progressively adapt to the company?

It communicates the existing research sequence:

```text
Company Profile
    -> Company Knowledge
    -> Process Learning
    -> Evaluation
    -> Specialized SLM when justified by the data
```

Customer outcome: Homun improves on the company's real terminology, knowledge, process
examples, and review criteria without requiring internal AI specialists.

#### Learning loop

A compact relationship below the three directions explains the long-term feedback loop:

```text
Team processes -> Verified outcomes -> Better company-specific assistance
```

This is a product dependency, not a promise of autonomous model training from arbitrary
company data. Specialized model training remains conditional on sufficient quality,
stable processes, and measurable evaluation criteria.

### 4. Official workflow products

This section remains vote-enabled but is explicitly nested under the commercial
`Workflow Products` direction.

**Heading**

> Where should Homun work first?

**Supporting copy**

> We are evaluating the first official Homun workflows for small teams. Each combines a
> visible process, connected tools, permissions, review rules, templates, and measurable
> outcomes.

The visual hierarchy is:

1. `Client Work` appears as the recommended first pilot candidate;
2. `Sales Operations`, `Content & Marketing`, `Internal Operations`, and `Customer
   Support` appear as compact evaluation cards;
3. the idea submission action remains visible;
4. votes and GitHub discussion links retain their existing behavior;
5. evaluation states remain `Evaluating`, `Selected for pilot`, or `Removed`.

The section must not imply that every idea is committed or that every workflow will be
developed simultaneously.

### 5. Evidence and future directions

The bottom of the page uses one compact three-column band instead of two more full-size
roadmap sections.

#### Voice & Meeting Capture

Presented as research, not a commitment. It retains its detail page, vote, and GitHub
discussion.

#### Developer Platform

Presented as a future ecosystem direction after official workflow products mature. It
must not be described as an available marketplace or near-term developer platform.

#### Releases

The latest release and recent release history are combined into one compact evidence
card. The latest release remains visually identifiable, and all existing changelog links
remain available.

## Content Removed From the Main Page

The following section headings and standalone compositions are removed:

- `One continuous product journey`;
- `Available today` as an independent full-width section;
- `Up next` as an independent full-width section;
- `Adaptive Company Intelligence` as an independent single-card section;
- `Exploring` as an independent full-width section;
- separate `Release history` and `Latest release` panels.

Their underlying programs, states, links, votes, and release data remain available inside
the new hierarchy. No roadmap item is silently deleted.

## Status and Data Rules

The existing roadmap contract remains authoritative.

- strategic programs keep `available`, `building`, `next`, or `exploring`;
- workflow ideas keep their evaluation state;
- publication status continues to control public visibility;
- public update dates and milestones remain data-driven;
- vote counts and discussion links remain synchronized with GitHub;
- the latest release and history remain derived from release data;
- no arbitrary percentage or invented delivery date is introduced.

The page may group items into visual directions, but it must not rewrite the underlying
status to make the narrative appear more advanced.

## Component Boundaries

The implementation should introduce focused presentation components rather than extend
the generic `RoadmapJourney` component with conditional layout modes.

Recommended boundaries:

- `RoadmapVisionHero`: hero copy and synchronization evidence;
- `RoadmapNow`: Operational Workspace plus Homun Flow;
- `RoadmapDirections`: the three connected product directions;
- `WorkflowProducts`: featured pilot candidate, compact ideas, voting, and submission;
- `RoadmapEvidence`: research directions plus consolidated releases.

Existing reusable components for milestones, participation, links, release data, and
illustrations should remain shared. The page component owns ordering and data grouping;
leaf components own presentation only.

## Responsive Behavior

### Desktop

- Operational Workspace and Homun Flow use an asymmetric two-column layout, with Homun
  Flow receiving more width;
- the three directions use three columns;
- workflow candidates use one featured card plus a compact grid;
- evidence and future directions use three compact columns.

### Tablet

- current product cards stack if their copy becomes compressed;
- the three directions may use one wide card followed by two cards or a single column;
- workflow cards use two columns where space permits.

### Mobile

- every relationship remains understandable in a single column;
- arrows become vertical or are replaced by ordered labels;
- no meaning depends only on horizontal position;
- status labels remain adjacent to their program titles;
- filters are omitted unless the number of visible ideas makes them useful.

## Accessibility

- heading order remains sequential from the page title through section and card titles;
- status cannot rely on color alone;
- connected visual directions use semantic lists or labelled groups;
- all detail, vote, discussion, and changelog links retain meaningful accessible names;
- focus behavior remains visible on whole-card links;
- decorative arrows and illustrations are hidden from assistive technology;
- reduced-motion behavior follows the existing site policy.

## Verification

The implementation must verify:

1. the generated roadmap contains the new hero, current-product section, three
   directions, workflow product section, and compact evidence band;
2. removed standalone headings no longer appear on the main roadmap page;
3. every currently published roadmap item remains reachable from the main page;
4. every existing detail route still builds;
5. votes, discussion links, idea submission, release links, and changelog anchors remain
   correct;
6. public statuses and evaluation states match the synchronized data;
7. desktop and mobile screenshots show no empty single-card sections or broken reading
   order;
8. existing product-data checks, snapshot checks, and Astro validation remain green.

## Non-Goals

This redesign does not:

- change the GitHub Project schema or synchronization workflow;
- select a workflow pilot remotely;
- change any roadmap item's public commitment state;
- open the marketplace to developers;
- implement Homun Flow, team support, mobile applications, channels, workflow packs, or
  specialized model training;
- modify detail-page scope beyond any small copy or navigation adjustments required for
  consistency;
- publish or deploy the redesigned page before separate implementation verification.

## Acceptance Criteria

The design is complete when a first-time visitor can answer these questions from the main
page without reconstructing the strategy from separate sections:

1. What can Homun do today?
2. What is Homun building now?
3. How does that product reach a team and become commercially useful?
4. How can verified company work improve Homun over time?
5. Which parts are decided, being evaluated, or still research?

The page should feel like one product becoming more valuable, not a collection of
unrelated feature bets.
