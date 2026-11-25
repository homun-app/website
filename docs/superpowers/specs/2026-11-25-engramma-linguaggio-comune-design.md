# Pagina Engramma e linguaggio comune della famiglia — design

**Data:** 2026-11-25 · **Base:** il ramo locale `engramma-developer-preview` (commit `df8e4b5`): ha già `src/data/engramma.mjs`, `CommandBlock`, le schede dei client e il test `check-engramma.mjs`.

**Riferimento visivo vincolante:** `docs/design/engramma-mockup.html`, approvato da Fabio il 25/11.
- Sono legge: l'ordine delle sezioni, il layout, i colori, i caratteri, le **animazioni** e gli scenari.
- I testi sono una bozza buona: si rifiniscono, ma il senso non cambia.
- Le note arancioni `MOCKUP NOTE` sono istruzioni per chi costruisce: nella pagina non vanno.

Resta valida la spec del 15/11 (`2026-11-15-sito-famiglia-design.md`) per la home di Homun, per la mascotte e per la famiglia di prodotti. Questa spec la **estende** con i pezzi comuni.

## Intento

Fabio ha giudicato la pagina Engramma «brutta e scarna»:
- sembrava «un file SQL»;
- non spiegava i vettori, il grafo, il modello integrato e la ricerca mista;
- non mostrava il punto di forza, cioè **una memoria sola condivisa da tutti gli strumenti**;
- non diceva come si tiene la **verità**;
- la roadmap non era una roadmap vera.

La pagina nuova parla agli sviluppatori e a chi usa più assistenti. Racconta Engramma con lo stesso metodo della home: ogni sezione porta **un pezzo vero del prodotto che recita uno scenario**. Qui i pezzi sono il terminale, la nota Markdown, il grafo, il registro firmato.

## Obiettivi

1. **Chi arriva installa Engramma.** L'install è nell'hero, con un comando corto. Il download di Homun resta solo nella barra di navigazione.
2. **Si capisce cosa c'è dentro.** I cinque passi:
   - scrittura;
   - registro (HLC e catena di hash);
   - memoria (note, grafo, vettori);
   - ricerca (BM25 in sei lingue, embedding Granite R2 dentro il processo, PageRank personalizzato);
   - risposta con le ragioni.
3. **Si vede che gli strumenti si parlano attraverso la memoria.** È la scena «hub», la più curata della pagina.
4. **Si capisce come si tiene la verità.** Sono le sei regole, più l'esempio del conflitto.
5. **La roadmap è vera:** le release fatte, con versione e contenuto, poi «Now», poi «Next», e la visione «tu → il tuo team → la tua azienda».
6. **Homun ed Engramma parlano la stessa lingua visiva:** gli stessi componenti, ognuno con l'accento del suo prodotto.

## Non obiettivi

- Il confronto con i concorrenti per nome (Mem0, Zep, Letta). Le fonti oggi si contraddicono: è un lavoro a sé, sulle loro documentazioni ufficiali e datato.
- Le pagine marketing in italiano.
- L'implementazione dell'ingestione dei documenti: in roadmap compare solo come «Your documents · planned».

## Anti-obiettivi: se succede una di queste cose, la pagina è fallita

- **Un output, un numero o una promessa inventati.** Ogni riga di terminale è catturata dal binario rilasciato. Ogni numero ha la sua fonte nel repo di Engramma. Il marchio «tested» va solo sui client provati davvero: ChatGPT, claude.ai e Codex via HTTP, il 12/11.
- **Dati personali veri.** Gli esempi usano dati sintetici: «Gaia», Milano, Torino, Acme. Mai il nome di Fabio con una città vera diversa da Napoli.
- **Animazioni che distraggono o che rompono «riduci movimento».**
- **Scorrimento orizzontale a 360 px.**

## Il linguaggio comune: i pezzi che Homun ed Engramma condividono

Sono componenti Astro in `src/components/family/`, con l'accento del prodotto passato come proprietà: Homun è teal, Engramma è blu `#3A5BD9`.

| Componente | Cosa fa | Dove va |
|---|---|---|
| `Terminal` | Finestra scura con righe che compaiono in sequenza; la prima si scrive da sola | Hero di Engramma, Connect |
| `SignedLog` | Il registro firmato: righe con ora, attore e un bordo colorato (proposta, accettato, lettura) | Hub di Engramma; in futuro le approvazioni di Homun |
| `Pipeline` | I passi del metodo, con il punto di luce che li percorre | «Inside» di Engramma; «come lavora un bot» nella home |
| `DeepDive` | Testo, chip tecnici e un'immagine animata che entra quando la sezione è sullo schermo | Le quattro tecnologie |
| `ReleasesRoadmap` | Le release fatte, poi Now, poi Next con la barra di avanzamento, poi la visione | Engramma (dati statici) **e** home di Homun |
| `NumbersBand` | I numeri che contano fino al valore, ognuno con la sua fonte | Engramma; Homun quando ha numeri misurati |
| `Faq` | Domande aperte a fisarmonica | Tutte e due |

**`ReleasesRoadmap` per Homun.** Le release vengono da `src/data/releases.json` e i lavori futuri da `src/data/roadmap.json`. Tutti e due si sincronizzano dal progetto GitHub: **non si scrivono a mano**. Il componente legge i due file tramite un adattatore. Sostituisce le corsie di `NewsSection` (`home-roadmap.mjs`), e `check-news.mjs` si aggiorna di conseguenza.

**Le regole del movimento:**
- ogni animazione parte quando la sezione entra nello schermo, e una volta sola;
- vanno in ciclo solo l'hub, la pipeline e «Now» della roadmap;
- con «riduci movimento» si vede subito lo stato finale;
- niente librerie di animazione: CSS e poco JavaScript, come nel mockup.

## La pagina Engramma, sezione per sezione

Valgono l'ordine e gli `id` del mockup: `install` (hero), `shared`, `how`, `meaning`, `graph`, `time`, `trust`, `truth`, i numeri, `different`, `connect`, `roadmap`, `faq`, `start`.

- **Hero.**
  - L'install corto `curl -LsSf homun.app/engramma/install.sh | sh`. Serve una regola in `nginx/default.conf`: `location = /engramma/install.sh` risponde 302 verso l'installer della release corrente, con l'URL preso da `ENGRAMMA_RELEASE.installerUrl`. La regola va generata o tenuta allineata a quel dato, ed è il test a verificarlo.
  - Il terminale mostra un `search` vero che spiega il risultato, e `verify`.
- **Hub (`shared`).** Le tre storie del mockup:
  - Claude Code → Codex, accettata da te;
  - Cursor → OpenCode, decisa dal revisore con `auto`;
  - ChatGPT → Homun, che resta in quarantena.

  Il registro a destra si riempie. Le firme e le politiche devono essere quelle vere: `mcp:<attore>`, `write=propose|confirm|auto`, `min_confidence`. Prima di pubblicare, chi costruisce fa una sessione vera con due client sulla stessa cella e ne tiene gli output nel REPORT.
- **`truth`.** Ogni regola rimanda al documento che la fa rispettare: DESIGN § 4 per i conflitti, § 8.5 per la politica e i revisori, `docs/cli.md` per `revert`. **Va verificato che `revert --by` accetti `mcp:<attore>`.** Se non lo accetta, la regola 6 parla solo di revisori e diventa un difetto da dichiarare a Engramma.
- **Connect.** Otto schede: Claude Code, Claude Desktop, Cursor, VS Code, Codex, Gemini CLI, OpenCode, ChatGPT/claude.ai. I formati sono quelli delle documentazioni ufficiali attuali. Il marchio «tested» va solo dove è vero.
- **Roadmap.** Le fasi principali dalla 0.1 alla 0.6.17, prese dal § 12 del DESIGN di Engramma. «Now» è la beta. «Next» contiene «Your documents · planned» e poi le versioni dalla 0.7 alla 0.9. Le release sono senza date: sono tutte di novembre 2026, e le date non aggiungono niente.

## La CLI parla italiano

Oggi le etichette dell'output sono in italiano (`punteggio`, `liste`, `registro verificato`).
- Il mockup le mostra in inglese: **non si inventano**.
- Finché la CLI non ha l'inglese, il terminale mostra l'output vero, in italiano, con una didascalia: «The CLI speaks Italian today; English output is coming».
- Rendere la CLI multilingue è una fase di Engramma, non del sito.

## Vincoli

- **CPU bassa:** `nice -n 19` sulle build e sui test.
- **I dati del sito:** `releases.json` e `roadmap.json` non si toccano a mano.
- **I test:**
  - `npm run check` verde, compresi `check-engramma.mjs` e `check-news.mjs` aggiornati;
  - un test nuovo per il redirect di nginx;
  - nessuno scorrimento orizzontale a 360 px;
  - la pagina va bene anche con «riduci movimento».
- **Il marketing è in inglese.**
- **Le immagini:** niente immagini pesanti. Le grafiche sono SVG e HTML.

## Cosa resta a chi costruisce

- Come dividere i componenti, i nomi interni e l'animazione dell'hub (come nel mockup o con Web Animations).
- I testi definitivi, nel senso del mockup.
- Dove mettere `Pipeline` nella home di Homun, se trova un posto naturale. Altrimenti si dichiara e si rimanda.

## Le decisioni prese

- **L'approccio:** Claude scrive la spec e il mockup vincolante, GLM implementa. Sono stati scartati: GLM che disegna da solo, perché la grafica era proprio il punto debole; e Claude che implementa, per il costo in token.
- **Approvati da Fabio:**
  - le animazioni;
  - l'hub degli strumenti come punto di forza;
  - «Your documents» in Next;
  - Gaia al posto di Fabio negli esempi (scelta di Fabio).
