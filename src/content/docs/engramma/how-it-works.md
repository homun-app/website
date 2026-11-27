---
title: How search works
slug: docs/engramma/how-it-works
---

One question, four lists, one answer that says where it came from.

## Words: BM25 in six languages

Text search runs on SQLite FTS5 over title, body and tags. The body is normalized — lowercase, accents folded, **stemmed** in the language of the note — with Snowball stemmers for Italian, English, French, German, Spanish and Portuguese. A short question's language cannot be guessed, so an uncertain question (fewer than four significant words) is searched in every language the cell holds.

## Meaning: Granite R2 inside the process

The vector branch runs IBM Granite Embedding Multilingual R2 — 97M parameters, 384 dimensions — as an ONNX model executed by `tract`, in pure Rust, inside the engine. No API key, no service to call, nothing leaves your computer. The model is downloaded once, from its own pinned revision, when you ask for it:

```console
$ engramma model pull granite-embedding-97m-multilingual-r2
downloaded: granite-embedding-97m-multilingual-r2@835ad140 in <tmp>/models
```

With it, a question in other words — or another language — finds the note:

```console
$ engramma search "Where does she live now?"
1. [active] Gaia abita a Milano (AY3TSRFT)
   score 1.0000 (raw 0.6500)
   lists: vector
   semantic rank: 1
   cosine: 0.7958
   ...
```

Remote embedders exist (Ollama, any OpenAI-compatible endpoint) for those who want them, configured in `<root>/config.json`; the engine never calls one unless you wrote it there.

## The fusion

Each question runs the lists in parallel — words and meaning, fifty candidates each — and fuses them with reciprocal rank fusion (RRF): each list contributes `1/(60 + position)`, so scores from incommensurable lists need no calibration. Quarantined and deleted notes are excluded **inside** each list, before ranks and normalization, so hidden notes never bend the scores of the visible ones.

## The graph: personalized PageRank

`[[Names]]` make entities; mentions make edges between notes and entities. On a question, a push-based personalized PageRank (Andersen–Chung–Lang) walks an in-memory graph, seeded by the entities the question names plus the top candidates of the fusion, and the graph's scores enter the fusion as a third list. A question that mentions no entity of the graph leaves the graph off — and the explanation says so.

The graph carries a note the words never matched:

```console
$ engramma search "trasloco di Gaia"
2. [active] Il lavoro di Giulia (M2CV4HB1)
   score 0.2692 (raw 0.1750)
   lists: graph
   graph rank: 1
   via: [[note:01M8DZ3QN01TQ7W5N9AY3TSRFT]] -mentions-> [[Giulia]] -mentions-> (note M2CV4HB1)
   ...
```

## How to read an explanation

Every hit says:

- `lists` — which lists found it: `text`, `vector`, `graph`, or a pair.
- `terms` / `BM25 rank` / `semantic rank` / `cosine` — the words that matched, and each list's rank.
- `via` — the graph path, when the graph carried the result.
- `graph weight` — how much the graph weighed on this question, and why (the gap between the top two, whether the lists agree).
- `support` — `strong` when more than one signal confirms the hit, `weak` for vector-only results with a thin margin (`--strict` drops them).
- `validity` and `source` — when it is true, and where it came from.

With `--json` the same fields come machine-readable, per hit, under `explain`.
