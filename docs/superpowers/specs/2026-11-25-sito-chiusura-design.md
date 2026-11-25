# Chiusura del sito: il download della 0.3, le guide sull'app 0.3, i ritocchi — design

**Data:** 2026-11-25 · **Base:** il ramo `site-engramma` (PR #3, in bozza) a `da7a6bb`, dopo la verifica del revisore della fase 2 (consegnata). Questa fase continua la stessa PR ed è l'ultima prima che la PR esca dalla bozza.

Restano validi:
- `2026-11-25-homun-docs-engramma-design.md`;
- `2026-11-25-engramma-linguaggio-comune-design.md`;
- `2026-11-15-sito-famiglia-design.md`.

## Intento

La home descrive Homun 0.3, verificata sul codice della `v0.3.1001-beta.20`. Il download però non la offre:
- `pickCurrentRelease` (`src/scripts/downloads.mjs:72`) scarta le pre-release e tutto quello sotto `MIN_PUBLIC_VERSION = "0.3.0"`;
- non esiste ancora una 0.3 stabile, quindi il bottone non trova un installer e porta alla pagina delle release di GitHub;
- i chip dell'hero dicono «Windows beta» e «Linux beta», ma la beta.20 c'è solo per macOS, Apple Silicon (`releases.json`: `platforms: ["macOS"]`, asset `arm64`).

Anche le guide del sito descrivono un'app che la 0.3 non è più (vedi sotto). Fabio vuole che il sito esca **coerente**: quello che la pagina descrive è quello che si scarica, e le guide dicono il vero.

## Le decisioni di Fabio (25/11)

1. **Il download offre la beta 0.3 in primo piano**, perché è l'app che la pagina descrive.
2. **I chip:** solo macOS si scarica; Windows e Linux restano visibili come «soon».
3. **Le guide si riallineano all'app 0.3 in questa stessa fase.**

## Obiettivi

### 1. Il download della 0.3 beta

- **La regola:** il resolver offre l'ultima stabile ≥ `MIN_PUBLIC_VERSION`. Se non ce n'è nessuna, offre l'ultima pre-release ≥ `MIN_PUBLIC_VERSION` e la marca «beta». Quando uscirà una 0.3 stabile, il sito passa a quella da solo, senza toccare il codice.
- **Il bottone** dice la verità di quello che scarica, per esempio «Download the beta for macOS». Il chooser segue la stessa regola.
- **L'architettura:** gli asset della beta sono `arm64`. Se non c'è un asset Intel, accanto a macOS va scritto «Apple Silicon», e su un Mac Intel non si propone il `.dmg` arm64 come se andasse bene.
- **I chip** vengono dai dati della release offerta, non sono scritti a mano: macOS (beta, Apple Silicon); Windows e Linux «soon» finché la release offerta non li ha.
- **Gatekeeper:** si verifica dalle note della release o dal workflow di build di Homun (in sola lettura) se la beta è firmata e notarizzata. Se non lo è, la nota va accanto al download, come per Engramma.
- **Nessuna pubblicità alla 0.2.** È la linea precedente, già esclusa dal sito. Basta un link discreto: «All releases» verso `RELEASES_PAGE_URL`.
- **Dove:** l'hero, la nav («Download for macOS» diventa coerente), la sezione `download`, la guida `guides/download.md`, il fallback senza JavaScript e `platformBadge`.
- **Il test:** si aggiorna `check-download-routing.mjs`, o il test del resolver. Tre casi: senza stabile ≥ 0.3 si sceglie la beta; con una stabile ≥ 0.3 si sceglie la stabile; una 0.2 non si sceglie mai.

### 2. Le guide sull'app 0.3

Le guide di `src/content/docs/guides/` (e `concepts.md`, `privacy.md`, `reference/`) si verificano sul codice di Homun al tag `v0.3.1001-beta.20` (`~/Projects/Bot/sandbot`, in sola lettura, con `git show <tag>:<file>`). Si correggono le frasi false, con lo stesso metodo della sezione `privacy`.

**Le discrepanze già note**, trovate nella fase 2:
- «un box per bot»: il box è uno solo, condiviso, usato quando lo prepari (`src/main/sandbox/index.ts`);
- l'invio della bozza in modalità Automatica: cosa vede il revisore (`agent/auto-review.ts`);
- «Apps» contro «Plugin»: si usano le parole dell'app;
- skill e plugin arrivano da GitHub (`agent/skill-catalog.ts`, `connectors/marketplace-manager.ts`).

**Il resto:** si leggono tutte le guide. Ogni funzione, etichetta o impostazione citata deve esistere nella 0.3, con il nome che l'app mostra. Quello che non esiste si toglie o si riscrive. Non si aggiungono guide nuove.

Le guide `it/` seguono le stesse correzioni dove esistono.

### 3. I ritocchi

- **Nav:** su `/engramma/` il marchio Engramma porta a `/engramma/`, come nell'intestazione delle docs. Oggi porta a `/` con `aria-label="Engramma home"`. Si aggiunge un caso a `check-nav-product.mjs`.
- **I titoli delle pagine:** le docs di Engramma non hanno «| Homun» nella scheda del browser, ma «| Engramma». Con Starlight si sovrascrive il componente `Head`, o si usa quello che Starlight 0.40 offre.

## Non obiettivi

- Le docs di Engramma in italiano.
- Le pagine `/it/docs/engramma/` nuove (oggi cadono sull'inglese).
- I titoli in inglese delle release su GitHub: sono il repo di Homun.
- Un motore di scena unico per `TeamHub` e `Hub`.
- La fusione della PR e il deploy: li decide Fabio.

## Anti-obiettivi: se succede una di queste cose, la fase è fallita

- **Il bottone dice «Download» e scarica una versione diversa da quella che la home descrive.**
- **Un Mac Intel riceve un `.dmg` arm64 senza avviso.**
- **Una guida cita una funzione o un'etichetta che la 0.3 non ha**, oppure contraddice la home.
- **Dati scritti a mano** in `releases.json` o `roadmap.json`.
- **Scorrimento orizzontale a 360 px, errori in console, percorsi personali.**

## Vincoli

Sono quelli delle fasi precedenti:
- CPU bassa: `nice -n 19`, corse in sequenza;
- disco ≥ 15 GB;
- i motori si leggono soltanto;
- repo pubblico;
- file aggiunti per nome;
- push solo su `site-engramma`, fast-forward;
- la PR resta in bozza fino alla verifica del revisore.

## Cosa resta a chi costruisce

- Come il resolver espone «beta» al markup.
- Il testo esatto del bottone e dei chip.
- Come rilevare Intel e Apple Silicon (`userAgentData.getHighEntropyValues`, dove c'è; altrimenti dirlo e lasciare scegliere).
- L'ordine con cui leggere le guide.
