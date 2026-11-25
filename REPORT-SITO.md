# Report sito Homun

## Task 7 · Casi d’uso, novità, roadmap, chiusura e download beta

Commit già presente, `964ef94`. Contiene anche la revisione di piano e spec sulle release pubblicate. Il ciclo test prima del codice non è stato ripetuto sulla cronologia esistente.

File del commit:
- docs/superpowers/plans/2026-11-15-sito-famiglia.md
- docs/superpowers/specs/2026-11-15-sito-famiglia-design.md
- scripts/check-download-routing.mjs
- scripts/check-homepage.mjs
- scripts/check-news.mjs
- src/components/home/ClosingSection.astro
- src/components/home/DownloadButton.astro
- src/components/home/NewsSection.astro
- src/components/home/UseCasesSection.astro
- src/data/home-roadmap.mjs
- src/data/news.mjs
- src/pages/index.astro
- src/scripts/downloads.mjs

`npm run check` su `964ef94`, exit 0:

```text

> homun-website@0.1.0 test:container-runtime-signals
> node scripts/check-container-runtime-signals.mjs

Container runtime signal cleanup contract passed
```

Il controllo news è passato anche da solo. La homepage sul dev server misurava `scrollWidth = innerWidth = 360`, in Chromium con movimento ridotto. Il mockup mostra la beta.5 mentre il piano richiede le quattro release beta.1–beta.4.

Requisiti: [CHANGELOG di Sandbot](sandbot/CHANGELOG.md:223) documenta Docker per la 0.3.1000. Il commit ereditato non lo pubblicizza come requisito di una release stabile disponibile. La regola di selezione delle release resta invariata.

## Task 8 · Pagina Engramma

File: `src/pages/engramma.astro`, `src/components/engramma/MemoryNote.astro`, `src/components/brand/EngrammaMark.astro`, `src/data/brand.mjs`, `scripts/check-engramma.mjs`, `package.json` e questo report. In `package.json` ho collegato alla suite anche il test news rimasto fuori dal Task 7.

Test iniziale dopo la build: `AssertionError: Build must include the Engramma product page`. `npm run check` dopo l’implementazione, exit 0:

```text

> homun-website@0.1.0 test:container-runtime-signals
> node scripts/check-container-runtime-signals.mjs

Container runtime signal cleanup contract passed
```

Chromium sul dev server a 360 px con movimento ridotto: `/engramma/` ha `scrollWidth = innerWidth = 360`. Ho ripreso dal mockup il ritmo delle sezioni, la gelatina, i primi piani e i tre esempi di memoria. La schermata in quarantena è illustrativa. La CTA apre il download di Homun.

Riferimenti al README di Engramma:

- Hero, note leggibili e integrazione Homun: [righe 5 e seguenti](engramma/README.md:5), [binding per Homun e accesso MCP](engramma/README.md:25). Lo stato «coming to other AI apps» segue la spec del sito.
- Ricerca con parole diverse: [riga 21](engramma/README.md:21).
- Ricerca storica e mantenimento della vecchia versione: [riga 15](engramma/README.md:15).
- Provenienza, confidenza e spiegazione: [riga 6](engramma/README.md:6), [riga 107](engramma/README.md:107).
- Quarantena e conferma: [riga 19](engramma/README.md:19).
- File locali e assenza di un server: [riga 10](engramma/README.md:10).
- Rust, SQLite e strumenti MCP: [riga 3](engramma/README.md:3), [riga 10](engramma/README.md:10), [riga 100](engramma/README.md:100).

## Task 9 · Docs divise per prodotto, più banner di transizione

File: `astro.config.mjs`, `package.json`, `package-lock.json`, `src/styles/starlight-theme.css`, `src/components/UpdateNotice.astro`, `src/components/docs/Banner.astro`, `src/content/docs/{,it/}engramma/{index,how-it-works,privacy,whats-next}.md`, `src/pages/roadmap/{index,[slug]}.astro`, `src/pages/changelog.astro`, `scripts/check-docs-topics.mjs`, `scripts/check-transition-notices.mjs` e report.

Prima del codice, i test sono falliti per `dist/docs/engramma/index.html` mancante e `English notice missing on docs/`. Dopo l’implementazione, `npm run check` è terminato con exit 0:

```text

> homun-website@0.1.0 test:container-runtime-signals
> node scripts/check-container-runtime-signals.mjs

Container runtime signal cleanup contract passed
```

La versione 0.8.0 del plugin è la più recente che dichiara compatibilità con Starlight 0.40.0. Il lockfile viene letto da Node e `npm ci --dry-run` ha restituito exit 0 con avvisi sugli script di installazione. Ho preservato gli slug effettivi della build, comprese le guide servite sotto `/guides/` e `/it/guides/`. I nuovi slug sono espliciti per collocare Engramma sotto `/docs/engramma/`. Ho usato la lista pagine del Task 10 del 9 novembre, richiamato dal Task 9, per il banner roadmap e il badge changelog. Il CSS esistente delle docs recepisce i font e i colori del mockup.

Chromium, dev server, 360 px e movimento ridotto: entrambe le home docs, entrambe le guide Getting started, tutte e otto le nuove pagine docs, changelog e tutte le pagine roadmap hanno restituito `scrollWidth = innerWidth = 360`. Dopo il cambio del plugin è servito un riavvio del dev server per usare gli slug appena sincronizzati.

## Task 10 · Nav, footer, stelle GitHub e pulizia

File: `src/components/Nav.astro`, `src/components/Footer.astro`, `src/components/home/Hero.astro`, `src/components/ui/StarButton.astro`, `src/lib/github-stars.mjs`, `scripts/check-homepage.mjs`, `scripts/check-github-stars.mjs`, `scripts/check-license-build.mjs`, `scripts/check-download-routing.mjs`, `package.json` e report. Rimossi i 13 componenti Homun 2 elencati nel piano del 9 novembre e sette illustrazioni orfane. `RoadmapOrbitIllustration.astro` resta importata dalla roadmap.

Test rossi iniziali: `Nav must link Engramma with a Soon label` e `ERR_MODULE_NOT_FOUND` per il nuovo modulo stelle. La prima suite ha evidenziato la vecchia asserzione sul fallback `/releases/latest`; ho allineato l’asserzione della homepage a `RELEASES_PAGE_URL`. Ho rimosso anche la sola asserzione licenza che pretendeva il vecchio slogan nel footer. Il resto dei controlli licenza resta per il Task 11.

`npm run check`, exit 0:

```text

> homun-website@0.1.0 test:container-runtime-signals
> node scripts/check-container-runtime-signals.mjs

Container runtime signal cleanup contract passed
```

Chromium, dev server: tutte le 20 pagine che condividono nav e footer hanno restituito `scrollWidth = innerWidth = 360`. Come nel mockup, su schermi stretti la nav mostra marchio e download. Il footer conserva i link Privacy e All releases per mantenere accesso alle informative e tracciamento esistente. Il conteggio stelle è richiesto lato server con cache condivisa e timeout, con il solo link quando manca un conteggio. Nella build il conteggio è comparso in hero e footer.

## Task 11 · Licenza Apache-2.0

File: `src/data/homun-core-license.md`, `src/content/docs/{,it/}license.mdx`, `src/components/docs/LicenseText.astro`, `scripts/check-license-build.mjs` e report. Rimossi `src/components/docs/LicenseReleaseTable.astro` e `src/lib/license-dates.mjs` dopo aver eliminato gli ultimi import.

Test rosso dopo la build iniziale: `Published license must match the official Apache-2.0 text`. Il [testo ufficiale](https://www.apache.org/licenses/LICENSE-2.0.txt) ha SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`. Ho aggiornato anche l’hash nel componente esistente, che blocca la build se i byte del testo non coincidono. Dopo aver verificato il riferimento a `homun-core` nell’attributo del link, `npm run check` è terminato con exit 0:

```text

> homun-website@0.1.0 test:container-runtime-signals
> node scripts/check-container-runtime-signals.mjs

Container runtime signal cleanup contract passed
```

In Chromium a 360 px, `/license/` e `/it/license/` hanno restituito `scrollWidth = innerWidth = 360`. Le pagine presentano il testo inglese vincolante e il riferimento storico alla FSL.

## Commit e passaggio a Fabio e Claude

- Task 7 · `964ef94` (commit ereditato, verifica browser e collegamento del test news registrati nel Task 8).
- Task 8 · `4100a04`.
- Task 9 · `053523d`.
- Task 10 · `59c2b14`.
- Task 11 · commit che introduce questa sezione, risolvibile con `git rev-parse --short ':/^feat: Homun is open source under Apache-2[.]0'`. Scriverne l’hash qui prima del commit ne cambierebbe il valore.

A Fabio resta l’approvazione dei testi di `src/data/home-roadmap.mjs` prima del merge. Verificare la licenza nel repo di Homun Core prima del lancio e rendere raggiungibile il link alla licenza d’archivio con il tag già presente in locale, quando autorizzato.

Dubbi aperti per la revisione: il mockup apre una richiesta Google Fonts e contiene la beta.5, quindi nel confronto a 360 px i font remoti sono stati bloccati e i contenuti delle novità seguono la spec. Nella pagina Engramma la sezione quarantena usa la fascia scura del mockup con una scheda chiara in tema chiaro. Le vecchie guide di download conservano i link GitHub manuali a `/releases/latest`, segnalati dal banner di transizione. Il bottone del sito usa il resolver delle stabili e il fallback alla lista release.

Il Task 12 è riservato a Claude.

## 2026-11-25 · Pagina Engramma e linguaggio comune della famiglia

Ramo `site-engramma`, dalla base `66c78c1`. Il motore di Engramma non è stato toccato.

**La sessione vera.** Binario `engramma 0.6.17-beta.1` (commit `1bfc611`), installato dall'installer della release in una cartella temporanea, radice dati nuova, note sintetiche del mockup. Comandi e output sono in `scripts/fixtures/engramma-session.txt`, con cui `check-engramma.mjs` confronta le righe del terminale dell'hero. Nella storia 1 i client sono due programmi veri: Claude Code 2.1.332 propone (`--mcp-config`, headless) e MCP Inspector 2.16.0 legge la stessa cella. Codex non è installato sulla macchina: Cursor, OpenCode, ChatGPT, Homun e il Codex lettore erano un driver stdio con la configurazione di quel client. Il motore firma l'attore della configurazione, quindi il lato motore è vero e il lato client no (`client dichiarato: site-capture-driver`). Il revisore `local` è una fixture, non un modello.

- Storia 1: `pending`, poi `accettata` da `user@cli`; la lettura trova «Auth: JWT», `fonte: mcp:claude-code`.
- Storia 2: `write=auto`, `decided_by: reviewer:local` (confidenza 0.9); a 0.6, sotto `min_confidence`, la proposta torna all'utente.
- Storia 3: proposta inferita dal web: `in coda`, `status: quarantined`, fuori dalla ricerca.

**`revert --by mcp:<attore>`.** Accettato, ma annulla 0 decisioni, anche dopo l'accettazione della proposta. Le decisioni le firma chi decide (`user@cli`, `reviewer:<nome>`), mai chi propone: `--by reviewer:local` e `--by user` ne annullano una, `revert <id-decisione>` riporta la proposta in coda. La regola 6 parla di revisori e di decisioni singole. Difetto da dichiarare a Engramma.

**Tre differenze dal mockup, trovate dal binario.** Le letture non entrano nel registro (`verify`: 14 operazioni prima e dopo una ricerca): il registro mostra solo proposte e decisioni, le letture sono righe tratteggiate. Due proposte accettate che correggono la stessa nota restano due note attive, senza copia di conflitto: le copie nascono fra due dispositivi (§ 4.3.1), caso non riprodotto; la regola 4 e l'esempio seguono la via a un dispositivo (entrambe in coda, una accettata, l'altra `rifiutata (lapide)`). Una proposta accettata non ha vettore finché non gira `engramma embed` (`copertura vettori: 8/14 note`): da dichiarare a Engramma.

**Fonti dei numeri.** 97,5% = `any@5` di sessione, ibrida, su 320 domande tenute da parte (`docs/DESIGN.md` § 6.3; misura della v0.4.5). 6 lingue = `ALL_STEM_LANGS`, `crates/engramma-core/src/text.rs:22`. «700+» = 676 test Rust e 67 JavaScript contati nel repository; `.github/workflows/ci.yml` li lancia a ogni push. 1 file per cella = `docs/compatibilita.md`. Il chip «offline» è diventato «model downloaded once».

**Client** (documentazione ufficiale, letta il 25/11/2026): `code.claude.com/docs/en/mcp`; `support.claude.com`, articoli 10949351 e 11175166; `cursor.com/docs/mcp`; `code.visualstudio.com/docs/agents/reference/mcp-configuration`; `developers.openai.com/codex/mcp` (rimanda a `learn.chatgpt.com`); `github.com/google-gemini/gemini-cli`, `docs/tools/mcp-server.md`; `opencode.ai/docs/mcp-servers` e `opencode.ai/config.json`; `help.openai.com`, articolo 12584461; `modelcontextprotocol.io` (specifica 2026-07-28). Cambiamenti: OpenCode usa `mcp.servers.<nome>`; VS Code `.mcp.json` con `mcpServers` (`.vscode/mcp.json` è deprecato); Cursor dichiara `type: "stdio"`; ChatGPT si aggiunge da Plugins, con il MCP completo su Business, Enterprise ed Edu; nei JSON il percorso assoluto. «Tested» solo su ChatGPT e claude.ai: il 12/11 Codex ha completato il solo collegamento (`docs/http.md`) e nessuno dei tre è stato riprovato su questa beta. Nove schede come nel mockup, con la cella `default`: una che non esiste è un errore.

**La home.** `ReleasesRoadmap` legge `releases.json` e `roadmap.json` tramite `src/lib/releases-roadmap.mjs`; `news.mjs` e `home-roadmap.mjs` sono rimossi. Conseguenza da decidere: il sync scarta le pre-release, quindi la sezione elenca le stabili (`v0.2.1004`, 10 ottobre) e non le beta 0.3.1001 che prima comparivano; per lo stesso motivo «Shipping every week» è diventato «Releases and roadmap». `Faq` è entrata con quattro risposte prese dalle guide. Rimandati: `NumbersBand` (nessun numero misurato con una fonte) e `Pipeline` (nessun posto naturale nella scena).

**Verifiche.** `npm run check` verde, con il test nuovo `check-scripts-build.mjs`: due annotazioni TypeScript rimaste in `copy.mjs` caricavano con stato 200 e lasciavano muto il bottone Copia. A 1280 e a 360 px `scrollWidth = clientWidth` sulle due pagine; nello stato finale senza movimento nessun testo nascosto; nessun errore a runtime in un percorso completo; ancore e link al repository rispondono 200; redirect provato con nginx in un contenitore (`302`, e seguendolo si scarica lo script). Copia verificata fino al testo che consegna: gli appunti sono negati all'automazione. Screenshot in `~/.zcode/v2/visualizations/57ac262ee12bd4a5fdc1b72bca76394c44aea759a4ec463a0f23f085fe4b126f/sito-engramma/`: un fotogramma per schermata, a 1280 e a 360, nei due temi (la pagina intera non si fotografa fedelmente in questo browser).

Da dichiarare a Engramma: «Your documents» non è nel DESIGN § 12 (la cartella sorvegliata esiste già per il Markdown); «More platforms» è «planned», perché il README non promette una versione. Le docs linkavano `/engramma/#developers`, mai esistita: ora puntano a `#install`.

## 2026-11-25 · Fase 2: la home di Homun, la nav per prodotto, le docs di Engramma

Ramo `site-engramma`, dalla base `c8c3680`. Due sessioni hanno lavorato sulla stessa cartella: la prima ha lasciato nel working tree nav, docs, sync e gran parte della home, la seconda ha rilettuto tutto, corretto e finito. I motori sono stati soltanto letti: qui sotto `src/…` è il codice di Homun al tag `v0.3.1001-beta.20`, `engramma/…` il repo di Engramma.

**Verifiche sul codice dell'app** (il file `sito-fase2-verifiche.md` non c'era: sono fatte qui).
- *Privacy, cosa resta:* i dati stanno sulla macchina (`src/main/paths.ts:23`, `store/db.ts:46`, `store/library.ts:3-4`, `memory/engine.ts:367-369`).
- *Privacy, cosa esce:* le app collegate, da `connect.composio.dev` e `login.composio.dev` o dall'indirizzo proprio del servizio (`connectors/catalog.json:6,22`, `connectors/composio.ts:155,201`; GitHub è un'app via Composio: `shared/app-catalog/composio-catalog.json:26`); i server MCP, stdio o HTTP (`mcp/index.ts:449,456`); i modelli cloud, dritti al fornitore (`agent/live-models.ts:27-34`, `agent/llm-pi.ts:8`); la ricerca web **senza chiave, accesa di default** (`agent/web-tools.ts:409`, `agent/web-search-providers.ts:8,52,143,276`); gli aggiornamenti, all'avvio e ogni sei ore (`main/updater.ts:55,580,585`); il modello integrato, 2,7 GB da Hugging Face (`agent/local-catalog.ts:35,50`), e quello della memoria (`memory/memory-rpc.ts:236-247`); skill e plugin da GitHub (`agent/skill-catalog.ts:64`, `connectors/marketplace-manager.ts:83`); Docker o Apple container e l'immagine del box (`sandbox/apple-container-release.ts:20-24`, `resources/box/Dockerfile:17,64-65`). Telemetria, analisi, crash report, account, licenze: non trovati (`renderer/index.html:8`; cercati sentry, posthog, telemetry, analytics, crashReporter, invite, license, activation). Guide: `guides/security.md:53-61`, `guides/connectors.md:13-17`.
- **Frasi tolte perché false:** «Data goes out only to the apps you connected and to a cloud model», «direct GitHub», «each bot has a computer of its own» (un box solo, condiviso, usato quando lo prepari: `main/sandbox/index.ts:94`). In modalità Automatica il revisore vede richiesta e azione (`agent/auto-review.ts:586-603`). Il titolo della sezione è «This is everything that leaves».
- *Registro di `team`:* «Asked {name}: {text}» e «Summary for you» (`renderer/src/components/AgentSendRow.tsx:54`, `TeamChat.tsx:116`), «Opened {host}» e «Took note» (`renderer/src/lib/activity.ts:85-101,140-142`), «waiting for you» (`ActivityPanel.tsx:75-83`), «{name} wants to…» (`lib/approval-app.ts:174`), «Allowed for this turn», «Deny» (`ApprovalCard.tsx:361-372,502-511`), «draft awaiting your click» (`shared/ui-messages.ts:159`), «source: {source}», «waiting for confirmation» (`MemoryPanel.tsx:289,426`). Approvazioni predefinite su «Ask» (`shared/types.ts:2141-2157`).
- **Etichette corrette, l'app 0.3 non le ha:** «Take over» → «Take control» (`BotScreen.tsx:255`); «Change time» → «Edit» (`Settings.tsx:1061`); card «Save skill» → «{bot} wants to change skills» con Allow e Deny (`shared/tool-names.ts:38`); trigger e provider con i nomi dell'app (`Settings.tsx:963-979`, `lib/use-provider-setup.ts:17-29`).

**Sync.** `normalizeReleases` tiene le pre-release e scrive `prerelease` su ogni release; il download e le pagine roadmap leggono solo le stabili; il changelog le elenca marcate «Pre-release». Modalità nuova, senza token né progetto: legge le release pubbliche e lascia la roadmap com'è. Comando usato: `npm run sync:product-data -- --write --releases-only` → `NO_CHANGE 13 roadmap items and 97 releases` (78 stabili, 19 pre-release). Il workflow non cambia.

**Roadmap.** Le 19 beta sono una voce: «0.3 · beta — 19 pre-releases», con la data dell'ultima e il link al changelog; nessun titolo inventato. Delle stabili si mostrano quelle con un titolo di cinque parole al più: 0.2.1004, 0.2.1002, 0.2.1001. Homun Flow, a 0 su 6, mostra solo «In progress».

**Codex.** Il CLI c'è, dentro l'app Codex (`codex-cli 0.171.0-alpha.13.2`, «Logged in using ChatGPT»), perciò la storia 1 è stata ripetuta con Codex lettore vero (fixture, S16): Claude Code 2.1.332 propone, tu accetti, `memory_search` di Codex trova «Auth: JWT · mcp:claude-code». Codex è «tested» e l'hero dice «what Claude Code learned, Codex knows». Codex ha girato in una casa isolata, poi cancellata; Claude Code ha fatto una richiesta (0,09 $).

**Docs.** Le quattordici pagine, con l'aiuto del binario in `scripts/fixtures/engramma-help.txt` e una sessione in `engramma-docs-session.txt`. `check-engramma-docs.mjs` confronta i nomi di comandi e opzioni con l'aiuto.

**Verifiche.** `npm run check` verde (build e 29 test). Browser headless su 38 casi: nessuno scorrimento orizzontale a 1280 e a 360 px, nessun errore in console, nessun testo nascosto con «riduci movimento». Screenshot (home, Engramma, due pagine delle docs, desktop e 360 px): `~/.zcode/v2/visualizations/cf370f1ad1035c0e438f7e7f7c095d73f077e6b68bd22571b57dbc49ae2c6f94/sito-fase2/`.

**Da dichiarare e rimandato.**
- Alle release di Homun servono titoli in inglese su GitHub: oggi il nome è il tag e le note delle beta sono in italiano.
- A beta.20 la CI costruisce solo macOS (`.github/workflows/build.yml:2-4`): i chip «Windows beta» e «Linux beta» sono rimasti, vanno decisi.
- Guide del sito non allineate all'app 0.3, non toccate: un box per bot, l'invio della bozza in Automatica, «Apps» contro «Plugin», skill da GitHub.
- A Engramma: `engramma revert <id> --dry-run` annulla davvero (trovato nella sessione delle docs); `mcp --actor` senza `--write` fa uscire il server.
- `TeamHub` e `Hub` hanno due motori di scena gemelli, non uno condiviso. `scroll.css` serve solo a `/dev/primitives`. Le pagine nuove sotto `/it/docs/engramma/` cadono sull'inglese.
