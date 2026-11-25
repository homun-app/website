---
title: Approvals & safety
description: When a bot asks before acting, how drafts and the Vault protect you, and where your data lives.
---

Homun lets bots do real work, so the defaults lean toward asking. You decide how much a
bot may do on its own.

## Approval cards

Before an action that changes something, a bot shows an **approval card** with what it
wants to do and why. You can:

- **Allow** it once;
- allow it **For this turn**, for the same tool until the bot finishes the current
  request;
- allow it **Always** — for that bot, for an app, for ten minutes: the choice saves a
  consent you can revoke later;
- **Deny** it.

Messages to other people are never sent from an approval card: they become
[drafts](/guides/chat/#drafts) that wait for you. In **Automatic** a reviewer can let a
draft go when your request or one of your rules covers it — the card says «Sent
automatically».

## When to ask

**Settings › Approvals** has three modes:

- **Ask**: the bot asks before every action that changes something: sending, writing,
  running commands. Reading never asks, and inside the [bots' computer](/guides/local-computer/)
  commands and files do not ask: the box is isolated from your Mac.
- **Automatic**: a model checks the actions that would otherwise ask, against your
  request. It lets through what the request needs, including steps you did not spell out,
  and asks when the bot goes clearly beyond it and the action is not easy to undo:
  writing to someone you did not name, paying, deleting, publishing. Some actions always
  come to you, logins first.
- **Never ask**: every action runs without waiting. The fixed protections stay: blocked
  actions remain blocked, and outgoing drafts still wait for you.

In **Automatic**, your rules come first. **Continue on your own when…** widens what
passes by itself; **Stop and always ask me when…** always wins and turns an action into a
card. Bots can propose a rule; you add it or ignore it.

**Saved consents** lists everything you allowed with **Always**, each with **Revoke**.

## The Vault

The **Vault** keeps logins for sites, secrets such as API keys, and contacts. Values are
encrypted on your computer, with a key sealed in the system keychain.

Bots see only the **names** of secrets and logins, never the values — contacts, by their
nature, are visible to them. When a bot uses a secret, Homun fills in the value at the
last moment and removes it from any output, so it never ends up in the chat or in what
the model reads. The approval card tells you which credentials an action uses.

## Your data

Bots, chats, memory, routines and the Library live on your computer. What reaches a
cloud service depends on your choices:

- the [model](/guides/models/) you pick: with the built-in model or one on your network,
  conversations stay on your machine;
- the [apps](/guides/connectors/) you connect: each app's card says whether it talks to
  the service directly or passes through Composio's servers;
- web searches: a bot's searches reach free search services, on by default — you can
  turn them off in **Settings › General › Advanced**.

Homun 0.3 is open source under the [Apache-2.0 license](/license/), so you can read how
all of this works.

## The bots' computer

Bots run commands and browse inside a [contained box](/guides/local-computer/), separate
from your system. When a step needs you, such as signing in, the bot hands you the screen
and your password does not pass through it.

## Website analytics

This website uses Umami Cloud to measure aggregate page views and selected interactions,
such as download attempts, outbound GitHub links, and roadmap participation. The website
analytics do not receive data from the Homun app — conversations, prompts, or files — and
Homun does not use them to identify individual visitors.

For the controller, provider, retention, and rights information, read the [website privacy notice](/privacy/).
