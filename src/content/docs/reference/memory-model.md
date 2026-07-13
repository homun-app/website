---
title: Memory model
description: How Homun's memory is built — event log, store, graph, generated wiki, and consolidation.
---

The [Memory](/guides/memory/) guide covers memory from the user's side. This page is
the model underneath it.

## Layers

- **Event log** — an append-only record of what was learned and when. Memory has a
  history, not just a current state, so changes are traceable.
- **Memory store** — the durable SQLite store backing everything.
- **Graph memory** — entities (people, projects, places, organizations, events),
  relationships, and decisions, linked into a graph.
- **Generated wiki** — a human-readable Markdown wiki built from the graph, so the
  knowledge is browsable as documents.
- **Contacts** — a curated set of people, kept distinct from raw chat history.

## Extraction & consolidation

Facts are **extracted** from conversations and linked to the right entities. Over time
a **consolidation** pass merges fragments about the same entity and removes noise, so
the picture sharpens rather than accumulating duplicates. Consolidation is something you
can trigger explicitly from the Memory view.

## Forget, retention & export

- **Forget** by topic or entity is a real, scoped delete — backed by cascade purge, not
  a soft hint to the model.
- **Retention** is enforced (cascade purge + `VACUUM`), so deletions reclaim space.
- **Export** lets you take your full dataset out at any time.

## Related graphs

- **Graphify** builds a graph of a codebase or project on the host — the same idea
  applied to a repository.
- The **LLM/Obsidian-style wiki** keeps memory human-readable and editable, not locked
  in an opaque embedding blob.

Everything here lives locally under `HOMUN_DATA_DIR` (`~/.homun` on desktop) — see
[Privacy & security](/guides/security/).
