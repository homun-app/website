# Homepage "Bot team" — design

**Data:** 2026-11-09 · **Fase:** 1 di 4 del rinnovo del sito (1 homepage + basi grafiche + download + licenza · 2 changelog/roadmap · 3 docs · 4 marketplace)

## Intento

Homun è cambiato. Il sito attuale racconta Homun 2: *"Your work. Your models. Your system."*, un
"AI workspace" con memoria, modelli e sicurezza. Il prodotto di oggi (Homun 0.3, codice in
`~/Projects/Bot/Sandbot`) è un'altra cosa: **una squadra di bot che lavora sul tuo computer**. Ogni
bot ha un lavoro, un computer suo (sandbox Docker + computer use), routine che lo svegliano da solo,
app collegate (MCP, Composio) e una memoria condivisa (Engramma).

Il racconto vecchio va archiviato e sostituito. Riferimenti di stile e di racconto:
[rakazo.com](https://rakazo.com/) e [x.ai/bot](https://x.ai/bot). Sono pagine chiare, centrate, con
l'app grande sotto il titolo, e ogni sezione è una **scena** in cui un bot fa qualcosa, non un
elenco di funzioni. Homun si avvicina a quel linguaggio. La prima differenza visibile è
**Engramma** (la memoria); col tempo il sito si differenzierà di più.

## Obiettivo e misura di successo

L'unica azione che conta: **chi finisce di guardare la homepage scarica Homun.** La seconda leva
è "Star on GitHub" (il progetto diventa open source).

Tutto il design serve questa conversione:
- l'hero chiede un piccolo impegno (scegliere il primo bot) prima del download;
- il bottone di download è sempre raggiungibile;
- il download è giusto al primo clic per il sistema del visitatore.

## Non-obiettivi (questa fase)

- Riscrivere docs, roadmap, changelog e marketplace: sono le fasi 2–4. In questa fase restano
  funzionanti. *Decisione mia*, per non contraddire la homepage nel frattempo:
  - docs e roadmap ricevono un banner breve: *"Being updated for the new Homun — some pages
    describe the previous version."*
  - `/marketplace` esce dalla nav finché non arriva la fase 4, ma l'URL resta raggiungibile.
  - nel changelog le release di Homun 2 restano come storia vera, con l'etichetta "Homun 2".
- Homepage italiana: oggi la homepage è solo in inglese (l'italiano esiste solo per le docs) e
  resta così.
- Prezzi, piani hosted, account: Homun non ne ha.

## Anti-obiettivi (fallimento anche se "funziona")

- **Copia di Rakazo o di Grok Bot**: testi, asset, illustrazioni, marchi o nomi di template
  copiati. Si prende il *linguaggio* (scene, ritmo, layout), non il contenuto.
- **Promesse false**: funzioni che Homun 0.3 non ha (app mobile, canali Slack/iMessage/Telegram,
  piano hosted, "keeps working while your computer is off"); testimonianze inventate; numeri finti.
- **Download sbagliato**: un visitatore Windows/Linux che scarica la build di Homun 2.
- **Rompere i contratti di privacy esistenti** del sito (vedi Vincoli).

## Vincoli

- **Stack:** Astro + Tailwind v4 nello stesso repo (`homun-website`), Starlight per le docs.
  Decisione mia: per un sito marketing Astro è oggi la scelta migliore (statico, JS solo nelle
  "isole" interattive) e tiene l'infrastruttura esistente: download, analytics Umami, privacy,
  container nginx, sync dei dati prodotto.
- **Archivio:** prima di toccare il codice si crea il tag git `site-v2-workspace` sul commit
  corrente di `main`. Nessuna pagina "legacy" pubblica.
- **Privacy:** valgono i test esistenti `test:privacy`, `test:analytics-*`. Nessun nuovo servizio
  terzo lato client, nessun cookie, nessuna raccolta email.
- **Test:** `npm run check` deve restare verde. I test che verificano i *testi* della vecchia
  homepage (`scripts/check-homepage.mjs`, `check-homepage-illustrations.mjs`,
  `check-marketing-backgrounds.mjs`) vanno riscritti sul nuovo racconto, non cancellati. Il nuovo
  `check-homepage.mjs` verifica i messaggi chiave nuovi e l'assenza dei vecchi slogan.
- **Prestazioni e accessibilità:** le scene animate rispettano `prefers-reduced-motion` (mostrano
  lo stato finale, fermo) e funzionano senza JavaScript (stato finale statico, bottone di download
  generico). Il layout funziona da 360 px in su senza scroll orizzontale.
- **Sviluppo:** il codice lo scrive GLM, a partire da prompt piccoli (un componente o una sezione
  per volta, con criteri di accettazione) scritti da Claude. Claude rivede ogni diff, lancia
  `npm run check` e verifica nel browser a 375 / 768 / 1440 px, in chiaro e in scuro.

## Decisioni prese

### Posizionamento e testi

- Categoria propria, non "alternativa a Grok Bot". Linea di testa di lavoro:
  **"Your bot team. On your computer."** con sottotitolo sul fatto che ogni bot ha un lavoro,
  un computer suo e una memoria. Copy finale da rifinire in implementazione (vedi "Lasciato al
  builder"), ma la gerarchia è questa.
- **Open source**: confermato da Fabio, licenza **Apache-2.0** sul repository
  **`homun-app/homun-core`**. "Star on GitHub" punta lì (`CORE_REPOSITORY_URL`). La pagina licenza
  (`src/data/homun-core-license.md`, oggi FSL-1.1) e `test:license` passano al testo integrale di
  Apache-2.0. Il file LICENSE e il campo `license` del `package.json` nel repository dell'app sono
  lavoro sul repository dell'app, fuori dal sito, ma devono essere a posto prima del lancio.
- Lingua del sito marketing: inglese.

### Hero: "scegli il tuo primo bot" (opzione B, scelta da Fabio)

- Titolo, sottotitolo, fila di **chip con i template veri** di Homun 0.3
  (`Sandbot/src/main/templates/*.json`): Inbox Manager, Meeting Prep, Daily Briefing,
  Chief of Staff, Mention Monitor, Executive Assistant.
- Sotto: **finestra dell'app animata** (chat a sinistra, pannello "Computer" del bot a destra
  quando la scena lo usa) che recita una scena breve per il template selezionato. Un template è
  preselezionato (Inbox Manager) e la scena parte da sola.
- Al cambio di chip cambia la scena. Il bottone primario resta **"Download for <OS>"**. Sotto
  compare la riga *"Then pick <bot> from the templates — it's ready in the app."* Il nome del bot
  scelto passa all'evento analytics del download (proprietà `template`). *Decisione mia:* oggi
  l'app non può ricevere la scelta (nessun deep link, `protocol.ts` serve solo `homun://app`).
  Per questo il bottone non promette di "partire con quel bot". Un deep link
  `homun://template/<id>` al primo avvio è un possibile lavoro futuro lato app, fuori da questa
  fase.
- Le scene descrivono solo cose che Homun 0.3 fa davvero (letture libere, invii in bozza, carte
  di approvazione, routine, memoria).

### Percorso della pagina (dopo l'hero)

Ogni sezione è una scena illustrata con UI dell'app ricostruita in HTML/CSS, non uno screenshot.

1. **Its own computer**: sandbox per bot + computer use; carta di approvazione con
   *Allow once / Always allow / Deny*. Messaggio: lavora da solo, i limiti li decidi tu.
2. **Engramma: memory** (sezione distintiva, sfondo leggermente diverso). Scena: un fatto
   imparato ("Acme only signs annual") aggiorna la memoria ed è disponibile a un altro bot. Punti:
   resta sul tuo computer, la puoi leggere e cancellare, cerca anche nella storia delle chat.
   Nominare **Engramma** come motore della memoria.
3. **Works in your apps**: Gmail, Slack, GitHub…; più di mille app via Composio e qualsiasi
   server MCP; letture libere, invii in bozza, scritture con approvazione.
4. **Wakes up on its own**: routine programmate e routine *suggerite* dai bot a partire da ciò
   che fai spesso.
5. **Your models**: un modello per bot; Anthropic, provider OpenAI-compatible, OpenRouter,
   Ollama, LM Studio; anche tutto in locale.
6. **Private by design**: cassaforte cifrata (il modello vede solo i nomi delle credenziali), app
   firmata, open source.
7. **Shipping every week**: le ultime voci del changelog al posto delle testimonianze (che non
   abbiamo e non inventiamo). *Decisione mia:* si mostrano solo le release **≥ 0.3** che hanno
   delle note, prese dal corpo delle GitHub Release, che a sua volta viene dal `CHANGELOG.md`
   dell'app. Se `sync-product-data` oggi non estrae quelle note (in `releases.json` sono vuote),
   va corretto. Se nessuna release ≥ 0.3 ha note, la sezione non si mostra.
8. **FAQ** + chiusura **"Meet your first bot"** con bottone di download.

### Download

- Al lancio esistono le build 0.3 per **macOS, Windows e Linux** su `homun-app/homun-releases`. Il
  bottone riconosce il sistema (logica esistente in `src/scripts/downloads.mjs`) e scarica la
  build giusta; un link "Other platforms" mostra le altre.
- **Protezione contro Homun 2** (*decisione mia*). Oggi su `homun-releases` la release "Latest" è
  0.2.1004, cioè Homun 2, e 0.3.1000 è ancora una bozza. Per questo `downloads.mjs` non usa più
  `releases/latest` alla cieca. Prende la release pubblicata più recente con versione **≥ 0.3**.
  Se una piattaforma non ha la build 0.3, quella piattaforma ripiega su "Other platforms" e non
  serve mai una build di Homun 2. Ci vanno test dedicati.
- **Requisito Docker.** Homun 0.3 richiede Docker Desktop per il computer dei bot (CHANGELOG
  0.3.1000). Accanto al bottone compare una nota breve, "Requires Docker Desktop", con il link, e
  la FAQ lo spiega. Quando arriverà la macchina virtuale inclusa, la nota sparirà.
- Da telefono o sistema sconosciuto: niente vicolo cieco e niente raccolta email. Il bottone
  diventa "Get Homun for your computer" e mostra le piattaforme, più un'azione per copiare o
  condividere il link (Web Share API dove c'è).
- Il bottone di download sta anche nella nav fissa, sempre visibile mentre si scorre.

### GitHub

- Bottone secondario **"Star on GitHub"** nell'hero e nel footer, con il numero di stelle.
  Il numero si legge **al build** (come gli altri dati prodotto, in `sync:product-data`), non dal
  browser del visitatore.

### Grafica

- Tema **chiaro** come base, come i riferimenti, con tema scuro fedele tramite
  `prefers-color-scheme`. Decisione mia: il sito attuale è "espresso" scuro con accento verde
  acqua; il nuovo cambia palette. L'accento resta il verde acqua di Homun, così il marchio si
  riconosce.
- Tipografia: Inter Variable (già nel progetto) per tutto; mono solo per piccoli dettagli UI.
- Le basi (token di colore, spaziature, tipi di card, finestra dell'app finta) vanno in un piccolo
  set di componenti riusabili, perché le fasi 2–4 le erediteranno.

### Cosa si rimuove

I componenti della vecchia homepage (`Hero`, `ModelFreedom`, `Memory`, `WorkProof`,
`ConnectedAction`, `Security`, `Ecosystem`, `Apprentice`, `Pillars`, `Features*`, `illustrations/*`)
vengono rimossi dalla homepage e cancellati se non sono più usati altrove. Restano nel tag
d'archivio.

## Lasciato al builder

- Copy definitivo di titoli e testi, entro la gerarchia e il tono descritti (frasi brevi,
  concrete, minuscole e asciutte nelle scene di chat).
- Copione esatto di ogni scena dei 6 template, verificato sul comportamento reale del template
  (`Sandbot/src/main/templates/<id>.json`).
- Tecnica di animazione (CSS + piccolo script vanilla o isola Astro), purché leggera e coerente con
  i vincoli di accessibilità.
- Palette precisa per chiaro e scuro, purché con contrasto AA.
- Domande della FAQ (partire da: è gratis? quali modelli? i miei dati dove stanno? serve Docker?).
