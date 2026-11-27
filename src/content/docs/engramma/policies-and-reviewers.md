---
title: Policies and reviewers
slug: docs/engramma/policies-and-reviewers
---

Who may propose, and how far the machine may go. The policy is per cell, it is an operation in the log (so history says who allowed what, and when), and it changes **only from the CLI** — never from the web, never from MCP.

```console
$ engramma policy show
write: off
min_confidence: 0.8
kinds: all
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
policy updated
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
policy updated
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
$ engramma proposals accept BAG5TBJD
accepted: 01M8DWJP8ZA4A79E01BAG5TBJD
embedded: 2 (pending: 0)
$ engramma decisions
QFY2WY0N  accept  user@cli  2026-11-27T06:55:10Z
      proposal BAG5TBJD
      why: accepted from the CLI
```

`revert` is the git revert of that registry — a **new** operation, history is never rewritten:

```console
$ engramma revert --by user --dry-run
would revert 1 decisions:
  conflicts: 0 (left alone)
  purged: 0 (reverted in the registry, the content does not come back)
$ engramma revert --by user --yes
would revert 1 decisions:
  ...
reverted 1, conflicts 0, purged 0
```

The bulk form takes `--by` (an exact actor or a prefix, e.g. `reviewer:`) narrowed by `--since`/`--until`, with the preview first — `--dry-run` shows what would happen, and writes nothing. Decisions are signed by who decides, never by who proposed: `--by mcp:…` is a usage error, and `--proposed-by mcp:claude-code` selects the decisions taken on what that assistant proposed. A single decision goes back the same way, by id, and the proposal returns to the queue. A revert refuses to run under a later correction of the same note, and says which to revert first; purged content does not come back.
