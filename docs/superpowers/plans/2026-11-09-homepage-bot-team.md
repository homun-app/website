# Homepage "Bot team" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la homepage "AI workspace" di Homun 2 con la homepage "Your bot team", insieme a
download sicuro per la 0.3, tema chiaro/scuro, licenza Apache-2.0 e banner sulle pagine non ancora
rifatte.

**Architecture:** Il sito resta Astro + Tailwind v4. La homepage diventa una sequenza di sezioni-scena
in `src/components/home/`, costruite su pochi primitivi UI riusabili in `src/components/ui/`.
L'interattività (picker dei template, download) vive in moduli `.mjs` in `src/scripts/`, con
funzioni pure testate dagli script `node` già usati da `npm run check`.

**Tech Stack:** Astro 5, Tailwind CSS v4 (`@theme`), Starlight (docs), JavaScript vanilla, test
`node:assert` in `scripts/check-*.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-09-homepage-bot-team-design.md`

## Come si esegue (GLM implementa, Claude rivede)

Lavoro sul branch `site-v3-bot-team`. Ogni task è un prompt per GLM. Usa questo modello, cambiando
solo il numero del task:

```
Lavori nel repo /Users/fabio/Projects/Homun/website, branch site-v3-bot-team.
Leggi per intero:
- docs/superpowers/specs/2026-11-09-homepage-bot-team-design.md
- docs/superpowers/plans/2026-11-09-homepage-bot-team.md, sezioni "Global Constraints",
  "Review Focus" e "Task N".
Implementa SOLO il Task N, step per step, nell'ordine.
Tocca solo i file elencati nel task. Se ti serve toccarne altri, fermati e chiedi.
Dopo ogni step "Run", incolla l'output reale del comando. Non dichiarare un test verde senza
averlo eseguito.
Fai il commit indicato nell'ultimo step. Non fare push.
Alla fine riporta: file toccati, output dei comandi, dubbi e scelte che hai fatto tu.
```

Dopo ogni task, Claude:
- legge il diff;
- esegue `npm run check`;
- apre la homepage nel browser a 375, 768 e 1440 px, in chiaro e in scuro;
- se trova problemi, rimanda le correzioni a GLM con un prompt dedicato.

Il task successivo parte solo dopo l'ok.

## Global Constraints

- Lingua della homepage e dei testi marketing: **inglese**. Docs IT restano dove sono.
- Linea di testa: **"Your bot team. On your computer."** (gerarchia fissata dalla spec; il copy di supporto è libero).
- Template veri, id esatti: `inbox-manager`, `meeting-prep`, `daily-briefing`, `chief-of-staff`, `mention-monitor`, `executive-assistant` (fonte: `~/Projects/Bot/Sandbot/src/main/templates/*.json`, campi `name.en`, `description.en`).
- Nessuna funzione che Homun 0.3 non ha: niente app mobile, canali Slack/iMessage/Telegram, piano hosted, "works while your computer is off", testimonianze, numeri inventati.
- Niente testi, asset, nomi di template o illustrazioni copiati da rakazo.com o x.ai/bot.
- Download: solo release pubblicate con versione **≥ 0.3.0**, mai Homun 2. Fallback: `https://github.com/homun-app/homun-releases/releases` (mai `/releases/latest`).
- Nota accanto al download: **"Requires Docker Desktop"** con link `https://www.docker.com/products/docker-desktop/`.
- Repository open source: `https://github.com/homun-app/homun-core`, licenza **Apache-2.0**.
- Privacy: nessun nuovo script o richiesta a terzi lato client oltre a quelli esistenti (Umami, `api.github.com` per i download). Niente cookie, niente raccolta email.
- Animazioni: con `prefers-reduced-motion: reduce` nessuna animazione, si vede lo stato finale. Senza JavaScript la pagina è completa (stato finale statico, link di download verso il fallback).
- Layout senza scroll orizzontale della pagina da 360 px in su. Contrasto testo AA in chiaro e in scuro.
- `npm run check` verde alla fine di ogni task.

## Review Focus

1. **API GitHub irraggiungibile o rate-limited** (60 richieste/ora senza token): il bottone porta al fallback `/releases` e non resta bloccato su "Finding…". → test nel Task 1.
2. **Tag in formati diversi** (`v0.3.1001`, `0.3.1001`, `v0.3.0-beta.1`, `nightly`): si confrontano bene, prerelease e tag non validi si scartano. → test nel Task 1.
3. **JavaScript disattivato**: l'hero mostra la scena finale di Inbox Manager e il bottone di download funziona come link. → test nel Task 4 (HTML di build).
4. **Riduzione del movimento**: nessuna animazione nel picker, stato finale subito. → test nel Task 4 (`sceneFrames` con `reducedMotion: true`).
5. **Telefono a 360 px**: la fila dei chip scorre dentro il suo contenitore e la pagina non scorre in orizzontale. → controllo di Claude nel browser alla fine del Task 4 e del Task 8.

---

### Task 1: Archivio e download solo dalla 0.3 in su

**Files:**
- Create: `src/lib/versions.mjs`
- Modify: `src/scripts/downloads.mjs`, `src/components/Footer.astro` (link "All releases")
- Test: `scripts/check-download-routing.mjs`

**Interfaces:**
- Produces:
  - `parseVersion(tag: string): [number, number, number] | null`, che accetta `v` iniziale e rifiuta i prerelease (`-…`).
  - `compareVersions(a, b): number`
  - `MIN_PUBLIC_VERSION = "0.3.0"`
  - in `downloads.mjs`: `pickCurrentRelease(releases: GitHubRelease[], min = MIN_PUBLIC_VERSION): GitHubRelease | null`; `RELEASES_PAGE_URL = "https://github.com/homun-app/homun-releases/releases"`; `RELEASES_API_URL = "https://api.github.com/repos/homun-app/homun-releases/releases?per_page=30"`.

- [ ] **Step 1: Archivio.** Da `main` pulito: `git tag site-v2-workspace && git switch -c site-v3-bot-team`. Run `git tag --list site-v2-workspace`. Expected: `site-v2-workspace`.
- [ ] **Step 2: Test che falliscono.** In `scripts/check-download-routing.mjs`:
  - sostituisci l'asserzione su `RELEASES_PAGE_URL` con il nuovo valore;
  - aggiungi:

```js
import { parseVersion, compareVersions } from "../src/lib/versions.mjs";
assert.deepEqual(parseVersion("v0.3.1001"), [0, 3, 1001]);
assert.deepEqual(parseVersion("0.3.1001"), [0, 3, 1001]);
assert.equal(parseVersion("v0.3.0-beta.1"), null);
assert.equal(parseVersion("nightly"), null);
assert.ok(compareVersions("v0.3.2", "v0.3.10") < 0);
const rel = (tag, extra = {}) => ({ tag_name: tag, draft: false, prerelease: false, published_at: "2026-11-01T00:00:00Z", assets: [], ...extra });
assert.equal(pickCurrentRelease([rel("v0.2.1004"), rel("v0.1.1078")]), null);
assert.equal(pickCurrentRelease([rel("v0.2.1004"), rel("v0.3.1000"), rel("v0.3.1001")]).tag_name, "v0.3.1001");
assert.equal(pickCurrentRelease([rel("v0.3.1002", { draft: true }), rel("v0.3.1001")]).tag_name, "v0.3.1001");
assert.equal(pickCurrentRelease([rel("v0.3.1002", { prerelease: true }), rel("v0.3.1001")]).tag_name, "v0.3.1001");
```

  - aggiorna i test di `loadLatestInstallers` con un `fetchImpl` finto che restituisce un **array** di release. Verifica che vengano raggruppati gli asset di `pickCurrentRelease`. Verifica anche che, quando nessuna release è ≥ 0.3, il risultato abbia `macos`, `windows` e `linux` vuoti, così il click porta a `RELEASES_PAGE_URL`.
  - aggiungi un test in cui `fetchImpl` restituisce `{ ok: false, status: 403 }`: il click porta a `RELEASES_PAGE_URL` e `aria-busy` viene rimosso.
- [ ] **Step 3: Run** `node scripts/check-download-routing.mjs`. Expected: FAIL, perché `versions.mjs` non esiste.
- [ ] **Step 4: Implementa** `src/lib/versions.mjs` e i cambi in `downloads.mjs`. `loadLatestInstallers` legge la lista, usa `pickCurrentRelease` e passa il risultato a `groupInstallers`, con `[]` se il risultato è `null`. Le funzioni esistenti mantengono la stessa firma. In `Footer.astro` il link "All releases" punta a `RELEASES_PAGE_URL`, cioè la lista e non più `/latest`.
- [ ] **Step 5: Run** `node scripts/check-download-routing.mjs && node scripts/check-analytics-events.mjs`. Expected: entrambi passano.
- [ ] **Step 6: Commit** `git add -A src/lib/versions.mjs src/scripts/downloads.mjs src/components/Footer.astro scripts/check-download-routing.mjs && git commit -m "feat: download only Homun 0.3+ releases"`

### Task 2: Tema chiaro e scuro

**Files:**
- Modify: `src/styles/global.css` (blocco `@theme` e utility che usano colori fissi), `src/layouts/Base.astro` (meta `color-scheme`, `theme-color`)
- Test: `scripts/check-marketing-backgrounds.mjs` (riscrivere sul nuovo contratto)

**Interfaces:**
- Produces: i **nomi** dei token restano gli stessi (`--color-bg`, `--color-bg-raised`, `--color-surface`, `--color-surface-2`, `--color-cream` = testo principale, `--color-muted`, `--color-faint`, `--color-line`, `--color-line-strong`, `--color-accent*`). Le pagine vecchie (roadmap, changelog, marketplace) li usano, quindi cambiano i valori, non i nomi. Si aggiunge `--color-highlight`, lo sfondo leggermente diverso della sezione Engramma.

- [ ] **Step 1: Test che falliscono.** Riscrivi `scripts/check-marketing-backgrounds.mjs` perché verifichi sul CSS di `dist/`:
  - esistono valori chiari per i token di default;
  - esiste un blocco `@media (prefers-color-scheme: dark)` che li ridefinisce;
  - `dist/index.html` contiene `<meta name="color-scheme" content="light dark">` e due `theme-color` con `media`.

  Togli le asserzioni sullo sfondo "espresso" fisso.
- [ ] **Step 2: Run** `npm run build && node scripts/check-marketing-backgrounds.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa i token.** I token Tailwind puntano a variabili CSS:
  - `:root` contiene la palette chiara: sfondo quasi bianco, testo quasi nero, accento verde acqua `#20a991` o una sua variante scura che regga AA su chiaro;
  - `@media (prefers-color-scheme: dark)` contiene la palette scura, partendo da quella attuale.

  Le utility `grain`, `atmosphere`, `glow` e `text-gradient` devono funzionare in entrambi i temi, oppure essere neutralizzate in chiaro. In `Base.astro` aggiorna i meta.
- [ ] **Step 4: Run** `npm run check`. Expected: tutto verde. Le pagine roadmap e changelog vanno solo verificate: restano leggibili in chiaro, ed è questo che Claude controlla nel browser.
- [ ] **Step 5: Commit** `git commit -am "feat: light and dark theme tokens"`

### Task 3: Primitivi UI delle scene

**Files:**
- Create: `src/components/ui/AppWindow.astro`, `src/components/ui/ChatMessage.astro`, `src/components/ui/ApprovalCard.astro`, `src/components/ui/SceneSection.astro`, `src/pages/dev/primitives.astro` (pagina di prova, `noindex`, esclusa dalla sitemap)
- Test: `scripts/check-primitives.mjs` (nuovo, aggiunto a `npm run check` in `package.json`)

**Interfaces:**
- Produces:
  - `<AppWindow title: string, botName?: string, botEmoji?: string, computer?: boolean>`: finta finestra dell'app, con barra in alto, chat e pannello "Computer" a destra solo se `computer`. Ha gli slot `default` (chat) e `computer`. Sotto 768 px il pannello Computer va sotto la chat.
  - `<ChatMessage from: "user" | "bot" | "system", status?: "done" | "draft" | "held">`. I messaggi `user` sono a destra e neutri, i `bot` a sinistra, i `system` sono righe piccole centrate (es. "⏱ Routine «Backup»").
  - `<ApprovalCard tool: string, detail: string, state?: "pending" | "allowed" | "denied">`, con i bottoni *Allow once / Always allow / Deny* (finti, `aria-hidden` sui bottoni decorativi).
  - `<SceneSection id: string, eyebrow: string, title: string, body: string, variant?: "default" | "highlight", align?: "left" | "right">`, con lo slot `default` per la scena. Usa la classe `reveal` esistente.

- [ ] **Step 1: Test che fallisce.** `scripts/check-primitives.mjs` legge `dist/dev/primitives/index.html` e verifica:
  - una `[data-app-window]` con `[data-computer-panel]`;
  - i tre tipi `data-from="user|bot|system"`;
  - una `[data-approval-card]` con i testi "Allow once", "Always allow", "Deny";
  - una `section[data-scene][data-variant="highlight"]`;
  - `<meta name="robots" content="noindex">`.
- [ ] **Step 2: Run** `npm run build && node scripts/check-primitives.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa** i quattro componenti e la pagina di prova, che li mostra tutti in ogni variante. Fai il `noindex` con una prop `noindex` su `Base.astro`, e togli la pagina dalla sitemap con `filter` in `astro.config.mjs`.
- [ ] **Step 4: Run** `npm run check`. Expected: verde. Il test sulla privacy deve accettare la nuova pagina.
- [ ] **Step 5: Commit** `git add -A src/components/ui src/pages/dev scripts/check-primitives.mjs package.json astro.config.mjs src/layouts/Base.astro && git commit -m "feat: scene UI primitives"`

### Task 4: Hero "scegli il tuo primo bot"

**Files:**
- Create:
  - `src/data/bot-templates.mjs`: i 6 template con le scene;
  - `src/scripts/hero-picker.mjs`: la logica pura e il collegamento al DOM;
  - `src/components/home/Hero.astro`, che sostituisce la vecchia hero (il vecchio `src/components/Hero.astro` non viene più importato);
  - `src/components/home/DownloadButton.astro`: bottone primario, nota Docker e link "Other platforms".
- Modify: `src/pages/index.astro` (usa la nuova Hero al posto della vecchia), `src/scripts/analytics.mjs` (proprietà `template`), `src/scripts/downloads.mjs` (comportamento per la piattaforma `unknown`)
- Test: `scripts/check-hero-picker.mjs` (nuovo, in `npm run check`), `scripts/check-analytics-events.mjs`, `scripts/check-download-routing.mjs`

**Interfaces:**
- Consumes: `AppWindow`, `ChatMessage` (Task 3); `initDownloadControls` / `data-homun-download` (Task 1).
- Produces:
  - `BOT_TEMPLATES: Array<{ id, name, emoji, tagline, scene: Array<{ from: "user"|"bot"|"system", text: string, status?: string }> }>`, con gli id della Global Constraints e `inbox-manager` per primo;
  - `DEFAULT_TEMPLATE_ID = "inbox-manager"`;
  - `sceneFrames(templateId: string, { reducedMotion: boolean }): Array<{ delayMs: number, upTo: number }>`. Con `reducedMotion` restituisce un solo frame `{ delayMs: 0, upTo: scene.length }`; senza, un frame per messaggio con ritmo da chat (400–1400 ms). Un id sconosciuto ricade su `DEFAULT_TEMPLATE_ID`.
  - `initHeroPicker(root = document, win = window): void`.

- [ ] **Step 1: Test che falliscono.**
  - In `scripts/check-hero-picker.mjs` verifica:
    - gli id e l'ordine di `BOT_TEMPLATES` corrispondono esattamente a quelli della Global Constraints;
    - ogni scena ha da 4 a 8 messaggi, contiene almeno un `user` e un `bot`, e ogni `text` è lungo al massimo 140 caratteri;
    - `sceneFrames("inbox-manager", { reducedMotion: true })` restituisce `[{ delayMs: 0, upTo: n }]`;
    - `sceneFrames("nope", …)` usa la scena di `inbox-manager`;
    - nell'HTML di `dist/index.html`: c'è un `h1` con "Your bot team." e "On your computer."; ci sono 6 `button[role="tab"]` con `aria-selected`, uno solo dei quali vale `"true"` (inbox-manager); i messaggi della scena di Inbox Manager sono **già presenti nell'HTML statico**, che è il fallback senza JS; ci sono il testo "Requires Docker Desktop" e il link "Other platforms".
  - In `check-download-routing.mjs`, per la piattaforma `unknown` (telefono o sistema sconosciuto):
    - l'etichetta del bottone è `"Get Homun for your computer"`;
    - il click **non** naviga, ma apre l'elenco `[data-download-options]` con tutte le piattaforme e un bottone `[data-share-link]`;
    - `[data-share-link]` usa `navigator.share({ url: "https://homun.app/" })` se esiste, altrimenti `navigator.clipboard.writeText`, e mostra "Link copied". Nessuna email, nessuna richiesta di rete.
  - In `check-analytics-events.mjs`: con `dataset.analyticsTemplate = "meeting-prep"` il `download_click` ha `data.template === "meeting-prep"`; con un valore fuori lista la proprietà `template` non c'è.
- [ ] **Step 2: Run** `npm run build && node scripts/check-hero-picker.mjs`. Expected: FAIL.
- [ ] **Step 3: Scrivi `src/data/bot-templates.mjs`.** Il copione di ogni scena deriva da `description.en` del template in Sandbot e mostra solo comportamenti reali: legge, prepara bozze da approvare, chiede conferma, usa la memoria. Il tono è da chat, breve e minuscolo.
- [ ] **Step 4: Implementa `Hero.astro`, `hero-picker.mjs` e `DownloadButton.astro`.**
  - La fila di chip è un `role="tablist"`, con navigazione da tastiera tramite frecce. Sotto 640 px scorre in orizzontale dentro il suo contenitore.
  - Al cambio di template la scena si ridisegna con `sceneFrames` e il bottone riceve `data-analytics-template=<id>`.
  - Sotto il bottone compare la riga *"Then pick {name} from the templates — it's ready in the app."*
  - Il bottone di download è un `<a data-homun-download data-analytics-download-source="hero" href=RELEASES_PAGE_URL>`.
  - Accanto c'è "Star on GitHub", che per ora è un link a `homun-core` senza numero: il numero arriva nel Task 8.
- [ ] **Step 5: Analytics.** In `analytics.mjs` aggiungi `TEMPLATE_ALLOWLIST`, con i 6 id, e la proprietà `template` nei `download_click` quando `dataset.analyticsTemplate` è nella lista.
- [ ] **Step 6: Run** `npm run check`. Expected: verde.
- [ ] **Step 7: Commit** `git add -A src/data/bot-templates.mjs src/scripts/hero-picker.mjs src/components/home src/pages/index.astro src/scripts/analytics.mjs scripts/check-hero-picker.mjs scripts/check-analytics-events.mjs package.json && git commit -m "feat: bot-team hero with template picker"`

### Task 5: Scene "Its own computer" ed "Engramma"

**Files:**
- Create: `src/components/home/ComputerScene.astro`, `src/components/home/MemoryScene.astro`
- Modify: `src/pages/index.astro`
- Test: `scripts/check-homepage.mjs`. È la riscrittura completa: il test vecchio controlla testi di Homun 2.

**Interfaces:**
- Consumes: `SceneSection`, `AppWindow`, `ChatMessage`, `ApprovalCard` (Task 3).
- Produces: le sezioni `#computer` e `#memory`. Il Task 8 le usa come ancore della nav.

- [ ] **Step 1: Test che falliscono.** Riscrivi `scripts/check-homepage.mjs` come contratto della nuova homepage, che i task successivi estendono. Per ora verifica:
  - c'è il titolo hero del Task 4;
  - c'è `section#computer` con una `[data-approval-card]`;
  - c'è `section#memory[data-variant="highlight"]` con la parola "Engramma";
  - nessuno dei vecchi slogan è presente: `"Your work. Your models. Your system."`, `"Independent AI workspace"`, `"An AI workspace for people who build"`, `"Official Homun workflow packs."`.
- [ ] **Step 2: Run** `npm run build && node scripts/check-homepage.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa** le due scene:
  - **Computer:** un bot con il pannello Computer attivo esegue un comando e incontra una carta di approvazione. Messaggio: lavora da solo, i limiti li decidi tu.
  - **Memory:** il bot impara "Acme only signs annual", compare la riga "Memory updated · shared with Account Manager" e un secondo bot usa quel fatto. Punti a fianco: resta sul tuo computer, la puoi leggere e cancellare, cerca anche nella storia delle chat. È powered by Engramma.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git commit -am "feat: computer and Engramma memory scenes"` (aggiungi prima i file nuovi con `git add`)

### Task 6: Scene "Apps", "Routines", "Models", "Private by design"

**Files:**
- Create: `src/components/home/AppsScene.astro`, `src/components/home/RoutinesScene.astro`, `src/components/home/ModelsScene.astro`, `src/components/home/PrivacyScene.astro`
- Modify: `src/pages/index.astro`
- Test: `scripts/check-homepage.mjs` (estensione)

**Interfaces:**
- Consumes: i primitivi del Task 3.
- Produces: le sezioni `#apps`, `#routines`, `#models` e `#privacy`.

- [ ] **Step 1: Test che falliscono.** Aggiungi a `check-homepage.mjs`:
  - esistono le quattro `section#…`;
  - `#apps` contiene "MCP" e "Composio";
  - `#models` contiene "Ollama", "LM Studio" e "OpenRouter";
  - `#privacy` contiene "Apache-2.0".

  Aggiungi anche una lista di **parole vietate** su tutto il testo visibile: `"iMessage"`, `"WhatsApp"`, `"Telegram"`, `"iOS"`, `"Android"`, `"hosted plan"`, `"while your computer is off"`, `"Grok Bot"`, `"Rakazo"`.
- [ ] **Step 2: Run** `npm run build && node scripts/check-homepage.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa** le quattro scene, seguendo la spec, sezione "Percorso della pagina", punti 3–6:
  - **Apps:** le letture sono libere, gli invii restano in bozza, le scritture passano da una carta di approvazione.
  - **Routines:** una routine programmata e una suggerita dal bot ("you do this every Monday at 9 — want me to take it?").
  - **Models:** un modello per bot.
  - **Privacy:** la cassaforte, dove il modello vede solo i nomi delle credenziali; l'app firmata; open source Apache-2.0.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A src/components/home src/pages/index.astro scripts/check-homepage.mjs && git commit -m "feat: apps, routines, models and privacy scenes"`

### Task 7: "Shipping every week", FAQ e chiusura

**Files:**
- Create: `src/lib/release-notes.mjs`, `src/components/home/ShippingScene.astro`, `src/components/home/Faq.astro`, `src/components/home/FinalCta.astro`
- Modify: `src/pages/index.astro`
- Test: `scripts/check-release-notes.mjs` (nuovo, in `npm run check`), `scripts/check-homepage.mjs`

**Interfaces:**
- Consumes: `compareVersions`, `parseVersion`, `MIN_PUBLIC_VERSION` (Task 1); `src/data/releases.json` (schema 2: `items[].version`, `highlights[]`, `improvements[]`, `fixes[]`, `githubUrl`, `publishedAt`).
- Produces: `recentReleaseNotes(items, { min = MIN_PUBLIC_VERSION, limit = 4 }): Array<{ version, publishedAt, githubUrl, line: string }>`. Prende una riga per release (il primo highlight, altrimenti il primo improvement, altrimenti il primo fix), toglie il markdown `**…**`, ordina dalla versione più recente e salta le release senza note.

- [ ] **Step 1: Test che falliscono.** `check-release-notes.mjs`:

```js
const items = [
  { version: "v0.2.1004", highlights: ["old"], improvements: [], fixes: [], githubUrl: "u1", publishedAt: "2026-07-01T00:00:00Z" },
  { version: "v0.3.1000", highlights: ["**A renewal.** Homun is back"], improvements: [], fixes: [], githubUrl: "u2", publishedAt: "2026-11-02T00:00:00Z" },
  { version: "v0.3.1001", highlights: [], improvements: [], fixes: ["**Emails go out.** Really"], githubUrl: "u3", publishedAt: "2026-11-03T00:00:00Z" },
  { version: "v0.3.1002", highlights: [], improvements: [], fixes: [], githubUrl: "u4", publishedAt: "2026-11-05T00:00:00Z" },
];
assert.deepEqual(recentReleaseNotes(items).map((r) => r.version), ["v0.3.1001", "v0.3.1000"]);
assert.equal(recentReleaseNotes(items)[1].line, "A renewal. Homun is back");
assert.deepEqual(recentReleaseNotes(items.slice(0, 1)), []);
```

  In `check-homepage.mjs`:
  - se `recentReleaseNotes` dei dati reali è vuoto, `section#shipping` **non** esiste; altrimenti esiste;
  - esistono `section#faq` con 4–6 `<details>` e `section#download` con "Meet your first bot" e un `[data-homun-download]`.
- [ ] **Step 2: Run** `node scripts/check-release-notes.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa.**
  - **ShippingScene:** mostra le voci con la data e il link alla release, più un link a `/changelog`.
  - **FAQ:** è gratis? (sì, open source); quali modelli?; dove stanno i miei dati?; serve Docker? (sì, Docker Desktop, il motivo, e la nota che una macchina virtuale inclusa è prevista); su quali sistemi gira?
  - **FinalCta:** "Meet your first bot", `DownloadButton` (Task 4) con `data-analytics-download-source="download_section"`.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A src/lib/release-notes.mjs src/components/home src/pages/index.astro scripts/check-release-notes.mjs scripts/check-homepage.mjs package.json && git commit -m "feat: shipping feed, FAQ and final CTA"`

### Task 8: Nav, footer, metadati, stelle GitHub e pulizia

**Files:**
- Create: `src/lib/github-stars.mjs`, `src/components/ui/StarButton.astro`
- Modify: `src/components/Nav.astro`, `src/components/Footer.astro`, `src/layouts/Base.astro` (title e description di default), `src/components/home/Hero.astro` (`StarButton`)
- Delete (se non più importati altrove; verifica con `grep -r`): `src/components/{Hero,ModelFreedom,Memory,WorkProof,ConnectedAction,Security,Ecosystem,Apprentice,Pillars,Features,FeatureGrid,FeatureRow,Download}.astro`, `src/components/illustrations/`
- Test: `scripts/check-homepage-illustrations.mjs` (va rimosso da `package.json` e cancellato se verifica solo le illustrazioni vecchie; altrimenti riscritto), `scripts/check-homepage.mjs`, `scripts/check-github-stars.mjs` (nuovo)

**Interfaces:**
- Produces:
  - `fetchStarCount(fetchImpl = fetch, { repo = "homun-app/homun-core", timeoutMs = 5000 }): Promise<number | null>`. Restituisce `null` in caso di errore, timeout o risposta non valida, e non lancia mai eccezioni.
  - `formatStars(n: number): string` (`999` → `"999"`, `7600` → `"7.6k"`, `12000` → `"12k"`).
  - `<StarButton count?: number | null>`. Senza numero mostra solo "Star on GitHub".

- [ ] **Step 1: Test che falliscono.**
  - `check-github-stars.mjs`: con un fetch finto che risponde `{ stargazers_count: 7600 }` il risultato è `7600`; con un fetch che lancia, con `{ ok: false }` o con un payload senza il campo il risultato è `null`; i casi di `formatStars` sopra.
  - `check-homepage.mjs`:
    - la nav contiene i link `#computer`, `#memory`, `/docs`, `/changelog`, `/roadmap` e **non** contiene `/marketplace`;
    - il footer contiene "Apache-2.0" e il link a `https://github.com/homun-app/homun-core`, e non contiene "Sign in", "source-available" né "Your work · your models · your system";
    - il `<title>` della homepage contiene "bot team".
- [ ] **Step 2: Run** `npm run build && node scripts/check-homepage.mjs && node scripts/check-github-stars.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa.**
  - `fetchStarCount` viene chiamato **nel frontmatter** di `Hero.astro` e di `Footer.astro`, quindi a build time e mai nel browser; è un unico modulo con cache in memoria per build.
  - **Nav:** Product (`/#computer`), Memory (`/#memory`), Docs, Changelog, Roadmap, più `DownloadButton` compatto. Togli "Sign in · Soon".
  - **Footer:** descrizione nuova, badge "Open source · Apache-2.0" e `StarButton`.
  - Cancella i componenti vecchi e gli script di test orfani, aggiornando `package.json`.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: new nav, footer and GitHub stars; remove Homun 2 homepage"`

### Task 9: Licenza Apache-2.0

**Files:**
- Modify: `src/data/homun-core-license.md` (diventa il testo ufficiale di Apache-2.0), `src/content/docs/license.mdx`, `src/content/docs/it/license.mdx`
- Delete se orfani: `src/components/docs/LicenseReleaseTable.astro`, `src/lib/license-dates.mjs`
- Test: `scripts/check-license-build.mjs`

- [ ] **Step 1: Testo ufficiale.**
  - `curl -fsSL https://www.apache.org/licenses/LICENSE-2.0.txt -o src/data/homun-core-license.md`
  - `shasum -a 256 src/data/homun-core-license.md`

  Annota l'hash nel report. Claude lo confronta con il file di riferimento.
- [ ] **Step 2: Test che falliscono.** Riscrivi `check-license-build.mjs`:
  - l'hash atteso è quello dello Step 1;
  - le pagine EN e IT contengono "Apache License", "Version 2.0" e "homun-core";
  - la pagina IT contiene "Il testo inglese della licenza è vincolante";
  - la nota storica è presente in entrambe le lingue (EN *"Versions before 0.3 were published under FSL-1.1-ALv2"*, IT *"Le versioni precedenti alla 0.3 sono state pubblicate con licenza FSL-1.1-ALv2"*) con il link al testo d'archivio `https://github.com/homun-app/website/blob/site-v2-workspace/src/data/homun-core-license.md` (il repository del sito è pubblico; il link funziona dopo il push del tag, che fa Fabio);
  - nessuna pagina di `dist/` contiene "source-available";
  - la homepage linka `/license/`.

  Togli le asserzioni su FSL e sulle date di conversione.
- [ ] **Step 3: Run** `npm run build && node scripts/check-license-build.mjs`. Expected: FAIL.
- [ ] **Step 4: Implementa** le due pagine: un riassunto breve e chiaro di Apache-2.0, la nota storica e `<LicenseText>` (componente esistente) con il testo vincolante.
- [ ] **Step 5: Run** `npm run check`. Expected: verde.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: Homun is open source under Apache-2.0"`

### Task 10: Banner sulle pagine non ancora rifatte

**Files:**
- Create: `src/components/docs/Banner.astro` (override di Starlight), `src/components/UpdateNotice.astro`
- Modify: `astro.config.mjs` (`components.Banner`), `src/pages/roadmap/index.astro`, `src/pages/roadmap/[slug].astro`, `src/pages/changelog.astro`
- Test: `scripts/check-transition-notices.mjs` (nuovo, in `npm run check`)

**Interfaces:**
- Produces: `<UpdateNotice locale?: "en" | "it">`, con i testi EN *"Being updated for the new Homun — some pages describe the previous version."* e IT *"In aggiornamento per il nuovo Homun: alcune pagine descrivono la versione precedente."*

- [ ] **Step 1: Test che falliscono.** Verifica che:
  - `dist/docs/index.html` e `dist/roadmap/index.html` contengono il testo EN;
  - `dist/it/docs/index.html` contiene il testo IT;
  - in `dist/changelog/index.html` ogni release con versione < 0.3 ha l'etichetta "Homun 2";
  - `dist/index.html` **non** contiene il banner;
  - `dist/marketplace/index.html` esiste ancora.
- [ ] **Step 2: Run** `npm run build && node scripts/check-transition-notices.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa.** Il `Banner` di Starlight mostra `UpdateNotice` su tutte le pagine docs e sceglie la lingua da `Astro.currentLocale`. Le pagine roadmap lo mostrano in cima. Il changelog aggiunge il badge "Homun 2" usando `compareVersions` (Task 1).
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: transition notices on pages not yet rewritten"`

### Task 11 (Claude): verifica finale del branch

- [ ] `npm run check` verde sul branch completo.
- [ ] Nel browser, a 360, 768 e 1440 px, in chiaro e in scuro:
  - tutte le sezioni sono leggibili;
  - nessuno scroll orizzontale;
  - picker usabile da tastiera;
  - con la riduzione del movimento attiva nessuna animazione;
  - con JS disattivato la pagina è completa.
- [ ] Download simulato con user agent macOS, Windows e Linux. Finché la 0.3 non è pubblicata il bottone deve portare a `/releases`, non a una build di Homun 2.
- [ ] Revisione dell'intero diff con un revisore indipendente prima del merge. Merge e push solo su richiesta di Fabio.
