---
title: Il computer dei bot
description: Il box contenuto dove i bot navigano, eseguono comandi e tengono i file — un box solo, condiviso da tutti — e come prendere il controllo del suo schermo.
---

I bot condividono **un solo computer contenuto**: un box separato dal tuo sistema, con
browser, terminale e file. Ogni bot ha dentro la sua cartella home, e uno spazio di
lavoro comune appartiene a tutti. Lì i bot fanno lavoro vero — compilare un modulo su un
sito che non ha un'app, per esempio — senza toccare i tuoi file.

## Cosa puoi vedere

Apri il computer dal pannello del bot e trovi quattro viste:

- **Schermo**: il browser, dal vivo;
- **Terminale**: i comandi che il bot esegue;
- **File**: ciò che i bot hanno salvato nel loro box;
- **Attività**: cosa hanno fatto, passo per passo.

La card **Computer** nel pannello ti dice il suo stato: **Acceso** mentre un bot lavora,
con cosa sta facendo (mai il testo dei comandi), **In attesa** quando è pronto, **In
avvio** mentre parte, **Spento** quando è fermo, **In preparazione** mentre viene
configurato.

## Prendere il controllo

Alcuni passi spettano a te, come accedere a un sito. Il bot ti mostra una card —
«{Bot} ha bisogno di te sul suo schermo»: apri lo schermo, accedi, poi premi **Ho
finito**. La password non passa dal bot.

## Il motore

Il box ha bisogno di un motore. In **Impostazioni › Generali › Computer dei bot** trovi
**Dove girano i comandi** — sul computer dei bot, o direttamente sul Mac — e la riga
**Motore**:

- **Apple container**: su macOS 26 o successivo con chip Apple. Homun scarica lo
  strumento firmato di Apple e il kernel Linux che raccomanda (circa 1 GB); macOS chiede
  la password una volta.
- **Docker**: sugli altri sistemi, o se lo preferisci. Docker deve essere installato e
  aperto.

**Automatico** sceglie per te. Dalla stessa sezione puoi disinstallare lo strumento di
Apple.

## Spazio su disco

**Impostazioni › Generali › Spazio su disco** mostra quanto occupano l'immagine del box, i
file dei bot, il modello locale e il modello della memoria, e ti permette di liberare
spazio. Togliere l'immagine ferma il computer e chiede conferma: l'immagine si ricostruisce
quando serve. Cancellare i file dei bot non si può annullare, e Homun ti chiede conferma.
