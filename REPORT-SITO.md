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

Requisiti: [CHANGELOG di Sandbot](/Users/fabio/Projects/Bot/sandbot/CHANGELOG.md:223) documenta Docker per la 0.3.1000. Il commit ereditato non lo pubblicizza come requisito di una release stabile disponibile. La regola di selezione delle release resta invariata.

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

- Hero, note leggibili e integrazione Homun: [righe 5 e seguenti](/Users/fabio/Projects/Bot/engramma/README.md:5), [binding per Homun e accesso MCP](/Users/fabio/Projects/Bot/engramma/README.md:25). Lo stato «coming to other AI apps» segue la spec del sito.
- Ricerca con parole diverse: [riga 21](/Users/fabio/Projects/Bot/engramma/README.md:21).
- Ricerca storica e mantenimento della vecchia versione: [riga 15](/Users/fabio/Projects/Bot/engramma/README.md:15).
- Provenienza, confidenza e spiegazione: [riga 6](/Users/fabio/Projects/Bot/engramma/README.md:6), [riga 107](/Users/fabio/Projects/Bot/engramma/README.md:107).
- Quarantena e conferma: [riga 19](/Users/fabio/Projects/Bot/engramma/README.md:19).
- File locali e assenza di un server: [riga 10](/Users/fabio/Projects/Bot/engramma/README.md:10).
- Rust, SQLite e strumenti MCP: [riga 3](/Users/fabio/Projects/Bot/engramma/README.md:3), [riga 10](/Users/fabio/Projects/Bot/engramma/README.md:10), [riga 100](/Users/fabio/Projects/Bot/engramma/README.md:100).

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
