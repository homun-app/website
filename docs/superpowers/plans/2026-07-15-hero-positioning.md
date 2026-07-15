# Homepage Hero Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first screen explain who Homun is for, the complete AI-workspace capability it provides, and the user's control over models and work.

**Architecture:** Preserve the existing hero layout, headline, adaptive download behavior, and workshop illustration. Strengthen only the positioning copy and protect the new promise with the existing generated-homepage contract.

**Tech Stack:** Astro 6, Tailwind CSS 4, Node.js static contract tests

---

### Task 1: Protect the stronger hero promise

**Files:**
- Modify: `scripts/check-homepage.mjs`
- Test: `scripts/check-homepage.mjs`

- [ ] **Step 1: Write the failing positioning assertions**

Add these messages to the required homepage copy:

```js
"Independent AI workspace",
"An AI workspace for people who build, research and create—not just chat.",
"Use persistent memory, tools and automations with compatible cloud, open-source or local models, while keeping your work under your control.",
"No account required · Installers for macOS, Windows and Linux",
```

- [ ] **Step 2: Run the contract to verify it fails**

Run: `npm run build && npm run test:homepage`

Expected: FAIL because `Independent AI workspace` is absent from the rendered homepage.

- [ ] **Step 3: Keep the comparison guard intact**

Retain the existing forbidden-claim checks for named competitors and unsupported promises such as `any model`.

### Task 2: Strengthen the hero copy

**Files:**
- Modify: `src/components/Hero.astro`
- Test: `scripts/check-homepage.mjs`

- [ ] **Step 1: Implement the minimal hero change**

Keep `Your work. Your models. Your system.` and the existing actions. Replace the category label, supporting paragraph, and proof line with:

```astro
Independent AI workspace

An AI workspace for people who build, research and create—not just chat.
Use persistent memory, tools and automations with compatible cloud, open-source or local models, while keeping your work under your control.

No account required · Installers for macOS, Windows and Linux
```

Combine the account boundary and platform availability in one piece of microcopy so both remain discoverable above the fold at 1224×768.

- [ ] **Step 2: Run focused checks**

Run: `npm run build && npm run test:homepage && npm run test:illustrations`

Expected: all three commands pass.

- [ ] **Step 3: Run the complete regression suite**

Run: `npm run check`

Expected: all build and contract checks pass.

- [ ] **Step 4: Verify the rendered hero**

Run the local Astro server and inspect the first screen at desktop and mobile widths. Confirm the headline, paragraph, proof line, actions, platform note, and workshop illustration remain legible without overlap or clipping.
