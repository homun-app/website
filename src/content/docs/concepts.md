---
title: Core concepts
description: The pieces of Homun — bots, teams, the bot's computer, apps, skills, approvals, routines, memory and models — and how they fit together.
---

## Bots

A **bot** is an assistant with one job. It has a name, a mascot, a description it wrote
itself, a model, and its own chat. Bots keep working when you close the window: Homun stays
in the menu bar and finishes what it started.

One job per bot works better than one bot for everything: each bot keeps a focused
memory, its own skills and a computer of its own.

## Teams

A **team** groups several bots under a **coordinator**. You write to the team, the
coordinator splits the work, and you receive a short summary. See [Teams](/guides/teams/).

## The bot's computer

Every bot works inside a **box**: a contained computer with a browser, a terminal and its
own files. When a site has no app connection, the bot opens the browser and does the job
there. You can watch the screen and take over, for example to sign in. See
[The bot's computer](/guides/local-computer/).

## Apps

**Apps** are connections to the services you use: Gmail, Calendar, Trello, Slack and
more than a thousand others through Composio, plus any MCP server. You connect an app
once and every bot can use it. See [Apps](/guides/connectors/).

## Skills

A **skill** is a recipe: how to do a piece of work the way you like it. You can write
one, import one from GitHub, or ask a bot to save what it just did as a skill. See
[Skills](/guides/skills/).

## Approvals

Before a bot does something that cannot easily be undone (sending, paying, deleting,
publishing) it shows you an **approval card**. Messages are prepared as **drafts** and
leave only when you press **Send**. See [Approvals & safety](/guides/security/).

## Routines

A **routine** runs a request on a schedule, such as every weekday at 8:00. Bots notice
what you ask again and again and propose a routine; you activate it with one click. See
[Routines](/guides/automations/).

## Memory

Bots remember facts and rules between conversations, with the source and the date of
each one. Memory runs on [Engramma](/docs/engramma/), Homun's memory engine. See
[Memory](/guides/memory/).

## Models

Each bot uses a model you choose: a cloud provider, a model on your network, or the model
built into Homun that runs entirely on your machine. See [Models](/guides/models/).

## The Library

Documents, charts and files that bots prepare are saved in the **Library**, where you can
search, pin, rename and export them.
