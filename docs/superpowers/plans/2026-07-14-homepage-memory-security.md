# Homepage Memory and Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class Memory section to the Homun homepage and connect it to a stronger, separate Security story.

**Architecture:** Create one focused section component and one self-contained SVG/CSS illustration component, then compose them from the existing homepage. Extend the existing static build contracts before implementation so copy, order, navigation, illustration semantics, and reduced-motion behaviour are protected without adding a new test framework.

**Tech Stack:** Astro 6, TypeScript in Astro frontmatter, Tailwind CSS 4 utilities, component-scoped CSS, SVG, Node.js assertion scripts.

---

## File map

- Create `src/components/Memory.astro`: owns the section copy, layout, anchor, and user-control actions.
- Create `src/components/illustrations/MemoryArchitectureIllustration.astro`: owns only the three-layer memory visual and its motion/responsive rules.
- Modify `src/pages/index.astro`: inserts Memory after Model Freedom.
- Modify `src/components/Nav.astro`: adds the top-level Memory anchor to desktop and mobile navigation.
- Modify `src/components/Security.astro`: reframes security as ownership of persistent memory and updates its control list.
- Modify `scripts/check-homepage.mjs`: protects positioning copy, route, and section order.
- Modify `scripts/check-homepage-illustrations.mjs`: protects illustration anatomy, reduced-motion support, and Memory-to-Security order.

### Task 1: Add failing homepage contracts

**Files:**
- Modify: `scripts/check-homepage.mjs`
- Modify: `scripts/check-homepage-illustrations.mjs`

- [ ] **Step 1: Extend the positioning contract**

Add the Memory messages to the `required` array in `scripts/check-homepage.mjs`:

```js
"A memory inspired by how we remember.",
"Fast recall, meaningful connections, and a narrative you can read and correct.",
"Inspect · Correct · Consolidate · Forget · Export",
"Useful memory requires ownership.",
```

Add `"/#memory"` to the required `href` array. Then add this order contract before the final `console.log`:

```js
const modelsPosition = html.indexOf('id="models"');
const memoryPosition = html.indexOf('id="memory"');
const productPosition = html.indexOf('id="product"');
const controlPosition = html.indexOf('id="control"');

assert.ok(modelsPosition >= 0, "Homepage is missing the Models section");
assert.ok(memoryPosition >= 0, "Homepage is missing the Memory section");
assert.ok(productPosition >= 0, "Homepage is missing the Product section");
assert.ok(controlPosition >= 0, "Homepage is missing the Security section");
assert.ok(
	modelsPosition < memoryPosition && memoryPosition < productPosition && productPosition < controlPosition,
	"Memory must render after Models and before Product, with Security later in the story",
);
```

- [ ] **Step 2: Extend the illustration contract**

Add `'data-illustration="memory-architecture"'` to the first marker array in `scripts/check-homepage-illustrations.mjs`.

Add `"MemoryArchitectureIllustration.astro"` to the component array that checks for `prefers-reduced-motion`.

After the existing connected-workspace source checks, add:

```js
const memorySource = await readFile(
	new URL("../src/components/illustrations/MemoryArchitectureIllustration.astro", import.meta.url),
	"utf8",
);

for (const part of [
	'data-memory-part="core"',
	'data-memory-part="recall"',
	'data-memory-part="connections"',
	'data-memory-part="understanding"',
	'data-memory-path="recall"',
	'data-memory-path="connections"',
	'data-memory-path="understanding"',
]) {
	assert.ok(memorySource.includes(part), `Memory illustration is missing: ${part}`);
}

for (const label of [
	"Recall",
	"SQLite + search",
	"Connections",
	"Graph + why",
	"Understanding",
	"Markdown wiki",
]) {
	assert.ok(memorySource.includes(label), `Memory illustration is missing label: ${label}`);
}
```

Replace the old order assertion with explicit non-negative guards and the new order:

```js
const modelsPosition = homepage.indexOf('id="models"');
const memoryPosition = homepage.indexOf('id="memory"');
const workPosition = homepage.indexOf('id="product"');
const connectedPosition = homepage.indexOf('id="connected-action"');
const controlPosition = homepage.indexOf('id="control"');

for (const [name, position] of [
	["models", modelsPosition],
	["memory", memoryPosition],
	["product", workPosition],
	["connected action", connectedPosition],
	["control", controlPosition],
]) {
	assert.ok(position >= 0, `Homepage is missing ordered section: ${name}`);
}

assert.ok(
	modelsPosition < memoryPosition &&
		memoryPosition < workPosition &&
		workPosition < connectedPosition &&
		connectedPosition < controlPosition,
	"Homepage sections must render in the approved product-story order",
);
```

- [ ] **Step 3: Build and run the contracts to verify they fail**

Run:

```bash
npm run build && npm run test:homepage && npm run test:illustrations
```

Expected: `test:homepage` fails with `Homepage is missing required message: A memory inspired by how we remember.` The illustration test will also fail until its new component exists.

- [ ] **Step 4: Commit the red contracts**

```bash
git add scripts/check-homepage.mjs scripts/check-homepage-illustrations.mjs
git commit -m "test: define homepage memory contracts"
```

### Task 2: Build the memory architecture illustration

**Files:**
- Create: `src/components/illustrations/MemoryArchitectureIllustration.astro`
- Test: `scripts/check-homepage-illustrations.mjs`

- [ ] **Step 1: Create the semantic illustration markup**

Create `src/components/illustrations/MemoryArchitectureIllustration.astro` with this structure:

```astro
<div
	class="memory-architecture"
	data-illustration="memory-architecture"
	aria-label="One Homun memory combining fast recall, connected context, and a readable wiki"
	role="img"
>
	<div class="memory-caption" aria-hidden="true">
		<span>Hybrid memory</span>
		<span>One continuous system</span>
	</div>

	<svg class="memory-routes" viewBox="0 0 760 520" aria-hidden="true">
		<defs>
			<linearGradient id="memory-route-recall" x1="380" y1="260" x2="126" y2="112">
				<stop stop-color="#50dfc5" />
				<stop offset="1" stop-color="#20a991" stop-opacity=".35" />
			</linearGradient>
			<linearGradient id="memory-route-connections" x1="380" y1="260" x2="634" y2="153">
				<stop stop-color="#77a2f5" />
				<stop offset="1" stop-color="#346bd7" stop-opacity=".35" />
			</linearGradient>
			<linearGradient id="memory-route-understanding" x1="380" y1="260" x2="260" y2="420">
				<stop stop-color="#ef78d8" />
				<stop offset="1" stop-color="#7e377a" stop-opacity=".35" />
			</linearGradient>
		</defs>
		<ellipse class="memory-orbit" cx="380" cy="260" rx="270" ry="184" />
		<path data-memory-path="recall" pathLength="1" d="M352 242C292 190 230 142 144 120" stroke="url(#memory-route-recall)" />
		<path data-memory-path="connections" pathLength="1" d="M410 242C476 190 542 158 618 150" stroke="url(#memory-route-connections)" />
		<path data-memory-path="understanding" pathLength="1" d="M366 292C340 342 307 383 270 416" stroke="url(#memory-route-understanding)" />
	</svg>

	<div class="memory-core" data-memory-part="core" aria-hidden="true">
		<span class="core-signal"></span>
		<span>Memory</span>
		<small>Homun</small>
	</div>

	<div class="memory-node node-recall" data-memory-part="recall">
		<span class="node-index">01</span>
		<strong>Recall</strong>
		<small>SQLite + search</small>
	</div>

	<div class="memory-node node-connections" data-memory-part="connections">
		<span class="node-index">02</span>
		<strong>Connections</strong>
		<small>Graph + why</small>
	</div>

	<div class="memory-node node-understanding" data-memory-part="understanding">
		<span class="node-index">03</span>
		<strong>Understanding</strong>
		<small>Markdown wiki</small>
	</div>
</div>
```

- [ ] **Step 2: Add scoped visual, entry-motion, and responsive CSS**

Append this component-scoped style block:

```astro
<style>
	.memory-architecture {
		position: relative;
		min-height: 34rem;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 1.5rem;
		background:
			radial-gradient(circle at 50% 48%, rgba(80, 223, 197, 0.13), transparent 27%),
			linear-gradient(145deg, rgba(9, 20, 17, 0.94), rgba(5, 9, 8, 0.99));
		box-shadow: var(--shadow-lift);
	}

	.memory-caption {
		position: absolute;
		inset: 1.2rem 1.35rem auto;
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-faint);
	}

	.memory-routes { position: absolute; inset: 2.5rem 0 0; width: 100%; height: calc(100% - 2.5rem); }
	.memory-routes path { fill: none; stroke-width: 2; stroke-linecap: round; }
	.memory-orbit { fill: none; stroke: rgba(80, 223, 197, 0.16); stroke-dasharray: 5 12; }

	.memory-core,
	.memory-node { position: absolute; z-index: 2; }

	.memory-core {
		left: 50%;
		top: 50%;
		display: grid;
		width: 7.5rem;
		aspect-ratio: 1;
		place-content: center;
		translate: -50% -43%;
		border: 1px solid rgba(80, 223, 197, 0.5);
		border-radius: 2rem;
		background: linear-gradient(145deg, rgba(16, 40, 33, 0.98), rgba(7, 15, 13, 0.98));
		box-shadow: 0 0 70px -24px rgba(80, 223, 197, 0.75);
		text-align: center;
		text-transform: uppercase;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		letter-spacing: 0.15em;
	}

	.memory-core small { margin-top: 0.35rem; color: var(--color-faint); font-size: 0.52rem; }
	.core-signal { width: 0.42rem; height: 0.42rem; margin: 0 auto 0.65rem; border-radius: 50%; background: var(--color-accent-bright); box-shadow: 0 0 16px var(--color-accent-glow); }

	.memory-node {
		min-width: 10rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--color-line-strong);
		border-radius: 1rem;
		background: rgba(8, 17, 14, 0.94);
		box-shadow: 0 20px 50px -30px #000;
	}

	.memory-node strong,
	.memory-node small { display: block; }
	.memory-node strong { margin-top: 0.55rem; color: var(--color-cream); font-size: 0.94rem; }
	.memory-node small { margin-top: 0.35rem; color: var(--color-faint); font-family: var(--font-mono); font-size: 0.6rem; }
	.node-index { color: var(--color-accent-bright); font-family: var(--font-mono); font-size: 0.56rem; letter-spacing: 0.12em; }
	.node-recall { left: 4%; top: 15%; }
	.node-connections { right: 4%; top: 23%; }
	.node-understanding { left: 14%; bottom: 8%; }

	:global(.reveal.in) .memory-core { animation: memory-core-enter 700ms var(--ease-expo) both; }
	:global(.reveal.in) .memory-node { animation: memory-node-enter 650ms var(--ease-expo) both; }
	:global(.reveal.in) .node-recall { animation-delay: 260ms; }
	:global(.reveal.in) .node-connections { animation-delay: 430ms; }
	:global(.reveal.in) .node-understanding { animation-delay: 600ms; }
	:global(.reveal.in) [data-memory-path] { animation: memory-route-draw 780ms var(--ease-expo) both; stroke-dasharray: 1; stroke-dashoffset: 1; }
	:global(.reveal.in) [data-memory-path="connections"] { animation-delay: 170ms; }
	:global(.reveal.in) [data-memory-path="understanding"] { animation-delay: 340ms; }
	:global(.reveal.in) .core-signal { animation: memory-confirm 850ms 900ms ease-out both; }

	@keyframes memory-core-enter { from { opacity: 0; scale: 0.86; } to { opacity: 1; scale: 1; } }
	@keyframes memory-node-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
	@keyframes memory-route-draw { to { stroke-dashoffset: 0; } }
	@keyframes memory-confirm { 0% { scale: 0.7; opacity: 0; } 45% { scale: 1.45; opacity: 1; } 100% { scale: 1; opacity: 1; } }

	@media (max-width: 640px) {
		.memory-architecture { min-height: 39rem; }
		.memory-routes { display: none; }
		.memory-caption { font-size: 0.5rem; }
		.memory-core { top: 24%; width: 6.6rem; }
		.memory-node { left: 1.25rem; right: 1.25rem; min-width: 0; }
		.node-recall { top: 40%; }
		.node-connections { top: 59%; }
		.node-understanding { top: 78%; bottom: auto; }
	}

	@media (prefers-reduced-motion: reduce) {
		.memory-core,
		.memory-node,
		[data-memory-path],
		.core-signal { animation: none !important; opacity: 1; stroke-dashoffset: 0; transform: none; }
	}
</style>
```

- [ ] **Step 3: Run the focused illustration contract**

Run:

```bash
npm run build && npm run test:illustrations
```

Expected: the new Memory-specific source checks pass; the test may still fail on the absent homepage marker until Task 3 integrates the component.

- [ ] **Step 4: Commit the illustration**

```bash
git add src/components/illustrations/MemoryArchitectureIllustration.astro
git commit -m "feat: add hybrid memory illustration"
```

### Task 3: Add Memory to the homepage and navigation

**Files:**
- Create: `src/components/Memory.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/components/Nav.astro`
- Test: `scripts/check-homepage.mjs`
- Test: `scripts/check-homepage-illustrations.mjs`

- [ ] **Step 1: Create the Memory section**

Create `src/components/Memory.astro`:

```astro
---
import MemoryArchitectureIllustration from "./illustrations/MemoryArchitectureIllustration.astro";

const controls = ["Inspect", "Correct", "Consolidate", "Forget", "Export"] as const;
---

<section id="memory" class="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
	<div class="glow -right-48 top-16 h-[30rem] w-[30rem] opacity-15" aria-hidden="true"></div>
	<div class="section-shell grid items-center gap-14 lg:grid-cols-[.88fr_1.12fr] lg:gap-20">
		<div>
			<p class="eyebrow reveal">Hybrid memory</p>
			<h2 class="reveal mt-4 pb-[0.06em] text-4xl leading-[1.06] text-cream sm:text-6xl">
				A memory inspired by how we remember.
			</h2>
			<p class="reveal mt-6 max-w-xl text-lg leading-relaxed text-muted" style="--reveal-delay: 70ms">
				Fast recall, meaningful connections, and a narrative you can read and correct.
			</p>

			<ul class="reveal mt-9 flex max-w-xl flex-wrap gap-x-4 gap-y-3 border-t border-line pt-5" style="--reveal-delay: 130ms" aria-label="Memory controls">
				{controls.map((control) => (
					<li class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
						<span class="status-dot h-1 w-1"></span>{control}
					</li>
				))}
			</ul>
		</div>

		<div class="reveal" style="--reveal-delay: 110ms">
			<MemoryArchitectureIllustration />
		</div>
	</div>
</section>
```

- [ ] **Step 2: Compose the section after Model Freedom**

In `src/pages/index.astro`, add:

```astro
import Memory from "../components/Memory.astro";
```

Then render it exactly here:

```astro
<ModelFreedom />
<Memory />
<WorkProof />
```

- [ ] **Step 3: Add the top-level Memory link**

In `src/components/Nav.astro`, insert this entry after Models:

```ts
{ label: "Memory", href: "/#memory" },
```

The existing `links.map` calls automatically expose the same link in desktop and mobile navigation.

- [ ] **Step 4: Run both homepage contracts**

Run:

```bash
npm run build && npm run test:homepage && npm run test:illustrations
```

Expected:

```text
Homepage positioning contract passed
Homepage illustration contract passed
```

- [ ] **Step 5: Commit the integrated Memory section**

```bash
git add src/components/Memory.astro src/pages/index.astro src/components/Nav.astro
git commit -m "feat: make memory a homepage pillar"
```

### Task 4: Connect Security to ownership and control

**Files:**
- Modify: `src/components/Security.astro`
- Modify: `scripts/check-homepage-illustrations.mjs`
- Test: `scripts/check-homepage.mjs`

- [ ] **Step 1: Replace the Security control copy**

Replace the `controls` array in `src/components/Security.astro` with:

```ts
const controls = [
	{ title: "Keep knowledge local and in scope", body: "Memory is stored locally by default and separated by user and project, so one workspace does not silently become another's context." },
	{ title: "Grant access explicitly", body: "Tools and connectors begin denied and operate through permissions you approve." },
	{ title: "Inspect what happened", body: "Activity and audit history keep tool use, decisions and results visible." },
	{ title: "Protect secrets by design", body: "Sensitive credentials belong behind the Vault boundary, not inside readable memory." },
	{ title: "Retain the final say", body: "Correct, export or truly forget stored knowledge when it no longer belongs in the system." },
] as const;
```

- [ ] **Step 2: Replace the section introduction**

Use this content in the existing text column:

```astro
<p class="eyebrow reveal">Security and control</p>
<h2 class="reveal mt-4 text-4xl text-cream sm:text-6xl">Useful memory requires ownership.</h2>
<p class="reveal mt-6 text-lg leading-relaxed text-muted" style="--reveal-delay: 70ms">
	Homun makes the storage, access boundary and activity visible—so persistent context remains something you direct.
</p>
```

Change the controls grid from `sm:grid-cols-2` to `sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2` so five items remain balanced beside the screenshot.

- [ ] **Step 3: Update the preserved-copy assertion**

In `scripts/check-homepage-illustrations.mjs`, replace:

```js
"Your system remains yours to direct.",
```

with:

```js
"Useful memory requires ownership.",
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run build && npm run test:homepage && npm run test:illustrations
```

Expected: both contract scripts print their `passed` messages and exit with code 0.

- [ ] **Step 5: Commit the Security narrative**

```bash
git add src/components/Security.astro scripts/check-homepage.mjs scripts/check-homepage-illustrations.mjs
git commit -m "feat: connect memory to security ownership"
```

### Task 5: Verify behaviour and visual quality

**Files:**
- Verify: `src/components/Memory.astro`
- Verify: `src/components/illustrations/MemoryArchitectureIllustration.astro`
- Verify: `src/components/Security.astro`
- Verify: `src/components/Nav.astro`

- [ ] **Step 1: Run the complete repository check**

Run:

```bash
npm run check
```

Expected: Astro production build completes and every contract script passes with exit code 0.

- [ ] **Step 2: Start the local production-equivalent preview**

Run:

```bash
npm run preview -- --host 127.0.0.1
```

Expected: Astro prints a local preview URL and serves the built homepage.

- [ ] **Step 3: Verify desktop layout in the in-app browser**

At a 1440 × 1000 viewport, verify all of the following:

- `Memory` appears in the navigation and scrolls to `#memory`.
- Memory follows Model Freedom and precedes Work Proof.
- All three nodes and route lines are visible.
- The headline descender in `memory` is not clipped.
- The illustration enters once and remains still afterward.
- Security remains visually separate and starts with `Useful memory requires ownership.`

- [ ] **Step 4: Verify mobile and reduced-motion layouts**

At a 390 × 844 viewport, verify:

- mobile navigation contains Memory and closes after selection;
- node labels form a readable vertical sequence;
- the control list wraps without truncation;
- no horizontal overflow exists.

Emulate `prefers-reduced-motion: reduce`, reload, and verify that all Memory content is immediately visible with no path drawing or pulse.

- [ ] **Step 5: Inspect the final repository state**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: the worktree is clean and the new test, illustration, Memory, and Security commits appear in the recent history.
