---
title: Download
description: Get Homun for macOS — today the 0.3 beta for Apple Silicon.
---

The [homepage](/#download) offers the current release for your system and picks
the right installer. Today that is the **0.3 beta for macOS**: there is no
stable 0.3 yet, and the site will offer it on its own as soon as one ships.

## macOS (beta · Apple Silicon)

Download the `.dmg`, open it and drag **Homun** into `Applications`. The app is
signed and notarized, so it opens without a warning. The installer fits
**Apple Silicon** Macs; there is no Intel build yet.

For the [bots' computer](/guides/local-computer/):

- on **macOS 26 or later with an Apple chip**, Homun sets up Apple container: it
  downloads Apple's signed tool and the Linux kernel it recommends (about 1 GB),
  and macOS asks for your password once;
- on earlier versions, install
  [Docker Desktop](https://www.docker.com/products/docker-desktop/) and keep it
  open.

## Windows and Linux

Not yet. The 0.3 line ships on macOS first; Windows and Linux builds will join
it. Every published file, the 0.2 installers included, is on the
[releases page](https://github.com/homun-app/homun-releases/releases).

## Requirements

- A [model](/guides/models/): an API key for a cloud provider, a model on your
  network, or room for the built-in one (about 2.5 GB on disk — it needs Apple
  Silicon, and with less than 16 GB of memory the app warns you it will be
  slow).
- Disk space for the bots' computer. **Settings › General › Disk space** shows
  what it takes and lets you free it.

## Updates

Installed in `Applications`, Homun checks for new versions by itself, at startup
and every six hours. When one is available it tells you and shows what changes;
nothing downloads until you choose to, and you can restart then or install when
you quit. **Settings › General › Version and updates** has **Check for
updates** and **Get pre-release versions**.
