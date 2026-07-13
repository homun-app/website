---
title: Design decisions
description: The architectural choices that shape Homun, and why.
---

Homun's design is deliberate. These are the decisions that matter most — the *why*
behind how the pieces fit.

## Local-first, cloud-optional

Data and memory stay on the device by default; cloud models are an opt-in delegation,
never a requirement. This drives everything from the storage layout (`~/.homun`) to the
deny-by-default permission model.

## A local gateway as the boundary

Chat doesn't depend on native bridges for long streams. A local **Rust HTTP gateway**
on `127.0.0.1` is the single boundary for threads, messages, streaming, cancel,
approvals, audit and redacted read models. Desktop and server run the *same* gateway.

## Provider routing, not one runtime

Inference is a **routing layer**, not a single bundled model. Provider-neutral kinds
(Ollama, OpenAI-compatible, Anthropic), a model registry, and per-role routing mean
there's no hard-coded model — and local-first stays the default.

## One Brain, the core decides

A single **orchestrator/Brain** plans, seeing compact capability cards and loading tool
detail lazily. The Rust core stays the owner of policy, execution, queueing, approvals
and audit. The model proposes; the core decides and validates structured output before
acting.

## Contained execution

Real-world actions run inside a **contained Docker computer** (a real browser over CDP +
a shell), isolated from the host. Capabilities are deny-by-default and the browser stops
before logins, personal data, payments and purchases.

## An agnostic core + addons

The core is capability-agnostic; features plug in as **addons** with their own engine,
panel and scoped permissions, and can be detached cleanly. Connectors span native, MCP,
and opt-in managed aggregators, routed on demand.

## Durable by default

Tasks survive restarts via a heartbeat watchdog (lease renewal + a double-execution
guard). Retention (cascade purge + VACUUM) and data export are first-class.

## English-default, multilingual

English is the neutral substrate for LLM instructions; output follows the user's
language. The UI is localized (English + Italian), and each plugin ships its own
translations as a self-contained namespace.

## OpenHuman as reference, not blueprint

Prior art like OpenHuman is studied for patterns and trade-offs, but not copied. Every
adopted idea passes through an explicit decision about what it solves and how it's
adapted.
