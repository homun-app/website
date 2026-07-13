---
title: Core concepts
description: The mental model behind Homun — how it works on your terms today, and the apprentice it's growing into.
---

Homun is not a passive chat box. Today it assists you on your terms — chat, memory,
channels, automations, deliverables. The mental model it's **growing into** is an
**apprentice**: one that observes your work, understands your routines, proposes, and
operates your computer end-to-end under progressive permissions. That autonomous loop is
[on the roadmap](/roadmap/).

A few principles shape every feature.

## On your terms

Your data and memory live on your device by default — plain SQLite and files under
`~/.homun` (desktop) or a volume you mount (server). Cloud models are an **opt-in**
delegation, never a requirement: local [Ollama](https://ollama.com) is the default,
and you choose if and when anything leaves the machine.

## Transparent

You can see and correct what the assistant knows. Memory is not an opaque embedding
blob — it's an inspectable graph of entities, relationships and decisions, plus a
human-readable Markdown wiki. If something is wrong, you fix it; if you want it gone,
you [forget](/guides/memory/) it by topic or entity.

## Operative, with contracts

Every action passes through **contracts, permissions, and an audit trail**. The model
produces structured output (a plan, a memory write, a risk assessment) that the Rust
core validates *before* acting. Permissions are deny-by-default; the contained
computer and connectors run behind explicit grants.

## Proactive

Homun detects patterns and offers help before you ask. A supervisor engine watches
for recurring work and surfaces **suggestion cards** — you stay in control of whether
a suggestion becomes an automation.

## The product loop

Everything rests on one base loop:

```text
you write  →  the active model responds  →  you understand the response
```

Tasks, the browser, approvals, memory, and subagents are real capabilities, but they
live *beneath* the chat — they appear as inline activity, not as noise in the base
conversation. A simple, stable chat is the foundation; operative power is layered on
top.

## The pieces

| Piece | What it does |
| --- | --- |
| [Chat](/guides/chat/) | The base loop: Markdown, code, diagrams, attachments, message actions, streaming. |
| [Memory](/guides/memory/) | Hybrid store — SQLite + graph + Markdown wiki + curated contacts. |
| [Models & providers](/guides/models/) | Bring your own model: local Ollama or cloud, routed per task. |
| [Channels](/guides/channels/) | WhatsApp and Telegram, into memory and drafts with approval. |
| [Automations](/guides/automations/) | When → Then rules that run agentic tasks. |
| [Skills](/guides/skills/) | Installable, sandboxed capabilities from a catalog. |
| [Connectors](/guides/connectors/) | Native, MCP, and opt-in managed integrations. |
| [The local computer](/guides/local-computer/) | A contained Docker browser/shell you can watch live. |

All of it is owned by a single local **gateway** — see
[Architecture](/reference/architecture/) for how the parts connect.
