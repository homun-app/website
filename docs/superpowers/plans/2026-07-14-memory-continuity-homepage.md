# Memory Continuity Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sparse memory architecture diagram with an editorial Capture → Three Faces → Recall story that demonstrates continuity across conversations.

**Architecture:** Keep the homepage section copy and closing proof in `Memory.astro`, and isolate the visual narrative in a new `MemoryContinuityIllustration.astro` component. The component uses semantic HTML plus a small decorative SVG/HTML graph, CSS-only entry motion, a complete reduced-motion state, and a stacked responsive layout; no client framework or live data is introduced.

**Tech Stack:** Astro 6, Tailwind utility classes, scoped component CSS, Node assertion scripts, Astro build output, browser verification.

---

## File map

- Create `src/components/illustrations/MemoryContinuityIllustration.astro`: owns the fictional Capture → SQL/Graph/Wiki → Recall visual story, animation, accessibility description, and responsive composition.
- Modify `src/components/Memory.astro`: owns the section anchor, promise, supporting copy, proof labels, and import of the new illustration.
- Modify `scripts/check-homepage-illustrations.mjs`: protects the new story structure, labels, source context, ownership actions, reduced-motion behaviour, and retirement of the old central-node metaphor.
- Modify `scripts/check-homepage.mjs`: protects the continuity-first headline and closing product promise in the rendered homepage.
- Delete `src/components/illustrations/MemoryArchitectureIllustration.astro`: removes the superseded central-memory/satellite composition after the replacement is proven.

### Task 1: Replace the illustration contract with a failing continuity-story test

**Files:**
- Modify: `scripts/check-homepage-illustrations.mjs`
- Modify: `scripts/check-homepage.mjs`

- [ ] **Step 1: Change the rendered illustration marker**

In the first marker loop in `scripts/check-homepage-illustrations.mjs`, replace:

```js
'data-illustration="memory-architecture"',
```

with:

```js
'data-illustration="memory-continuity"',
```

- [ ] **Step 2: Point source checks at the new component**

Replace `MemoryArchitectureIllustration.astro` in the reduced-motion component list with:

```js
"MemoryContinuityIllustration.astro",
```

Replace the existing `memorySource` read with:

```js
const memorySource = await readFile(
	new URL("../src/components/illustrations/MemoryContinuityIllustration.astro", import.meta.url),
	"utf8",
);
```

- [ ] **Step 3: Replace the old memory-node assertions with the approved story contract**

Remove the old `memory-architecture-*`, `data-memory-part`, and `data-memory-path` assertion blocks. Add:

```js
for (const marker of [
	'aria-labelledby="memory-continuity-title memory-continuity-description"',
	'id="memory-continuity-title"',
	'id="memory-continuity-description"',
	'data-memory-stage="capture"',
	'data-memory-stage="three-faces"',
	'data-memory-stage="recall"',
	'data-memory-face="sql"',
	'data-memory-face="graph"',
	'data-memory-face="wiki"',
	'data-memory-action="inspect"',
	'data-memory-action="correct"',
	'data-memory-action="forget"',
]) {
	assert.ok(memorySource.includes(marker), `Memory continuity contract is missing: ${marker}`);
}

for (const label of [
	"Yesterday · Project Atlas",
	"One memory · three synchronized faces",
	"Today · New chat",
	"Recall",
	"SQLite + FTS",
	"Connections",
	"Graph + why",
	"Understanding",
	"Markdown wiki",
	"Source · Project Atlas",
]) {
	assert.ok(memorySource.includes(label), `Memory continuity illustration is missing: ${label}`);
}

for (const retired of [
	'data-memory-part="core"',
	'class="memory-core"',
	'class="memory-orbit"',
	"One continuous system",
]) {
	assert.ok(!memorySource.includes(retired), `Memory continuity retained the old diagram: ${retired}`);
}

const memoryReducedMotion = memorySource.slice(
	memorySource.indexOf("@media (prefers-reduced-motion: reduce)"),
);
for (const declaration of [
	"animation: none !important;",
	"transform: none;",
	"opacity: 1;",
]) {
	assert.ok(
		memoryReducedMotion.includes(declaration),
		`Memory reduced-motion state is missing: ${declaration}`,
	);
}
```

- [ ] **Step 4: Protect the continuity-first rendered copy**

In the first `for (const required of [...])` array in `scripts/check-homepage.mjs`, remove these retired strings:

```js
"A memory inspired by how we remember.",
"Fast recall, meaningful connections, and a narrative you can read and correct.",
"Inspect · Correct · Consolidate · Forget · Export",
```

Insert these strings in the same position:

```js
"A new chat. The same understanding.",
"Not a transcript. Not an opaque embedding blob.",
"SQL · fast recall",
"Graph · context + why",
"Wiki · read + correct",
```

- [ ] **Step 5: Run the focused tests and confirm RED**

Run:

```bash
npm run build && npm run test:homepage && npm run test:illustrations
```

Expected: build succeeds, then a test fails because `data-illustration="memory-continuity"` or `MemoryContinuityIllustration.astro` does not exist yet.

- [ ] **Step 6: Commit the failing contract**

```bash
git add scripts/check-homepage.mjs scripts/check-homepage-illustrations.mjs
git commit -m "test: define memory continuity homepage contract"
```

### Task 2: Build the semantic Capture → Three Faces → Recall component

**Files:**
- Create: `src/components/illustrations/MemoryContinuityIllustration.astro`

- [ ] **Step 1: Add the complete semantic story structure**

Create the component with this structure and exact public labels:

```astro
<div
	class="memory-continuity"
	data-illustration="memory-continuity"
	role="img"
	aria-labelledby="memory-continuity-title memory-continuity-description"
>
	<span id="memory-continuity-title" class="sr-only">Homun memory continuity</span>
	<span id="memory-continuity-description" class="sr-only">
		A decision captured in Project Atlas becomes structured SQLite recall, connected graph context,
		and a readable Markdown wiki, then returns with its source in a new conversation.
	</span>

	<article class="memory-stage capture-stage" data-memory-stage="capture">
		<header><span>Yesterday · Project Atlas</span><span class="stage-state">Captured</span></header>
		<div class="stage-body">
			<div class="message-meta"><strong>Fabio</strong><time>16:42</time></div>
			<p class="message-bubble">Keep Ollama local for private documents. Use cloud only for presentation rendering.</p>
			<div class="knowledge-tags" aria-label="Extracted knowledge">
				<span>Decision</span><span>Privacy</span><span>Model routing</span>
			</div>
		</div>
		<span class="story-flow flow-out" aria-hidden="true"></span>
	</article>

	<article class="memory-stage faces-stage" data-memory-stage="three-faces">
		<header><span>One memory · three synchronized faces</span><span class="stage-state">Connected</span></header>
		<div class="face-stack">
			<section class="memory-face sql-face" data-memory-face="sql">
				<div class="face-heading"><strong>01 · Recall</strong><span>SQLite + FTS</span></div>
				<ul><li><b>decision</b><span>16:42</span></li><li><b>local model</b><span>private</span></li><li><b>cloud render</b><span>opt-in</span></li></ul>
			</section>

			<section class="memory-face graph-face" data-memory-face="graph">
				<div class="face-heading"><strong>02 · Connections</strong><span>Graph + why</span></div>
				<svg viewBox="0 0 260 108" aria-hidden="true">
					<path d="M130 54 48 24M130 54 218 22M130 54 65 91M130 54 210 90" />
					<circle cx="130" cy="54" r="8" /><circle cx="48" cy="24" r="5" />
					<circle cx="218" cy="22" r="5" /><circle cx="65" cy="91" r="5" />
					<circle cx="210" cy="90" r="5" />
				</svg>
			</section>

			<section class="memory-face wiki-face" data-memory-face="wiki">
				<div class="face-heading"><strong>03 · Understanding</strong><span>Markdown wiki</span></div>
				<h3>Why we chose local models</h3>
				<p>Private documents stay on-device. Cloud rendering remains available only when explicitly enabled.</p>
			</section>
		</div>
	</article>

	<article class="memory-stage recall-stage" data-memory-stage="recall">
		<header><span>Today · New chat</span><span class="stage-state">Recalled</span></header>
		<div class="stage-body">
			<p class="no-context">No context pasted</p>
			<h3>I remember the boundary you chose.</h3>
			<p>Private documents stay local. Cloud presentation rendering remains opt-in.</p>
			<div class="memory-source"><span aria-hidden="true"></span>Source · Project Atlas · decision captured yesterday</div>
			<ul class="memory-actions" aria-label="Memory controls">
				<li data-memory-action="inspect">Inspect</li>
				<li data-memory-action="correct">Correct</li>
				<li data-memory-action="forget">Forget</li>
			</ul>
		</div>
		<span class="story-flow flow-in" aria-hidden="true"></span>
	</article>
	<span class="sr-only">Recall — SQLite + FTS. Connections — Graph + why. Understanding — Markdown wiki.</span>
</div>
```

- [ ] **Step 2: Add the desktop visual system in scoped CSS**

Use a three-column grid with the centre scene visibly dominant:

```css
.memory-continuity {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1.02fr) minmax(28rem, 1.48fr) minmax(0, 1fr);
	gap: 0.85rem;
	align-items: stretch;
}
.memory-stage {
	position: relative;
	min-width: 0;
	min-height: 22rem;
	overflow: hidden;
	border: 1px solid var(--color-line);
	border-radius: 1.2rem;
	background: linear-gradient(145deg, rgba(10, 23, 19, 0.96), rgba(4, 10, 8, 0.99));
	box-shadow: var(--shadow-lift);
}
.memory-stage > header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.95rem 1rem;
	border-bottom: 1px solid var(--color-line);
	color: var(--color-faint);
	font-family: var(--font-mono);
	font-size: 0.56rem;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
.stage-state { color: var(--color-accent-bright); }
.stage-body { padding: 1.25rem 1rem; }
.message-meta { display: flex; justify-content: space-between; color: var(--color-faint); font-size: 0.68rem; }
.message-meta strong { color: var(--color-cream); }
.message-bubble { margin-top: 0.9rem; padding: 0.9rem; border-radius: 0.25rem 0.9rem 0.9rem; background: rgba(21, 65, 52, 0.58); color: var(--color-muted); font-size: 0.76rem; line-height: 1.55; }
.knowledge-tags, .memory-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 1.35rem; padding: 0; list-style: none; }
.knowledge-tags span, .memory-actions li { padding: 0.38rem 0.5rem; border: 1px solid var(--color-line); border-radius: 999px; color: var(--color-faint); font-family: var(--font-mono); font-size: 0.5rem; letter-spacing: 0.07em; text-transform: uppercase; }
.face-stack { position: relative; min-height: 18rem; margin: 1rem; }
.memory-face { position: absolute; width: 74%; min-height: 11.6rem; padding: 0.95rem; border: 1px solid var(--color-line-strong); border-radius: 0.95rem; background: linear-gradient(145deg, rgba(13, 28, 24, 0.99), rgba(5, 12, 10, 0.99)); box-shadow: 0 20px 55px rgba(0, 0, 0, 0.34); }
.sql-face { left: 0; top: 0; rotate: -4deg; opacity: 0.72; }
.graph-face { left: 13%; top: 2.25rem; z-index: 2; border-color: rgba(119, 162, 245, 0.38); }
.wiki-face { left: 26%; top: 4.75rem; z-index: 3; rotate: 2.5deg; border-color: rgba(239, 120, 216, 0.32); }
.face-heading { display: flex; justify-content: space-between; gap: 0.75rem; padding-bottom: 0.65rem; border-bottom: 1px solid var(--color-line); font-family: var(--font-mono); font-size: 0.54rem; text-transform: uppercase; }
.face-heading strong { color: var(--color-cream); }
.face-heading span { color: var(--color-faint); }
.sql-face ul { margin: 0.65rem 0 0; padding: 0; list-style: none; }
.sql-face li { display: flex; justify-content: space-between; margin-top: 0.5rem; color: var(--color-faint); font: 0.52rem/1.2 var(--font-mono); }
.sql-face b { color: var(--color-muted); font-weight: 500; }
.graph-face svg { width: 100%; margin-top: 0.65rem; }
.graph-face path { fill: none; stroke: rgba(99, 225, 192, 0.55); stroke-width: 1.5; }
.graph-face circle { fill: var(--color-accent-bright); }
.wiki-face h3 { margin-top: 0.9rem; color: var(--color-cream); font-size: 0.78rem; }
.wiki-face p { margin-top: 0.5rem; color: var(--color-faint); font-size: 0.58rem; line-height: 1.5; }
.no-context { color: var(--color-faint); font: 0.54rem/1 var(--font-mono); letter-spacing: 0.09em; text-transform: uppercase; }
.recall-stage h3 { margin-top: 1.3rem; color: var(--color-cream); font-size: 1.05rem; line-height: 1.3; }
.recall-stage h3 + p { margin-top: 0.8rem; color: var(--color-muted); font-size: 0.7rem; line-height: 1.55; }
.memory-source { margin-top: 1.4rem; padding: 0.7rem; border: 1px solid rgba(119, 162, 245, 0.24); border-radius: 0.7rem; color: rgba(160, 185, 232, 0.85); font: 0.52rem/1.45 var(--font-mono); }
.story-flow { position: absolute; z-index: 6; top: 50%; width: 1.7rem; height: 1px; background: linear-gradient(90deg, transparent, var(--color-accent-bright)); }
.flow-out { left: 100%; }
.flow-in { right: 100%; rotate: 180deg; }
```

- [ ] **Step 3: Add responsive stacking without losing the face overlap**

```css
@media (max-width: 1050px) {
	.memory-continuity { grid-template-columns: 1fr; }
	.memory-stage { min-height: 19rem; }
	.faces-stage { min-height: 24rem; }
	.face-stack { max-width: 34rem; margin-inline: auto; }
	.story-flow { display: none; }
}
@media (max-width: 560px) {
	.memory-stage > header { align-items: flex-start; flex-direction: column; }
	.face-stack { min-height: 20rem; margin-inline: 0.65rem; }
	.memory-face { width: 82%; }
	.graph-face { left: 9%; }
	.wiki-face { left: 18%; }
}
```

- [ ] **Step 4: Run the illustration test and confirm the component contract is GREEN**

Run:

```bash
npm run build && npm run test:illustrations
```

Expected: the illustration test still fails only on the missing `Memory.astro` import/rendered copy, not on missing source markers.

- [ ] **Step 5: Commit the component**

```bash
git add src/components/illustrations/MemoryContinuityIllustration.astro
git commit -m "feat: add memory continuity story illustration"
```

### Task 3: Replace the homepage section with the approved editorial composition

**Files:**
- Modify: `src/components/Memory.astro`

- [ ] **Step 1: Replace the import and remove the old controls array**

Use:

```astro
---
import MemoryContinuityIllustration from "./illustrations/MemoryContinuityIllustration.astro";
---
```

- [ ] **Step 2: Replace the section body**

```astro
<section id="memory" class="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
	<div class="glow -right-48 top-16 h-[34rem] w-[34rem] opacity-15" aria-hidden="true"></div>
	<div class="section-shell">
		<div class="grid items-end gap-8 lg:grid-cols-[.92fr_1.08fr] lg:gap-16">
			<div>
				<p class="eyebrow reveal">Hybrid memory · built for continuity</p>
				<h2 class="reveal mt-4 pb-[0.08em] text-4xl leading-[1.04] text-cream sm:text-6xl">
					A new chat.<br />The same understanding.
				</h2>
			</div>
			<p class="reveal max-w-xl text-lg leading-relaxed text-muted" style="--reveal-delay: 70ms">
				Homun remembers more than facts. It preserves <span class="text-cream">what happened, what was decided, and why</span> — through a memory you can inspect, correct, and carry with you.
			</p>
		</div>

		<div class="reveal mt-12" style="--reveal-delay: 110ms">
			<MemoryContinuityIllustration />
		</div>

		<div class="reveal mt-8 flex flex-col justify-between gap-5 border-t border-line pt-6 md:flex-row md:items-center" style="--reveal-delay: 150ms">
			<p class="max-w-xl text-sm leading-relaxed text-muted">
				<span class="text-cream">Not a transcript. Not an opaque embedding blob.</span><br />
				Structured recall, meaningful connections, and a narrative you own.
			</p>
			<ul class="flex flex-wrap gap-2" aria-label="Hybrid memory layers">
				<li class="pill font-mono text-[9px] uppercase tracking-wider"><strong class="text-cream">SQL</strong>&nbsp; · fast recall</li>
				<li class="pill font-mono text-[9px] uppercase tracking-wider"><strong class="text-cream">Graph</strong>&nbsp; · context + why</li>
				<li class="pill font-mono text-[9px] uppercase tracking-wider"><strong class="text-cream">Wiki</strong>&nbsp; · read + correct</li>
			</ul>
		</div>
	</div>
</section>
```

- [ ] **Step 3: Run focused homepage and illustration checks**

Run:

```bash
npm run build && npm run test:homepage && npm run test:illustrations
```

Expected: both test scripts print their passing messages.

- [ ] **Step 4: Commit the section integration**

```bash
git add src/components/Memory.astro
git commit -m "feat: tell the memory continuity story"
```

### Task 4: Add one-shot motion and the complete reduced-motion state

**Files:**
- Modify: `src/components/illustrations/MemoryContinuityIllustration.astro`
- Modify: `scripts/check-homepage-illustrations.mjs`

- [ ] **Step 1: Extend the source contract for one-shot face and flow animation**

Add these assertions after the reduced-motion block:

```js
for (const animation of [
	"memory-stage-enter",
	"memory-face-enter",
	"memory-flow-enter",
]) {
	assert.ok(memorySource.includes(animation), `Memory continuity animation is missing: ${animation}`);
}
assert.ok(
	!memorySource.includes("animation-iteration-count: infinite"),
	"Memory continuity motion must not loop",
);
```

- [ ] **Step 2: Run the illustration test and confirm RED**

```bash
npm run test:illustrations
```

Expected: FAIL with `Memory continuity animation is missing: memory-stage-enter`.

- [ ] **Step 3: Add staged entry animations**

Append to the component CSS:

```css
:global(.reveal.in) .capture-stage { animation: memory-stage-enter 620ms var(--ease-expo) both; }
:global(.reveal.in) .sql-face { animation: memory-face-enter 620ms 180ms var(--ease-expo) both; }
:global(.reveal.in) .graph-face { animation: memory-face-enter 620ms 320ms var(--ease-expo) both; }
:global(.reveal.in) .wiki-face { animation: memory-face-enter 620ms 460ms var(--ease-expo) both; }
:global(.reveal.in) .story-flow { animation: memory-flow-enter 520ms 620ms ease-out both; transform-origin: left; }
:global(.reveal.in) .recall-stage { animation: memory-stage-enter 620ms 720ms var(--ease-expo) both; }
@keyframes memory-stage-enter {
	from { opacity: 0; transform: translateY(14px); }
	to { opacity: 1; transform: translateY(0); }
}
@keyframes memory-face-enter {
	from { opacity: 0; transform: translateY(16px); }
	to { opacity: 1; transform: translateY(0); }
}
@keyframes memory-flow-enter {
	from { opacity: 0; scale: 0 1; }
	to { opacity: 1; scale: 1 1; }
}
@media (prefers-reduced-motion: reduce) {
	.capture-stage,
	.sql-face,
	.graph-face,
	.wiki-face,
	.story-flow,
	.recall-stage {
		animation: none !important;
		transform: none;
		opacity: 1;
	}
}
```

Keep `rotate` as the individual transform property on SQL and Wiki faces so the reduced-motion `transform: none` declaration does not erase their static overlap.

- [ ] **Step 4: Run the focused checks and confirm GREEN**

```bash
npm run build && npm run test:illustrations && npm run test:marketing-backgrounds
```

Expected: all three commands pass.

- [ ] **Step 5: Commit motion and accessibility behaviour**

```bash
git add src/components/illustrations/MemoryContinuityIllustration.astro scripts/check-homepage-illustrations.mjs
git commit -m "feat: animate memory continuity once"
```

### Task 5: Retire the old diagram and verify the production-quality result

**Files:**
- Delete: `src/components/illustrations/MemoryArchitectureIllustration.astro`
- Verify: `src/components/Memory.astro`
- Verify: `src/components/illustrations/MemoryContinuityIllustration.astro`

- [ ] **Step 1: Confirm the old component has no remaining references**

Run:

```bash
rg -n "MemoryArchitectureIllustration|memory-architecture|data-memory-part=\"core\"" src scripts
```

Expected: no references outside the old component itself.

- [ ] **Step 2: Delete the superseded component**

Delete `src/components/illustrations/MemoryArchitectureIllustration.astro` using `apply_patch`.

- [ ] **Step 3: Run the full repository verification**

```bash
npm run check
```

Expected: Astro builds all routes and every homepage, background, download, illustration, product-data, roadmap, and container check passes.

- [ ] **Step 4: Run browser verification at three widths**

Start the site with `npm run dev`, then inspect the real homepage at:

- 1440 × 1000: three scenes remain in one line, the centre face stack is dominant, and no section title is clipped.
- 1024 × 900: scenes stack in narrative order without an awkward half-grid breakpoint.
- 390 × 844: no horizontal overflow; Capture → Three Faces → Recall remains understandable; source and actions remain visible.

At each width verify:

- `#memory` navigation lands on the section;
- no overlap hides SQL, Graph, or Wiki labels;
- the fictional source is legible;
- the Security section still follows later in the page;
- the browser console contains no errors.

- [ ] **Step 5: Verify reduced motion in the browser**

Emulate `prefers-reduced-motion: reduce`, reload the homepage, and verify that all three stages and faces are immediately visible with no entry animation or missing relationship paths.

- [ ] **Step 6: Commit the completed replacement**

```bash
git add src/components/illustrations/MemoryArchitectureIllustration.astro
git commit -m "refactor: retire old memory architecture diagram"
```

- [ ] **Step 7: Prepare publication evidence**

Record:

```bash
git status --short --branch
git log --oneline -6
```

Expected: clean worktree on `fabio/homepage-redesign`, with the continuity test, component, integration, motion, and retirement commits visible. Merge or push to `main` only after the final visual result is accepted.
