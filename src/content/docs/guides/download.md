---
title: Download
description: Get Homun for macOS, or try the Windows and Linux beta.
---

The [homepage](/#download) detects your system and offers the right installer. You can
also choose a file from the
[latest release](https://github.com/homun-app/homun-releases/releases/latest).

## macOS

Download the `.dmg`, open it and drag **Homun** into `Applications`. The app is signed
and notarized, so it opens without a warning.

For the [bot's computer](/guides/local-computer/):

- on **macOS 26 or later with an Apple chip**, Homun uses Apple container and nothing
  else is needed;
- on earlier versions, install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

## Windows (beta)

Download the `.exe` installer. Windows and Linux builds are in **beta**: some parts may
work differently from macOS. Windows may show a SmartScreen warning the first time.

## Linux (beta)

Two formats:

- `.AppImage`: runs on most distributions. Make it executable with
  `chmod +x Homun-*.AppImage`, then open it.
- `.deb`: installs on Debian, Ubuntu and compatible distributions.

## Requirements

- A [model](/guides/models/): an API key for a cloud provider, a model on your network,
  or room for the built-in model (about 2.7 GB on disk, 16 GB of memory recommended).
- Disk space for the bot's computer. **Settings › General › Disk space** shows what it
  takes.

## Updates

Homun updates itself when it is installed in `Applications`: it tells you when a new
version is available, shows what changes, and lets you restart now or install when you
quit.
