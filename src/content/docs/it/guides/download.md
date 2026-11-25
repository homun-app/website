---
title: Download
description: Scarica Homun per macOS — oggi la beta 0.3 per Apple Silicon.
---

La [homepage](/#download) offre la release corrente per il tuo sistema e sceglie
l'installer giusto. Oggi è la **beta 0.3 per macOS**: non esiste ancora una 0.3
stabile, e il sito la proporrà da solo appena uscirà.

## macOS (beta · Apple Silicon)

Scarica il `.dmg`, aprilo e trascina **Homun** in `Applicazioni`. L'app è firmata
e notarizzata, quindi si apre senza avvisi. L'installer è per i Mac con **Apple
Silicon**; non c'è ancora una build per Intel.

Per il [computer dei bot](/it/guides/local-computer/):

- su **macOS 26 o successivo con chip Apple**, Homun prepara Apple container:
  scarica lo strumento firmato di Apple e il kernel Linux che raccomanda (circa
  1 GB), e macOS chiede la password una volta;
- sulle versioni precedenti, installa
  [Docker Desktop](https://www.docker.com/products/docker-desktop/) e tienilo
  aperto.

## Windows e Linux

Non ancora. La linea 0.3 nasce su macOS; le build per Windows e Linux arriveranno.
Ogni file pubblicato, installatori della 0.2 compresi, sta nella
[pagina delle release](https://github.com/homun-app/homun-releases/releases).

## Requisiti

- Un [modello](/it/guides/models/): una chiave API di un provider cloud, un
  modello sulla tua rete, o spazio per quello integrato (circa 2,5 GB su disco —
  richiede Apple Silicon, e con meno di 16 GB di memoria l'app avverte che sarà
  lento).
- Spazio su disco per il computer dei bot. **Impostazioni › Generali › Spazio su
  disco** mostra quanto occupa e ti permette di liberarlo.

## Aggiornamenti

Installato in `Applicazioni`, Homun controlla da solo se ci sono versioni nuove,
all'avvio e ogni sei ore. Quando c'è te lo dice e mostra cosa cambia; nulla si
scarica finché non decidi tu, e puoi riavviare subito o installare alla
chiusura. In **Impostazioni › Generali › Versione e aggiornamenti** trovi
**Controlla aggiornamenti** e **Ricevi le versioni di prova**.
