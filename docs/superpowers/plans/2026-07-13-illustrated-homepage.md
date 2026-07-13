# Illustrated Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved B2 adaptable-workshop illustration system to the Homun homepage with balanced narrative density, restrained motion, and preserved product proof.

**Architecture:** Four focused Astro components own inline SVG scenes and their local CSS animation. Existing homepage sections own copy and layout, importing only the illustration they need. A static build contract verifies component presence, reduced-motion support, banned-metaphor absence, and preservation of product/download messages.

**Tech Stack:** Astro 6, inline SVG, scoped CSS, Tailwind utilities, Node built-in assertions.

---

## File map

- Create `src/components/illustrations/WorkshopIllustration.astro`: hero adaptable-workshop scene.
- Create `src/components/illustrations/EngineTransition.astro`: stable Homun centre with replaceable model modules.
- Create `src/components/illustrations/WorkSpotIllustration.astro`: finite `kind` variants for code, deliverables, local work, and project continuity.
- Create `src/components/illustrations/EcosystemIllustration.astro`: Projects-to-Marketplace ecosystem scene.
- Create `scripts/check-homepage-illustrations.mjs`: rendered illustration contract.
- Modify `src/components/Hero.astro`: replace the operator panel with the workshop scene.
- Modify `src/components/ModelFreedom.astro`: add the engine transition after model choices.
- Modify `src/components/WorkProof.astro`: add four spot scenes while preserving the product screenshot.
- Modify `src/components/Ecosystem.astro`: add split header scene while preserving roadmap and marketplace cards.
- Modify `package.json`: include the new contract in `npm run check`.

### Task 1: Illustration contract

**Files:**
- Create: `scripts/check-homepage-illustrations.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing rendered contract**

Create `scripts/check-homepage-illustrations.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

for (const marker of [
	"data-illustration=\"workshop\"",
	"data-illustration=\"engines\"",
	"data-illustration=\"work-code\"",
	"data-illustration=\"work-deliverables\"",
	"data-illustration=\"work-local\"",
	"data-illustration=\"work-continuity\"",
	"data-illustration=\"ecosystem\"",
	"prefers-reduced-motion:reduce",
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing illustration contract: ${marker}`);
}

for (const forbidden of ["ai-brain", "robot-mascot", "laptop-illustration", "bg-grid"]) {
	assert.ok(!homepage.includes(forbidden), `Homepage contains banned illustration metaphor: ${forbidden}`);
}

for (const preserved of [
	"Your work. Your models. Your system.",
	"Real work, not isolated prompts.",
	"Your system remains yours to direct.",
	"Start without creating an account.",
	"data-homun-download",
]) {
	assert.ok(homepage.includes(preserved), `Homepage lost required content: ${preserved}`);
}

console.log("Homepage illustration contract passed");
```

Add to `package.json`:

```json
"test:illustrations": "node scripts/check-homepage-illustrations.mjs",
"check": "npm run build && npm run test:homepage && npm run test:marketing-backgrounds && npm run test:downloads && npm run test:illustrations"
```

- [ ] **Step 2: Build and verify the new contract fails**

Run: `npm run build && npm run test:illustrations`

Expected: FAIL on `data-illustration="workshop"`.

- [ ] **Step 3: Commit the failing contract**

```bash
git add package.json scripts/check-homepage-illustrations.mjs
git commit -m "test: define homepage illustration contract"
```

### Task 2: Hero adaptable workshop

**Files:**
- Create: `src/components/illustrations/WorkshopIllustration.astro`
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Create the focused workshop scene**

Build a decorative component with this semantic boundary and visual groups:

```astro
<div class="workshop-illustration" data-illustration="workshop" aria-hidden="true">
	<svg viewBox="0 0 640 520" fill="none">
		<g class="workshop-floor"><path d="M80 390 320 250 560 390 320 500Z" /></g>
		<g class="workshop-core"><path d="M250 230 320 190 390 230 320 270Z" /><path d="M250 230V350L320 390V270Z" /><path d="M390 230V350L320 390V270Z" /></g>
		<g class="module module-projects"><rect x="55" y="110" width="165" height="118" rx="18" /></g>
		<g class="module module-memory"><rect x="420" y="92" width="165" height="118" rx="18" /></g>
		<g class="module module-model"><path d="M450 330 500 300 550 330 500 360Z" /></g>
		<g class="workshop-paths"><path d="M220 190 270 245M420 190 370 245M390 350 450 340" /></g>
	</svg>
</div>
```

Use only inline `path`, `rect`, `circle`, `line`, and `text` elements. The central teal/cream core is visually stable. Blue, magenta, and amber are limited to peripheral modules. Add scoped styles for the frame, module shadows, a 12-second 3-pixel module drift, a slow path-opacity pulse, and:

```css
@media (prefers-reduced-motion: reduce) {
	.module,
	.workshop-paths { animation: none; }
}
```

- [ ] **Step 2: Replace the hero operator panel**

Import the component in `Hero.astro` and replace the current `Live workspace` panel with:

```astro
<div class="reveal relative z-10" style="--reveal-delay: 140ms">
	<WorkshopIllustration />
</div>
```

Keep the headline, paragraph, buttons, and installer line unchanged.

- [ ] **Step 3: Build and inspect the hero marker**

Run: `npm run build && rg -n 'data-illustration="workshop"' dist/index.html`

Expected: the rendered homepage contains one workshop marker and the build exits 0.

- [ ] **Step 4: Commit the hero scene**

```bash
git add src/components/Hero.astro src/components/illustrations/WorkshopIllustration.astro
git commit -m "feat: illustrate the adaptable Homun workshop"
```

### Task 3: Replaceable-engine transition

**Files:**
- Create: `src/components/illustrations/EngineTransition.astro`
- Modify: `src/components/ModelFreedom.astro`

- [ ] **Step 1: Create the engine transition component**

Render a wide `data-illustration="engines"` scene containing one stable `HOMUN` workspace block at the centre, left and right model cubes, a continuous teal route, and two small decision markers. Use `viewBox="0 0 960 250"`, `aria-hidden="true"`, and scoped CSS.

Only the outer engine modules translate up to 4 pixels over 14 seconds. The centre never animates. Add a reduced-motion media query that disables both module and route animations.

- [ ] **Step 2: Integrate below model cards**

Import `EngineTransition` and add below the existing choice grid:

```astro
<div class="reveal mx-auto mt-8 max-w-5xl" style="--reveal-delay: 220ms">
	<EngineTransition />
</div>
```

- [ ] **Step 3: Run the partial contract**

Run: `npm run build && rg -n 'data-illustration="engines"' dist/index.html`

Expected: one engine marker and a successful build.

- [ ] **Step 4: Commit the engine transition**

```bash
git add src/components/ModelFreedom.astro src/components/illustrations/EngineTransition.astro
git commit -m "feat: show replaceable model engines"
```

### Task 4: Four work spot illustrations

**Files:**
- Create: `src/components/illustrations/WorkSpotIllustration.astro`
- Modify: `src/components/WorkProof.astro`

- [ ] **Step 1: Define the finite variant component**

Use this exact public interface:

```astro
---
interface Props { kind: "code" | "deliverables" | "local" | "continuity"; }
const { kind } = Astro.props;
---
<div class="work-spot" data-illustration={`work-${kind}`} aria-hidden="true">
	{kind === "code" && <svg viewBox="0 0 120 86"><rect x="8" y="9" width="104" height="68" rx="12" /><path d="m37 30-12 13 12 13m46-26 12 13-12 13M68 24 52 62" /></svg>}
	{kind === "deliverables" && <svg viewBox="0 0 120 86"><rect x="31" y="8" width="58" height="70" rx="9" /><path d="M44 28h32M44 40h25M44 52h34" /></svg>}
	{kind === "local" && <svg viewBox="0 0 120 86"><path d="m22 28 38-20 38 20-38 21Z" /><path d="M22 28v38l38 20V49Zm76 0v38L60 86V49Z" /></svg>}
	{kind === "continuity" && <svg viewBox="0 0 120 86"><path d="M12 62C34 12 50 74 70 30c12-27 27-11 38 8" /><circle cx="12" cy="62" r="6" /><circle cx="108" cy="38" r="6" /></svg>}
</div>
```

Code uses a terminal surface, deliverables uses stacked document/deck surfaces, local uses a contained cube, and continuity uses one curved path with start/end markers. These compact SVGs have no animation.

- [ ] **Step 2: Add kinds to outcome data and redesign the list**

Add `kind` to the four outcome objects in order. Replace each current row with a bordered card that contains the spot illustration, small index metadata, heading, and body. Use a four-column desktop grid, two-column tablet grid, and one-column narrow layout:

```astro
<div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	{outcomes.map((outcome, index) => (
		<article class="reveal card p-5" style={`--reveal-delay: ${index * 60}ms`}>
			<WorkSpotIllustration kind={outcome.kind} />
			<span class="mt-5 block font-mono text-[10px] text-accent-bright">{outcome.index}</span>
			<h3 class="mt-3 text-lg text-cream">{outcome.title}</h3>
			<p class="mt-3 text-sm leading-relaxed text-muted">{outcome.body}</p>
		</article>
	))}
</div>
```

Keep the existing real chat screenshot and product-evidence frame below the cards.

- [ ] **Step 3: Build and verify all four markers**

Run: `npm run build && npm run test:illustrations`

Expected: contract still fails only because the ecosystem marker is not implemented; all four `work-*` markers exist.

- [ ] **Step 4: Commit the work spots**

```bash
git add src/components/WorkProof.astro src/components/illustrations/WorkSpotIllustration.astro
git commit -m "feat: illustrate Homun work outcomes"
```

### Task 5: Living ecosystem scene

**Files:**
- Create: `src/components/illustrations/EcosystemIllustration.astro`
- Modify: `src/components/Ecosystem.astro`

- [ ] **Step 1: Create the ecosystem component**

Render `data-illustration="ecosystem"` with `viewBox="0 0 640 360"`. The scene has a Projects surface on the left, a Plugins surface on the right, one teal growth path, blue and magenta extension modules, and an amber decision marker. Add a slow peripheral drift and reduced-motion override; keep the path and main surfaces fixed.

- [ ] **Step 2: Convert the ecosystem header to the approved split**

Import the component and replace the current single-column header with:

```astro
<div class="grid items-center gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
	<div class="max-w-2xl">
		<p class="eyebrow reveal">A living system</p>
		<h2 class="reveal mt-4 text-4xl text-cream sm:text-6xl">Designed to keep growing.</h2>
		<p class="reveal mt-6 max-w-2xl text-lg leading-relaxed text-muted">Follow what Homun may become, shape the direction over time, and extend what it can do through a curated ecosystem.</p>
	</div>
	<div class="reveal" style="--reveal-delay: 90ms"><EcosystemIllustration /></div>
</div>
```

Keep the two existing Projects and Marketplace cards below the new split without changing their status, optional-account copy, or links.

- [ ] **Step 3: Run the complete illustration contract**

Run: `npm run build && npm run test:illustrations`

Expected: `Homepage illustration contract passed`.

- [ ] **Step 4: Commit the ecosystem scene**

```bash
git add src/components/Ecosystem.astro src/components/illustrations/EcosystemIllustration.astro
git commit -m "feat: illustrate the growing Homun ecosystem"
```

### Task 6: Full verification and visual QA

**Files:**
- Verify all changed files; modify only the smallest responsible component if QA exposes a defect.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm run check && git diff --check`

Expected: 47 pages build; homepage, background, download, and illustration contracts pass; no whitespace errors.

- [ ] **Step 2: Verify desktop at 1440 × 1000**

Open the homepage and inspect hero, model transition, work cards, real screenshot, ecosystem split, and download section. Confirm no horizontal overflow, no console errors, and clear visual alternation between illustrated and real-product sections.

- [ ] **Step 3: Verify tablet and mobile**

At 820 × 1000 and 390 × 844, confirm copy precedes illustrations, work cards collapse 2 then 1 column, secondary SVG labels do not become unreadable, the adaptive download remains visible, and no horizontal overflow occurs.

- [ ] **Step 4: Verify reduced-motion CSS and final repository state**

Run:

```bash
rg -n "prefers-reduced-motion" src/components/illustrations
git status --short
git log --oneline -8
```

Expected: each animated main illustration has a reduced-motion override and the worktree is clean.
