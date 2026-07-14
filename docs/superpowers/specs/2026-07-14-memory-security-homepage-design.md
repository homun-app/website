# Memory and security homepage design

**Date:** 2026-07-14
**Status:** Approved design, pending implementation plan

## Purpose

Make Homun's memory architecture a first-class product promise, with the same strategic weight as model freedom. The section must explain the benefit before the implementation: Homun does not merely store chat history; it builds useful continuity that people can inspect, correct, and control.

Security remains a separate product pillar. The transition between the two sections makes the relationship explicit: persistent memory is valuable only when it remains owned and governable by the user.

## Positioning

The primary message is:

> A memory inspired by how we remember.

The supporting message is:

> Fast recall, meaningful connections, and a narrative you can read and correct.

This wording communicates the human-memory inspiration without claiming that Homun literally simulates a human brain.

The section must communicate three complementary capabilities:

1. **Recall — SQLite + search:** durable facts and fast retrieval.
2. **Connections — Graph + why:** relationships, decisions, causes, and open loops.
3. **Understanding — Markdown wiki:** a readable and editable narrative of the user's knowledge.

The closing control line is:

> Inspect · Correct · Consolidate · Forget · Export

## Homepage structure

Add `Memory` as a top-level navigation item linking to the new `#memory` section.

The homepage order becomes:

1. Hero
2. Model Freedom
3. Memory
4. Work Proof
5. Connected Action
6. Security
7. Ecosystem
8. Download

This position establishes model autonomy and memory continuity as Homun's two central differentiators before demonstrating workflows and integrations.

## Section composition

The desktop section uses a balanced two-part composition:

- A concise editorial introduction containing the eyebrow, headline, supporting copy, and control line.
- A bespoke illustration representing one memory with three connected faces.

The illustration has a central `MEMORY` element and three clearly labelled satellites:

- `Recall` with the descriptor `SQLite + search`
- `Connections` with the descriptor `Graph + why`
- `Understanding` with the descriptor `Markdown wiki`

The three elements must read as parts of one system, not as unrelated feature cards. Their paths meet at the central memory and share the visual language already established on the homepage: dark surfaces, restrained teal glow, fine technical lines, rounded geometry, and selective use of blue and violet accents.

The illustration must be drawn as a native web component using semantic HTML and SVG/CSS where appropriate. It must not depend on a raster screenshot of the application.

## Motion

Motion clarifies the relationship between the three memory layers:

- On entry, the central memory appears first.
- The three paths draw outward in sequence.
- Each satellite fades and lifts into place as its path reaches it.
- A final subtle pulse confirms that the three layers operate as one memory.

The animation runs once when the section enters the viewport. It must not loop continuously or compete with the content. Hover or pointer movement may create only a very small depth response on devices with a precise pointer.

When `prefers-reduced-motion` is enabled, the complete illustration appears immediately with no path drawing, pulsing, or pointer response.

## Responsive behaviour

On wide screens, text and illustration sit side by side with enough vertical space to avoid headline clipping.

On smaller screens:

- The text appears before the illustration.
- The three memory layers become a vertical sequence around the central element.
- Labels remain visible without relying on hover.
- The control line can wrap into two balanced rows without truncation.
- The illustration must fit the viewport without horizontal scrolling.

Typography must preserve full descenders and line height at every breakpoint.

## Relationship with security

Security remains a separate section rather than being compressed into the memory illustration. Its opening transition is:

> Useful memory requires ownership.

The security section then explains the controls that make persistent memory trustworthy:

- local-first storage and project scope;
- deny-by-default access and explicit grants;
- inspectable activity and audit history;
- protected secrets and a clear Vault boundary;
- the ability to correct, export, or truly forget stored knowledge.

The memory section explains what Homun can remember. The security section explains who remains in control.

## Accessibility and content quality

- The section uses a real heading hierarchy and a stable `memory` anchor.
- SVG relationships that are purely decorative are hidden from assistive technology; the same meaning is present in text.
- Text and interactive elements meet WCAG AA contrast targets.
- The section remains understandable with CSS animations disabled.
- Product claims stay aligned with the documented architecture and avoid absolute security guarantees.
- The visual does not use third-party product logos or imply endorsements.

## Scope

This slice includes:

- the new homepage Memory section;
- the `Memory` navigation link;
- responsive and reduced-motion behaviour;
- the transition and copy alignment with the existing Security section;
- automated checks and browser-level visual verification for the affected homepage.

This slice does not include:

- changes to Homun's memory implementation;
- an interactive memory explorer;
- live user memory data on the public website;
- a rewrite of the full documentation architecture;
- new security certifications or unsupported security claims.

## Acceptance criteria

The design is complete when:

1. `Memory` is reachable from the main navigation and the anchor works on desktop and mobile.
2. The section appears directly after Model Freedom and communicates the three-layer architecture without requiring documentation knowledge.
3. The illustration is visually consistent with the existing Homun homepage and does not resemble a generic dashboard card grid.
4. Entry motion runs once, reduced-motion users receive a static version, and the page remains stable during load.
5. Desktop and mobile layouts have no clipped text, truncated labels, or horizontal overflow.
6. The Security section follows as a distinct ownership and control story.
7. Existing homepage links, download behaviour, and responsive navigation continue to work.
8. The production build and the relevant browser tests pass.
