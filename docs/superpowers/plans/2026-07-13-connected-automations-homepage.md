# Connected Automations Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an illustrated homepage section that shows how channels, connected services and scheduled or event-driven automations turn signals into controlled actions.

**Architecture:** Insert a focused `ConnectedAction` section between `WorkProof` and `Security`. Keep the main connected-workspace scene and the reusable automation story SVGs in separate Astro components, with HTML carrying all meaningful trigger/action/result text and SVG used only for the consistent B2 visual language.

**Tech Stack:** Astro, TypeScript-flavoured Astro props, inline SVG, Tailwind utility classes, component-scoped CSS, Node assertion contracts, Playwright browser QA.

---

## File Map

- Create `src/components/ConnectedAction.astro`: section copy, example data, safety note and guide links.
- Create `src/components/illustrations/ConnectedWorkspaceIllustration.astro`: central Homun scene with channels, Composio, MCP and Skills.
- Create `src/components/illustrations/AutomationStoryIllustration.astro`: reusable illustration with `whatsapp`, `gmail-brief` and `invoice` variants.
- Modify `src/pages/index.astro`: insert `ConnectedAction` between `WorkProof` and `Security`.
- Modify `scripts/check-homepage-illustrations.mjs`: define section order, content, links, variants and reduced-motion contracts.

### Task 1: Define the connected-action homepage contract

**Files:**
- Modify: `scripts/check-homepage-illustrations.mjs`

- [ ] **Step 1: Write the failing contract**

Add assertions after the existing illustration marker loop:

```js
for (const marker of [
	'data-illustration="connected-workspace"',
	'data-illustration="automation-whatsapp"',
	'data-illustration="automation-gmail-brief"',
	'data-illustration="automation-invoice"',
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing connected-action illustration: ${marker}`);
}

for (const content of [
	'From a message to real action.',
	'Two ways to begin. Countless ways to continue.',
	'WhatsApp',
	'Telegram',
	'Composio',
	'MCP',
	'Skills',
	'Schedule',
	'Event',
]) {
	assert.ok(homepage.includes(content), `Homepage is missing connected-action content: ${content}`);
}

for (const href of [
	'href="/guides/channels/"',
	'href="/guides/connectors/"',
	'href="/guides/automations/"',
]) {
	assert.ok(homepage.includes(href), `Homepage is missing connected-action guide link: ${href}`);
}

const workPosition = homepage.indexOf('id="product"');
const connectedPosition = homepage.indexOf('id="connected-action"');
const controlPosition = homepage.indexOf('id="control"');
assert.ok(
	workPosition < connectedPosition && connectedPosition < controlPosition,
	"Connected action must render between product proof and control",
);
```

Add both new illustration component names to the reduced-motion component list:

```js
"ConnectedWorkspaceIllustration.astro",
"AutomationStoryIllustration.astro",
```

- [ ] **Step 2: Build and run the contract to verify it fails**

Run: `npm run build && npm run test:illustrations`  
Expected: FAIL with `Homepage is missing connected-action illustration: data-illustration="connected-workspace"`.

- [ ] **Step 3: Commit the red contract**

```bash
git add scripts/check-homepage-illustrations.mjs
git commit -m "test: define connected automation homepage contract"
```

### Task 2: Build and insert the connected workspace scene

**Files:**
- Create: `src/components/illustrations/ConnectedWorkspaceIllustration.astro`
- Create: `src/components/ConnectedAction.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create the connected workspace illustration**

Implement an accessible wrapper with the exact marker and label:

```astro
<div
	class="connected-workspace"
	data-illustration="connected-workspace"
	role="img"
	aria-label="WhatsApp, Telegram, Composio, MCP and Skills connected through the stable Homun workspace"
>
	<div class="scene-label"><span>Connected workspace</span><span>Channels + tools</span></div>
	<svg viewBox="0 0 680 420" fill="none" aria-hidden="true">
		<ellipse cx="340" cy="204" rx="242" ry="126" stroke="#225146" stroke-dasharray="7 10" />
		<path class="signal-path" d="M165 116C224 112 255 138 291 170M515 116C456 112 425 138 389 170M176 275C232 270 261 247 298 222M504 275C448 270 419 247 382 222" stroke="#58dfbf" stroke-width="2" />
		<g class="peripheral"><rect x="43" y="82" width="122" height="68" rx="14" fill="#0b1915" stroke="#55dfc0" /><text x="104" y="112" fill="#eef8f4" font-family="monospace" font-size="12" text-anchor="middle">WHATSAPP</text><text x="104" y="132" fill="#698079" font-family="monospace" font-size="9" text-anchor="middle">MESSAGE</text></g>
		<g class="peripheral"><rect x="515" y="82" width="122" height="68" rx="14" fill="#0b151f" stroke="#5789ee" /><text x="576" y="112" fill="#eef8f4" font-family="monospace" font-size="12" text-anchor="middle">TELEGRAM</text><text x="576" y="132" fill="#698079" font-family="monospace" font-size="9" text-anchor="middle">CHANNEL</text></g>
		<g class="peripheral"><rect x="52" y="246" width="144" height="68" rx="14" fill="#171018" stroke="#ef78d8" /><text x="124" y="276" fill="#eef8f4" font-family="monospace" font-size="12" text-anchor="middle">COMPOSIO</text><text x="124" y="296" fill="#698079" font-family="monospace" font-size="9" text-anchor="middle">CONNECTED APPS</text></g>
		<g class="peripheral"><rect x="484" y="246" width="144" height="68" rx="14" fill="#17150b" stroke="#f1d070" /><text x="556" y="276" fill="#eef8f4" font-family="monospace" font-size="12" text-anchor="middle">MCP + SKILLS</text><text x="556" y="296" fill="#698079" font-family="monospace" font-size="9" text-anchor="middle">MORE TOOLS</text></g>
		<g><path d="m288 172 52-31 54 31-54 32Z" fill="#64e1bf" /><path d="M288 172v64l52 31v-63Z" fill="#142d25" stroke="#64e1bf" /><path d="M394 172v64l-54 31v-63Z" fill="#346bd7" stroke="#76a2f5" /><text x="340" y="228" fill="#eef8f4" font-family="monospace" font-size="11" text-anchor="middle">HOMUN</text></g>
		<rect x="86" y="344" width="508" height="48" rx="14" fill="#081410" stroke="#1c463c" /><text x="340" y="373" fill="#a8c0ba" font-family="monospace" font-size="10" text-anchor="middle">MESSAGE · SCHEDULE · EVENT  →  CONTEXT + TOOLS  →  ACTION</text>
	</svg>
</div>
```

Use the existing teal, blue, magenta and amber fills from `EcosystemIllustration.astro`. Component-scoped CSS must include:

```css
.peripheral { animation: connected-drift 13s ease-in-out infinite alternate; }
.signal-path { animation: connected-signal 7s ease-in-out infinite; }
@keyframes connected-drift { to { transform: translateY(-4px); } }
@keyframes connected-signal { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
	.peripheral,
	.signal-path { animation: none; }
}
```

- [ ] **Step 2: Create the section shell and main copy**

Create `ConnectedAction.astro` with this top-level structure:

```astro
---
import ConnectedWorkspaceIllustration from "./illustrations/ConnectedWorkspaceIllustration.astro";
---

<section id="connected-action" class="relative scroll-mt-24 overflow-hidden border-y border-line bg-bg-raised/30 py-24 sm:py-32">
	<div class="section-shell">
		<div class="grid items-center gap-12 lg:grid-cols-[.84fr_1.16fr] lg:gap-16">
			<div class="max-w-2xl">
				<p class="eyebrow reveal">Connected action</p>
				<h2 class="reveal mt-4 text-4xl text-cream sm:text-6xl">From a message to real action.</h2>
				<p class="reveal mt-6 text-lg leading-relaxed text-muted" style="--reveal-delay: 70ms">
					Reach Homun through the channels you already use. Connect the services where your work lives, then turn a message, schedule or event into an action you can review and control.
				</p>
			</div>
			<div class="reveal" style="--reveal-delay: 90ms"><ConnectedWorkspaceIllustration /></div>
		</div>
	</div>
</section>
```

- [ ] **Step 3: Insert the section in homepage order**

Import `ConnectedAction` in `src/pages/index.astro`, then render:

```astro
<WorkProof />
<ConnectedAction />
<Security />
```

- [ ] **Step 4: Build and confirm the contract advances to the missing story marker**

Run: `npm run build && npm run test:illustrations`  
Expected: FAIL with `Homepage is missing connected-action illustration: data-illustration="automation-whatsapp"`, proving the scene and order assertions now pass.

- [ ] **Step 5: Commit the connected workspace**

```bash
git add src/components/ConnectedAction.astro src/components/illustrations/ConnectedWorkspaceIllustration.astro src/pages/index.astro
git commit -m "feat: introduce connected action on the homepage"
```

### Task 3: Add three reusable automation stories

**Files:**
- Create: `src/components/illustrations/AutomationStoryIllustration.astro`
- Modify: `src/components/ConnectedAction.astro`

- [ ] **Step 1: Create a typed reusable illustration component**

Define the exact variants and marker:

```astro
---
interface Props {
	kind: "whatsapp" | "gmail-brief" | "invoice";
}
const { kind } = Astro.props;
---

<div class="automation-story" data-illustration={`automation-${kind}`} aria-hidden="true">
	{kind === "whatsapp" && <svg viewBox="0 0 360 190"><rect x="14" y="34" width="126" height="62" rx="12" fill="#0b1b17" stroke="#55dfc0" /><path class="story-path" d="M140 65h64" stroke="#55dfc0" stroke-width="2" /><rect x="204" y="34" width="140" height="62" rx="12" fill="#171018" stroke="#ef78d8" /><rect class="story-status" x="69" y="126" width="222" height="38" rx="12" fill="#0b151f" stroke="#5789ee" /></svg>}
	{kind === "gmail-brief" && <svg viewBox="0 0 360 190"><rect x="14" y="34" width="76" height="62" rx="12" fill="#17150b" stroke="#f1d070" /><path class="story-path" d="M90 65h42" stroke="#55dfc0" stroke-width="2" /><rect x="132" y="34" width="94" height="62" rx="12" fill="#171018" stroke="#ef78d8" /><path class="story-path" d="M226 65h42" stroke="#55dfc0" stroke-width="2" /><rect x="268" y="34" width="76" height="62" rx="12" fill="#0b151f" stroke="#5789ee" /><rect class="story-status" x="69" y="126" width="222" height="38" rx="12" fill="#0b151f" stroke="#5789ee" /></svg>}
	{kind === "invoice" && <svg viewBox="0 0 360 190"><rect x="14" y="34" width="76" height="62" rx="12" fill="#171018" stroke="#ef78d8" /><path class="story-path" d="M90 65h42" stroke="#55dfc0" stroke-width="2" /><rect x="132" y="34" width="94" height="62" rx="12" fill="#0b1915" stroke="#55dfc0" /><path class="story-path" d="M226 65h42" stroke="#55dfc0" stroke-width="2" /><rect x="268" y="34" width="76" height="62" rx="12" fill="#0b151f" stroke="#5789ee" /><rect class="story-status" x="69" y="126" width="222" height="38" rx="12" fill="#17150b" stroke="#f1d070" /></svg>}
</div>
```

Every variant uses the same panel, path and status primitives. Add sequential path animation and a complete reduced-motion override:

```css
.story-path { stroke-dasharray: 8 10; animation: story-signal 8s linear infinite; }
.story-status { animation: story-status 8s ease-in-out infinite; }
@keyframes story-signal { to { stroke-dashoffset: -72; } }
@keyframes story-status { 0%, 35%, 100% { opacity: .45; } 55%, 80% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
	.story-path,
	.story-status { animation: none; }
}
```

- [ ] **Step 2: Add story data and HTML meaning to the section**

In `ConnectedAction.astro`, add:

```astro
const stories = [
	{
		kind: "whatsapp",
		badge: "Event · WhatsApp",
		title: "Jean asks. Homun responds.",
		body: "An incoming message becomes a task with the right project context and permissions.",
		result: "Reply drafted · Auto-reply if allowed",
	},
	{
		kind: "gmail-brief",
		badge: "Schedule · 08:30",
		title: "Your inbox, already distilled.",
		body: "Every weekday Homun checks Gmail, prioritises what matters and prepares a brief.",
		result: "Daily brief → Telegram",
	},
	{
		kind: "invoice",
		badge: "Event · New invoice",
		title: "When work arrives, the workflow starts.",
		body: "A service event can trigger extraction, updates across tools and a final notification.",
		result: "Update Sheets · Notify",
	},
] as const;
```

Render the second heading, a responsive `md:grid-cols-2 xl:grid-cols-3` story grid, the safety note and three guide links. Use `AutomationStoryIllustration kind={story.kind}` inside every card. Guide links must be exactly `/guides/channels/`, `/guides/connectors/` and `/guides/automations/`.

- [ ] **Step 3: Build and run the illustration contract**

Run: `npm run build && npm run test:illustrations`  
Expected: PASS with `Homepage illustration contract passed`.

- [ ] **Step 4: Run the full automated suite**

Run: `npm run check`  
Expected: Astro builds 47 pages and all homepage, background, download and illustration contracts pass.

- [ ] **Step 5: Commit the automation stories**

```bash
git add src/components/ConnectedAction.astro src/components/illustrations/AutomationStoryIllustration.astro
git commit -m "feat: illustrate connected automation stories"
```

### Task 4: Responsive and motion verification

**Files:**
- Modify only if QA exposes a reproducible issue: `src/components/ConnectedAction.astro`, `src/components/illustrations/ConnectedWorkspaceIllustration.astro`, or `src/components/illustrations/AutomationStoryIllustration.astro`

- [ ] **Step 1: Verify desktop rendering**

Open `http://127.0.0.1:4321/#connected-action` at `1440 × 1000`. Confirm the split introduction, three equal story cards, readable labels, calm motion and transition into `Security`.

- [ ] **Step 2: Verify tablet rendering**

Open the same anchor at `820 × 1000`. Confirm no horizontal overflow, a two-plus-one story layout and readable main-scene labels.

- [ ] **Step 3: Verify mobile rendering**

Open the same anchor at `390 × 844`. Confirm stacked introduction and story cards, readable trigger types, no clipped SVGs and no horizontal overflow.

- [ ] **Step 4: Verify reduced motion and console state**

Emulate reduced motion and confirm illustration animations are disabled. Confirm the browser console has zero errors.

- [ ] **Step 5: Run final verification**

Run:

```bash
npm run check
git diff --check
git status --short
```

Expected: all commands exit 0; status is clean after the implementation commits.
