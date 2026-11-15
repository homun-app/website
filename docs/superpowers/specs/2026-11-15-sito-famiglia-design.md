# Sito Homun: racconto a scene, marchio con la mascotte, famiglia di prodotti — design

**Data:** 2026-11-15, rivista lo stesso giorno dopo il mockup · **Branch:** `site-v3-bot-team`.

**Riferimento visivo vincolante:** `docs/design/homepage-mockup.html`. È una pagina sola, si apre nel
browser ed è pubblicata anche su https://claude.ai/artifact/Ko1sx5cp9EdgpWqkqCqsgV.
- Fanno legge: layout, ordine delle sezioni, colori, caratteri, animazioni e scenari.
- I testi sono una bozza buona: il builder li può rifinire, ma non cambiarne il senso.

**Rapporto con la spec del 9 novembre** (`2026-11-09-homepage-bot-team-design.md`). Restano valide:
- l'obiettivo;
- gli anti-obiettivi;
- i vincoli di privacy e di test;
- il download solo dalla 0.3 in su;
- la licenza Apache-2.0;
- la lingua inglese per il marketing;
- il metodo di lavoro (l'agente implementa, Claude rivede).

Tutto ciò che riguarda **l'aspetto e la struttura della homepage** è sostituito da questa spec. In
particolare non si riusano l'hero con la scelta del template, `SceneSection`, l'`AppWindow` di oggi e
le scene del 9 novembre: Fabio ha giudicato il sito attuale non adatto come riferimento.

## Intento

La pagina racconta Homun come la pagina iPhone di Apple:
- la pagina **scorre davvero**: niente scena fissata con il contenuto che cambia;
- ogni sezione porta **un pezzo dell'app vera**, la finestra intera oppure un primo piano, che entra
  scorrendo e «recita» uno scenario realistico;
- la forza è nelle immagini: si capisce cosa fa Homun guardando l'app che lavora.

Il protagonista del marchio è la **mascotte a gelatina**. Homun è il **marchio madre di una
famiglia di prodotti**, e il primo è **Engramma**.

## Obiettivi

1. **Chi arriva scarica Homun.** Le aziende (rete P2P) verranno dopo.
2. **Si capisce cosa fa**: app collegate, skill, computer del bot, approvazioni, squadre, routine,
   memoria, e soprattutto **qualsiasi modello, anche tutto in locale**, che è la differenza chiave per
   la privacy.
3. **Si vede dove va il prodotto**: le ultime novità e la roadmap.
4. **La famiglia si capisce**: Homun, Engramma («Soon»), e lo spazio per i prossimi.

## Non-obiettivi

- Pagina per le aziende, prezzi, account, raccolta email.
- Engramma installabile da solo.
- Homepage in italiano.
- FAQ. Il mockup non la prevede: si aggiunge solo se Fabio la chiede.

## Anti-obiettivi

Valgono quelli del 9 novembre, più questi:
- **Scenari inventati.** Ogni cosa che la finestra mostra deve esistere nell'app (vedi la tabella).
- **Promettere Engramma da solo** o funzioni future come presenti. Quello che manca sta solo nella
  roadmap, dichiarato.
- **Pagina lenta o che scatta.** Animazioni solo CSS legate allo scorrimento, nessuna libreria.
- **Mascotte decorativa.** Le mascotte delle sezioni sono bot dell'app, con uno stato che ha un senso.

## Decisioni prese (dall'utente)

### Marchio (già nel codice con il Task 1)
- **La scritta «homun»** ha come testa una gelatina teal dentro la «u».
- **Il simbolo** è la testa da sola.
- **Engramma** è blu, con gli occhi chiusi, e ha la firma «a homun product».
- I file stanno in `src/assets/brand/`, il componente in `src/components/brand/`. I dettagli sono
  nel piano, Task 1.

### Caratteri
- **Titoli:** M PLUS Rounded 1c, peso 800, spaziatura `-0.03em`.
- **Testo e interfaccia ricostruita dell'app:** Figtree, che è il carattere dell'app.
- **Etichette piccole:** monospace.
- Tutti e tre sono **ospitati dal sito** con i pacchetti `@fontsource`: niente Google Fonts, per il
  vincolo di privacy, che vieta richieste a terzi.

### Struttura della homepage

L'ordine e il contenuto sono quelli del mockup:

| # | Sezione | Pezzo di app | Scenario | Funzione reale (fonte) |
|---|---|---|---|---|
| 0 | Hero | gelatina grande che si sveglia | — | marchio |
| 1 | Showcase | **finestra intera**: barra con i bot e il team, chat, pannello del bot con il Computer | Inbox manager: sweep, archivio, bozza per Nora | template `inbox-manager`, card bozza |
| 2 | Drafts | primo piano di due card «Draft for…» | Send ed Edit | `DraftCard`: «draft — sent only if you confirm» |
| 3 | Apps | finestra App: ricerca, filtri, tessere | Gmail con due account, Composio, MCP | CHANGELOG beta.1 e beta.5 |
| 4 | Skills | proposta di skill con approvazione, elenco | «Save skill» | tool `update_skill`, catalogo, GitHub, plugin |
| 5 | Its own computer | schermo del Computer con il browser | Scout confronta le sale | computer del bot, `Take over` |
| 6 | Approvals | carta di approvazione | Allow · For this turn · Always allow · Deny | `ApprovalCard`, CHANGELOG beta.3 |
| 7 | Teams | membri e chat di gruppo | coordinatore e due bot; a te solo il riassunto | `TeamChat`, gruppi con coordinatore |
| 8 | Routines | tre lunedì e proposta di routine | Activate | routine proposta, CHANGELOG 0.3.1001 |
| 9 | Any model | modello per bot, locali, cloud | integrato, Ollama, LM Studio, provider | `ProviderKind` in `src/shared/types.ts` |
| 10 | Memory (fascia scura) | chat e note con fonte e data | Acme firma solo annuali | Engramma (fonte, tempo, quarantena) |
| 11 | Use cases | sei schede | frasi da dare a un bot | template veri, oppure «Ask in your own words» |
| 12 | News & roadmap | ultime release e Now/Next/Later | — | CHANGELOG; roadmap (vedi sotto) |
| 13 | Chiusura | gelatina che salta e download | — | — |

Le fonti nell'ultima colonna sono nel repo dell'app, `~/Projects/Bot/sandbot`.

### Movimento (come nel mockup)
- **Hero.** La gelatina grande si rimpicciolisce e svanisce scorrendo, mentre il marchio compare
  nella nav.
- **Showcase.** La finestra entra inclinata (`rotateX` circa 18°, `scale` 0,86) e si raddrizza; i
  messaggi compaiono uno dopo l'altro.
- **Sezioni.** Il testo sale; il pezzo di app sale e cresce da 0,92. I singoli elementi (`.play`)
  entrano in sequenza in base allo scorrimento della loro sezione. Il cursore nel browser si muove, i
  bottoni principali si «premono».
- **Tutto è legato allo scorrimento** (`animation-timeline`) e si riavvolge tornando su. Fuori da
  `@supports` e con la riduzione del movimento, la pagina è ferma e completa.

### Interfaccia dell'app ricostruita
- Le misure e i colori vengono dai token dell'app (`src/renderer/src/styles.css` di sandbot), con un
  tema scuro coerente.
- Le mascotte sono le famiglie vere di `src/renderer/src/bot/Bot.tsx`: `h-creature`, `h-robo`,
  `h-device` e `jelly`, con i loro stati (idle, listening, thinking, speaking, waiting, happy).
- I testi dei bottoni sono quelli inglesi dell'app (`src/renderer/src/locales/en/messages.po`).
- La finestra intera è disegnata a 1200×740 e si scala per stare nella colonna. Sul telefono resta
  una panoramica; il dettaglio lo danno i primi piani.

### Famiglia, nav, documentazione, piattaforme
Invariati rispetto alla prima versione di questa spec:
- **Nav:** Homun · Engramma «Soon» · Docs · Download.
- **`/engramma`:** la pagina con l'etichetta «Inside Homun today · coming to other AI apps».
- **Documentazione:** divisa per prodotto con `starlight-sidebar-topics`, e gli indirizzi di oggi
  restano.
- **Download:** Windows e Linux hanno l'etichetta «beta».
- **Requisiti:** si scrive solo quello che il CHANGELOG dice per la release scaricabile.

La pagina `/engramma` usa la stessa grammatica della homepage: sezioni che scorrono e primi piani
della memoria.

## Approcci considerati

| | Approccio | Esito |
|---|---|---|
| A | Astro 6 + Tailwind 4 + Starlight, animazioni CSS legate allo scorrimento, interfaccia dell'app ricostruita in HTML | **scelto** |
| B | Come A, con GSAP | scartato: le animazioni del mockup vengono senza librerie |
| C | Catture o video dell'app vera | rimandato: serve una messa in scena con dati demo e va rifatta a ogni cambio di UI |
| D | Una scena ferma con il contenuto che cambia (prima versione del mockup) | **rifiutato da Fabio**: vuole che la pagina scorra |

## Scelte mie (da controllare)

- **Novità.** Il CHANGELOG dell'app è in italiano e il sito è in inglese. Le novità della homepage
  vengono da un piccolo file curato in inglese, `src/data/news.mjs`. Si citano solo release
  **pubblicate** su `homun-app/homun-releases`, comprese le pre-release, con l'etichetta «beta».
  Un test le confronta con una lista di versioni pubblicate, aggiornata a mano. Non si usa
  `releases.json`, perché il sync scarta le pre-release.
- **Roadmap della homepage.** Ha tre colonne (Now, Next, Later) in un file dati
  `src/data/home-roadmap.mjs`, con i testi del mockup. **Va approvata da Fabio** prima del merge,
  perché è una promessa pubblica. La pagina `/roadmap` esistente resta com'è finché non si rifà.
- **«Homun local · picked for your hardware».** Resta solo se la release scaricabile sceglie davvero
  il modello in base all'hardware. Altrimenti diventa «built into Homun». Si verifica al momento del
  task.
- **La scelta del template nell'hero sparisce.** I template restano citati nei casi d'uso. Si
  rimuovono `hero-picker.mjs` e il suo test.

## Lasciato al builder

- La struttura dei componenti, purché segua il piano.
- Le rifiniture dei testi entro il senso del mockup.
- I tempi esatti delle animazioni, se la sensazione resta quella del mockup.
