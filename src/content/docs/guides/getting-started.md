---
title: Getting started
description: Install Homun, follow the guided setup, and meet your first bot.
---

## Install

1. Download Homun from the [homepage](/#download). It picks the installer for your
   system. The [Download](/guides/download/) page says what is offered today.
2. On macOS, open the `.dmg` and drag **Homun** into `Applications`. The app is signed
   and notarized.
3. Open Homun from `Applications`.

If you open Homun from somewhere else, such as the disk image or `Downloads`, it offers to
move itself into `Applications`. Do it: from anywhere else, updates cannot be installed.

## The guided setup

The first time you open Homun, a short guide takes you from nothing to a working bot.

1. **You.** Give your first bot a name and a look: a mascot family and a colour. This bot
   is your point of contact: it answers you, works for you and coordinates the others.
   You can change it later.
2. **Model.** Choose the brain of your bots. Connect a cloud provider with an API key —
   the guide tests it right there —, pick Ollama if it is running on your Mac, or install
   the model built into Homun. See [Models](/guides/models/).
3. **Computer.** On macOS 26 or later with an Apple chip, Homun prepares the bots'
   computer: it downloads Apple's container tool and the Linux kernel it recommends, and
   macOS asks for your password once. On other systems you can skip this step and set
   the computer up later with Docker. See [The bots' computer](/guides/local-computer/).
4. **Permissions.** Choose how much your bot may do on its own:
   - **Ask me first**: it reads and searches by itself, and asks before it changes
     anything;
   - **Do what I ask**: it does on its own whatever your request needs, and still asks
     for money, messages to new people, deletions and anything outside the request.

   You can change this at any time in **Settings › Approvals**. See
   [Approvals & safety](/guides/security/).

## Your first conversation

Write to your bot as you would to a person. A new bot introduces itself: it asks what it
is for, writes its own description and starts working. A few ideas:

- *"Every morning, sort my inbox and draft replies to what can't wait."*
- *"Compare the three venues on this list and tell me which one fits 40 people."*
- *"Prepare a short brief for each of tomorrow's meetings."*

To make more bots, press **+** in the sidebar, or **Start from a template**: Inbox
manager, Daily briefing editor, Meeting preparation assistant, Chief of staff, Executive
assistant, Mention monitor.

## Updates

Installed from `Applications`, Homun checks for new versions by itself. When one is
available it tells you and shows what changes; nothing downloads until you choose to,
and you can restart then or install when you quit. **Settings › General › Version and
updates** has **Check for updates** and **Get pre-release versions**.

## Next

- [Core concepts](/concepts/): how bots, teams, apps and approvals fit together.
- [Plugins](/guides/connectors/): connect the apps your bots will use.
