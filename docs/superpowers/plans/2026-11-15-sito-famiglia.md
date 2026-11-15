# Sito Homun a scene, marchio e famiglia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** costruire la homepage del mockup `docs/design/homepage-mockup.html`, la pagina
`/engramma`, la documentazione divisa per prodotto e la nav della famiglia, sul marchio già fatto
nel Task 1.

**Architecture:**
- Astro 6 + Tailwind 4 + Starlight 0.40, branch `site-v3-bot-team`.
- La homepage è una sequenza di sezioni in `src/components/home/`, costruite con un **kit dell'app
  ricostruita** in `src/components/app/` e con le classi di scorrimento di `src/styles/scroll.css`.
- Le mascotte dei bot sono disegnate al build da `src/data/bot-families.mjs`; il movimento è CSS,
  più `src/scripts/mascot.mjs` per lo sguardo.
- Nessuna libreria di animazione, nessun font da Google.

**Tech Stack:** Astro 6, Tailwind CSS v4, Starlight 0.40 + `starlight-sidebar-topics`, `@fontsource`, JavaScript vanilla, test `node:assert` in `scripts/check-*.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-15-sito-famiglia-design.md` (vince sul resto), con il
riferimento visivo `docs/design/homepage-mockup.html`. Per i vincoli generali vale anche
`docs/superpowers/specs/2026-11-09-homepage-bot-team-design.md`.

## Come si esegue (l'agente implementa, Claude rivede)

Un solo agente alla volta su questo repo, un task per prompt. Il prompt da incollare è questo; cambia
solo il numero del task:

```
Lavori nel repo /Users/fabio/Projects/Homun/website, branch site-v3-bot-team.
Leggi per intero:
- docs/superpowers/specs/2026-11-15-sito-famiglia-design.md
- docs/superpowers/plans/2026-11-15-sito-famiglia.md: sezioni "Global Constraints", "Review Focus" e "Task N".
- docs/design/homepage-mockup.html (aprilo anche nel browser): è il riferimento visivo vincolante.
Se il Task N rimanda al piano 2026-11-09-homepage-bot-team.md, leggi anche quel task.
Implementa SOLO il Task N, step per step, nell'ordine.
Tocca solo i file elencati nel task. Se ti serve toccarne altri, fermati e chiedi.
Dopo ogni step "Run", incolla l'output reale del comando. Non dichiarare un test verde senza averlo eseguito.
Fai il commit indicato nell'ultimo step. Non fare push, merge o tag.
Alla fine riporta: file toccati, output dei comandi, dubbi e scelte che hai fatto tu.
```

Dopo ogni task Claude:
- legge il diff ed esegue `npm run check`;
- confronta la pagina con il mockup a 375, 768 e 1440 px, in chiaro e in scuro, e con la riduzione
  del movimento attiva;
- se trova problemi, manda un prompt di correzione.

## Global Constraints

- **Il mockup è vincolante** per layout, ordine delle sezioni, colori, caratteri, animazioni e
  scenari. I testi si possono rifinire, non cambiare di senso.
- **Lingua:** homepage e `/engramma` in inglese; le docs in EN e IT. Titolo della homepage:
  «Your bot team. On your computer.».
- **Caratteri:**
  - titoli in **M PLUS Rounded 1c 800**, spaziatura `-0.03em`;
  - testo e interfaccia dell'app in **Figtree**;
  - etichette in **Geist Mono**;
  - tutti da `@fontsource` (oppure `@fontsource-variable`), **mai Google Fonts**.
- **Colori del sito:** sono i token del `:root` del mockup, con il tema scuro.
  - Marchio: teal `#157A6E`, inchiostro `#101917`, crema `#F4F1EE`.
  - Engramma: `#3A5BD9`, nel tema scuro `#5574E8`.
- **Interfaccia dell'app:** token `--a-*` del mockup, presi dal `styles.css` del renderer di
  sandbot.
- **Mascotte dei bot:** famiglie `creature`, `robo`, `device` e `jelly`, con i tracciati di
  `~/Projects/Bot/sandbot/src/renderer/src/bot/Bot.tsx`.
  - Colori dei bot: `#F26A2E`, `#3F7BEA`, `#E7B93A`, `#E9418A`, `#2FA39A`, `#8A5CF0`.
  - Stati: `idle`, `thinking`, `speaking`, `waiting`, `happy`.
- **Testi dei bottoni dell'app**, uguali all'app inglese:
  - Send, Edit;
  - Allow, For this turn, Always allow, Deny;
  - Activate;
  - «draft — sent only if you confirm»;
  - Activity, Library, Memory, Computer, On, Off;
  - Routines, Recent work, Take over.
- **Movimento:**
  - ogni `animation-timeline` sta dentro `@supports (animation-timeline: view())`;
  - fuori da lì, e con `prefers-reduced-motion: reduce`, la pagina è ferma e completa (nessun
    elemento a `opacity: 0`);
  - nessuna libreria di animazione;
  - un solo `pointermove` per pagina;
  - SVG in pausa quando la scheda è nascosta.
- **Scenari veri:** ogni funzione mostrata compare nella tabella «Struttura della homepage» della
  spec.
  - Nessuna funzione di canali di messaggistica (iMessage, WhatsApp, Telegram, Slack come canale),
    app mobile o piano hosted.
  - Valgono le parole vietate del Task 6 del 9/11.
- **Engramma:** «Inside Homun today · coming to other AI apps», «Soon» nella nav. Nessun download né
  link GitHub di Engramma.
- **Download:** solo release dalla 0.3.0 in su.
  - Windows e Linux con l'etichetta «beta».
  - Requisiti scritti solo come li dice `~/Projects/Bot/sandbot/CHANGELOG.md`.
- **Privacy:** nessuna richiesta a terzi oltre a Umami e `api.github.com`, niente cookie, niente
  email.
- **Layout e test:** da 360 px senza scroll orizzontale, contrasto AA. `npm run check` verde alla
  fine di ogni task.

## Review Focus

1. **Browser senza `animation-timeline`** (Firefox, Safari vecchi): ogni sezione è visibile e
   completa. → test CSS nel Task 2.
2. **Telefono a 360 px**: la finestra scalata dello showcase non allarga la pagina (`overflow: clip`
   sul contenitore); i primi piani sono leggibili. → controllo `scrollWidth` nel Task 4 e di Claude.
3. **Font**: nessun `fonts.googleapis.com` o `fonts.gstatic.com` in `dist/`. → test nel Task 2.
4. **Tema scuro**: l'interfaccia ricostruita resta leggibile e la fascia di Engramma resta scura in
   tutti e due i temi. → controllo di Claude.
5. **Link delle docs esistenti** (`/docs/guides/...`, `/it/docs/...`): continuano a funzionare. →
   test nel Task 9.

---

### Task 1: Marchio nel codice — FATTO (da committare)

Implementato e verificato da Claude il 2026-11-15. Se il commit non c'è ancora, il primo passo del
Task 2 è committarlo.

Cosa usano i task seguenti:
- **`src/data/brand.mjs`:** `COLORS`, `JELLY`, `HOMUN_LETTERS`, `HEAD_TRANSFORM`, `PRODUCTS`.
- **`<HomunMark animated? class?>`** e
  **`<ProductSymbol product="homun"|"engramma" size? animated? wake?>`** in `src/components/brand/`.
- **`src/scripts/mascot.mjs`:**
  - `eyeOffset`, `shouldAnimate`;
  - `initMascots(root, onPagePointerMove?)`, che anima gli `svg[data-mascot][data-mascot-animated]`;
  - contratto di markup: `data-mascot-body`, `data-mascot-eyes data-max`, `data-eyes-open`,
    `data-eyes-closed`, `data-mascot-morph`;
  - classi: `is-squish`, `is-hop`, `is-awake`, `is-waking`.

### Task 2: Fondamenta (font, token, scorrimento)

**Files:**
- Modify:
  - `package.json` (dipendenze `@fontsource/m-plus-rounded-1c`, `@fontsource-variable/figtree`, `@fontsource/geist-mono`; via `@fontsource-variable/inter` se non usato altrove)
  - `src/layouts/Base.astro`
  - `src/styles/global.css` (token del sito e dell'app, chiaro e scuro, presi dal mockup)
- Create: `src/styles/scroll.css`, `scripts/check-foundation.mjs` (in `check`)

**Interfaces:**
- Produces:
  - Variabili CSS:
    - sito: `--bg`, `--surface`, `--line`, `--fg`, `--muted`, `--teal`, `--teal-text`, `--blue`,
      `--band`, `--band-fg`, `--band-muted`, `--band-card`;
    - app: `--a-bg`, `--a-side`, `--a-card`, `--a-muted`, `--a-mfg`, `--a-fg`, `--a-line`,
      `--a-bubble`, `--a-user`, `--ink`, `--screen`, `--blush`, `--ok`;
    - caratteri: `--display`, `--body`, `--mono`.
  - Classi di `scroll.css`, con gli stessi nomi e lo stesso effetto del mockup:
    - `.reveal-window`: l'entrata inclinata dello showcase, su `--show`;
    - `.section-text` e `.section-visual`: su `--f`;
    - `.play` con `--i`: comparsa in sequenza; usa `--tl` se definita, altrimenti `--f`;
    - `.press`: il bottone che si preme;
    - `.cursor-move`;
    - `.rise-self`: su `view()`.
  - Timeline: una sezione dichiara `view-timeline-name: --f` (o `--show` per lo showcase) con
    l'utility `.timeline-f` o `.timeline-show`.

- [ ] **Step 1: Test che falliscono.** `check-foundation.mjs`:
  - **CSS di `scroll.css`:**
    - ogni `animation-timeline` sta dentro `@supports (animation-timeline: view())` (contando la
      nidificazione delle graffe);
    - fuori da `@supports`, nessuna regola delle classi esportate imposta `opacity: 0`;
    - esiste un blocco `prefers-reduced-motion: reduce` con `animation: none`.
  - **Build:** nessun file in `dist/` contiene `fonts.googleapis.com` o `fonts.gstatic.com`.
  - **Font in `dist/`:** almeno un `.woff2` il cui nome contiene `m-plus-rounded-1c`, e uno che
    contiene `figtree`.
- [ ] **Step 2: Run** `npm run build && node scripts/check-foundation.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa.**
  - Porta i token e i caratteri del mockup in `global.css` e `Base.astro`, con i titoli
    `h1`/`h2`/`h3` in `--display` 800.
  - Copia le regole di movimento del mockup in `scroll.css`, rinominate come sopra.
  - Le pagine esistenti devono ancora compilare: il loro aspetto può cambiare, verranno rifatte.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: self-hosted rounded type, site and app tokens, scroll-driven motion"`

### Task 3: Kit dell'app ricostruita

**Files:**
- Create:
  - `src/data/bot-families.mjs`
  - `src/components/app/BotAvatar.astro`
  - `src/components/app/AppWindow.astro`
  - `src/components/app/Surface.astro`
  - `src/components/app/Msg.astro`
  - `src/components/app/Done.astro`
  - `src/components/app/Card.astro`
  - `src/components/app/Pill.astro`
  - `src/components/app/AppTile.astro`
  - `src/components/app/ComputerScreen.astro`
- Modify:
  - `src/pages/dev/primitives.astro` (diventa la tavola del kit nuovo)
  - `scripts/check-primitives.mjs`
- Delete: `src/components/ui/` (`AppWindow`, `ApprovalCard`, `ChatMessage`, `SceneSection`), dopo aver verificato con `grep -r` chi li usa. I consumatori sono le sezioni che il Task 4 rifà: in questo task la homepage può restare temporaneamente con le sole sezioni che compilano.

**Interfaces:**
- Produces:
  - `bot-families.mjs`:
    - esporta `FAMILIES = { creature, robo, device, jelly }`;
    - esporta `botSvg({ family, color, state, mini? }): string`, che produce l'SVG come nel
      mockup (orecchie, schermo, antenna, guance, occhi per stato, bocca, puntini «thinking»);
    - il morph è un `<animate>` solo se `!mini`.
  - `<BotAvatar family color state="idle" size={34} label?>`: un wrapper con l'onda per
    `listening` e il pallino per `waiting`; `role="img"` solo se c'è `label`.
  - `<AppWindow>`: la finestra intera a 1200×740, con gli slot `sidebar`, `chat` e `panel`.
    - Il wrapper `.scaler` scala la finestra con `--k`, calcolato da un piccolo script
      `ResizeObserver`.
    - Senza JavaScript vale `--k` di riserva, ricavato dal CSS.
    - `overflow: clip` con `overflow-clip-margin: 16px`.
  - `<Surface title? bot?>`: la cornice del primo piano, con la barra «avatar · nome · stato».
  - `<Msg from="me"|"bot"|"member" who? botFamily? botColor? i?>`, `<Done time? i?>`.
  - `<Card kind="draft"|"approval"|"routine"|"skill" i?>`, con gli slot per titolo, sotto, corpo e
    bottoni.
  - `<Pill primary?>`, `<AppTile name logo color status ok? i?>`.
  - `<ComputerScreen url bot state="On"|"Off">`, con lo slot del contenuto del browser,
    `Take over` e `.cursor-move`.
  - Tutti accettano `i` e, se presente, aggiungono `.play` con `--i`.

- [ ] **Step 1: Test che falliscono.**
  - Su `bot-families.mjs`:
    - `botSvg({family:"creature",color:"#F26A2E",state:"waiting"})` contiene il tracciato
      dell'orecchio `M32 34 C26 20 28 10 34 8`;
    - con `state:"happy"` non contiene `class="blink"`;
    - con `mini:true` non contiene `<animate`;
    - lancia un errore per una famiglia sconosciuta.
  - Su `dist/dev/primitives/index.html`: contiene un esempio per ogni componente, con gli attributi
    `data-app-window`, `data-surface`, `data-card="draft"`, `data-card="approval"`,
    `data-card="routine"`, `data-card="skill"`, `data-app-tile` e `data-computer-screen`.
- [ ] **Step 2: Run** `npm run build && node scripts/check-primitives.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa** il kit copiando struttura e stile dal mockup. Le classi CSS stanno nel componente (`<style>` di Astro) oppure in `src/styles/app-kit.css`.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: rebuilt Homun app kit with real bot families"`

### Task 4: Hero e showcase

**Files:**
- Create: `src/components/home/Hero.astro` (riscritto), `src/components/home/Showcase.astro`, `src/components/home/FeatureSection.astro`
- Modify: `src/pages/index.astro`, `src/components/Nav.astro` (comparsa del marchio legata allo scorrimento), `scripts/check-homepage.mjs`
- Delete: `src/components/home/{ComputerScene,MemoryScene}.astro`, `src/scripts/hero-picker.mjs`, `scripts/check-hero-picker.mjs` (e la voce in `package.json`), `src/data/bot-templates.mjs` se non più importato

**Interfaces:**
- Consumes: il kit del Task 3, `ProductSymbol` e `HomunMark` del Task 1, `scroll.css` del Task 2,
  `DownloadButton`.
- Produces: `<FeatureSection id eyebrow title lead layout="split"|"flip"|"center" tone="default"|"band">`,
  con uno slot `visual`. Applica `.timeline-f`, `.section-text` e `.section-visual`.

- [ ] **Step 1: Test che falliscono.** In `check-homepage.mjs`:
  - `section#hero` contiene un `svg[data-mascot]` con `is-waking`, l'`h1` con le due frasi e un
    `[data-homun-download]`;
  - la riga delle piattaforme contiene «beta» due volte;
  - `section#showcase` contiene `data-app-window`, con dentro almeno 4 righe di bot, una riga team e
    una card `data-card="draft"`;
  - non esistono più `data-hero-templates` né `section#meet`.
- [ ] **Step 2: Run** `npm run build && node scripts/check-homepage.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa** le sezioni 0 e 1 del mockup.
- [ ] **Step 4: Run** `npm run check`. Poi a 360 px: `document.documentElement.scrollWidth === innerWidth`. Expected: verde, nessuno scroll orizzontale.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: mascot hero and full app showcase"`

### Task 5: Sezioni Drafts, Apps, Skills, Computer, Approvals

**Files:**
- Create: `src/components/home/{DraftsSection,AppsSection,SkillsSection,ComputerSection,ApprovalsSection}.astro`
- Modify: `src/pages/index.astro`, `scripts/check-homepage.mjs`

- [ ] **Step 1: Test che falliscono.** Verifica, nell'ordine:
  - le sezioni `#drafts`, `#apps`, `#skills`, `#computer` e `#approvals` dopo `#showcase`;
  - `#drafts` ha due `data-card="draft"` e il testo «draft — sent only if you confirm»;
  - `#apps` ha almeno 8 `data-app-tile`, contiene «Composio» e «MCP», e una tessera con
    «work · personal»;
  - `#skills` ha un `data-card="skill"` con «Save skill»;
  - `#computer` ha `data-computer-screen` con «Take over»;
  - `#approvals` contiene, in quest'ordine, «Allow», «For this turn», «Always allow» e «Deny».
- [ ] **Step 2: Run** `npm run build && node scripts/check-homepage.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa** le sezioni 2–6 del mockup con `FeatureSection` e il kit.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: drafts, apps, skills, computer and approvals sections"`

### Task 6: Sezioni Teams, Routines, Any model, Memory

**Files:**
- Create: `src/components/home/{TeamsSection,RoutinesSection,ModelsSection,MemorySection}.astro`
- Modify: `src/pages/index.astro`, `scripts/check-homepage.mjs`

- [ ] **Step 1: Verifica** nel repo dell'app se la release scaricabile sceglie il modello locale in base all'hardware: cerca `homun-local` e `local-catalog` in `~/Projects/Bot/sandbot/src/main/agent/`, e il CHANGELOG. Riporta nel report cosa hai trovato. Se non è così, la riga diventa «Homun local · built into Homun».
- [ ] **Step 2: Test che falliscono.**
  - `#teams` ha 4 membri (3 bot e «You») e 3 messaggi di membri;
  - `#routines` ha un `data-card="routine"` con «Activate»;
  - `#models`:
    - contiene «Ollama», «LM Studio», «Anthropic», «OpenRouter» e «OpenAI-compatible»;
    - almeno 3 righe con l'etichetta «local»;
    - 3 bot, ciascuno con il suo modello;
  - `#memory` ha `data-tone="band"`, il simbolo di Engramma, `href="/engramma"` e una nota con
    «waiting for your OK».
- [ ] **Step 3: Run** `npm run build && node scripts/check-homepage.mjs`. Expected: FAIL.
- [ ] **Step 4: Implementa** le sezioni 7–10 del mockup.
- [ ] **Step 5: Run** `npm run check`. Expected: verde.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: teams, routines, any-model and memory sections"`

### Task 7: Casi d'uso, novità, roadmap, chiusura e download «beta»

**Files:**
- Create:
  - `src/data/news.mjs`
  - `src/data/home-roadmap.mjs`
  - `src/components/home/{UseCasesSection,NewsSection,ClosingSection}.astro`
  - `scripts/check-news.mjs` (in `check`)
- Modify:
  - `src/scripts/downloads.mjs`
  - `src/components/home/DownloadButton.astro`
  - `src/pages/index.astro`
  - `scripts/check-homepage.mjs`
  - `scripts/check-download-routing.mjs`

**Interfaces:**
- Produces:
  - **`news.mjs`:** `NEWS: Array<{ version: string, date: string, title: string, body: string }>`.
    - Quattro voci, i testi del mockup.
    - Le versioni sono esattamente `v0.3.1001-beta.5`, `v0.3.1001-beta.4`, `v0.3.1001-beta.3` e
      `v0.3.1001-beta.1`.
  - **`home-roadmap.mjs`:** `ROADMAP: { now: Item[], next: Item[], later: Item[] }`, dove
    `Item = { title, body }`, con i testi del mockup.
  - **In `downloads.mjs`:**
    - `platformBadge(platform): "beta" | null`;
    - `platformRequirement(platform): string | null`, da CHANGELOG.

- [ ] **Step 1: Test che falliscono.**
  - **`check-news.mjs`:**
    - ogni `NEWS[i].version` esiste in `src/data/releases.json` (`items[].version`, confronto
      tollerante sulla «v») ed è almeno 0.3;
    - le date sono in ordine decrescente;
    - `ROADMAP` ha 1–3 voci per colonna.
  - **`check-download-routing.mjs`:**
    - `platformBadge` restituisce `"beta"` per Windows e Linux e `null` per macOS e `unknown`;
    - `platformRequirement("unknown") === null`.
  - **`check-homepage.mjs`:**
    - `#uses` ha 6 `article`;
    - ogni scheda che dice «Template: X» nomina un template che esiste in
      `~/Projects/Bot/sandbot/src/main/templates/` (lista copiata nel test);
    - `#news` ha 4 release e 3 colonne Now, Next, Later;
    - `#download` ha un `svg[data-mascot]` e un `[data-homun-download]`.

  Se `releases.json` non contiene ancora le beta, fermati e chiedi: `sync:product-data` va eseguito
  da Fabio.
- [ ] **Step 2: Run** `npm run build && node scripts/check-news.mjs && node scripts/check-download-routing.mjs && node scripts/check-homepage.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa** le sezioni 11–13 del mockup e le etichette «beta» nel `DownloadButton` e nell'elenco delle piattaforme.
  - La mascotte della chiusura salta quando entra nello schermo: `IntersectionObserver` e `is-hop`,
    mai con la riduzione del movimento.
  - Riporta nel report la riga del CHANGELOG usata per i requisiti.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: use cases, news, roadmap, closing and beta badges"`

### Task 8: Pagina `/engramma`

Come il Task 6 della prima versione di questo piano, ma con la grammatica nuova:
- `FeatureSection` e il kit dell'app;
- primi piani di note con fonte, data e quarantena;
- la gelatina blu che dorme nell'hero.

**Files:**
- Create:
  - `src/pages/engramma.astro`
  - `src/components/engramma/*.astro`
  - `src/components/brand/EngrammaMark.astro`
  - `scripts/check-engramma.mjs` (in `check`)
- Modify: `src/data/brand.mjs` (`ENGRAMMA_LETTERS` da `src/assets/brand/engramma-wordmark-light.svg`)

- [ ] **Step 1: Test che falliscono.** `check-engramma.mjs` su `dist/engramma/index.html`:
  - contiene «Inside Homun today» e «coming to other AI apps»;
  - le sezioni `#hero`, `#remembers`, `#time`, `#sources`, `#quarantine`, `#local` e
    `#developers` stanno in quest'ordine;
  - c'è un `[data-homun-download]`;
  - nessun `href` corrisponde a `/github\.com[^"]*engramma/i` o a `\.mcpb`, né a un installer con
    «engramma» nel nome;
  - `ENGRAMMA_LETTERS[0]` compare nel file SVG della scritta.
- [ ] **Step 2: Run** `npm run build && node scripts/check-engramma.mjs`. Expected: FAIL.
- [ ] **Step 3: Implementa.** Ogni frase deve corrispondere a una funzione presente in `~/Projects/Bot/engramma/README.md`: nel report, cita la riga per ogni sezione. Il tono è per chi non programma; la parte tecnica va solo in `#developers`.
- [ ] **Step 4: Run** `npm run check`. Expected: verde.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: Engramma page"`

### Task 9: Docs divise per prodotto, più banner di transizione

È il Task 7 della prima versione di questo piano, senza cambi, e unisce il Task 10 del 9/11.

**Files:** `package.json` (`starlight-sidebar-topics`), `astro.config.mjs`, `src/content/docs/engramma/{index,how-it-works,privacy,whats-next}.md` e le stesse in `src/content/docs/it/engramma/`, `src/components/docs/Banner.astro`, `src/components/UpdateNotice.astro`, `scripts/check-docs-topics.mjs`, `scripts/check-transition-notices.mjs`.

- [ ] **Step 1:** con `npm view starlight-sidebar-topics peerDependencies versions --json`, scegli la versione più recente compatibile con `@astrojs/starlight@0.40.0`. Se non ce n'è una, **fermati e chiedi**.
- [ ] **Step 2: Test che falliscono.**
  - Ogni slug della sidebar di oggi (lista nel test) esiste in EN e in IT.
  - Esistono `dist/docs/engramma/index.html` e la sua versione IT.
  - `dist/docs/index.html` contiene un link a `/docs/engramma/`.
  - Il banner c'è sulle docs di Homun e non su quelle di Engramma (`check-transition-notices` come
    nel Task 10 del 9/11, più quest'ultima condizione).
- [ ] **Step 3: Run** `npm run build && node scripts/check-docs-topics.mjs && node scripts/check-transition-notices.mjs`. Expected: FAIL.
- [ ] **Step 4: Implementa.**
  - Gli argomenti mettono ogni pagina di Homun sotto il suo argomento, senza spostare file.
  - Le pagine di Engramma sono brevi e per chi non programma.
  - Il tema di Starlight usa i caratteri e i colori del Task 2.
- [ ] **Step 5: Run** `npm run check`. Expected: verde.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: docs split by product, Engramma docs, transition banner"`

### Task 10: Nav, footer, stelle GitHub e pulizia

È il Task 8 del 9/11, con queste differenze:
- **Nav, come nel mockup:** `HomunMark`, poi Homun, Engramma con l'etichetta «Soon» e Docs, più
  Download. Su schermi stretti restano solo il marchio e Download.
- **Footer, come nel mockup:**
  - «Open source · Apache-2.0», Changelog, Roadmap;
  - la famiglia con i due simboli;
  - `StarButton`.
- **Test della nav:**
  - contiene `/engramma` e «Soon»;
  - non contiene `/marketplace`, `#computer` né `#memory`.
- **Pulizia:** si cancellano i componenti vecchi non più importati (`src/components/*.astro` di
  Homun 2, `illustrations/`), verificando con `grep -r`.

- [ ] **Step 1–4:** come nel Task 8 del 9/11, con i test cambiati come sopra.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: family nav, footer and GitHub stars; remove Homun 2 components"`

### Task 11: Licenza Apache-2.0

Esegui il **Task 9** del 9/11 senza modifiche.

### Task 12 (Claude): verifica finale del branch

- [ ] `npm run check` verde.
- [ ] La homepage confrontata con il mockup, sezione per sezione, a 375, 768 e 1440 px, in chiaro e in scuro.
- [ ] Riduzione del movimento attiva, JavaScript spento, Firefox (senza `animation-timeline`).
- [ ] Lighthouse mobile: LCP sotto 2,5 s, CLS sotto 0,1.
- [ ] Download simulato per macOS, Windows e Linux.
- [ ] Fabio approva i testi di `home-roadmap.mjs`.
- [ ] Revisione indipendente del diff completo. Merge e push solo su richiesta di Fabio.
