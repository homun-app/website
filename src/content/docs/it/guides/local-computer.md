---
title: Il computer del bot
description: Il box separato dove ogni bot naviga, esegue comandi e tiene i suoi file, e come prendere il controllo del suo schermo.
---

Ogni bot lavora su **un computer suo**: un box separato dal tuo sistema, con browser,
terminale e una cartella di file. Lì il bot può fare lavoro vero, come compilare un modulo
su un sito che non ha un'app, senza toccare i tuoi file.

## Cosa puoi vedere

Dalla chat apri il computer del bot e trovi quattro viste:

- **Schermo**: il browser, dal vivo;
- **Terminale**: i comandi che il bot esegue;
- **File**: ciò che il bot ha salvato nel suo box;
- **Attività**: cosa ha fatto, passo per passo.

La card **Computer** in chat ti dice il suo stato: **Acceso** mentre il bot lavora, con
cosa sta facendo (mai il testo dei comandi), **In attesa** quando è pronto, **In avvio**
mentre parte, **Spento** quando è fermo.

## Prendere il controllo

Alcuni passi spettano a te, come accedere a un sito. Il bot ti mostra una card di **Presa
di controllo dello schermo**: apri lo schermo, accedi, poi premi **Ho finito**. La password
non passa dal bot.

## Il motore

Il box ha bisogno di un motore. **Impostazioni › Generali › Motore** mostra quale lo fa
girare:

- **Apple container**: su macOS 26 o successivo con chip Apple. Homun installa il
  pacchetto firmato di Apple (macOS chiede la password) e non serve altro.
- **Docker**: sugli altri sistemi, o se lo preferisci. Docker Desktop deve essere
  installato e aperto.

**Automatico** sceglie per te. Dalla stessa sezione puoi disinstallare lo strumento di
Apple.

## Spazio su disco

**Impostazioni › Generali › Spazio su disco** mostra quanto occupano l'immagine del box e i
file dei bot, e ti permette di liberare spazio. Togliere l'immagine è sicuro: si
ricostruisce quando serve. Cancellare i file dei bot non si può annullare, e Homun ti
chiede conferma.
