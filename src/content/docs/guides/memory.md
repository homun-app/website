---
title: Memory
description: What a bot remembers between conversations, where each memory comes from, and how to correct or forget it.
---

Bots remember facts and rules between conversations: that a client signs only annual
contracts, how you like your reports, who to copy on invoices. Memory runs on
[Engramma](/docs/engramma/), Homun's memory engine, and stays on your computer.

## What a memory looks like

Every memory is a short note with its **source** and its **date**. When a bot uses a
memory, you can see where it comes from. When something changes, the old version is kept
in the history instead of being overwritten.

Memories belong to one bot, or are **shared** by every bot.

## Opening a bot's memory

In the bot panel, open **Memory**. You can search, filter by bot or shared memories, and
see which memories are active, waiting for confirmation or deleted.

## Waiting for confirmation

What a bot learns from the web or from other external data does not enter its memory
directly: it waits in **waiting for confirmation** until you confirm it. A page cannot
plant a memory by itself.

## Correcting and forgetting

Delete a memory and it moves to the deleted list. From there you can forget it for good.

## Better search

Out of the box, memory search works on text and on the links between notes. For search
that also finds notes written with different words, download the memory model
(about 400 MB) from the Memory panel. You can remove it from **Settings › General › Disk
space**.

Read more in the [Engramma docs](/docs/engramma/how-it-works/).
