---
title: Architecture
description: The parts of Homun 0.3 and how they fit together.
---

Homun 0.3 is a desktop app. Everything that keeps your bots running lives on your
computer; the only parts that reach the network are the models and apps you choose.

## The parts

| Part | What it does |
| --- | --- |
| **The app** | The window you use: chats, teams, apps, skills, settings. |
| **The background process** | Keeps bots, routines and teams running when the window is closed. It is the app itself, signed like the app. Homun stays in the menu bar. |
| **The agent loop** | For each request: the model answers, asks for tools, each tool call goes through approvals, results go back to the model, until the work is done. |
| **The transcript** | Every chat is a sequence of events (messages, tool calls, results, approvals) saved in a local SQLite database. |
| **The bot's computer** | One contained box per bot, run by Apple container or Docker, with a browser, a terminal and files. |
| **Apps** | Direct connections, Composio, and MCP servers, exposed to bots as tools. |
| **Memory** | [Engramma](/docs/engramma/), a local engine written in Rust, with notes, sources, history and quarantine. |
| **The Vault** | Encrypted secrets and logins; the key is held by the system keychain. |
| **Models** | Cloud providers, local servers, and the built-in model, behind one interface. |
| **Updates** | Signed releases from GitHub, with release notes shown before you install. |

## Where things run

- **On your computer**: the app, the background process, the transcripts, the memory,
  the Vault, the Library, the bots' boxes, and the built-in model if you install it.
- **On services you choose**: cloud models, apps you connect Through Composio, and the
  services your apps talk to.

## Source code

Homun is open source under the [Apache-2.0 license](/license/). The code is on
[GitHub](https://github.com/homun-app).
