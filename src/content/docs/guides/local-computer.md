---
title: The bot's computer
description: The contained box where each bot browses, runs commands and keeps its files, and how to take over its screen.
---

Every bot works on **a computer of its own**: a contained box, separate from your system,
with a browser, a terminal and a folder of files. The bot can do real work there, such as
filling in a form on a site that has no app, without touching your files.

## What you can see

Open the bot's computer from the chat to see four views:

- **Screen**: the browser, live;
- **Terminal**: the commands the bot runs;
- **Files**: what the bot saved in its box;
- **Activity**: what it did, step by step.

The **Computer** card in the chat tells you its state: **On** while the bot works, with
what it is doing (never the text of the commands), **Waiting** when it is ready,
**Starting** while it boots, **Off** when it is stopped.

## Taking over

Some steps are yours, such as signing in to a site. The bot shows a **Screen takeover**
card: open the screen, sign in, then press **I'm done**. Your password does not pass
through the bot.

## The engine

The box needs an engine. **Settings › General › Engine** shows which one runs it:

- **Apple container**: on macOS 26 or later with an Apple chip. Homun installs Apple's
  signed package (macOS asks for your password) and nothing else is needed.
- **Docker**: on other systems, or if you prefer it. Docker Desktop must be installed
  and open.

**Automatic** chooses for you. You can uninstall Apple's tool from the same section.

## Disk space

**Settings › General › Disk space** shows how much the box image and the bots' files
take, and lets you free space. Removing the image is safe: it is rebuilt when needed.
Deleting the bots' files cannot be undone, and Homun asks you to confirm.
