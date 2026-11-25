# Home di Homun nel linguaggio comune, nav per prodotto, docs di Engramma — design

**Data:** 2026-11-25 · **Base:** il ramo `site-engramma` (PR #3, in bozza), dopo la verifica del revisore. Questa fase continua la stessa PR.

**Riferimento visivo vincolante:** `docs/design/homun-mockup.html`, approvato da Fabio il 25/11.
- Sono legge: l'ordine delle sezioni, il layout, i colori, i caratteri, le **animazioni** e le scene.
- I testi vengono dalla home di oggi, già verificati sull'app. Si rifiniscono, ma il senso non cambia.
- Le note arancioni `MOCKUP NOTE` sono istruzioni per chi costruisce: nella pagina non vanno.

Restano validi:
- `2026-11-25-engramma-linguaggio-comune-design.md`: i componenti comuni, le regole del movimento e gli anti-obiettivi;
- `2026-11-15-sito-famiglia-design.md`: la famiglia di prodotti, la mascotte e i download.

## Intento

Dopo la pagina Engramma, Fabio ha visto che:
- la home di Homun era rimasta quella del 15/11, con un'altra lingua visiva;
- il logo in alto restava quello di Homun anche su Engramma;
- le docs di Engramma erano quattro segnaposto da 42 righe.

La famiglia deve parlare una lingua sola. Chi sviluppa deve poter usare Engramma leggendo solo il sito.

## Obiettivi

1. **La home di Homun come il mockup.** Comprende:
   - l'hero diviso, con l'app che lavora;
   - la scena `team`, il punto di forza: bot che si passano il lavoro, tu che approvi, la memoria condivisa e il registro delle attività;
   - la Pipeline «how a bot works»;
   - gli approfondimenti animati;
   - la sezione nuova `privacy`;
   - `ReleasesRoadmap` in teal;
   - FAQ e download.
2. **La nav segue il prodotto.**
   - Su `/engramma/` e su `/docs/engramma/**` ci sono la gelatina blu e la scritta «engramma», e il bottone diventa «Install Engramma» (verso `/engramma/#install`).
   - Altrove resta Homun.
   - Vale anche per l'intestazione di Starlight nelle docs.
3. **Le docs complete di Engramma, in inglese**, sotto `/docs/engramma/`, prese dalle docs del repo (vedi sotto).
4. **I ritocchi alla pagina Engramma emersi in revisione.**

## Non obiettivi

- Le docs di Engramma in italiano: le quattro pagine `it/` restano e rimandano alle inglesi. Sono una fase a sé.
- La traduzione della CLI di Engramma, che è una fase di Engramma.
- L'ingestione dei documenti.
- Il confronto con i concorrenti per nome.

## Anti-obiettivi: se succede una di queste cose, la fase è fallita

- **Un comando, un'opzione o un output nelle docs che il binario `0.6.17-beta.1` non ha.** È il test a verificarlo.
- **Una freccia della sezione `privacy` non verificata.** Si verifica sulle guide Privacy e Architecture di Homun e sul codice di Homun (`~/Projects/Bot/sandbot`, solo in lettura). Composio passa dai suoi server: va detto.
- **Titoli tecnici in roadmap** («Sealed object transfers…») oppure una barra che mostra «0 of 6».
- **Scorrimento orizzontale a 360 px, animazioni che rompono «riduci movimento», dati personali veri.**

## La home di Homun

- **I componenti.** Si usano quelli di `src/components/family/`, con `product="homun"`:
  - `Pipeline` per `how`;
  - `DeepDive` per gli approfondimenti;
  - `SignedLog` per il registro della scena `team`;
  - `ReleasesRoadmap` e `Faq`.

  La scena `team` è un componente `home/TeamHub.astro`, gemello di `engramma/Hub.astro`. Se conviene, i due condividono il motore della scena.
- **I pezzi dell'app.** Si riusano quelli dell'app kit di oggi (bot, bozze, schede, finestra del browser), con avatar e colori veri. I segnaposto del mockup non si copiano.
- **Il registro di `team`.** Le etichette devono essere quelle del pannello Activity dell'app 0.3. Si verificano nel codice di Homun.
- **La roadmap.** Le release vengono da `releases.json`. Fabio ha approvato il mockup, quindi **le beta 0.3 compaiono, marcate «beta»**.
  - Se il sync scarta le pre-release, si cambia il sync (`sync-product-data.yml` e il suo script) perché le tenga con `prerelease: true`. I dati non si scrivono a mano.
  - Il download punta solo alle stabili.
  - I titoli per gli utenti: se il progetto GitHub non ha un campo adatto, si mostrano solo le release che hanno un titolo leggibile. Si scrive nel REPORT cosa manca nei dati.
- **I componenti tolti.** Quelli di `home/` che la home non usa più si cancellano, insieme ai loro test.

## Le docs di Engramma

**Le fonti** sono nel repo `~/Projects/Bot/engramma`, in sola lettura:
- `README.md`;
- `docs/cli.md`, `mcp.md`, `http.md`, `sync.md`, `node.md`, `compatibilita.md`;
- `DESIGN.md`, per i meccanismi.

**Le pagine**, nella barra laterale «Engramma», in quest'ordine:

| Pagina | Contenuto |
|---|---|
| Overview | Cos'è, a chi serve, cosa non è; un link alla pagina prodotto |
| Install | L'installer, le piattaforme, glibc ≥ 2.35, macOS non firmato, `ENGRAMMA_ROOT`, come si disinstalla |
| Quickstart | `init`, `add`, `search` con spiegazione, `verify`, `review`: dieci minuti, con l'output vero |
| Concepts | Celle; note in Markdown con frontmatter; fonte e confidenza; validità bitemporale; proposte e quarantena; registro e `verify` |
| How search works | BM25 in sei lingue; Granite R2 dentro il processo; la fusione; il grafo con PageRank personalizzato; come si legge la spiegazione di un risultato |
| Connect your assistants | Client locali via stdio (gli stessi otto formati della pagina) e client remoti via HTTP, OAuth 2.1 e tunnel |
| Policies and reviewers | `write=off\|propose\|confirm\|auto`, revisore, `min_confidence`, tipi, `max_auto_per_hour`; `decisions` e `revert` |
| Sync between devices | Abbinamento SPAKE2, iroh, relay pubblico, proprio o nessuno; cosa vede chi; i conflitti; perdere un dispositivo |
| Import and the vault | `import --obsidian` (solo Markdown); `vault init\|sync\|watch` |
| Embed it | Il modulo Node (N-API), usato da Homun: com'è distribuito oggi, senza promettere npm se non c'è |
| Compatibility | La promessa sul formato: dice cosa resta stabile e cosa no |
| Privacy | Cosa esce: lo scaricamento del modello (una volta), il relay della sync (cifrato), nient'altro. Da verificare sul codice |
| CLI reference | Tutti i comandi e le opzioni del binario 0.6.17-beta.1 |
| What's next | Rimanda alla roadmap della pagina Engramma |

**Come si scrivono:**
- In inglese, una spiegazione e poi un esempio vero. Gli output sono catturati dal binario con i dati sintetici, come per la pagina: Gaia, Milano, Torino, Acme.
- Dove l'output è in italiano vale la didascalia della pagina.
- Le pagine attuali `index`, `how-it-works`, `privacy` e `whats-next` si riscrivono o si fondono; i redirect già presenti in `astro.config.mjs` restano validi.

**Il test.** Un test nuovo, `check-engramma-docs.mjs`, verifica due cose:
- ogni comando e ogni opzione citati nelle docs esistono nel `--help` del binario. L'aiuto catturato sta in una fixture accanto a `engramma-session.txt`;
- nessun link porta a `releases/latest`.

Il test confronta i nomi, non le frasi: l'aiuto della CLI è in italiano, le docs in inglese.

## I ritocchi alla pagina Engramma

1. **L'hero.** Restano il comando e una riga con le piattaforme e i link. L'avviso beta e la nota su Gatekeeper vanno in `start` o nelle FAQ.
2. **Sotto l'hub,** una riga onesta, per esempio: «Replayed from a real session on 0.6.17-beta.1. Story 1 with real clients; in stories 2 and 3 the engine side is real.»
3. **Claude Code «tested».** La storia 1 lo prova davvero; la nota dice dove (la fixture).
4. **Codex.**
   - Se il Codex CLI è installabile e Fabio è già collegato, la storia 1 si ripete con Codex come lettore vero, e Codex diventa «tested».
   - Altrimenti la frase dell'hero diventa «what Claude Code learned, your other tools know». Si scrive nel REPORT perché.

   Non si fanno accessi a nome di Fabio.

## Vincoli

Sono quelli della fase precedente:
- CPU bassa;
- disco ≥ 15 GB;
- niente dati scritti a mano;
- niente dati inventati;
- repo pubblico: niente percorsi personali;
- file aggiunti per nome;
- push solo su `site-engramma`, la PR resta in bozza e non si fonde.

## Cosa resta a chi costruisce

- Come dividere i componenti e se `TeamHub` e `Hub` condividono il motore della scena.
- I testi definitivi delle docs.
- Dove mettere la cattura del `--help`.

## Le decisioni prese

- Claude disegna il mockup, GLM implementa. È la stessa scelta della fase Engramma, per il costo in token.
- **Approvati da Fabio il 25/11:**
  - il mockup della home, comprese le beta in roadmap;
  - le docs complete di Engramma;
  - la nav che segue il prodotto.
