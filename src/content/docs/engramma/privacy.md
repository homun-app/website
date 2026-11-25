---
title: Privacy
slug: docs/engramma/privacy
---

What leaves your computer, and what never does. Each statement below was verified on the engine's code.

## What stays

- **The memory**: one SQLite file per cell, on your disk. Plain Markdown notes you can read, edit and export. No server, no account, no cloud.
- **The search**: BM25, the embedding model and the graph walk all run inside the engine, in process. The vector model is IBM Granite Embedding Multilingual R2, Apache-2.0, executed by `tract` in pure Rust.
- **The log**: hash-chained, local. `verify` replays it without touching the network.

## What goes out

**One thing, once: the model download.** `engramma model pull` downloads the embedding model — about 420 MB — from its own pinned revision, verifies each file's sha256 before renaming it into place (a failed check leaves no partial file), and never again. If you never pull a model, nothing is ever downloaded: search runs on words and graph.

Nothing else, in this version, on any code path: no telemetry, no analytics, no crash reports, no update checks.

If you configure them — and only then:

- **A remote embedder** (Ollama, or any OpenAI-compatible endpoint), if you write it into `<root>/config.json`. The engine never calls one unless you did.
- **The sync's relay**, if you share cells between devices: it forwards sealed envelopes through QUIC and cannot read them. The public relay of n0 by default, your own with `--relay`, none with `--no-relay`. The blind mailbox holds sealed envelopes and no keys.
- **The HTTP server's tunnel**, if you serve MCP to remote clients: it terminates TLS. With Tailscale Funnel the TLS ends on your computer; with Cloudflare Tunnel or ngrok the tunnel provider sees the tool responses — the text of the notes that were searched. The server itself listens on loopback only, and no token exists until you approve the connection on that computer.

## Who reads, over MCP

Whatever a connected client reads, its provider sees: the tool responses are text. Cells you did not name are not exposed; a grant's cells and scopes only narrow what the process offers. Reads leave no trace in the log — only changes are signed.

## Forgetting

`engramma purge <id> --reason "why"` is the right to be forgotten: the note, its versions, its edges, its vectors, its FTS row, the entities left orphaned, and the **payloads of its operations**. `secure_delete` zeroes the freed pages, the FTS optimize merges the segments (the stems leave the index too), a `VACUUM` rebuilds the file. If the WAL or a markdown view still holds bytes, the answer says so (`pending`) and names what to reach — the purge does not lie. Exports made before the purge are outside the engine's control.

The declared boundary, said plainly: **whoever has your shell is you.** An agent with access to your machine can run the CLI. The queue, the per-cell policy and the revert are the defenses that hold inside that boundary; pretending otherwise is not.
