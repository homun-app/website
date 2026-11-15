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
- allow it **Always**, which saves a consent you can revoke later;
- **Deny** it.

Messages to other people are never sent from an approval card: they become
[drafts](/guides/chat/#drafts) that leave only when you press **Send**.

## When to ask

**Settings › Approvals** has three modes:

- **Ask**: the bot asks before every action that changes something: sending, writing,
  running commands. Reading never asks.
- **Automatic**: a model reviews every action against your request. It lets through what
  your request needs, including steps you did not spell out, and asks you when the bot
  goes clearly beyond it and the action is not easy to undo: writing to someone you did
  not name, paying, deleting, publishing.
- **Never ask**: every action runs without waiting.

Your own rules come first in every mode. **Continue on its own when…** widens what passes
by itself; **Always stop and ask me when…** always wins and turns an action into a card.
Bots can propose a rule; you add it or ignore it.

**Saved consents** lists everything you allowed with **Always**, each with **Revoke**.

## The Vault

The **Vault** keeps logins for sites, secrets such as API keys, and contacts. Values are
encrypted on your computer with a key held by the system keychain.

Bots see only the **names** of secrets, never the values. When a bot uses a secret, Homun
fills in the value at the last moment and removes it from any output, so it never ends
up in the chat or in what the model reads. The approval card tells you which credentials
an action uses.

## Your data

Bots, chats, memory, routines and the Library live on your computer. What reaches a
cloud service depends on your choices:

- the [model](/guides/models/) you pick: with the built-in model or one on your network,
  conversations stay on your machine;
- the [apps](/guides/connectors/) you connect: Direct apps talk to the service from your
  computer, apps Through Composio pass through Composio's servers.

Homun 0.3 is open source under the [Apache-2.0 license](/license/), so you can read how
all of this works.

## The bot's computer

Bots run commands and browse inside a [contained box](/guides/local-computer/), separate
from your system. When a step needs you, such as signing in, the bot hands you the screen
and your password does not pass through it.

## Website analytics

This website uses Umami Cloud to measure aggregate page views and selected interactions,
such as download attempts, outbound GitHub links, and roadmap participation. The website
analytics do not receive Homun account data, workspace content, prompts, or files, and
Homun does not use them to identify individual visitors.

For the controller, provider, retention, and rights information, read the [website privacy notice](/privacy/).
