# Cursor Spotlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining marketing grids and add a restrained cursor-following spotlight to all pattern-free marketing atmospheres.

**Architecture:** The shared Base layout owns one fine-pointer, reduced-motion-aware listener that updates two CSS custom properties through a bounded requestAnimationFrame interpolation. Each `.atmosphere` consumes those properties; Projects and Marketplace switch from `bg-grid` to the same atmosphere primitive used by the homepage.

**Tech Stack:** Astro 6, Tailwind CSS 4, browser Pointer Events, CSS custom properties, Node.js built-HTML contract tests.

---

### Task 1: Define the marketing background contract

**Files:**
- Create: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/scripts/check-marketing-backgrounds.mjs`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/package.json`

- [ ] **Step 1: Add a failing multi-page contract**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pages = ["index.html", "roadmap/index.html", "marketplace/index.html"];

for (const page of pages) {
	const html = await readFile(new URL(`../dist/${page}`, import.meta.url), "utf8");
	assert.ok(!html.includes("bg-grid"), `${page} still renders the graph-paper background`);
	assert.ok(html.includes("atmosphere"), `${page} is missing the pattern-free atmosphere`);
	assert.ok(html.includes("pointermove"), `${page} is missing pointer spotlight support`);
	assert.ok(html.includes("prefers-reduced-motion: reduce"), `${page} is missing reduced-motion protection`);
	assert.ok(html.includes("(pointer: fine)"), `${page} is missing fine-pointer protection`);
}

console.log("Marketing background contract passed");
```

- [ ] **Step 2: Add the contract to the main check**

Use these scripts:

```json
"test:marketing-backgrounds": "node scripts/check-marketing-backgrounds.mjs",
"check": "npm run build && npm run test:homepage && npm run test:marketing-backgrounds"
```

- [ ] **Step 3: Verify the new test fails**

Run: `npm run check`

Expected: homepage assertions pass, then `roadmap/index.html still renders the graph-paper background`.

### Task 2: Implement the shared spotlight

**Files:**
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/styles/global.css`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/layouts/Base.astro`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/pages/roadmap.astro`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/pages/marketplace/index.astro`

- [ ] **Step 1: Make the atmosphere consume pointer coordinates**

```css
.atmosphere {
	background:
		radial-gradient(circle 34rem at var(--pointer-x, 50%) var(--pointer-y, 18%), rgba(80, 223, 197, 0.13), transparent 72%),
		radial-gradient(ellipse 38% 46% at 86% 62%, rgba(12, 102, 87, 0.08), transparent 76%);
	pointer-events: none;
}
```

- [ ] **Step 2: Add bounded pointer interpolation to Base**

Insert after the reveal script:

```js
(() => {
	const finePointer = window.matchMedia("(pointer: fine)");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	if (!finePointer.matches || reducedMotion.matches) return;

	const root = document.documentElement;
	let currentX = 50;
	let currentY = 18;
	let targetX = currentX;
	let targetY = currentY;
	let frame = 0;

	const render = () => {
		currentX += (targetX - currentX) * 0.08;
		currentY += (targetY - currentY) * 0.08;
		root.style.setProperty("--pointer-x", `${currentX}%`);
		root.style.setProperty("--pointer-y", `${currentY}%`);
		if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
			frame = window.requestAnimationFrame(render);
		} else {
			frame = 0;
		}
	};

	const schedule = () => {
		if (!frame) frame = window.requestAnimationFrame(render);
	};

	window.addEventListener("pointermove", (event) => {
		targetX = (event.clientX / window.innerWidth) * 100;
		targetY = (event.clientY / window.innerHeight) * 100;
		schedule();
	}, { passive: true });

	document.documentElement.addEventListener("mouseleave", () => {
		targetX = 50;
		targetY = 18;
		schedule();
	});
})();
```

- [ ] **Step 3: Replace the two remaining grid layers**

Use this decorative layer in both `roadmap.astro` and `marketplace/index.astro`:

```astro
<div class="atmosphere absolute inset-0 -z-10" aria-hidden="true"></div>
```

- [ ] **Step 4: Run the complete automated check**

Run: `npm run check`

Expected: 47 pages build, the homepage positioning contract passes, and `Marketing background contract passed` prints.

- [ ] **Step 5: Verify behaviour in a real browser**

At desktop size, move the pointer between the left and right edges and confirm the broad glow trails it without changing layout. Open Projects and Marketplace and confirm their grid is gone. At mobile size, confirm static backgrounds and no horizontal overflow.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/check-marketing-backgrounds.mjs src/styles/global.css src/layouts/Base.astro src/pages/roadmap.astro src/pages/marketplace/index.astro
git commit -m "feat: add restrained cursor spotlight"
```
