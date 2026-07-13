---
title: Getting started
description: Install the Homun desktop app and run it for the first time.
---

The fastest way to try Homun is the **desktop app**. To run it on a server instead,
see [Self-hosting](/guides/self-hosting/).

## Install (macOS)

1. Download the latest `.dmg` from the [releases](https://github.com/homun-app/homun-releases/releases/latest).
2. Open it and drag **Homun** into `Applications`.
3. Launch it. The build is signed and notarized, so it opens without a Gatekeeper
   warning.

The app bundles its own backend (a small native gateway) — there's nothing else to
install.

## First run

1. **Pick a model provider.** Point Homun at a local [Ollama](https://ollama.com) or
   a cloud provider's API. You can enable several at once; each provider has an
   on/off switch and the router picks the right model per task.
2. **Say hello.** Start a chat. Homun builds a private memory as you talk — what it
   learns stays in `~/.homun` on your machine.

## Make it yours

In **Settings → Appearance** you can pick an interface surface (Cold, Ivory, Neutral,
Sand) and a brand accent. The default accent is **teal**, but you can change it — it
applies to the whole app instantly.

![Settings → Appearance: surface options and an accent picker with teal selected](../../../assets/screenshots/appearance.png)
*Surface tones plus a one-click accent — teal by default, yours to change.*

## The local computer (optional)

For tasks that need a real browser or shell, Homun runs a **contained computer** — a
sandboxed Docker container it controls. It needs Docker running locally
(Docker Desktop, OrbStack, or Colima). Enable it from the sidebar bell or the
**Computer** section in Settings; you can watch the session live in the chat.

## Updates

The desktop app updates itself: when a newer version is published, the
**Notifications** panel (the sidebar bell) shows a one-click **download + restart**.

## Next

- [Self-hosting](/guides/self-hosting/) — run the same app as a container you own.
- [Architecture](/reference/architecture/) — what's under the hood.
