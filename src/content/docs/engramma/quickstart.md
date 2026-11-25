---
title: Quickstart
slug: docs/engramma/quickstart
---

Ten minutes, one terminal, real output. The CLI speaks Italian today; English output is coming. Install first ([Install](/docs/engramma/install/)), then give Engramma a place to live:

```console
$ export ENGRAMMA_ROOT=~/engramma-demo
$ engramma init
inizializzato: <tmp>/root
```

## A first note

A note is a body of Markdown plus a header the command builds for you. Every write states where it comes from (`--source`) and how much to trust it (`--confidence`):

```console
$ printf 'Gaia ha traslocato a [[Milano]] con [[Giulia]] a settembre 2026.\n' > gaia.md
$ engramma add gaia.md --source user --confidence stated --title "Gaia abita a Milano" --tag casa/milano --valid-from 2026-09-01
aggiunta: 01M89NXV30X3DWC6KM0R3XPKEG
```

`[[Milano]]` and `[[Giulia]]` are entities: the graph grows with your notes, and a question that mentions a name reaches notes that never spell it out.

## Search that explains itself

```console
$ engramma search "trasloco di Gaia"
1. [active] Gaia abita a Milano (0R3XPKEG)
   punteggio 1.0000 (grezzo 0.6500)
   liste: text
   termini: trasloc, gai
   rango BM25: 1
   supporto: strong
   peso grafo: 0.35 (stacco 0.00)
   validità: 2026-09-01 → ora
   fonte: user
```

Every result says which list found it (`liste`), the terms that matched (`termini`), the graph path when the graph carried it, its validity and its source. This search ran on words alone: [the meaning model](/docs/engramma/how-it-works/) joins once you pull it.

```console
$ engramma model pull granite-embedding-97m-multilingual-r2
scaricato: granite-embedding-97m-multilingual-r2@835ad140 in <tmp>/models
$ engramma model use granite-embedding-97m-multilingual-r2
modello granite-embedding-97m-multilingual-r2@835ad140 in costruzione (config in <tmp>/root/config.json): `engramma embed` lo riempie, la ricerca continua con il modello attuale
$ engramma embed
incorporate: 6 note
modello pronto: granite-embedding-97m-multilingual-r2@835ad140
```

Now a question in other words, with no term in common with the note, still finds it:

```console
$ engramma search "where does Gaia live now?"
1. [active] Gaia abita a Milano (0R3XPKEG)
   punteggio 1.0000 (grezzo 0.6500)
   liste: text, vector
   termini: gai
   rango BM25: 1
   rango semantico: 1
   coseno: 0.8857
   ...
```

## Verify

The log is the truth; notes, graph and indexes derive from it. Check it any time:

```console
$ engramma verify
registro verificato: 15 operazioni, catena hash, ricostruzione e indice FTS a posto
copertura vettori: granite-embedding-97m-multilingual-r2@835ad140 [ready] 8/8 note
```

## The review page

When assistants start proposing facts, this is where you decide:

```console
$ engramma review
revisione: http://127.0.0.1:57453/entra?token=...
```

It serves on `127.0.0.1` only, on any free port; `--open` opens the browser for you, Ctrl-C stops it. The queue, the decisions and the notes, on one page.

## From here

- [Concepts](/docs/engramma/concepts/) — what a cell is, what a note is made of.
- [Give your memory to Claude](/docs/engramma/connect/) — the MCP server, stdio and HTTP.
- [The CLI reference](/docs/engramma/cli-reference/) — every command and option.
