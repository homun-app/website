---
title: Engramma
slug: docs/engramma
---

Engramma is an open-source memory engine for assistants, written in Rust. It keeps what an assistant knows about a person, a family or a company as **readable notes** — Markdown with a structured header — tied into a **graph**, with tags, **time** (validity), **sources** and **confidence**. It answers with a **mixed search** — text, meaning, graph and time together — that **explains** every result.

- **Embedded**: one SQLite file per *cell* (a memory space). No server, no external services.
- **A change log, not a folder**: every write is one operation, ordered by a hybrid logical clock and chained by hashes. Replaying the log rebuilds exactly the same state; `engramma verify` proves it.
- **Time-aware**: notes carry `valid_from`/`valid_to`. Facts that changed are superseded, not overwritten: "where did they live in August?" and "where do they live now?" are different questions with different answers.
- **Quarantine by default**: content scraped or inferred from third parties is born `quarantined` and never appears in results until a person confirms it.
- **MCP**: access for Claude and other MCP clients, over stdio or HTTP with OAuth 2.1, scoped to the cells you choose; writes are proposals, handled by each cell's policy.
- **Sync**: end-to-end encrypted synchronization between your devices.

Engramma is the memory inside [Homun](/), and it is the same engine you can use from its command line and MCP server.

**What it is not.** It does not decide what to remember — extracting facts from a conversation is the application's job, with its model. It does not call an LLM: it computes embeddings with a small dedicated model that runs inside the engine. It is not a generic database: the schema is the schema of memory.

**Status.** Version `0.6.19-beta.1` is a developer preview: the engine is stable enough to trust with real notes — [the compatibility promise](/docs/engramma/compatibility/) is written down line by line, each line with the test that proves it — but the CLI's command surface may still move, and search scores may improve between versions.

## Where to go next

- [Install](/docs/engramma/install/) — the installer, the platforms, the first minute.
- [Quickstart](/docs/engramma/quickstart/) — from `init` to a search that explains itself.
- [Concepts](/docs/engramma/concepts/) — cells, notes, sources, validity, proposals.
- [The product page](/engramma/) — what Engramma is for, in one screen.
