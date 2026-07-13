---
title: Memoria
description: Una memoria ibrida e ispezionabile — SQLite più un grafo di entità e decisioni, una wiki Markdown generata e contatti curati.
---

La maggior parte degli assistenti ti dimentica tra una sessione e l'altra, o ti ricorda
in un cloud opaco. Homun costruisce una **memoria privata e verificabile** che vive
sulla tua macchina e che puoi leggere e correggere.

![La vista Memoria di Homun che mostra un grafo di 28 nodi-entità collegati attorno a un nodo-progetto centrale](../../../../assets/screenshots/memory-graph.png)
*Il grafo della memoria — entità e relazioni, filtrabili per tipo (fatti, decisioni, preferenze, conversazioni).*

## Come è memorizzata

La memoria è **ibrida**, non un singolo blob di embedding:

| Strato | Ruolo |
| --- | --- |
| **SQLite** | lo store durevole di base per tutto ciò che segue |
| **Grafo** | entità, relazioni e decisioni, collegate nel tempo |
| **Wiki Markdown** | una wiki leggibile generata dal grafo |
| **Contatti** | un insieme curato di persone, distinto dalla cronologia chat grezza |

## Dalla conversazione alla conoscenza

Mentre parli, Homun **estrae** ciò che conta e lo collega nel grafo:

- **Entità** — persone, progetti, luoghi, organizzazioni, eventi.
- **Relazioni** — come quelle entità si collegano.
- **Decisioni** — scelte che vale la pena ricordare, con il loro contesto.

Col tempo **consolida**: i frammenti sulla stessa entità vengono fusi e il rumore
rimosso, così il quadro si affina invece di duplicarsi. Un **event log** registra cosa è
stato appreso e quando, così la memoria ha una storia, non solo uno stato corrente.

## Trasparente e correggibile

Poiché la memoria è un grafo ispezionabile più una wiki — non una scatola nera — vedi
esattamente cosa è stato appreso e correggi ciò che è sbagliato. È un
[principio](/it/concepts/) di fondo: la conoscenza dell'assistente è tua da verificare,
modificare e di cui fidarti.

![La scheda Info della vista Memoria che elenca i fatti estratti, con le azioni Consolida ed Esporta](../../../../assets/screenshots/memory-list.png)
*La stessa memoria come elenco leggibile — consolida i frammenti o esportala tutta.*

## Dimentica

Puoi **dimenticare** per **argomento o entità**. Rimuovere un'entità rimuove ciò che vi
è appeso, così "dimentica tutto sul progetto X" è un'operazione reale e circoscritta —
supportata da un cascade purge nel database, non dalla speranza che il modello la lasci
cadere.

## Contatti

Le persone con cui interagisci — anche tramite i [canali](/it/guides/channels/) —
possono essere curate come **contatti**: una rubrica pulita a cui l'assistente attinge,
distinta dal flusso della cronologia messaggi.

## Resta locale, ed esportabile

Nulla nella memoria lascia la macchina per impostazione predefinita — semplice SQLite +
file sotto `~/.homun` (desktop) o il volume che monti (server). Puoi **esportare** i
tuoi dati in qualsiasi momento, e la retention è applicata (cascade purge + VACUUM) così
le cancellazioni sono reali. Vedi [Privacy e sicurezza](/it/guides/security/).

## Correlato: Graphify

Per il lavoro su codice e progetti, **Graphify** costruisce un grafo di un codebase o di
un progetto sull'host — la stessa idea applicata a un repository: una struttura
navigabile invece di un mucchio piatto di file.
