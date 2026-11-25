---
title: Concepts
slug: docs/engramma/concepts
---

The words Engramma uses, and what they mean in the engine.

## Cells

A **cell** is a memory space: your own memory, the family's, one bot's. One SQLite file (`<root>/cells/<name>.sqlite`), self-contained — copy it, move it, back it up as a unit. `engramma init` creates the `default` cell; `engramma cell create work` makes another; the MCP server exposes only the cells you name.

## Notes

The unit of memory: a structured header plus a body in Markdown. `engramma get` prints the canonical file:

```markdown
---
id: 01M89NXV30X3DWC6KM0R3XPKEG
type: fact
title: Gaia abita a Milano
tags: [casa/milano]
source: user
confidence: stated
status: active
valid_from: 2026-09-01
created_at: 2026-11-25T15:41:57Z
updated_at: 2026-11-25T15:41:57Z
---
Gaia ha traslocato a [[Milano]] con [[Giulia]] a settembre 2026.
```

- `[[Name]]` in the body (and typed relations in a `## Relations` section) create **entities** and **edges**: the graph. The format is compatible with Obsidian.
- Unknown header keys are preserved; non-standard ones carry an `x-` prefix.
- Versions: every edit is a row in the note's history; `engramma history <id> --diff` shows it line by line.

```console
$ engramma history 01M89NXV30X3DWC6KM0R3XPKEG --diff
v1 → ora  (stato attuale)
  + A settembre hanno anche imbiancato la casa.
```

## Source and confidence

Every write must say where it comes from and how much to trust it:

- `source`: `user`, or an app's path (`import:obsidian/…`), or the assistant that proposed it (`mcp:claude-code`).
- `confidence`: `stated` (a person said it), `inferred` (an assistant deduced it), `external` (read from third-party content).

`external` notes are born **quarantined**: out of the search results, in `--include-quarantined` views only, until `engramma confirm` promotes them — and the promotion is written in the log, with who did it.

## Validity — bitemporal

`valid_from`/`valid_to` say when a fact is true **in the world**; `created_at`/`updated_at` say when we learned it. A new fact that replaces an old one **supersedes** it: the old note closes, stays in history, and answers questions about the past:

```console
$ engramma search "ufficio" --as-of 2026-08-01
1. [superseded] Ufficio a Torino (EK7RXGNZ)
   ...
   validità: 2026-01-05 → 2026-09-01
```

## Proposals and quarantine

Two different gates, often confused:

- **Quarantine of content** (`external`): what was read from third parties.
- **The proposal queue**: what an assistant wants to remember. A proposal is born quarantined — the search never sees it, the graph is never seeded from it — until you decide, or a reviewer you configured does, within your [policy](/docs/engramma/policies-and-reviewers/).

A proposal, as the queue prints it:

```console
$ engramma proposals
[in coda] 6W44X6B0 mcp:claude-code — Corso di ceramica
```

## The log, and verify

Every write is one operation with a hybrid logical clock (HLC) and a hash-chained link to the previous one. Replay the log from zero and you rebuild exactly the same state — replication and sync stand on this. `engramma verify` recomputes the chain, replays the whole state in memory, compares every table and checks the FTS index; it runs inside a transaction that always rolls back, so it is read-only. [The compatibility page](/docs/engramma/compatibility/) says what future versions promise about all of this.
