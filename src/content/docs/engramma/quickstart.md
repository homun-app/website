---
title: Quickstart
slug: docs/engramma/quickstart
---

Ten minutes, one terminal, real output. Install first ([Install](/docs/engramma/install/)), then give Engramma a place to live:

```console
$ export ENGRAMMA_ROOT=~/engramma-demo
$ engramma init
initialized: <tmp>/root
```

## A first note

A note is a body of Markdown plus a header the command builds for you. Every write states where it comes from (`--source`) and how much to trust it (`--confidence`):

```console
$ printf 'Gaia ha traslocato a [[Milano]] con [[Giulia]] a settembre 2026.\n' > gaia.md
$ engramma add gaia.md --source user --confidence stated --title "Gaia abita a Milano" --tag casa/milano --valid-from 2026-09-01
added: 01M8DWJK5EEERPRG2H0GKBYJDC
```

`[[Milano]]` and `[[Giulia]]` are entities: the graph grows with your notes, and a question that mentions a name reaches notes that never spell it out.

## Search that explains itself

```console
$ engramma search "trasloco di Gaia"
1. [active] Gaia abita a Milano (0GKBYJDC)
   score 1.0000 (raw 0.6500)
   lists: text
   terms: trasloc, gai
   BM25 rank: 1
   support: strong
   graph weight: 0.35 (gap 0.00)
   validity: always → now
   source: 
```

Every result says which list found it (`lists`), the terms that matched (`terms`), the graph path when the graph carried it, its validity and its source. This search ran on words alone, before any model was configured: [the meaning model](/docs/engramma/how-it-works/) joins once you pull it. On such a search the beta prints `source:` empty (a known issue of 0.6.19): the source of the note is in the `--json` output.

```console
$ engramma model pull granite-embedding-97m-multilingual-r2
downloaded: granite-embedding-97m-multilingual-r2@835ad140 in <tmp>/models
$ engramma model use granite-embedding-97m-multilingual-r2
model granite-embedding-97m-multilingual-r2@835ad140 is building (config in <tmp>/root/config.json): `engramma embed` fills it, the search goes on with the current model
$ engramma embed
embedded: 6 notes
model ready: granite-embedding-97m-multilingual-r2@835ad140
```

Now a question in other words, with no term in common with the note, still finds it:

```console
$ engramma search "where does Gaia live now?"
1. [active] Gaia abita a Milano (0GKBYJDC)
   score 1.0000 (raw 0.6500)
   lists: text, vector
   terms: gai
   BM25 rank: 1
   semantic rank: 1
   cosine: 0.8857
   ...
```

## Verify

The log is the truth; notes, graph and indexes derive from it. Check it any time:

```console
$ engramma verify
log verified: 17 operations, hash chain, reconstruction and FTS index in place
vector coverage: granite-embedding-97m-multilingual-r2@835ad140 [ready] 8/8 notes
```

## The review page

When assistants start proposing facts, this is where you decide:

```console
$ engramma review
review: http://127.0.0.1:61893/enter?token=...
```

It serves on `127.0.0.1` only, on any free port; `--open` opens the browser for you, Ctrl-C stops it. The queue, the decisions and the notes, on one page.

## From here

- [Concepts](/docs/engramma/concepts/) — what a cell is, what a note is made of.
- [Give your memory to Claude](/docs/engramma/connect/) — the MCP server, stdio and HTTP.
- [The CLI reference](/docs/engramma/cli-reference/) — every command and option.
