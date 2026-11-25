---
title: Core concepts
description: The pieces of Homun — bots, teams, the bots' computer, apps, skills, approvals, routines, memory and models — and how they fit together.
---

## Bots

A **bot** is an assistant with one job. It has a name, a mascot, a description, a model, and its own chat. Bots keep working when you close the window: Homun keeps running in the background and finishes what it started.

One job per bot works better than one bot for everything: each bot keeps a focused memory and its own skills, and they all work in the same contained computer.

## Teams

A **team** groups several bots under a **coordinator**. You write to the team, the members do their part, and the coordinator closes the work with a **summary for you**. See [Teams](/guides/teams/).

## The bots' computer

The bots share **one contained computer**: a box separate from your system with a browser, a terminal and files. Each bot has its own home folder inside it. When a site has no app connection, the bot can open the browser and do the job there. You can watch the screen and take over, for example to sign in. See [The bots' computer](/guides/local-computer/).

## Apps

**Apps** are connections to the services you use: Gmail, Calendar, Trello, Slack and a thousand more through Composio, plus any MCP server. You connect an app once and every bot can use it. See [Apps](/guides/connectors/).

## Skills

A **skill** is a recipe: how to do a piece of work the way you like it. You can write one, pick one from the built-in catalog, or ask a bot to save what it just did as a skill. See [Skills](/guides/skills/).

## Approvals

You decide how much a bot may do on its own: **Ask**, **Automatic** or **Never ask**. Messages to other people are prepared as **drafts** that wait for you. See [Approvals & safety](/guides/security/).

## Routines

A **routine** runs a request on a schedule, such as every weekday at 8:00. Homun notices what you ask again and again and suggests a routine; you activate it with one click. See [Routines](/guides/automations/).

## Memory

Bots remember facts and rules between conversations, with the source and the date of each one. Memory runs on [Engramma](/docs/engramma/), Homun's memory engine. See [Memory](/guides/memory/).

## Models

Each bot uses a model you choose: a cloud provider, a model on your network, or the model built into Homun that runs entirely on your machine. See [Models](/guides/models/).

## The Library

Documents, charts and files that bots prepare are saved in the **Library**, where you can search, pin, rename and export them.
