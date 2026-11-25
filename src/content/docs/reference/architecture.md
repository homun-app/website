---
title: Architecture
description: The parts of Homun 0.3 and how they fit together.
---

Homun 0.3 is a desktop app. Everything that keeps your bots running lives on your
computer. A few things reach the network on their own — update checks, the free web
search a bot uses, the plugin marketplace — and the rest depends on your choices.

## The parts

| Part | What it does |
| --- | --- |
| **The app** | The window you use: chats, teams, the Plugin page, settings. |
| **The background process** | A second process of the same executable — the daemon — keeps bots, routines and teams running when the window is closed, and is signed like the app. While the app is open, Homun sits in the menu bar. |
| **The agent loop** | For each request: the model answers, asks for tools, each tool call goes through approvals, results go back to the model, until the work is done. |
| **The transcript** | Every chat is a sequence of events (messages, tool calls, results, approvals) saved in a local SQLite database. |
| **The bots' computer** | One contained box shared by every bot, run by Apple container or Docker, with a browser, a terminal and files; each bot has its own home inside. |
| **Apps** | Direct connections, Composio, and MCP servers, exposed to bots as tools. |
| **Memory** | [Engramma](/docs/engramma/), a local engine, with notes, sources, history and quarantine. |
| **The Vault** | Encrypted secrets and logins; the key is sealed in the system keychain. |
| **Models** | Cloud providers, local servers, and the built-in model, behind one interface. |
| **Updates** | Signed releases from GitHub, with release notes shown before you install. |

## Where things run

- **On your computer**: the app, the background process, the transcripts, the memory,
  the Vault, the Library, the bots' box, and the built-in model if you install it.
- **On services**: the cloud models and the apps you choose; the free web-search
  services when a bot searches; GitHub — for updates, the skill catalog and the plugin
  marketplace; and the downloads you start, such as the box image and the built-in
  model.

## Source code

Homun is open source under the [Apache-2.0 license](/license/). The code is on
[GitHub](https://github.com/homun-app).
