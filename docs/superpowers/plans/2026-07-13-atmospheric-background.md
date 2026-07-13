# Atmospheric Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the graph-paper effect from the homepage and replace it with restrained, pattern-free radial light fields.

**Architecture:** Add one reusable static atmosphere primitive to the existing marketing stylesheet. Replace only homepage `bg-grid` instances so inner documentation and existing secondary pages stay outside this visual adjustment.

**Tech Stack:** Astro 6, Tailwind CSS 4, Node.js built-HTML contract test.

---

### Task 1: Protect the pattern-free homepage

**Files:**
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/scripts/check-homepage.mjs`

- [ ] **Step 1: Add a failing built-HTML assertion**

```js
assert.ok(!html.includes("bg-grid"), "Homepage still renders the graph-paper background");
```

- [ ] **Step 2: Verify the assertion fails against the current homepage**

Run: `npm run check`

Expected: `AssertionError` with `Homepage still renders the graph-paper background`.

### Task 2: Add the pattern-free atmosphere

**Files:**
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/styles/global.css`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/components/Hero.astro`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/components/Ecosystem.astro`
- Modify: `/Users/fabio/Projects/Homun/website/.worktrees/homepage-redesign/src/components/Download.astro`

- [ ] **Step 1: Add a reusable static atmosphere class**

```css
.atmosphere {
	background:
		radial-gradient(ellipse 62% 54% at 50% 4%, rgba(80, 223, 197, 0.12), transparent 72%),
		radial-gradient(ellipse 36% 42% at 86% 62%, rgba(12, 102, 87, 0.09), transparent 76%);
	pointer-events: none;
}
```

- [ ] **Step 2: Replace homepage grid layers**

In Hero, Ecosystem, and Download replace their decorative `bg-grid` div class with:

```astro
<div class="atmosphere absolute inset-0 -z-10" aria-hidden="true"></div>
```

Do not remove the old `.bg-grid` class because secondary marketing pages may still depend on it.

- [ ] **Step 3: Run the full check**

Run: `npm run check`

Expected: the build completes, 47 pages are generated, and `Homepage positioning contract passed` is printed.

- [ ] **Step 4: Verify responsive rendering**

Inspect the live homepage at desktop and mobile sizes. Confirm there is no visible repeating pattern, no horizontal overflow, and text contrast remains unchanged.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-homepage.mjs src/styles/global.css src/components/Hero.astro src/components/Ecosystem.astro src/components/Download.astro
git commit -m "refine: replace homepage grid with atmospheric light"
```
