---
title: Self-hosting
description: Run Homun as a single 12-factor container on any self-hosted PaaS.
---

Homun ships as a **single 12-factor container**, so it runs identically on any
self-hosted PaaS — Coolify, Dokku, CapRover, Kamal, or plain `docker compose`. We
target the standard container contract, not a specific PaaS.

## The contract

| Requirement | How Homun meets it |
| --- | --- |
| One OCI image | a multi-stage `Dockerfile` (Rust gateway + web build → slim runtime) |
| Listen on `0.0.0.0:$PORT` | `HOMUN_DESKTOP_GATEWAY_HOST` (default `0.0.0.0`) + `PORT` |
| All config via env | see below |
| State in one mounted dir | `HOMUN_DATA_DIR` (default `/data`) — every store lives here |
| Health check | `GET /api/health` (no auth) |
| One deployable unit | the gateway serves the web UI **and** the API on the same port |

## Environment

| Var | Default | Purpose |
| --- | --- | --- |
| `HOMUN_DESKTOP_GATEWAY_HOST` | `0.0.0.0` | bind address |
| `PORT` | `18765` | listen port (PaaS usually injects it) |
| `HOMUN_DATA_DIR` | `/data` | all persistent state — **mount a volume here** |
| `HOMUN_DESKTOP_GATEWAY_TOKEN` | generated | bearer token the API requires (set it explicitly) |
| inference / providers | — | provider keys or an Ollama URL — all via env |

## Quick start (docker compose)

```bash
echo "HOMUN_DESKTOP_GATEWAY_TOKEN=$(openssl rand -hex 32)" > .env
docker compose up -d --build
# UI + API on http://<host>:18765 ; data persists in the volume.
```

Every PaaS does the same three things: **build the image**, **set the env vars**,
**mount a volume at `HOMUN_DATA_DIR`**, and route a domain to the port.

## Access

The web build ships a **login gate**: the bearer token is **not** baked into the
bundle. On first load you enter the `HOMUN_DESKTOP_GATEWAY_TOKEN`; it's validated and
kept in your browser. For a single-user host, also put a first layer in front — a
private network (Tailscale/WireGuard) or basic auth at the reverse proxy.

## The contained computer (optional)

The agent's browser/sandbox runs as a sibling Docker container. Mount the host Docker
socket and set the contained-computer env block (network + CDP/noVNC/Whisper hosts);
the gateway builds and runs the sibling for you. The **live view** is reverse-proxied
through the gateway's own public origin, so you can watch the session over the same
TLS domain — no exposed VNC port. Without the socket, the feature stays off and the
rest of the app works.

## Updates

A container can't replace its own image from the inside, so set `HOMUN_UPDATE_WEBHOOK`
to your PaaS **redeploy webhook**. The Notifications panel then shows a one-click
**Update** that triggers a redeploy to the latest image.
