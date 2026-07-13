---
title: Download
description: Get the Homun desktop app for macOS, Windows, or Linux — or self-host it.
---

Homun ships as a desktop app for all three platforms. macOS is **signed, notarized,
and published** today; Windows and Linux are built and on the way. Prefer a server?
[Self-host it](/guides/self-hosting/) instead.

## macOS

The recommended way to try Homun.

1. Download the latest `.dmg` from the
   [releases page](https://github.com/homun-app/homun-releases/releases/latest).
2. Open it and drag **Homun** into `Applications`.
3. Launch it — the build is **signed and notarized**, so it opens without a Gatekeeper
   warning.

The app bundles its own backend and **auto-updates**: when a new version ships, the
Notifications panel (the sidebar bell) offers a one-click download + restart.

## Windows & Linux

Both are built by CI (`.exe` for Windows, `.AppImage` and `.deb` for Linux), but they
are **not yet code-signed**, so they aren't published to the public release feed and
don't auto-update yet.

What that means for now:

- **Windows** — the unsigned `.exe` triggers a SmartScreen warning you'd have to
  bypass manually.
- **Linux** — the `.AppImage` needs to be marked executable (`chmod +x`) before it
  runs; the `.deb` installs on Debian/Ubuntu-based distros.

We're holding public Windows/Linux downloads until they're signed. If you want to run
Homun on those platforms today, [self-hosting](/guides/self-hosting/) is the portable
option and works everywhere Docker does.

## System requirements

- **Disk/RAM** for a local model are driven by your choice of
  [provider](/guides/models/) — local [Ollama](https://ollama.com) needs room for the
  model; cloud providers need almost none.
- **Docker** (Docker Desktop, OrbStack, or Colima) is optional, only for the
  [contained computer](/guides/local-computer/).
