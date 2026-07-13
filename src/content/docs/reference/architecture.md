---
title: Architecture
description: How Homun's pieces fit together.
---

Homun is one **gateway** plus a web UI, packaged two ways from the same code: a
desktop app (Electron shell around the gateway) and a self-hosted container. The
desktop and server builds run the *same* gateway — only how assets and env are wired
differs.

## The gateway

A small native service (Rust + axum) that owns everything: chat, the memory store,
tasks and automations, providers/model routing, channels, and the contained
computer. It serves the web UI and the API on one port, and keeps all state under
`HOMUN_DATA_DIR` (`~/.homun` on desktop, a mounted volume on a server).

## Memory

A private graph in plain SQLite + files. Facts are extracted from conversations,
linked to entities (people, projects, places…), and consolidated over time. It's
local by default; nothing leaves the machine.

## Providers & model routing

You configure one or more inference providers (local Ollama or cloud APIs). Each has
an independent **enable/disable** switch. The router resolves a model **per role**
(a manual binding, or an automatic capability match) across the *enabled* providers —
there's no single hard-coded model.

## Automations

A rule = **trigger → action**. The trigger is time-based (a schedule) or an event
(an incoming message, a connected service). The action is an agentic task with the
full toolset — skills, connectors, the browser, memory.

## The contained computer

For real-world tasks the agent drives a sandboxed Docker container (a headed browser
over CDP + a shell). On the server build, its live view (noVNC) is reverse-proxied
through the gateway so a remote browser can watch it over the same TLS domain.

## Distribution

The desktop app auto-updates from a public release feed (signed + notarized builds);
the source stays private. The server image rebuilds on every change and updates via a
PaaS redeploy webhook. See [Self-hosting](/guides/self-hosting/).
