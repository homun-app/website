# Memory continuity homepage design

**Date:** 2026-07-14
**Status:** Visual direction approved; written specification awaiting review

## Purpose

Present Homun's hybrid memory as a major product differentiator rather than a small architecture diagram. The section must first show the human benefit — continuity across conversations and projects — and then prove how Homun creates it through three synchronized representations: SQL, a causal graph, and a readable Markdown wiki.

The section must leave visitors with a simple idea:

> A new chat. The same understanding.

Homun carries forward what happened, what was decided, and why. The user can inspect, correct, export, consolidate, or forget that knowledge instead of trusting an opaque history store.

## Product truth

The story must stay aligned with the implemented and documented memory architecture:

1. **Recall — SQLite + FTS/search:** durable structured facts, decisions, episodes, embeddings, and fast hybrid retrieval.
2. **Connections — Graph + why:** entities and relationships connecting people, projects, decisions, artifacts, causes, and open work.
3. **Understanding — Markdown wiki:** a human-readable project narrative generated from structured knowledge and available for correction.

These are three synchronized faces of one memory, not three unrelated storage products. The public example is illustrative and must not suggest that live user data is transmitted to the website.

## Homepage position

The Memory section remains directly after Model Freedom:

1. Hero
2. Model Freedom
3. Memory
4. Work Proof
5. Connected Action
6. Security
7. Ecosystem
8. Download

This gives equal strategic weight to model autonomy and long-lived context. The existing `Memory` navigation item continues to target `#memory`.

## Narrative structure

The section is a short product story, not an isolated diagram.

### 1. Promise

- Eyebrow: `Hybrid memory · built for continuity`
- Headline: `A new chat. The same understanding.`
- Supporting copy: Homun preserves what happened, what was decided, and why through a memory the user can inspect and correct.

The promise leads with the outcome. SQL, graph, and Markdown appear only after the visitor understands why continuity matters.

### 2. Capture

The first scene shows a concise, clearly fictional project conversation. A decision such as keeping private documents on a local model while leaving cloud presentation rendering opt-in is identified as something worth remembering.

The scene exposes only the minimum metadata needed to feel concrete:

- project and relative time;
- the relevant message;
- extracted knowledge types such as `Decision`, `Privacy`, and `Model routing`.

### 3. One memory, three faces

The centre scene uses the approved visual direction from concept C: three overlapping surfaces that feel like different views of the same object.

- The back surface is **SQL / Recall**, with compact structured records.
- The middle surface is **Graph / Connections**, with a small relationship map that makes the causal `why` visible.
- The front surface is **Wiki / Understanding**, with a readable note explaining the decision.

The overlap is essential. It communicates synchronization and depth more effectively than three separate cards or three satellites around a generic centre node.

### 4. Continuity

The final scene brings the decision into a new conversation without requiring the user to paste old context. The response states the remembered boundary and identifies its source project and decision.

This scene also exposes the ownership actions:

- Inspect
- Correct
- Forget

The longer control set — Consolidate and Export — may appear in the closing line or supporting copy if it remains legible without becoming a toolbar.

### 5. Closing proof

The section closes with:

> Not a transcript. Not an opaque embedding blob.

and three compact proof labels:

- `SQL · fast recall`
- `Graph · context + why`
- `Wiki · read + correct`

## Visual composition

The design uses the existing Homun language: near-black and deep-green surfaces, fine borders, cream typography, restrained teal light, and selective blue, magenta, and amber accents.

On desktop:

- the promise forms a wide editorial header;
- the story is presented as a continuous three-scene sequence;
- Capture and Recall are narrower supporting scenes;
- the overlapping three-face memory is the visual centre and receives the most space;
- subtle directional traces connect the scenes without turning the composition into a flowchart.

The component must feel editorial and cinematic, not like an admin dashboard. Dense labels, repeated card chrome, decorative grids, and an empty central `MEMORY` box are explicitly avoided.

## Motion

Motion explains the transformation once when the section enters the viewport:

1. the captured decision appears;
2. the SQL surface enters;
3. the graph surface overlaps it and its relationships draw in;
4. the wiki surface settles on top;
5. a restrained signal crosses into the recalled answer.

The animation does not loop. Pointer movement may add only a small depth response to the overlapping faces on precise-pointer devices.

With `prefers-reduced-motion`, the complete story is visible immediately. No meaning depends on movement.

## Responsive behaviour

At desktop widths, the three scenes read from left to right in one sequence.

At tablet and mobile widths:

- the promise remains first;
- Capture, Three Faces, and Recall stack vertically in narrative order;
- the three-face overlap is preserved rather than converted into generic feature cards;
- directional traces are hidden or simplified;
- all source labels and ownership controls remain visible without hover;
- no title, descender, pill, or panel is clipped;
- the section introduces no horizontal scrolling.

## Accessibility

- The section keeps a stable `memory` anchor and a real heading hierarchy.
- The three-layer architecture and continuity story are available as text, not only as decorative graphics.
- Decorative paths and signals are hidden from assistive technology.
- The fictional example is labelled by context and does not impersonate real user data.
- Text and controls meet WCAG AA contrast targets.
- The static reduced-motion state remains complete and understandable.

## Relationship with security

Memory explains what Homun retains and how it creates continuity. Security remains a separate section explaining ownership, local storage, permissions, Vault boundaries, auditability, and deletion.

The transition remains:

> Useful memory requires ownership.

The Memory section may mention local, inspectable, and correctable properties but must not absorb the full Security story or make unsupported guarantees.

## Implementation boundaries

This slice includes:

- replacing the current sparse memory illustration and two-column composition;
- restructuring `Memory.astro` around the approved promise and narrative sequence;
- replacing or retiring `MemoryArchitectureIllustration.astro` with focused subcomponents if that keeps the implementation readable;
- entry motion, reduced-motion behaviour, desktop/tablet/mobile layouts, and accessibility text;
- focused automated checks and browser verification;
- publishing the finished section through the existing `main` and Coolify flow after approval and verification.

This slice does not include:

- changes to Homun's application memory engine;
- live data or an interactive public memory explorer;
- a redesign of the adjacent homepage sections;
- a rewrite of the documentation site;
- unsupported claims about perfectly reproducing a human brain.

## Acceptance criteria

1. The first visible message is continuity across conversations, not storage technology.
2. A visitor can understand the Capture → Three Faces → Recall story without reading the documentation.
3. SQL, graph, and wiki visibly overlap as synchronized views of one memory.
4. The graph communicates relationships and reasons rather than a decorative orbit.
5. The final scene visibly recalls the decision with source context and ownership actions.
6. The result is materially richer and more distinctive than the current central-node diagram while remaining consistent with the rest of the homepage.
7. Desktop and mobile layouts have no clipping, overlap failures, or horizontal overflow.
8. Motion runs once, reduced-motion receives a complete static state, and layout does not shift during load.
9. Existing navigation, homepage anchors, download behaviour, and adjacent sections continue to work.
10. The production build, focused component checks, and relevant browser suite pass before deployment.
