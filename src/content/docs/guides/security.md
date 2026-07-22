---
title: Privacy & security
description: Local-first by default, deny-by-default permissions, contracts, an audit trail, and owner-only data at rest.
---

Homun is built so that doing powerful things stays safe and private. The defaults lean
toward *less* exposure, not more.

![Homun's Privacy settings: toggles for "Local-first by default", "Managed cloud" and "Approval gate", plus remote-approval options](../../../assets/screenshots/privacy.png)
*The Privacy settings — local-first on, managed cloud off, and an approval gate, all by default.*

## Local-first

Your data and memory live on your device by default — plain SQLite + files under
`~/.homun` (desktop) or a volume you mount (server). Cloud [models](/guides/models/)
are an opt-in delegation; you can keep everything on the machine.

## Deny-by-default permissions

Capabilities are off until granted. [Connectors](/guides/connectors/), the
[contained computer](/guides/local-computer/), and channel auto-replies all run behind
**explicit grants** — there is no implicit access. Managed cloud connectors
(Composio/Zapier-style) stay disabled until you pick a provider.

## Approvals & remote authorization

An **approval gate** requires explicit confirmation before write actions and approved
automations run. When the agent drives the
[contained computer](/guides/local-computer/), the **browser stops before logins,
personal data, payments, or purchases** — those always come back to you.

Approvals can reach you **remotely**: route authorization requests to Telegram so you
can approve a send or a publish from your phone. Only your own chat id can authorize.

## Contracts & audit

Operative actions go through **contracts**: the model produces structured output (a
plan, a memory write, a risk assessment) that the Rust core **validates before
acting**. Actions are recorded in an **audit trail**, so what the assistant did is
inspectable after the fact.

## Data at rest

The gateway runs with a strict umask so everything it writes is **owner-only (0600)** —
including the SQLite WAL/SHM files created at runtime. The personal stores (memory,
contacts, message sessions) are plaintext SQLite protected by file permissions, so
they aren't exposed to other local users.

## Secrets

API keys and tokens are stored locally (owner-only) and kept out of read models and
logs. On a server, the gateway requires a bearer token and serves a login gate — the
token is never baked into the web bundle. See [Self-hosting](/guides/self-hosting/).

## Containment

Real-world execution happens inside the [contained computer](/guides/local-computer/),
isolated from your host. Combined with deny-by-default permissions, an agent action
can't quietly reach beyond its sandbox.

## Your data, exportable

You can **export** your data at any time, and retention is enforced with cascade purge
(and VACUUM) so deletions are real, not soft.

## Website analytics

This website uses Umami Cloud to measure aggregate page views and selected interactions,
such as download attempts, outbound GitHub links, and roadmap participation. The website
analytics do not receive Homun account data, workspace content, prompts, or files, and
Homun does not use them to identify individual visitors.
