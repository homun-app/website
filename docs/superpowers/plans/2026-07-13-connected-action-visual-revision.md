# Connected Action Visual Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the connected-action network diagram with the approved A1 miniature workshop and prevent the hero title from cropping the descender in `Your system.`

**Architecture:** Keep the existing `ConnectedAction` section and three automation stories unchanged. Replace only the internals of `ConnectedWorkspaceIllustration.astro`, then make a local typography correction in `Hero.astro`; extend the existing static contract so both regressions remain testable.

**Tech Stack:** Astro, inline SVG, component-scoped CSS, Tailwind utilities, Node assertions, Playwright browser QA.

---

### Task 1: Define the visual revision contract

**Files:**
- Modify: `scripts/check-homepage-illustrations.mjs`

- [ ] **Step 1: Write the failing source assertions**

Read both source components and add these assertions:

```js
const heroSource = await readFile(
	new URL("../src/components/Hero.astro", import.meta.url),
	"utf8",
);
assert.ok(heroSource.includes("leading-[1.04]"), "Hero title must preserve descenders with a 1.04 line height");
assert.ok(heroSource.includes("pb-[0.08em]"), "Hero title must include descender padding");

const connectedSource = await readFile(
	new URL("../src/components/illustrations/ConnectedWorkspaceIllustration.astro", import.meta.url),
	"utf8",
);
for (const part of [
	'data-scene="miniature-workshop"',
	'data-workshop-part="incoming-message"',
	'data-workshop-part="telegram-channel"',
	'data-workshop-part="composio-tool"',
	'data-workshop-part="mcp-skills-tool"',
	'data-workshop-part="homun-machine"',
	'data-workshop-part="reply-output"',
]) {
	assert.ok(connectedSource.includes(part), `Miniature workshop is missing: ${part}`);
}
for (const retired of ["class=\"peripheral", "class=\"action-rail", "MESSAGE · SCHEDULE · EVENT"]) {
	assert.ok(!connectedSource.includes(retired), `Miniature workshop retained the old network diagram: ${retired}`);
}
```

- [ ] **Step 2: Run the contract and verify the expected failure**

Run: `npm run build && npm run test:illustrations`  
Expected: FAIL with `Hero title must preserve descenders with a 1.04 line height`.

- [ ] **Step 3: Commit the red contract**

```bash
git add scripts/check-homepage-illustrations.mjs
git commit -m "test: define connected action visual revision"
```

### Task 2: Fix the hero descender

**Files:**
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Apply the minimal typography correction**

Change only the hero title classes:

```astro
<h1 class="reveal text-gradient max-w-3xl pb-[0.08em] text-[3.25rem] leading-[1.04] sm:text-[4.6rem] lg:text-[5.2rem]" style="--reveal-delay: 60ms">
	Your work.<br />Your models.<br />Your system.
</h1>
```

- [ ] **Step 2: Run the contract and verify it advances**

Run: `npm run build && npm run test:illustrations`  
Expected: FAIL with `Miniature workshop is missing: data-scene="miniature-workshop"`, proving the hero assertions pass.

- [ ] **Step 3: Commit the typography correction**

```bash
git add src/components/Hero.astro
git commit -m "fix: preserve hero title descenders"
```

### Task 3: Replace the network diagram with the miniature workshop

**Files:**
- Modify: `src/components/illustrations/ConnectedWorkspaceIllustration.astro`

- [ ] **Step 1: Replace the wrapper and visual structure**

Use this top-level structure and exact semantic markers:

```astro
<div
	class="connected-workspace"
	data-illustration="connected-workspace"
	data-scene="miniature-workshop"
	role="img"
	aria-label="A WhatsApp message enters a miniature Homun workshop, where connected Composio, MCP and Skills tools help produce a ready reply; Telegram is also available as a channel"
>
	<div class="scene-label"><span>Connected workshop</span><span>Message → useful result</span></div>
	<svg viewBox="0 0 680 420" fill="none" aria-hidden="true">
		<path class="work-floor" d="M92 282 318 139l278 116-225 143Z" fill="#0b1b17" stroke="#28584d" />
		<path class="runway" d="M115 229c126-38 173-19 229 25 63 50 119 34 214-18" stroke="#183f35" stroke-width="24" stroke-linecap="round" />
		<path class="runway-signal" d="M115 229c126-38 173-19 229 25 63 50 119 34 214-18" stroke="#5ce0bf" stroke-width="2" stroke-linecap="round" />
		<g class="scene-object incoming-message" data-workshop-part="incoming-message"><rect x="52" y="90" width="190" height="82" rx="20" fill="#eff8f4" /><text x="75" y="120" fill="#18352d" font-family="monospace" font-size="11">JEAN · WHATSAPP</text><text x="75" y="146" fill="#415d55" font-family="sans-serif" font-size="12">Latest project update?</text></g>
		<g class="scene-object telegram-token" data-workshop-part="telegram-channel"><circle cx="588" cy="91" r="27" fill="#13274b" stroke="#5789ee" /><path d="m576 92 25-11-8 26-6-8-7 5Z" fill="#78a3f5" /><text x="588" y="132" fill="#7e9fdc" font-family="monospace" font-size="9" text-anchor="middle">TELEGRAM</text></g>
		<g class="scene-object composio-tool" data-workshop-part="composio-tool"><path d="m132 292 34-20 35 20-35 21Z" fill="#ef78d8" /><path d="M132 292v40l34 20v-39Z" fill="#34182f" /><path d="m201 292-35 21v39l35-20Z" fill="#81397b" /><text x="166" y="371" fill="#b47ea9" font-family="monospace" font-size="9" text-anchor="middle">COMPOSIO</text></g>
		<g class="scene-object mcp-tool" data-workshop-part="mcp-skills-tool"><path d="m232 322 30-18 31 18-31 19Z" fill="#f1d070" /><path d="M232 322v35l30 18v-34Z" fill="#322b13" /><path d="m293 322-31 19v34l31-18Z" fill="#796527" /><text x="262" y="393" fill="#c0a95d" font-family="monospace" font-size="9" text-anchor="middle">MCP + SKILLS</text></g>
		<g data-workshop-part="homun-machine"><path d="m301 185 66-39 68 39-68 40Z" fill="#64e1bf" /><path d="M301 185v84l66 39v-83Z" fill="#142d25" stroke="#64e1bf" /><path d="M435 185v84l-68 39v-83Z" fill="#346bd7" stroke="#76a2f5" /><text x="367" y="264" fill="#eef8f4" font-family="monospace" font-size="11" text-anchor="middle">HOMUN</text></g>
		<g class="scene-object reply-output" data-workshop-part="reply-output"><rect x="493" y="142" width="136" height="154" rx="14" fill="#f1f7f4" /><path d="M518 178h85M518 198h64M518 218h77" stroke="#1e3931" stroke-width="6" stroke-linecap="round" /><rect x="518" y="244" width="66" height="20" rx="10" fill="#ef78d8" /><text x="551" y="258" fill="#271123" font-family="monospace" font-size="8" text-anchor="middle">REPLY READY</text></g>
	</svg>
</div>
```

- [ ] **Step 2: Replace network motion with workshop motion**

Keep the existing container and label styles. Replace network animation selectors with:

```css
.scene-object { animation: workshop-drift 13s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
.telegram-token { animation-delay: -3s; }
.composio-tool { animation-delay: -6s; }
.mcp-tool { animation-delay: -9s; }
.reply-output { animation-delay: -4.5s; }
.runway-signal { stroke-dasharray: 12 14; animation: runway-signal 9s linear infinite; }
@keyframes workshop-drift { to { transform: translateY(-4px); } }
@keyframes runway-signal { to { stroke-dashoffset: -104; } }
@media (prefers-reduced-motion: reduce) {
	.scene-object,
	.runway-signal { animation: none; }
}
```

- [ ] **Step 3: Run the illustration contract**

Run: `npm run build && npm run test:illustrations`  
Expected: PASS with `Homepage illustration contract passed`.

- [ ] **Step 4: Run the full suite**

Run: `npm run check`  
Expected: Astro builds 47 pages and all contracts pass.

- [ ] **Step 5: Commit the miniature workshop**

```bash
git add src/components/illustrations/ConnectedWorkspaceIllustration.astro
git commit -m "feat: turn connected action into a miniature workshop"
```

### Task 4: Visual verification

**Files:**
- Modify only if a reproducible visual defect is found: `src/components/Hero.astro`, `src/components/illustrations/ConnectedWorkspaceIllustration.astro`

- [ ] **Step 1: Verify the hero at 1440, 1024 and 390 px**

Confirm the final `y` descender is fully visible, the intended three title lines remain and no heading overflows.

- [ ] **Step 2: Verify the connected workshop at 1440, 820 and 390 px**

Confirm the message, Homun machine, Composio, MCP + Skills, Telegram and reply output remain distinct and no horizontal scrolling appears.

- [ ] **Step 3: Verify reduced motion and browser console**

Emulate `prefers-reduced-motion: reduce`; confirm `.scene-object` and `.runway-signal` have `animation-name: none`. Confirm zero console errors.

- [ ] **Step 4: Run final verification**

```bash
npm run check
git diff --check
git status --short
```

Expected: all commands exit 0 and the branch is clean after commits.
