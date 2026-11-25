---
title: Memoria
description: Cosa ricorda un bot tra una conversazione e l'altra, da dove viene ogni ricordo, e come correggerlo o dimenticarlo.
---

I bot ricordano fatti e regole tra una conversazione e l'altra: che un cliente firma solo
contratti annuali, come ti piacciono i report, chi mettere in copia sulle fatture. La
memoria gira su [Engramma](/it/docs/engramma/), il motore di memoria di Homun, e resta sul
tuo computer.

## Com'è fatto un ricordo

Ogni ricordo è una breve nota con la sua **fonte** e la sua **data**; apri una nota per
vedere da dove viene. Quando qualcosa cambia, la versione vecchia resta nella storia
invece di essere sovrascritta.

I ricordi appartengono a un bot, oppure sono **condivisi** da tutti i bot.

## Aprire la memoria di un bot

Nelle impostazioni del bot apri **Memoria**: si apre sulla chat. Puoi cercare, scegliere
tra le note di **questo bot** e quelle **condivise**, e vedere quali ricordi sono attivi,
in attesa di conferma o eliminati.

## In attesa di conferma

Ciò che un bot impara dal web o da altri dati esterni non entra direttamente nella sua
memoria: resta **in attesa di conferma** finché non lo confermi. Una pagina non può
piantare un ricordo da sola.

## Correggere e dimenticare

Se elimini un ricordo, passa tra gli eliminati, da dove puoi ripristinarlo o dimenticarlo
per sempre.

## Ricerca migliore

Di base la ricerca nella memoria lavora sul testo e sui legami tra le note. Per trovare
anche le note scritte con parole diverse, scarica il modello della memoria (circa 400 MB)
dal pannello Memoria. Puoi toglierlo da **Impostazioni › Generali › Spazio su disco**.

Approfondisci nelle [docs di Engramma](/it/docs/engramma/how-it-works/).
