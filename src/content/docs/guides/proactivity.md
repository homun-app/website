---
title: Proactivity
description: A supervisor engine that spots recurring work and proposes help before you ask.
---

A good apprentice doesn't wait to be told everything. Homun runs a **supervisor
engine** that watches for patterns in your work and offers help — turning observation
into suggestions you stay in control of.

![The Proactivity view: suggestion cards grouped by area, each with Open chat and Done actions](../../../assets/screenshots/proactivity.png)
*Suggestion cards — the assistant proposes; you open, act, or dismiss. Nothing runs on its own.*

## Suggestion cards

When the engine notices recurring work — a task you keep doing, a routine it can take
over — it surfaces a **suggestion card**. Nothing happens automatically: a suggestion
is an offer, not an action.

## From suggestion to automation

Accept a card and it becomes an [automation](/guides/automations/) — a `When → Then`
rule you can edit or remove. Decline it and it goes away. You decide what the
apprentice is allowed to take on.

## An addon, with scoped permissions

Proactivity is itself an **addon** (part of Homun's
[addon ecosystem](/reference/architecture/)): it runs as its own engine and panel and
declares exactly the permissions it uses — read suggestions, act on them, read memory,
read connectors, create a chat. Detach it and both its panel and engine go away.

![The Addons settings showing the Proactivity addon, active, with its permission scopes listed](../../../assets/screenshots/addons.png)
*Proactivity as an addon — explicit permission scopes, and a single toggle to turn it off.*

## Quiet by default

Proactivity lives *beneath* the chat, like the rest of Homun's operative power: it
appears as a card when relevant, never as noise in the base conversation. The
[product loop](/concepts/) — write, respond, understand — stays simple.
