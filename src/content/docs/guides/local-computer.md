---
title: The local computer
description: A sandboxed Docker computer — a real browser and shell the agent drives, and you watch live.
---

For tasks that need to *do* things — open a site, fill a form, run a command — Homun
drives a **contained computer**: a sandboxed Docker container with a real headed
browser and a shell. It's isolated from your host, and you can watch it work.

![The Local computer panel: a live noVNC browser view, Docker container status, memory usage and an artifacts section](../../../assets/screenshots/local-computer.png)
*The contained computer: a real browser streamed live over noVNC, running in a Docker container you can stop anytime.*

## What's inside

- A **real browser**, driven over CDP (Chrome DevTools Protocol).
- A **shell + toolchain**, used to run [skills](/guides/skills/) and commands.
- A **live view** (noVNC) streamed into the chat.

## Watch and take over

The session appears as an inline [activity card](/guides/chat/): a timeline with
progress, previews, and controls. You can **watch it live** and **take over** when you
want to steer manually — the agent operates under approvals, not unattended.

## Challenges and captchas

The agent handles simple human-verification challenges itself — a **press-and-hold**
("tieni premuto") button, a checkbox, a slider — by driving the real pointer the way a
person would.

For anything harder (image grids, login walls) it doesn't guess: it **hands off to
you**. The task pauses, you solve the challenge in the live view, and it resumes. And
because a task you launched while away must never hang, the handoff **times out**
(default 180s, override with `HOMUN_BROWSER_HANDOFF_TIMEOUT_SECS`): past the deadline
the task gives up gracefully with a clear reason instead of waiting forever.

## Harder to detect

The browser is a **real, headed Chrome** — not old-style headless — with a
**persistent profile**, so its cookies and logins survive between runs. Sites see a
returning person rather than a fresh bot, which means captchas show up far less often.
Homun also drives it through a hardened automation layer that avoids the usual
"controlled by automated software" fingerprints. There's no perfect invisibility
(your IP reputation still matters), but day to day you'll hit far fewer walls.

## Requirements

- **Desktop:** a local Docker engine (Docker Desktop, OrbStack, or Colima). Enable it
  from the sidebar bell or **Settings → Computer**.
- **Server:** mount the host Docker socket; the gateway builds and runs the sibling
  container, and reverse-proxies the live view through its own TLS origin — no exposed
  VNC port. Without the socket the feature stays off and the rest of the app works.

See [Self-hosting](/guides/self-hosting/) for the server-side setup.

## Contained by design

Running in a sandbox is a [security](/guides/security/) choice: the agent's
real-world actions happen in a container with deny-by-default permissions, not on your
machine directly.
