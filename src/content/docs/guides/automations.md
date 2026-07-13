---
title: Automations
description: When → Then rules that run agentic tasks on a schedule or in response to an event.
---

An automation is a simple rule with two halves:

```text
When <trigger>  →  Then <action>
```

The trigger fires; the action runs as a full agentic [task](/reference/architecture/)
with the complete toolset.

![Homun's automation editor: a WHEN section with Schedule/Event and time options, a THEN action field, and an approval checkbox](../../../assets/screenshots/automations.png)
*Building a rule: choose a schedule or event, describe the action, and require confirmation before anything is sent.*

## Triggers

- **Time-based** — a schedule (e.g. every morning, every hour).
- **Event-based** — something happens: an incoming [channel](/guides/channels/)
  message, a connected service signal.

## Actions

The action is an **agentic task**, not a fixed script. It has access to the same
capabilities as the assistant: [skills](/guides/skills/),
[connectors](/guides/connectors/), the [contained computer](/guides/local-computer/),
and [memory](/guides/memory/). So "summarize my unread messages and file the
important ones" is a single rule, not a pipeline you wire by hand.

## Durable by design

Automations run on the durable task runtime: tasks survive restarts via a heartbeat
watchdog (lease renewal + a guard against double execution). A scheduled action won't
silently run twice or vanish if the app restarts mid-run.

## From a suggestion

You rarely start from a blank rule. Homun's [proactivity](/guides/proactivity/) engine
spots recurring work and offers a suggestion card; accepting it creates the
automation.
