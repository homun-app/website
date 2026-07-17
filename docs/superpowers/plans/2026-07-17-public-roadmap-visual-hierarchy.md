# Public Roadmap Visual Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public roadmap as one connected product story centered on Homun Flow, with three clearly differentiated expansion directions and no empty single-card status sections.

**Architecture:** Keep the existing roadmap v3 data, GitHub synchronization, publication states, detail routes, voting policy, and release snapshots unchanged. Replace the generic status-band composition in `src/pages/roadmap/index.astro` with five focused presentation components; the page owns item selection and ordering, while leaf components render current proof, directions, workflow products, and release evidence.

**Tech Stack:** Astro 6, TypeScript, Tailwind CSS 4, checked-in roadmap/release JSON snapshots, Node.js assertion scripts.

---

## Scope and file map

Create these focused components:

- `src/components/roadmap/RoadmapVisionHero.astro`: hero promise and GitHub sync date.
- `src/components/roadmap/RoadmapNow.astro`: compact Available foundation plus dominant Building Homun Flow card.
- `src/components/roadmap/RoadmapDirections.astro`: Team & Reach, Workflow Products, Company Intelligence, and their learning loop.
- `src/components/roadmap/WorkflowProducts.astro`: featured Client Work candidate, remaining workflow ideas, voting, and submission.
- `src/components/roadmap/RoadmapEvidence.astro`: Voice research, Developer Platform, and consolidated release evidence.

Modify:

- `src/pages/roadmap/index.astro`: select canonical items by slug, validate required data, and compose the five sections.
- `scripts/check-roadmap-v3-pages.mjs`: assert the new copy, hierarchy, item reachability, preserved actions, and removed legacy headings.

Delete after the replacement is complete:

- `src/components/roadmap/ProductJourney.astro`
- `src/components/roadmap/RoadmapJourney.astro`
- `src/components/roadmap/FeaturedProject.astro`
- `src/components/roadmap/WorkflowIdeas.astro`
- `src/components/roadmap/LatestRelease.astro`
- `src/components/roadmap/ReleaseHistory.astro`

Keep and reuse:

- `src/components/roadmap/ProgramMilestones.astro`
- `src/components/roadmap/RoadmapParticipation.astro`
- `src/components/illustrations/RoadmapOrbitIllustration.astro`
- `src/lib/product-data.ts`
- `src/lib/roadmap-presentation.mjs`
- `src/data/roadmap.json`
- `src/data/releases.json`

No roadmap data, GitHub Project state, release snapshot, detail route, or synchronization script changes belong in this implementation.

### Task 1: Replace the abstract journey with the vision hero and current product proof

**Files:**

- Create: `src/components/roadmap/RoadmapVisionHero.astro`
- Create: `src/components/roadmap/RoadmapNow.astro`
- Modify: `src/pages/roadmap/index.astro`
- Modify: `scripts/check-roadmap-v3-pages.mjs`

- [ ] **Step 1: Change the rendered-page contract for the hero and current product section**

In `scripts/check-roadmap-v3-pages.mjs`, replace the entire original main-roadmap required-text loop with these two loops:

```js
for (const required of [
	"BUILT FOR SMALL COMPANIES AND TEAMS",
	"AI that keeps your company moving.",
	"Homun coordinates requests, recurring work and reviews across people and AI",
	"One operational foundation. Official workflow products. Company intelligence under your control.",
	"Where Homun is today",
	"From capable workspace to coordinated work.",
	"Available",
	"Homun Operational Workspace",
	"Building now",
	"Homun Flow",
	"Request", "Work", "Review", "Deliver",
]) assert.ok(roadmapText.includes(required), `Roadmap current-product story missing: ${required}`);

for (const required of [
	"Up next",
	"Business workflows we are evaluating",
	"Client Work", "Sales Operations", "Content & Marketing", "Internal Operations", "Customer Support",
	"Adaptive Company Intelligence",
	"Exploring",
	"Release history",
	"v0.1.1060",
]) assert.ok(roadmapText.includes(required), `Roadmap downstream section missing: ${required}`);

for (const removed of ["One continuous product journey", "Available today"]) {
	assert.ok(!roadmapText.includes(removed), `Roadmap still renders removed section: ${removed}`);
}
```

Later tasks shrink the downstream loop as each legacy section is replaced. Do not keep the original loop because it requires headings this task intentionally removes.

- [ ] **Step 2: Run the focused contract and verify it fails**

Run:

```bash
npm run build && npm run test:roadmap
```

Expected: `test:roadmap` fails first on `BUILT FOR SMALL COMPANIES AND TEAMS` because the new composition does not exist.

- [ ] **Step 3: Create the vision hero**

Create `src/components/roadmap/RoadmapVisionHero.astro`:

```astro
---
interface Props { synced: string }
const { synced } = Astro.props;
---

<section class="relative overflow-hidden pb-16 pt-36 sm:pt-44" aria-labelledby="roadmap-title">
	<div class="atmosphere absolute inset-0 -z-10" aria-hidden="true"></div>
	<div class="glow left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 opacity-25" aria-hidden="true"></div>
	<div class="mx-auto max-w-6xl px-5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<p class="eyebrow reveal">BUILT FOR SMALL COMPANIES AND TEAMS</p>
			<p class="reveal flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-faint">
				<span class="status-dot" aria-hidden="true"></span> Synced with GitHub · {synced}
			</p>
		</div>
		<h1 id="roadmap-title" class="reveal text-gradient mt-5 max-w-5xl text-5xl font-semibold sm:text-6xl lg:text-7xl">
			AI that keeps your company moving.
		</h1>
		<p class="reveal mt-6 max-w-3xl text-lg leading-relaxed text-muted">
			Homun coordinates requests, recurring work and reviews across people and AI—then learns from the knowledge and outcomes your company chooses to preserve.
		</p>
		<p class="reveal mt-5 max-w-3xl font-mono text-xs leading-relaxed text-faint">
			One operational foundation. Official workflow products. Company intelligence under your control.
		</p>
	</div>
</section>
```

- [ ] **Step 4: Create the current-product composition**

Create `src/components/roadmap/RoadmapNow.astro`:

```astro
---
import type { RoadmapItem } from "../../lib/product-data";
import RoadmapOrbitIllustration from "../illustrations/RoadmapOrbitIllustration.astro";
import ProgramMilestones from "./ProgramMilestones.astro";

interface Props { operational: RoadmapItem; flow: RoadmapItem }
const { operational, flow } = Astro.props;
const updated = flow.publicUpdateDate
	? new Date(`${flow.publicUpdateDate}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
	: null;
const lifecycle = ["Request", "Work", "Review", "Deliver"];
---

<section aria-labelledby="roadmap-now-title">
	<p class="eyebrow">Where Homun is today</p>
	<h2 id="roadmap-now-title" class="mt-3 text-3xl font-semibold sm:text-4xl">From capable workspace to coordinated work.</h2>
	<p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
		Homun already performs useful work. Homun Flow turns those capabilities into processes a team can see, review and improve.
	</p>
	<div class="mt-8 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
		<article class="card card-hover relative flex flex-col p-6">
			<div class="flex items-center justify-between gap-3">
				<p class="eyebrow">Available</p><span class="pill text-[10px]">Product foundation</span>
			</div>
			<h3 class="mt-5 text-2xl font-semibold"><a class="card-link focus-visible:outline-none" href={`/roadmap/${operational.slug}/`}>{operational.title}</a></h3>
			<p class="mt-3 text-sm leading-relaxed text-muted">{operational.outcome}</p>
			<ul class="mt-6 flex flex-wrap gap-2" aria-label="Available capabilities">
				{operational.firstRelease.slice(0, 6).map((capability) => <li class="pill text-[10px]">{capability}</li>)}
			</ul>
		</article>
		<article class="flow-card card sheen relative min-h-[27rem] overflow-hidden p-6 sm:p-8">
			<div class="relative z-10 max-w-[34rem]">
				<div class="flex flex-wrap items-center gap-3"><p class="eyebrow">Building now</p>{updated && <span class="pill text-[10px]">Updated {updated}</span>}</div>
				<h3 class="mt-6 text-3xl font-semibold sm:text-4xl">{flow.title}</h3>
				<p class="mt-4 text-[15px] leading-relaxed text-muted">{flow.outcome}</p>
				<ol class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Homun Flow lifecycle">
					{lifecycle.map((step, index) => <li class="rounded-xl border border-line bg-bg/35 px-3 py-3 text-center text-xs text-muted"><span class="mr-1 font-mono text-accent-bright">{index + 1}</span> {step}</li>)}
				</ol>
				<ProgramMilestones milestones={flow.milestones.slice(0, 3)} compact />
				<a href={`/roadmap/${flow.slug}/`} class="link-accent mt-7 inline-flex items-center gap-2 text-sm font-semibold">See the milestones <span aria-hidden="true">→</span></a>
			</div>
			<div class="absolute -bottom-16 -right-14 w-[24rem] opacity-35 sm:w-[28rem] lg:opacity-55" aria-hidden="true"><RoadmapOrbitIllustration /></div>
		</article>
	</div>
</section>

<style>
	.card-link::after { content: ""; position: absolute; inset: 0; }
	.card-link:focus-visible::after { border-radius: inherit; outline: 2px solid var(--color-accent); outline-offset: 2px; }
	.flow-card { background: radial-gradient(circle at 83% 52%, rgba(53, 171, 145, .15), transparent 38%), linear-gradient(145deg, rgba(13, 36, 31, .95), rgba(6, 13, 11, .96)); }
</style>
```

- [ ] **Step 5: Replace the current hero, product journey, Available section, and featured project in the page**

In `src/pages/roadmap/index.astro`:

1. import `RoadmapVisionHero` and `RoadmapNow`;
2. import `projectBySlug` from `../../lib/product-data`;
3. select `operational-workspace` and `homun-flow` by slug;
4. throw `new Error("Roadmap current-product programs are missing")` if either is absent;
5. render:

```astro
<RoadmapVisionHero synced={synced} />
<section class="pb-20 pt-4">
	<div class="mx-auto max-w-6xl px-5"><RoadmapNow operational={operational} flow={flow} /></div>
</section>
```

Remove the old inline hero, `<ProductJourney />`, Available `<RoadmapJourney />`, and `<FeaturedProject />` blocks. Do not remove their component files yet.

- [ ] **Step 6: Run the focused contract and verify it passes**

Run:

```bash
npm run build && npm run test:roadmap
```

Expected: `Roadmap v3 rendered page contract passed`.

- [ ] **Step 7: Commit the current-product story**

```bash
git add src/components/roadmap/RoadmapVisionHero.astro src/components/roadmap/RoadmapNow.astro src/pages/roadmap/index.astro scripts/check-roadmap-v3-pages.mjs
git commit -m "feat: connect roadmap vision to current product"
```

### Task 2: Replace status bands with three connected product directions

**Files:**

- Create: `src/components/roadmap/RoadmapDirections.astro`
- Modify: `src/pages/roadmap/index.astro`
- Modify: `scripts/check-roadmap-v3-pages.mjs`

- [ ] **Step 1: Add failing assertions for the three directions**

Remove `"Up next"` and `"Adaptive Company Intelligence"` from the temporary downstream required-text loop, then add after the current-product assertions:

```js
for (const required of [
	"How the system expands",
	"One core. Three directions.",
	"Adoption layer", "Team & Reach", "Up next",
	"Commercial layer", "Workflow Products", "Evaluate → Pilot",
	"Intelligence layer", "Company Intelligence", "Research · Long term",
	"Team processes", "Verified outcomes", "Better company-specific assistance",
]) assert.ok(roadmapText.includes(required), `Roadmap direction missing: ${required}`);

for (const removed of ["Decided product direction", "Long-term product advantage"]) {
	assert.ok(!roadmapText.includes(removed), `Roadmap still renders legacy direction band: ${removed}`);
}
```

- [ ] **Step 2: Run the contract and verify it fails**

Run `npm run build && npm run test:roadmap`.

Expected: failure on `How the system expands`.

- [ ] **Step 3: Create `RoadmapDirections.astro`**

Create a component with this interface and data normalization:

```astro
---
import type { RoadmapItem } from "../../lib/product-data";

interface Props { teamItems: RoadmapItem[]; workflowIdeas: RoadmapItem[]; adaptive: RoadmapItem }
const { teamItems, workflowIdeas, adaptive } = Astro.props;
const intelligenceSteps = adaptive.milestones.map(({ title }) => title);
---

<section aria-labelledby="roadmap-directions-title">
	<p class="eyebrow">How the system expands</p>
	<h2 id="roadmap-directions-title" class="mt-3 text-3xl font-semibold sm:text-4xl">One core. Three directions.</h2>
	<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted">Homun Flow grows through team adoption, official workflow products and company-specific intelligence. Each direction has a different maturity and purpose.</p>
	<div class="mt-8 grid gap-4 lg:grid-cols-3">
		<article class="direction-card card p-6">
			<p class="eyebrow">Adoption layer</p><h3 class="mt-4 text-2xl font-semibold">Team & Reach</h3><span class="pill mt-4 inline-flex text-[10px]">Up next</span>
			<p class="mt-4 text-sm leading-relaxed text-muted">Bring Homun into the daily work of the people responsible for moving a process forward.</p>
			<ul class="mt-6 space-y-2">{teamItems.map((item) => <li><a class="direction-link" href={`/roadmap/${item.slug}/`}>{item.title}<span aria-hidden="true"> →</span></a></li>)}</ul>
			<p class="mt-auto border-t border-line pt-5 text-xs leading-relaxed text-faint">Homun becomes usable by a small team, not only by one person at a desk.</p>
		</article>
		<article class="direction-card card border-accent/30 p-6">
			<p class="eyebrow">Commercial layer</p><h3 class="mt-4 text-2xl font-semibold">Workflow Products</h3><span class="pill mt-4 inline-flex text-[10px]">Evaluate → Pilot</span>
			<p class="mt-4 text-sm leading-relaxed text-muted">Package Homun Flow as official, ready-to-use outcomes for recurring business work.</p>
			<ul class="mt-6 space-y-2">{workflowIdeas.slice(0, 3).map((item) => <li><a class="direction-link" href={`/roadmap/${item.slug}/`}>{item.title}<span aria-hidden="true"> →</span></a></li>)}</ul>
			<a class="link-accent mt-4 inline-flex text-xs" href="#workflow-products">See all workflow candidates ↓</a>
			<p class="mt-auto border-t border-line pt-5 text-xs leading-relaxed text-faint">Customers buy a controlled operational result, not generic AI capability.</p>
		</article>
		<article class="direction-card card p-6">
			<p class="eyebrow">Intelligence layer</p><h3 class="mt-4 text-2xl font-semibold">Company Intelligence</h3><span class="pill mt-4 inline-flex text-[10px]">Research · Long term</span>
			<p class="mt-4 text-sm leading-relaxed text-muted">Adapt Homun to company knowledge, verified examples and review criteria.</p>
			<ol class="mt-6 space-y-2">{intelligenceSteps.map((step, index) => <li class="flex gap-3 text-xs text-muted"><span class="font-mono text-accent-bright">{index + 1}</span><span>{step}</span></li>)}</ol>
			<a class="link-accent mt-4 inline-flex text-xs" href={`/roadmap/${adaptive.slug}/`}>Explore the research →</a>
			<p class="mt-auto border-t border-line pt-5 text-xs leading-relaxed text-faint">Specialized SLM training appears only when quality and evaluation data justify it.</p>
		</article>
	</div>
	<ol class="mt-4 grid gap-2 rounded-2xl border border-dashed border-accent/25 p-4 text-center text-xs text-muted sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center" aria-label="Company learning loop">
		<li>Team processes</li><li aria-hidden="true" class="text-accent-bright">→</li><li>Verified outcomes</li><li aria-hidden="true" class="text-accent-bright">→</li><li>Better company-specific assistance</li>
	</ol>
</section>

<style>
	.direction-card { display: flex; min-height: 29rem; flex-direction: column; }
	.direction-link { display: flex; justify-content: space-between; border-radius: .75rem; border: 1px solid var(--color-line); background: color-mix(in srgb, var(--color-bg) 70%, transparent); padding: .7rem .8rem; font-size: .75rem; color: var(--color-muted); }
	.direction-link:hover { border-color: color-mix(in srgb, var(--color-accent) 45%, transparent); color: var(--color-cream); }
</style>
```

- [ ] **Step 4: Replace the old Up next and Adaptive Company Intelligence sections**

In `src/pages/roadmap/index.astro`, select:

```ts
const teamItems = programsByStage("next");
const adaptive = projectBySlug("adaptive-company-intelligence");
if (!adaptive) throw new Error("Adaptive Company Intelligence program is missing");
```

Render `RoadmapDirections` after `RoadmapNow`:

```astro
<section class="pb-20">
	<div class="mx-auto max-w-6xl px-5"><RoadmapDirections teamItems={teamItems} workflowIdeas={workflowIdeas} adaptive={adaptive} /></div>
</section>
```

Remove the old Up next and standalone Adaptive `<RoadmapJourney />` blocks.

- [ ] **Step 5: Run the focused contract and verify it passes**

Run `npm run build && npm run test:roadmap`.

Expected: `Roadmap v3 rendered page contract passed`.

- [ ] **Step 6: Commit the connected directions**

```bash
git add src/components/roadmap/RoadmapDirections.astro src/pages/roadmap/index.astro scripts/check-roadmap-v3-pages.mjs
git commit -m "feat: organize roadmap around product directions"
```

### Task 3: Turn workflow ideas into the commercial product-discovery section

**Files:**

- Create: `src/components/roadmap/WorkflowProducts.astro`
- Modify: `src/pages/roadmap/index.astro`
- Modify: `scripts/check-roadmap-v3-pages.mjs`

- [ ] **Step 1: Add the failing workflow-product contract**

Remove `"Business workflows we are evaluating"` from the temporary downstream required-text loop, then add:

```js
for (const required of [
	"Official workflow products",
	"Where should Homun work first?",
	"First pilot candidate",
	"Client Work", "Sales Operations", "Content & Marketing", "Internal Operations", "Customer Support",
]) assert.ok(roadmapText.includes(required), `Workflow product section missing: ${required}`);
assert.ok(!roadmapText.includes("Business workflows we are evaluating"));
assert.equal((roadmapText.match(/Suggest an idea/g) ?? []).length, 1);
```

- [ ] **Step 2: Run the contract and verify it fails**

Run `npm run build && npm run test:roadmap`.

Expected: failure on `Official workflow products`.

- [ ] **Step 3: Create `WorkflowProducts.astro`**

Use `RoadmapParticipation` for every idea, preserve the existing evaluation labels, and feature Client Work without changing its synchronized evaluation state:

```astro
---
import type { RoadmapItem } from "../../lib/product-data";
import RoadmapParticipation from "./RoadmapParticipation.astro";

interface Props { items: RoadmapItem[] }
const { items } = Astro.props;
const featured = items.find(({ slug }) => slug === "client-work");
const others = items.filter(({ slug }) => slug !== "client-work");
if (!featured) throw new Error("Client Work workflow candidate is missing");
const labels = { evaluating: "Evaluating", selected_for_pilot: "Selected for pilot", removed: "Removed" };
---

<section id="workflow-products" aria-labelledby="workflow-products-title">
	<div class="grid gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
		<div><p class="eyebrow">Official workflow products</p><h2 id="workflow-products-title" class="mt-3 text-3xl font-semibold sm:text-4xl">Where should Homun work first?</h2></div>
		<p class="text-sm leading-relaxed text-muted">We are evaluating the first official Homun workflows for small teams. Each combines a visible process, connected tools, permissions, review rules, templates and measurable outcomes.</p>
	</div>
	<div class="mt-8 grid gap-4 lg:grid-cols-[1.05fr_1.95fr]">
		<article class="idea-card card relative flex flex-col border-accent/30 p-6">
			<div class="flex items-center justify-between gap-3"><span class="eyebrow">First pilot candidate</span><span class="pill text-[10px]">{labels[featured.evaluationState ?? "evaluating"]}</span></div>
			<h3 class="mt-5 text-2xl font-semibold"><a class="idea-link focus-visible:outline-none" href={`/roadmap/${featured.slug}/`}>{featured.title}</a></h3>
			<p class="mt-3 text-sm leading-relaxed text-muted">{featured.outcome}</p>
			<p class="mt-5 text-xs leading-relaxed text-faint">Recommended because it combines requests, research, deliverables, review, approval and follow-up in one measurable process.</p>
			<div class="mt-auto pt-3"><RoadmapParticipation item={featured} variant="card" /></div>
		</article>
		<div class="grid gap-4 sm:grid-cols-2">
			{others.map((item) => <article class="idea-card card card-hover relative flex flex-col p-5"><div class="flex items-center justify-between gap-3"><span class="font-mono text-[10px] uppercase tracking-[.12em] text-accent-bright">{item.area}</span><span class="pill text-[10px]">{labels[item.evaluationState ?? "evaluating"]}</span></div><h3 class="mt-4 text-xl font-semibold"><a class="idea-link focus-visible:outline-none" href={`/roadmap/${item.slug}/`}>{item.title}</a></h3><p class="mt-3 text-sm leading-relaxed text-muted">{item.outcome}</p><div class="mt-auto pt-2"><RoadmapParticipation item={item} variant="card" /></div></article>)}
			<article class="rounded-2xl border border-dashed border-line-strong p-5"><p class="eyebrow">Help shape Homun</p><h3 class="mt-4 text-xl font-semibold">A workflow we should evaluate?</h3><p class="mt-3 text-sm leading-relaxed text-muted">Describe the team, recurring process and outcome that matters.</p><a href="https://github.com/homun-app/homun/issues/new?template=roadmap-idea.yml" target="_blank" rel="noopener" class="btn mt-5 w-full border border-line-strong text-xs text-cream hover:border-accent/50">Suggest an idea</a></article>
		</div>
	</div>
</section>

<style>
	.idea-link::after { content: ""; position: absolute; inset: 0; }
	.idea-link:focus-visible::after { border-radius: inherit; outline: 2px solid var(--color-accent); outline-offset: 2px; }
	.idea-card :global([data-roadmap-participation]) { position: relative; z-index: 10; }
</style>
```

- [ ] **Step 4: Replace `WorkflowIdeas` in the page**

Import `WorkflowProducts` and replace the old workflow section with:

```astro
<section class="pb-20">
	<div class="mx-auto max-w-6xl px-5"><WorkflowProducts items={workflowIdeas} /></div>
</section>
```

- [ ] **Step 5: Run the contract and verify it passes**

Run `npm run build && npm run test:roadmap`.

Expected: `Roadmap v3 rendered page contract passed`, including one `Suggest an idea` action and no nested anchors.

- [ ] **Step 6: Commit the workflow-product section**

```bash
git add src/components/roadmap/WorkflowProducts.astro src/pages/roadmap/index.astro scripts/check-roadmap-v3-pages.mjs
git commit -m "feat: frame roadmap ideas as workflow products"
```

### Task 4: Consolidate research and release proof into one evidence band

**Files:**

- Create: `src/components/roadmap/RoadmapEvidence.astro`
- Modify: `src/pages/roadmap/index.astro`
- Modify: `scripts/check-roadmap-v3-pages.mjs`

- [ ] **Step 1: Add the failing evidence-band contract**

Remove `"Exploring"`, `"Release history"`, and the standalone `"v0.1.1060"` entry from the temporary downstream loop, then add:

```js
for (const required of [
	"Evidence and future directions",
	"Voice & Meeting Capture",
	"Developer Platform",
	"Product evidence",
	"Latest release",
	"v0.1.1060",
	"All versions",
]) assert.ok(roadmapText.includes(required), `Roadmap evidence band missing: ${required}`);
for (const removed of ["Research, not commitments", "Release history"]) {
	assert.ok(!roadmapText.includes(removed), `Roadmap still renders legacy evidence section: ${removed}`);
}
```

- [ ] **Step 2: Run the contract and verify it fails**

Run `npm run build && npm run test:roadmap`.

Expected: failure on `Evidence and future directions`.

- [ ] **Step 3: Create `RoadmapEvidence.astro`**

Create the consolidated component:

```astro
---
import type { ReleaseItem, RoadmapItem } from "../../lib/product-data";
import RoadmapParticipation from "./RoadmapParticipation.astro";
interface Props { researchItems: RoadmapItem[]; latestRelease: ReleaseItem; releases: ReleaseItem[] }
const { researchItems, latestRelease, releases } = Astro.props;
const releaseId = (version: string) => version.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
---

<section aria-labelledby="roadmap-evidence-title">
	<p class="eyebrow">Evidence and future directions</p>
	<h2 id="roadmap-evidence-title" class="mt-3 text-3xl font-semibold sm:text-4xl">Research stays explicit. Releases prove momentum.</h2>
	<div class="mt-8 grid gap-4 lg:grid-cols-3">
		{researchItems.map((item) => <article class="evidence-card card card-hover relative flex flex-col p-5"><p class="eyebrow">{item.slug === "developer-platform" ? "Future ecosystem" : "Research"}</p><h3 class="mt-4 text-xl font-semibold"><a class="evidence-link focus-visible:outline-none" href={`/roadmap/${item.slug}/`}>{item.title}</a></h3><p class="mt-3 text-sm leading-relaxed text-muted">{item.outcome}</p><div class="mt-auto pt-2"><RoadmapParticipation item={item} variant="card" /></div></article>)}
		<article class="card sheen flex flex-col p-5"><div class="flex items-center justify-between gap-3"><p class="eyebrow">Product evidence</p><span class="pill text-[10px]">Latest release</span></div><h3 class="mt-5 font-mono text-2xl font-semibold">{latestRelease.version}</h3><p class="mt-3 text-sm text-muted">{latestRelease.highlights[0] ?? "Desktop release"}</p><div class="mt-5 divide-y divide-line">{releases.slice(1, 4).map((release) => <a class="flex justify-between gap-3 py-3 font-mono text-[10px] text-muted hover:text-cream" href={`/changelog/#${releaseId(release.version)}`}><span>{release.version}</span><time>{new Date(release.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></a>)}</div><div class="mt-auto flex flex-wrap gap-4 pt-5"><a class="link-accent text-xs" href={`/changelog/#${releaseId(latestRelease.version)}`}>Read the latest →</a><a class="link-accent text-xs" href="/changelog/">All versions →</a></div></article>
	</div>
</section>

<style>
	.evidence-card { min-height: 18rem; }
	.evidence-link::after { content: ""; position: absolute; inset: 0; }
	.evidence-link:focus-visible::after { border-radius: inherit; outline: 2px solid var(--color-accent); outline-offset: 2px; }
	.evidence-card :global([data-roadmap-participation]) { position: relative; z-index: 10; }
</style>
```

- [ ] **Step 4: Replace the old Exploring and release sections**

Select the two research items explicitly:

```ts
const voice = projectBySlug("voice-meeting-capture");
const developerPlatform = projectBySlug("developer-platform");
if (!voice || !developerPlatform || !latestRelease) throw new Error("Roadmap evidence data is missing");
const researchItems = [voice, developerPlatform];
```

Render after `WorkflowProducts`:

```astro
<section class="pb-28">
	<div class="mx-auto max-w-6xl px-5"><RoadmapEvidence researchItems={researchItems} latestRelease={latestRelease} releases={releases} /></div>
</section>
```

Remove the old Exploring `<RoadmapJourney />` and separate `ReleaseHistory` / `LatestRelease` grid.

- [ ] **Step 5: Run the focused contract and verify it passes**

Run `npm run build && npm run test:roadmap`.

Expected: `Roadmap v3 rendered page contract passed`.

- [ ] **Step 6: Commit the evidence band**

```bash
git add src/components/roadmap/RoadmapEvidence.astro src/pages/roadmap/index.astro scripts/check-roadmap-v3-pages.mjs
git commit -m "feat: consolidate roadmap research and releases"
```

### Task 5: Lock the complete hierarchy, preserve every item, and remove obsolete components

**Files:**

- Modify: `src/pages/roadmap/index.astro`
- Modify: `scripts/check-roadmap-v3-pages.mjs`
- Delete: `src/components/roadmap/ProductJourney.astro`
- Delete: `src/components/roadmap/RoadmapJourney.astro`
- Delete: `src/components/roadmap/FeaturedProject.astro`
- Delete: `src/components/roadmap/WorkflowIdeas.astro`
- Delete: `src/components/roadmap/LatestRelease.astro`
- Delete: `src/components/roadmap/ReleaseHistory.astro`

- [ ] **Step 1: Replace the legacy main-page assertions with the final hierarchy contract**

In `scripts/check-roadmap-v3-pages.mjs`, consolidate the roadmap-main assertions into this final form while leaving detail-page, redirect, changelog, RSS, percentage, and nested-anchor checks intact:

```js
const requiredMainCopy = [
	"BUILT FOR SMALL COMPANIES AND TEAMS",
	"AI that keeps your company moving.",
	"Where Homun is today",
	"From capable workspace to coordinated work.",
	"Homun Operational Workspace",
	"Homun Flow",
	"How the system expands",
	"One core. Three directions.",
	"Team & Reach",
	"Workflow Products",
	"Company Intelligence",
	"Where should Homun work first?",
	"First pilot candidate",
	"Evidence and future directions",
	"Product evidence",
	"v0.1.1060",
];
for (const required of requiredMainCopy) assert.ok(roadmapText.includes(required), `Roadmap missing: ${required}`);

const orderedSections = [
	"AI that keeps your company moving.",
	"Where Homun is today",
	"Homun Flow",
	"How the system expands",
	"Team & Reach",
	"Workflow Products",
	"Company Intelligence",
	"Where should Homun work first?",
	"Evidence and future directions",
];
for (let index = 1; index < orderedSections.length; index += 1) {
	assert.ok(roadmapText.indexOf(orderedSections[index - 1]) < roadmapText.indexOf(orderedSections[index]), `Roadmap section order is wrong at ${orderedSections[index]}`);
}

for (const removed of [
	"One continuous product journey",
	"Available today",
	"Decided product direction",
	"Business workflows we are evaluating",
	"Long-term product advantage",
	"Research, not commitments",
	"Release history",
]) assert.ok(!roadmapText.includes(removed), `Roadmap still renders removed section: ${removed}`);

for (const slug of [
	"operational-workspace",
	"homun-flow",
	"team-spaces-roles",
	"homun-mobile",
	"more-ways-to-reach-homun",
	"adaptive-company-intelligence",
	"voice-meeting-capture",
	"developer-platform",
	"client-work",
	"sales-operations",
	"content-marketing",
	"internal-operations",
	"customer-support",
]) assert.ok(roadmapHtml.includes(`/roadmap/${slug}/`), `Published roadmap item is not reachable from the main page: ${slug}`);

assert.ok(!/\d+% complete/.test(roadmapText), "Roadmap exposes an arbitrary percentage");
assert.equal((roadmapText.match(/Suggest an idea/g) ?? []).length, 1);
```

- [ ] **Step 2: Run the final hierarchy contract before cleanup**

Run `npm run build && npm run test:roadmap`.

Expected: PASS. If it fails, correct only the composition or assertions needed to match the approved spec; do not alter synchronized roadmap data.

- [ ] **Step 3: Remove obsolete imports, variables, and component files**

The final `src/pages/roadmap/index.astro` frontmatter must contain only:

```astro
---
import Page from "../../layouts/Page.astro";
import RoadmapDirections from "../../components/roadmap/RoadmapDirections.astro";
import RoadmapEvidence from "../../components/roadmap/RoadmapEvidence.astro";
import RoadmapNow from "../../components/roadmap/RoadmapNow.astro";
import RoadmapVisionHero from "../../components/roadmap/RoadmapVisionHero.astro";
import WorkflowProducts from "../../components/roadmap/WorkflowProducts.astro";
import { latestRelease, programsByStage, projectBySlug, releases, roadmapSyncedAt, workflowIdeas } from "../../lib/product-data";

const synced = new Date(roadmapSyncedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const operational = projectBySlug("operational-workspace");
const flow = projectBySlug("homun-flow");
const adaptive = projectBySlug("adaptive-company-intelligence");
const voice = projectBySlug("voice-meeting-capture");
const developerPlatform = projectBySlug("developer-platform");
const teamItems = programsByStage("next");

if (!operational || !flow) throw new Error("Roadmap current-product programs are missing");
if (!adaptive) throw new Error("Adaptive Company Intelligence program is missing");
if (!voice || !developerPlatform || !latestRelease) throw new Error("Roadmap evidence data is missing");
---
```

The final page body must be:

```astro
<Page title="Roadmap — Homun" description="How Homun is becoming an operational process system for small companies and teams.">
	<RoadmapVisionHero synced={synced} />
	<section class="pb-20 pt-4"><div class="mx-auto max-w-6xl px-5"><RoadmapNow operational={operational} flow={flow} /></div></section>
	<section class="pb-20"><div class="mx-auto max-w-6xl px-5"><RoadmapDirections teamItems={teamItems} workflowIdeas={workflowIdeas} adaptive={adaptive} /></div></section>
	<section class="pb-20"><div class="mx-auto max-w-6xl px-5"><WorkflowProducts items={workflowIdeas} /></div></section>
	<section class="pb-28"><div class="mx-auto max-w-6xl px-5"><RoadmapEvidence researchItems={[voice, developerPlatform]} latestRelease={latestRelease} releases={releases} /></div></section>
</Page>
```

Delete the six obsolete components listed in this task.

- [ ] **Step 4: Prove no removed component remains referenced**

Run:

```bash
! rg -n "ProductJourney|RoadmapJourney|FeaturedProject|WorkflowIdeas|LatestRelease|ReleaseHistory" src
```

Expected: no matches and exit status 0 because the negated search found nothing.

- [ ] **Step 5: Run build and all roadmap contracts**

Run:

```bash
npm run build
npm run test:roadmap-v3-presentation
npm run test:roadmap
```

Expected: build succeeds; presentation policy and rendered-page contract pass.

- [ ] **Step 6: Commit the final composition and cleanup**

```bash
git add src/pages/roadmap/index.astro src/components/roadmap scripts/check-roadmap-v3-pages.mjs
git commit -m "refactor: complete roadmap visual hierarchy"
```

### Task 6: Verify responsive behavior, accessibility, and the complete repository contract

**Files:**

- Modify only if verification exposes a defect: the new roadmap components, `src/pages/roadmap/index.astro`, or `scripts/check-roadmap-v3-pages.mjs`

- [ ] **Step 1: Run the complete repository check from a fresh build**

Run:

```bash
rm -rf dist
npm run check
```

Expected: 60 pages build; every homepage, product-data, roadmap v3, container, and runtime-signal contract passes with exit status 0.

- [ ] **Step 2: Start the production-equivalent preview**

Run:

```bash
npm run preview -- --host 127.0.0.1
```

Expected: Astro prints a local preview URL and serves the built site. Keep the process running only for the following visual checks.

- [ ] **Step 3: Inspect the desktop roadmap at 1440 × 1000**

Open `/roadmap/` and verify:

- the hero communicates the complete vision before scrolling;
- Operational Workspace and Homun Flow read as one present-state section;
- Homun Flow has greater visual weight without hiding its milestones;
- the three directions align and show their different maturity labels;
- Client Work is clearly the first pilot candidate without appearing selected or committed;
- no large empty single-card section remains;
- every vote, discussion, detail, changelog, and idea-submission action is clickable;
- there are no nested links, horizontal overflow, or browser-console errors.

Save the temporary screenshot outside the repository.

- [ ] **Step 4: Inspect the mobile roadmap at 390 × 844**

Verify:

- headings remain sequential and readable;
- the current-product cards stack in Available → Building order;
- lifecycle and learning-loop arrows become understandable in a single column;
- status labels remain adjacent to their direction;
- whole-card links do not cover vote or discussion actions;
- no content clips or causes horizontal scrolling.

Save the temporary screenshot outside the repository.

- [ ] **Step 5: Verify all published detail routes return successful pages**

Run:

```bash
for slug in operational-workspace homun-flow team-spaces-roles homun-mobile more-ways-to-reach-homun adaptive-company-intelligence voice-meeting-capture developer-platform client-work sales-operations content-marketing internal-operations customer-support; do
	test -f "dist/roadmap/$slug/index.html"
done
```

Expected: exit status 0.

- [ ] **Step 6: Verify the final diff is clean and scoped**

Run:

```bash
git diff --check
git status --short
git log --oneline --decorate -6
```

Expected: no whitespace errors; only intentional roadmap implementation changes are present; commit history contains the task commits from this plan.

- [ ] **Step 7: Commit any verification-only correction**

If Steps 1–6 required a correction, run the focused failing check again, then `npm run check`, and commit only the corrected files:

```bash
git add src/components/roadmap src/pages/roadmap/index.astro scripts/check-roadmap-v3-pages.mjs
git commit -m "fix: polish roadmap responsive hierarchy"
```

If no correction was required, do not create an empty commit.

## Completion boundary

Implementation is locally complete only after Task 6 passes. Do not push, merge, update the GitHub Project, change roadmap item states, or deploy to Coolify as part of this plan. Those remote actions require a separate explicit approval after the local branch has been reviewed.
