# Website Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a complete bilingual website privacy notice, link it globally, and minimize the data sent to the existing Umami Cloud analytics integration without adding a consent banner.

**Architecture:** English and Italian privacy notices live in Starlight's content collection so they build at `/privacy/` and `/it/privacy/` with accessible static-document styling. The shared marketing footer and a small Starlight footer override provide global entry points, while both Umami script locations receive identical minimization attributes. A focused build contract protects the public copy, routing, and tracker configuration; the existing analytics unit contract protects event payload allowlisting and fail-open behavior.

**Tech Stack:** Astro 6, Starlight 0.40, Markdown content collections, browser JavaScript, Node.js contract tests, Umami Cloud.

---

## File map

- Create `scripts/check-privacy-build.mjs`: assert privacy-page content, locale-aware links, and Umami minimization in built HTML.
- Modify `package.json`: expose `test:privacy` and include it in `npm run check`.
- Create `src/content/docs/privacy.md`: canonical English website privacy notice.
- Create `src/content/docs/it/privacy.md`: faithful Italian notice.
- Create `src/components/docs/Footer.astro`: preserve Starlight's footer and append the locale-aware privacy link.
- Modify `astro.config.mjs`: register the documentation footer override.
- Modify `src/components/Footer.astro`: add the global marketing privacy link while preserving product-security documentation.
- Modify `src/layouts/Base.astro`: minimize the marketing tracker payload.
- Modify `src/components/docs/AnalyticsHead.astro`: apply the same tracker configuration to documentation pages.
- Modify `src/content/docs/guides/security.md`: route website-analytics details to the English notice.
- Modify `src/content/docs/it/guides/security.md`: route website-analytics details to the Italian notice.
- Modify `scripts/check-analytics-events.mjs`: prove that arbitrary personal-looking data attributes are not copied into Umami events.
- Create `docs/operations/umami-retention.md`: define the manual control required to honor the 24-month maximum if the Cloud plan offers no automatic expiry.

### Task 1: Add the failing privacy build contract

**Files:**
- Create: `scripts/check-privacy-build.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the build contract**

Create `scripts/check-privacy-build.mjs` with:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const tracker = "https://cloud.umami.is/script.js";
const websiteId = "f3bdb523-4352-430b-b2a2-c7fdf4c0131f";

const englishPrivacy = await read("privacy/index.html");
for (const expected of [
	"Fabio Cantone",
	"hello@homun.app",
	"Umami Cloud",
	"legitimate interest",
	"IP address",
	"not stored",
	"24 months",
	"right to object",
	"Garante per la protezione dei dati personali",
]) {
	assert.ok(englishPrivacy.includes(expected), `English privacy notice is missing: ${expected}`);
}

const italianPrivacy = await read("it/privacy/index.html");
for (const expected of [
	"Fabio Cantone",
	"hello@homun.app",
	"Umami Cloud",
	"legittimo interesse",
	"indirizzo IP",
	"non viene conservato",
	"24 mesi",
	"diritto di opposizione",
	"Garante per la protezione dei dati personali",
]) {
	assert.ok(italianPrivacy.includes(expected), `Italian privacy notice is missing: ${expected}`);
}

for (const path of ["index.html", "roadmap/index.html", "changelog/index.html"]) {
	const html = await read(path);
	assert.ok(html.includes('href="/privacy/"'), `${path} is missing the marketing privacy link`);
}

for (const path of ["docs/index.html", "guides/security/index.html"]) {
	const html = await read(path);
	assert.ok(html.includes('href="/privacy/"'), `${path} is missing the English docs privacy link`);
}

for (const path of ["it/docs/index.html", "it/guides/security/index.html"]) {
	const html = await read(path);
	assert.ok(html.includes('href="/it/privacy/"'), `${path} is missing the Italian docs privacy link`);
}

for (const path of ["index.html", "docs/index.html", "privacy/index.html", "it/privacy/index.html"]) {
	const html = await read(path);
	const tags = html.match(/<script[^>]+cloud\.umami\.is\/script\.js[^>]*>/g) ?? [];
	assert.equal(tags.length, 1, `${path} must load Umami exactly once`);
	const tag = tags[0];
	assert.ok(tag.includes(`data-website-id="${websiteId}"`));
	assert.ok(tag.includes('data-do-not-track="true"'));
	assert.ok(tag.includes('data-exclude-search="true"'));
	assert.ok(tag.includes('data-exclude-hash="true"'));
	assert.ok(tag.includes('data-domains="homun.app,www.homun.app"'));
}

console.log("Privacy build contract passed");
```

- [ ] **Step 2: Register the contract**

Add this script beside the analytics scripts in `package.json`:

```json
"test:privacy": "node scripts/check-privacy-build.mjs"
```

Insert `npm run test:privacy` in `check` immediately after `npm run test:analytics-build`:

```json
"check": "npm run build && npm run test:analytics-events && npm run test:analytics-build && npm run test:privacy && npm run test:homepage && npm run test:marketing-backgrounds && npm run test:downloads && npm run test:illustrations && npm run test:product-data && npm run test:roadmap-v3-manifest && npm run test:roadmap-v3-product-data && npm run test:roadmap-v3-publication && npm run test:roadmap-v3-presentation && npm run test:roadmap-v3-projections && npm run test:roadmap-v3-rollout && npm run test:roadmap && npm run test:container && npm run test:container-runtime-ownership && npm run test:container-runtime-signals"
```

- [ ] **Step 3: Run the contract and verify the expected failure**

Run:

```bash
npm run build && npm run test:privacy
```

Expected: build succeeds and `test:privacy` fails with `ENOENT` for `dist/privacy/index.html` because the notices do not exist yet.

- [ ] **Step 4: Commit the red contract**

```bash
git add package.json scripts/check-privacy-build.mjs
git commit -m "test: define website privacy contract"
```

### Task 2: Publish the bilingual privacy notices and retention procedure

**Files:**
- Create: `src/content/docs/privacy.md`
- Create: `src/content/docs/it/privacy.md`
- Create: `docs/operations/umami-retention.md`
- Modify: `src/content/docs/guides/security.md`
- Modify: `src/content/docs/it/guides/security.md`

- [ ] **Step 1: Create the English notice**

Create `src/content/docs/privacy.md` with:

```markdown
---
title: Website privacy notice
description: How homun.app handles aggregate website analytics.
---

_Effective date: 22 July 2026_

This notice explains how the public **homun.app** website handles information when you visit it. It covers website analytics only; it does not describe data handled inside the Homun desktop application.

## Data controller

**Fabio Cantone**, responsible for the Homun project, Italy<br />
Email: [hello@homun.app](mailto:hello@homun.app)

## Why we use analytics

We use privacy-oriented aggregate analytics to understand whether the website is useful, which public pages attract interest, and whether visitors choose to download Homun, open its GitHub resources, or participate in the public roadmap.

The legal basis is the controller's legitimate interest in measuring and improving the public website with proportionate, aggregate analytics. You may object to this processing as described below.

## Information processed

The website uses **Umami Cloud** to process:

- page path and title;
- referring page;
- browser language and screen size;
- browser, operating system, and device type;
- approximate country;
- timestamps, page views, visits, and session duration;
- selected interactions: download intent, outbound GitHub navigation, roadmap project opening, and roadmap participation.

The request IP address is used technically by Umami to derive approximate location and an anonymous session hash. Umami states that the IP address itself is not stored. The anonymous session calculation uses a rotating salt and does not set a browser cookie.

## Information we do not send

Website analytics do not receive Homun account data, workspace content, prompts, files, personal names, email addresses, advertising identifiers, custom distinct IDs, or session-replay data. Query parameters and URL fragments are excluded. Homun does not use these analytics to identify visitors across websites.

The tracker does not set analytics cookies. If your browser sends the **Do Not Track** preference, the tracker is configured not to collect analytics.

## Provider and international processing

Analytics are provided by **Umami Software, Inc.** through Umami Cloud. Umami documents Cloud infrastructure in the European Union and the United States. Where data is processed outside the European Economic Area, the provider's [Data Processing Agreement](https://umami.is/umami-dpa.pdf) describes the applicable safeguards, including Standard Contractual Clauses.

You can read [Umami's tracker documentation](https://docs.umami.is/docs/metric-definitions) for technical details.

## Retention

Stored website analytics are retained for no longer than **24 months** and are then deleted. Homun reviews the retention boundary regularly and uses the available Umami Cloud account controls or a documented manual deletion procedure to enforce it.

## Your rights

Where applicable, you may request access, rectification, erasure, restriction, or portability of personal data, and you may object to processing based on legitimate interest. Because the analytics are designed not to identify individual visitors, Homun may be unable to associate an analytics record with you without additional information.

To make a request or ask a privacy question, email [hello@homun.app](mailto:hello@homun.app). You also have the right to lodge a complaint with the [Garante per la protezione dei dati personali](https://www.garanteprivacy.it/).

## Changes to this notice

Material changes to the website's analytics or this notice will be reflected on this page together with an updated effective date.
```

- [ ] **Step 2: Create the Italian notice**

Create `src/content/docs/it/privacy.md` with:

```markdown
---
title: Informativa privacy del sito
description: Come homun.app gestisce le analisi aggregate del sito.
---

_Data di efficacia: 22 luglio 2026_

Questa informativa spiega come il sito pubblico **homun.app** tratta le informazioni durante una visita. Riguarda esclusivamente le analisi del sito e non descrive i dati gestiti nell'applicazione desktop Homun.

## Titolare del trattamento

**Fabio Cantone**, responsabile del progetto Homun, Italia<br />
Email: [hello@homun.app](mailto:hello@homun.app)

## Perché usiamo le statistiche

Usiamo statistiche aggregate orientate alla tutela della privacy per capire se il sito è utile, quali pagine pubbliche suscitano interesse e se i visitatori scelgono di scaricare Homun, aprire le sue risorse GitHub o partecipare alla roadmap pubblica.

La base giuridica è il legittimo interesse del titolare a misurare e migliorare il sito pubblico tramite analisi aggregate e proporzionate. Puoi opporti a questo trattamento come descritto di seguito.

## Informazioni trattate

Il sito usa **Umami Cloud** per trattare:

- percorso e titolo della pagina;
- pagina di provenienza;
- lingua del browser e dimensioni dello schermo;
- browser, sistema operativo e tipo di dispositivo;
- paese approssimativo;
- orari, visualizzazioni, visite e durata della sessione;
- interazioni selezionate: intenzione di download, apertura di risorse GitHub, apertura dei progetti della roadmap e partecipazione alla roadmap.

L'indirizzo IP della richiesta viene usato tecnicamente da Umami per ricavare la posizione approssimativa e un hash anonimo della sessione. Umami dichiara che l'indirizzo IP non viene conservato. Il calcolo anonimo della sessione usa un salt a rotazione e non imposta cookie nel browser.

## Informazioni che non inviamo

Le statistiche del sito non ricevono dati dell'account Homun, contenuti degli spazi di lavoro, prompt, file, nomi personali, indirizzi email, identificativi pubblicitari, identificativi distinti personalizzati o dati di session replay. I parametri di ricerca e i frammenti degli URL sono esclusi. Homun non usa queste statistiche per identificare i visitatori attraverso siti diversi.

Il tracker non imposta cookie analitici. Se il browser invia la preferenza **Do Not Track**, il tracker è configurato per non raccogliere statistiche.

## Fornitore e trattamento internazionale

Le statistiche sono fornite da **Umami Software, Inc.** tramite Umami Cloud. Umami documenta infrastrutture Cloud nell'Unione europea e negli Stati Uniti. Quando i dati sono trattati fuori dallo Spazio economico europeo, l'[accordo sul trattamento dei dati](https://umami.is/umami-dpa.pdf) del fornitore descrive le garanzie applicabili, incluse le Clausole Contrattuali Standard.

Puoi consultare la [documentazione tecnica di Umami](https://docs.umami.is/docs/metric-definitions) per maggiori dettagli.

## Conservazione

Le statistiche memorizzate vengono conservate per non più di **24 mesi** e poi eliminate. Homun verifica regolarmente il limite di conservazione e usa i controlli disponibili nell'account Umami Cloud oppure una procedura manuale documentata per rispettarlo.

## I tuoi diritti

Quando applicabile, puoi chiedere accesso, rettifica, cancellazione, limitazione o portabilità dei dati personali e puoi esercitare il diritto di opposizione al trattamento basato sul legittimo interesse. Poiché le statistiche sono progettate per non identificare i singoli visitatori, Homun potrebbe non riuscire ad associare una registrazione analitica alla tua persona senza informazioni aggiuntive.

Per esercitare un diritto o fare una domanda sulla privacy, scrivi a [hello@homun.app](mailto:hello@homun.app). Hai inoltre il diritto di presentare un reclamo al [Garante per la protezione dei dati personali](https://www.garanteprivacy.it/).

## Modifiche all'informativa

Le modifiche sostanziali alle statistiche del sito o a questa informativa saranno riportate in questa pagina insieme a una nuova data di efficacia.
```

- [ ] **Step 3: Document the 24-month control**

Create `docs/operations/umami-retention.md` with:

```markdown
# Umami Cloud retention procedure

## Scope

This procedure covers the `homun.app` Umami Cloud website currently identified in the tracker by `f3bdb523-4352-430b-b2a2-c7fdf4c0131f`. Fabio Cantone owns the review.

## Policy

Stored website analytics must never be older than 24 months. Review the oldest available analytics date at least quarterly. The first hard deletion deadline for the website created in July 2026 is 22 July 2028.

## Procedure

1. Sign in to Umami Cloud and inspect the website's oldest retained event date.
2. If account-level retention can delete data older than 24 months, configure it and record the setting and review date below.
3. If age-based deletion is unavailable, export only the aggregate reports that remain necessary, delete the tracked website and its analytics history before the oldest event reaches 24 months, and create a replacement website.
4. Replace the website ID in `src/layouts/Base.astro` and `src/components/docs/AnalyticsHead.astro`.
5. Run `npm run build`, `npm run test:analytics-build`, and `npm run test:privacy` before deployment.
6. Confirm that new page views arrive in the replacement Umami website, then record the deletion date and next deadline below.

Deleting the Umami website and history is irreversible. Resolve the exact website target in the dashboard before confirming deletion.

## Review log

| Review date | Oldest data | Control used | Next deadline |
| --- | --- | --- | --- |
| 22 July 2026 | New website | Initial policy | 22 July 2028 |
```

- [ ] **Step 4: Link the notices from product-security documentation**

Append this sentence to the English `Website analytics` section in `src/content/docs/guides/security.md`:

```markdown
For the controller, provider, retention, and rights information, read the [website privacy notice](/privacy/).
```

Append the equivalent sentence to the Italian `Analisi del sito` section in `src/content/docs/it/guides/security.md`:

```markdown
Per informazioni su titolare, fornitore, conservazione e diritti, leggi l'[informativa privacy del sito](/it/privacy/).
```

- [ ] **Step 5: Build and verify the content portion**

Run:

```bash
npm run build
```

Expected: exit 0; `dist/privacy/index.html` and `dist/it/privacy/index.html` exist. `npm run test:privacy` still fails because global links and tracker attributes have not been implemented.

- [ ] **Step 6: Commit the notices**

```bash
git add src/content/docs/privacy.md src/content/docs/it/privacy.md src/content/docs/guides/security.md src/content/docs/it/guides/security.md docs/operations/umami-retention.md
git commit -m "docs: publish website privacy notices"
```

### Task 3: Add global locale-aware privacy links

**Files:**
- Create: `src/components/docs/Footer.astro`
- Modify: `astro.config.mjs`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Add the marketing footer link**

In the `Resources` links array in `src/components/Footer.astro`, retain `Privacy & security` and insert the dedicated notice immediately after it:

```astro
{ label: "Privacy & security", href: "/guides/security/" },
{ label: "Privacy", href: "/privacy/" },
```

- [ ] **Step 2: Create the documentation footer override**

Create `src/components/docs/Footer.astro` with:

```astro
---
import DefaultFooter from "@astrojs/starlight/components/Footer.astro";

const italian = Astro.url.pathname.startsWith("/it/");
const privacyHref = italian ? "/it/privacy/" : "/privacy/";
const privacyLabel = italian ? "Informativa privacy" : "Privacy notice";
---

<DefaultFooter />
<div class="homun-legal-footer">
	<a href={privacyHref}>{privacyLabel}</a>
	<span aria-hidden="true">·</span>
	<a href="mailto:hello@homun.app">hello@homun.app</a>
</div>

<style>
	.homun-legal-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-block: 1.5rem 2rem;
		font-size: var(--sl-text-xs);
		color: var(--sl-color-gray-3);
	}

	.homun-legal-footer a {
		color: inherit;
		text-decoration: none;
	}

	.homun-legal-footer a:hover {
		color: var(--sl-color-white);
		text-decoration: underline;
	}
</style>
```

- [ ] **Step 3: Register the Starlight footer**

Extend the existing `components` object in `astro.config.mjs` to exactly:

```js
components: {
	Head: './src/components/docs/AnalyticsHead.astro',
	Footer: './src/components/docs/Footer.astro',
	ThemeProvider: './src/components/docs/ThemeProvider.astro',
},
```

- [ ] **Step 4: Build and verify routing**

Run:

```bash
npm run build
```

Expected: exit 0. Inspecting `dist/index.html`, `dist/docs/index.html`, and `dist/it/docs/index.html` shows `/privacy/`, `/privacy/`, and `/it/privacy/` respectively. `npm run test:privacy` still fails only on missing Umami minimization attributes.

- [ ] **Step 5: Commit the global links**

```bash
git add src/components/Footer.astro src/components/docs/Footer.astro astro.config.mjs
git commit -m "feat: link website privacy globally"
```

### Task 4: Minimize Umami collection and prove event allowlisting

**Files:**
- Modify: `src/layouts/Base.astro`
- Modify: `src/components/docs/AnalyticsHead.astro`
- Modify: `scripts/check-analytics-events.mjs`

- [ ] **Step 1: Add a failing event allowlist assertion**

Append this assertion before `console.log("Analytics event contract passed");` in `scripts/check-analytics-events.mjs`:

```js
assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun/issues/42?email=visitor@example.com#prompt",
		currentPath: "/roadmap/client-work/?email=visitor@example.com#workspace",
		dataset: {
			analyticsRoadmapAction: "vote",
			analyticsRoadmapProject: "client-work",
			analyticsRoadmapSource: "roadmap_detail",
			email: "visitor@example.com",
			prompt: "private prompt",
			workspace: "private workspace",
		},
	}),
	{
		name: "roadmap_participation",
		data: {
			action: "vote",
			project: "client-work",
			source: "roadmap_detail",
		},
	},
);
```

- [ ] **Step 2: Run the allowlist assertion**

Run:

```bash
npm run test:analytics-events
```

Expected: PASS because the existing classifier already emits only explicit, validated fields. This characterization test locks in the privacy boundary without requiring production-code changes.

- [ ] **Step 3: Minimize the marketing tracker**

Replace the Umami tag in `src/layouts/Base.astro` with:

```astro
<script
	defer
	src="https://cloud.umami.is/script.js"
	data-website-id="f3bdb523-4352-430b-b2a2-c7fdf4c0131f"
	data-do-not-track="true"
	data-exclude-search="true"
	data-exclude-hash="true"
	data-domains="homun.app,www.homun.app"
></script>
```

- [ ] **Step 4: Minimize the documentation tracker**

Replace the Umami tag in `src/components/docs/AnalyticsHead.astro` with the same configuration:

```astro
<script
	defer
	src="https://cloud.umami.is/script.js"
	data-website-id="f3bdb523-4352-430b-b2a2-c7fdf4c0131f"
	data-do-not-track="true"
	data-exclude-search="true"
	data-exclude-hash="true"
	data-domains="homun.app,www.homun.app"
></script>
```

- [ ] **Step 5: Run the focused contracts**

Run:

```bash
npm run build && npm run test:analytics-events && npm run test:analytics-build && npm run test:privacy
```

Expected: all four commands exit 0 and print `Analytics event contract passed`, `Analytics build contract passed`, and `Privacy build contract passed`.

- [ ] **Step 6: Commit the minimization controls**

```bash
git add src/layouts/Base.astro src/components/docs/AnalyticsHead.astro scripts/check-analytics-events.mjs
git commit -m "feat: minimize website analytics data"
```

### Task 5: Run full and rendered verification

**Files:**
- Verify only; modify implementation files only if a check reveals a scoped defect.

- [ ] **Step 1: Run formatting and repository diff checks**

Run:

```bash
git diff --check
```

Expected: no output and exit 0.

- [ ] **Step 2: Run the full project gate**

Run:

```bash
npm run check
```

Expected: exit 0. Record any intentionally excluded or unavailable test instead of calling it passing.

- [ ] **Step 3: Start the production preview**

Run:

```bash
npm run preview -- --host 127.0.0.1
```

Expected: Astro reports a local preview URL, normally `http://127.0.0.1:4321/`.

- [ ] **Step 4: Inspect representative rendered pages**

At both 390px and 1440px viewport widths, open:

```text
http://127.0.0.1:4321/
http://127.0.0.1:4321/privacy/
http://127.0.0.1:4321/docs/
http://127.0.0.1:4321/it/privacy/
http://127.0.0.1:4321/it/docs/
```

Expected:

- the marketing footer exposes `Privacy` without overlap or clipping;
- documentation footers route to the correct locale;
- both notices have correct heading hierarchy, readable line lengths, working email/provider/Garante links, and no horizontal overflow;
- changing to a local hostname produces no Umami collection because `data-domains` excludes it;
- blocked analytics do not interfere with links or navigation.

- [ ] **Step 5: Confirm clean repository state and commits**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: no uncommitted files; the privacy contract, notices, links, and minimization commits are present above the approved design commit.
