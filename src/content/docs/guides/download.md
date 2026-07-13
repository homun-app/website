---
title: Download
description: Get the Homun desktop app for macOS, Windows, or Linux — or self-host it.
---

Homun ships as a desktop app for macOS, Windows, and Linux. The homepage detects your
operating system and selects the newest matching installer automatically. You can also
choose another platform or browse the
[latest release](https://github.com/homun-app/homun-releases/releases/latest) manually.
Prefer a server? [Self-host it](/guides/self-hosting/) instead.

## macOS

The public feed currently contains a signed and notarized Apple Silicon `.dmg`.

1. Use the [adaptive download on the homepage](/#download), or download the latest
   `.dmg` from the [release page](https://github.com/homun-app/homun-releases/releases/latest).
2. Open it and drag **Homun** into `Applications`.
3. Launch it — the build is **signed and notarized**, so it opens without a Gatekeeper
   warning.

The app bundles its own backend and **auto-updates**: when a new version ships, the
Notifications panel (the sidebar bell) offers a one-click download + restart.

## Windows

Download the public `.exe` from the [homepage](/#download) or the
[latest release](https://github.com/homun-app/homun-releases/releases/latest). Windows
may show a SmartScreen warning until code-signing is confirmed for the selected build.

## Linux

The public feed offers two formats:

- `.AppImage` — portable across distributions; mark it executable with
  `chmod +x Homun-*.AppImage` before launching it.
- `.deb` — installs on Debian, Ubuntu, and compatible distributions.

Choose either format from the [homepage download selector](/#download) or from the
[latest release](https://github.com/homun-app/homun-releases/releases/latest).

## System requirements

- **Disk/RAM** for a local model are driven by your choice of
  [provider](/guides/models/) — local [Ollama](https://ollama.com) needs room for the
  model; cloud providers need almost none.
- **Docker** (Docker Desktop, OrbStack, or Colima) is optional, only for the
  [contained computer](/guides/local-computer/).
