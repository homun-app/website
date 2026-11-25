---
title: The bots' computer
description: The contained box where the bots browse, run commands and keep their files — one box shared by all of them — and how to take over its screen.
---

The bots share **one contained computer**: a box separate from your system, with a
browser, a terminal and files. Each bot has its own home folder inside, and a common
workspace belongs to them all. Real work happens there — filling in a form on a site that
has no app, for example — without touching your files.

## What you can see

Open the computer from the bot's panel to see four views:

- **Screen**: the browser, live;
- **Terminal**: the commands the bot runs;
- **Files**: what the bots saved in their box;
- **Activity**: what they did, step by step.

The **Computer** card in the panel tells you its state: **On** while a bot works, with
what it is doing (never the text of the commands), **Idle** when it is ready, **Starting**
while it boots, **Off** when it is stopped, **Preparing** while it is being set up.

## Taking over

Some steps are yours, such as signing in to a site. The bot shows a card — «{Bot} needs
you on their screen»: open the screen, sign in, then press **I'm done**. Your password
does not pass through the bot.

## The engine

The box needs an engine. **Settings › General › Bot computer** has **Where commands
run** — on the bots' computer, or directly on the Mac — and the **Engine** row:

- **Apple container**: on macOS 26 or later with an Apple chip. Homun downloads Apple's
  signed tool and the Linux kernel it recommends (about 1 GB); macOS asks for your
  password once.
- **Docker**: on other systems, or if you prefer it. Docker must be installed and open.

**Automatic** chooses for you. You can uninstall Apple's tool from the same section.

## Disk space

**Settings › General › Disk space** shows how much the box image, the bots' files, the
local model and the memory model take, and lets you free space. Removing the image stops
the computer and asks you to confirm: the image is rebuilt when needed. Deleting the
bots' files cannot be undone, and Homun asks you to confirm.
