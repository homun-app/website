---
title: Modello di memoria
description: Come è costruita la memoria di Homun — event log, store, grafo, wiki generata e consolidamento.
---

La guida [Memoria](/it/guides/memory/) copre la memoria dal lato utente. Questa pagina è
il modello che le sta sotto.

## Strati

- **Event log** — un registro append-only di cosa è stato appreso e quando. La memoria
  ha una storia, non solo uno stato corrente, così i cambiamenti sono tracciabili.
- **Memory store** — lo store SQLite durevole che fa da base a tutto.
- **Graph memory** — entità (persone, progetti, luoghi, organizzazioni, eventi),
  relazioni e decisioni, collegate in un grafo.
- **Wiki generata** — una wiki Markdown leggibile costruita dal grafo, così la
  conoscenza è navigabile come documenti.
- **Contatti** — un insieme curato di persone, distinto dalla cronologia chat grezza.

## Estrazione e consolidamento

I fatti sono **estratti** dalle conversazioni e collegati alle entità giuste. Col tempo
un passo di **consolidamento** fonde i frammenti sulla stessa entità e rimuove il rumore,
così il quadro si affina invece di accumulare duplicati. Il consolidamento puoi
innescarlo esplicitamente dalla vista Memoria.

## Dimentica, retention ed export

- **Dimentica** per argomento o entità è una cancellazione reale e circoscritta —
  supportata da cascade purge, non da un suggerimento soft al modello.
- La **retention** è applicata (cascade purge + `VACUUM`), così le cancellazioni
  recuperano spazio.
- L'**export** ti fa portare fuori l'intero dataset in qualsiasi momento.

## Grafi correlati

- **Graphify** costruisce un grafo di un codebase o di un progetto sull'host — la stessa
  idea applicata a un repository.
- La **wiki stile LLM/Obsidian** tiene la memoria leggibile e modificabile, non chiusa in
  un blob di embedding opaco.

Tutto qui vive in locale sotto `HOMUN_DATA_DIR` (`~/.homun` su desktop) — vedi
[Privacy e sicurezza](/it/guides/security/).
