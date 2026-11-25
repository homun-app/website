---
title: Policies and reviewers
slug: docs/engramma/policies-and-reviewers
---

Who may propose, and how far the machine may go. The policy is per cell, it is an operation in the log (so history says who allowed what, and when), and it changes **only from the CLI** — never from the web, never from MCP.

```console
$ engramma policy show
write: off
min_confidence: 0.8
kinds: tutti
allow_supersede: none
max_auto_per_hour: 20
```

## `write`

- `off` — the default. A cell nobody has opened stays closed, on every surface: proposals are refused even if the server was started with `--write`.
- `propose` — everything lands in the queue.
- `confirm` — a client that supports forms (Claude Desktop) asks you in the chat; a client without forms behaves as `propose`.
- `auto` — a reviewer you configured decides.

```console
$ engramma policy set write=propose
politica aggiornata
```

## The reviewer, and its limits

Reviewers live in `reviewers.yaml` in the data root: the file contains the **name of the environment variable** holding the key, never the key. Two kinds: `command` (an external program, fixed argv, no shell) and `openai` (any `/v1/chat/completions` endpoint with JSON-schema output — OpenAI, llama-server, Ollama). Every answer must be `{decision: accept|reject|escalate, reason, confidence}`; anything else is `escalate` — fail towards the human. A transport failure marks the review failed, retryable with `engramma proposals review`.

`auto` runs inside limits you set:

- `reviewer` — which reviewer, by name.
- `min_confidence` — below it (default 0.8), the decision goes to you.
- `kinds` — the note types the reviewer may accept.
- `allow_supersede` — `none` (default), `inferred`, `any`.
- `max_auto_per_hour` — the breaker, 20 by default: past the cap, every proposal goes to you.

Never automatic, whatever the policy: `confidence: external` proposals, and proposals on purged or tombstoned notes.

```console
$ engramma policy set write=auto reviewer=local min_confidence=0.8 kinds=fact,preference max_auto_per_hour=10
politica aggiornata
$ engramma policy show
write: auto
reviewer: local
min_confidence: 0.8
kinds: fact,preference
allow_supersede: none
max_auto_per_hour: 10
```

## Decisions, and how to undo them

`engramma decisions` is the registry: who, when, what, why.

```console
$ engramma proposals accept 6W44X6B0
accettata: 01M89P16DAY77XXPJY6W44X6B0
$ engramma decisions
D9BWHR4V  accetta  user@cli  2026-11-25T15:43:48Z
      proposta 6W44X6B0
      perché: accettata dalla CLI
```

`revert` is the git revert of that registry — a **new** operation, history is never rewritten:

```console
$ engramma revert --by user --dry-run
annullerò 1 decisioni:
  conflitti: 0 (non toccati)
  purgate: 0 (annullate nel registro, il contenuto non torna)
$ engramma revert --by user --yes
annullerò 1 decisioni:
  ...
annullate 1, conflitti 0, purgate 0
```

The bulk form takes `--by` (an exact actor or a prefix, e.g. `reviewer:`) narrowed by `--since`/`--until`, with the preview first — `--dry-run` shows what would happen. A single decision goes back the same way, by id, and the proposal returns to the queue. A revert refuses to run over a later human correction of the same note, and says which operations stand in between; purged content does not come back.

One engine defect to know while this is a beta: with a **single decision id**, `revert <id> --dry-run` reverts for real — the dry-run check sits after the call. `--dry-run` is honored on the bulk path only. Until it is fixed, preview with `--by <actor> --dry-run`, or look before you leap.
