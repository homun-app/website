---
title: Components
description: The building blocks behind the gateway — the Rust core and its crates.
---

[Architecture](/reference/architecture/) shows the big picture: one gateway, packaged
as a desktop app or a container. This page goes one level deeper — the parts that make
up the core.

## The desktop shell

An **Electron** app with a **React + TypeScript** UI. The shell is thin: it renders
the interface and talks to the gateway over a local HTTP boundary. The same UI is
served directly by the gateway on a self-hosted server.

## The gateway

A native **Rust + axum** service that owns chat, state, providers, channels, tasks and
the contained computer. It exposes the API and serves the web UI on one port, and is
the single boundary for streaming, approvals, audit and redacted read models. Internally
it's split into focused crates:

| Crate | Responsibility |
| --- | --- |
| `desktop-gateway` | the HTTP gateway: threads, messages, streaming, read models |
| `orchestrator` | the **Brain** — a hybrid router/planner with a lazy tool registry |
| `inference` | provider routing (Ollama, OpenAI-compatible, Anthropic) + model registry |
| `task-runtime` | the durable task runtime (heartbeat, retention, export) |
| `subagents` | local subagents coordinated by the core, not the LLM |
| `memory` | the hybrid memory store (SQLite + graph + wiki) |
| `capabilities` | the provider-neutral capability layer + routing |
| `skill-runtime` / `process-skill` | running skills, sandboxed |
| `browser-automation` | the browser sidecar (Playwright/CDP) driving |
| `local-computer-session` | the contained-computer session and its surfaces |
| `process-manager` | managing child processes/sidecars |
| `context-compression` | compressing context to fit model windows |
| `secrets` | local secret storage |

## How a turn flows

1. The UI sends a message to the **gateway**.
2. The **orchestrator** (Brain) plans, seeing compact capability cards and loading tool
   detail on demand.
3. **Inference** routes the work to the right provider/model per role.
4. Operative steps run through the **capability layer** with deny-by-default
   permissions — [skills](/guides/skills/), [connectors](/guides/connectors/), the
   [contained computer](/guides/local-computer/) — recorded in the audit trail.
5. Results stream back; [memory](/reference/memory-model/) captures what matters.

The core stays the owner of policy, execution, queueing and approvals — the model
proposes, the core decides.
