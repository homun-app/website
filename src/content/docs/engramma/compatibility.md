---
title: Compatibility
slug: docs/engramma/compatibility
---

The promise Engramma makes to whoever trusts it with a memory. Every line below says only what the code already guarantees, and beside it the test that proves it: a promise without a test is not there. If a future change must break one of these lines, it is announced in the `CHANGELOG.md` with the version that does it.

## The cells

A cell is one SQLite file (`<root>/cells/<name>.sqlite`), schema 24 in this version.

**1. Every future version opens a cell written by this one, without losses.** Schema migrations only move forward, and the cell is a log: replaying the operations rebuilds exactly the same state. The proof is the golden-cell mechanism: every schema-changing release adds its cell to `crates/engramma-core/tests/golden/` — written by the version that introduces it, with a repeatable script in the repository and synthetic data only — and `golden_cell.rs` opens **all** of them with today's engine, `verify` green on each.

**2. An older version refuses a cell written by a newer one, and does not touch it.** The check is `SchemaTooNew`, before any migration and before any write:

```console
engramma: the cell schema is newer than this binary (version 25, this
binary supports up to 24): the cell was left untouched, upgrade Engramma
first
```

Exit code 6, and the file stays byte for byte what it was.

## The sync

Two devices with different protocol versions **refuse each other** before a single operation moves: the ALPN of the connection is `engramma/sync/9` — the number is the version of the materialization rules — and the handshake dies there. Different rules derive different states from the same operations: refusing is the only safe answer. Update both devices and sync resumes from where it was, because the cells were not touched.

## The export

`engramma export` writes a folder of Markdown notes with an `engramma.json` declaring `format_version: 0`.

**Guaranteed:** the notes stay readable text (YAML header + Markdown body); ids do not change; a folder exported by this version re-imports into a cell and rebuilds the same state of the notes.

**Not guaranteed:** an export is not a backup of the cell — it carries no operation log, no vectors (derived data: recomputed), no sync state, no expunged referrals (tombstones are skipped) — and an id forgotten by `purge` stays forgotten: the import refuses it and says so.

## The MCP contract

The tool names and arguments are stable for the whole `0.6.x-beta` series: `memory_search`, `memory_get`, `memory_neighbors`, `memory_tags`, `memory_timeline` (read) and `memory_propose` (write, only with `--write`). A breaking change is announced in the `CHANGELOG.md` before it ships. The proof: `crates/engramma-cli/tests/mcp.rs` pins the `tools/list` to the five read tools, with their schemas, and the cell isolation.

## What is *not* promised

The internal shape of the SQLite file (tables, `schema_version`) is not an interface: it changes with migrations, and the real promise is the two lines above. The command line (subcommand names and flags) belongs to this preview and may move. Text and semantic search may improve their scores: results can change order between versions, with nothing lost.
