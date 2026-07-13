---
title: Self-hosting
description: Esegui Homun come un singolo container 12-factor su qualsiasi PaaS self-hosted.
---

Homun è distribuito come **singolo container 12-factor**, quindi gira in modo identico su
qualsiasi PaaS self-hosted — Coolify, Dokku, CapRover, Kamal o `docker compose` puro.
Puntiamo al contratto standard dei container, non a un PaaS specifico.

## Il contratto

| Requisito | Come Homun lo soddisfa |
| --- | --- |
| Una immagine OCI | un `Dockerfile` multi-stage (gateway Rust + build web → runtime slim) |
| Ascolto su `0.0.0.0:$PORT` | `HOMUN_DESKTOP_GATEWAY_HOST` (default `0.0.0.0`) + `PORT` |
| Tutta la config via env | vedi sotto |
| Stato in una sola dir montata | `HOMUN_DATA_DIR` (default `/data`) — ogni store vive qui |
| Health check | `GET /api/health` (senza auth) |
| Una unità di deploy | il gateway serve la UI web **e** l'API sulla stessa porta |

## Ambiente

| Variabile | Default | Scopo |
| --- | --- | --- |
| `HOMUN_DESKTOP_GATEWAY_HOST` | `0.0.0.0` | indirizzo di bind |
| `PORT` | `18765` | porta di ascolto (il PaaS di solito la inietta) |
| `HOMUN_DATA_DIR` | `/data` | tutto lo stato persistente — **monta un volume qui** |
| `HOMUN_DESKTOP_GATEWAY_TOKEN` | generato | bearer token richiesto dall'API (impostalo esplicitamente) |
| inferenza / provider | — | chiavi dei provider o un URL Ollama — tutto via env |

## Avvio rapido (docker compose)

```bash
echo "HOMUN_DESKTOP_GATEWAY_TOKEN=$(openssl rand -hex 32)" > .env
docker compose up -d --build
# UI + API su http://<host>:18765 ; i dati persistono nel volume.
```

Ogni PaaS fa le stesse tre cose: **builda l'immagine**, **imposta le env var**,
**monta un volume su `HOMUN_DATA_DIR`**, e instrada un dominio sulla porta.

## Accesso

La build web include un **gate di login**: il bearer token **non** è incorporato nel
bundle. Al primo caricamento inserisci il `HOMUN_DESKTOP_GATEWAY_TOKEN`; viene validato e
conservato nel browser. Per un host a utente singolo, metti anche un primo strato davanti
— una rete privata (Tailscale/WireGuard) o basic auth sul reverse proxy.

## Il computer contenuto (opzionale)

Il browser/sandbox dell'agente gira come container Docker fratello. Monta il socket
Docker dell'host e imposta il blocco env del computer contenuto (rete + host
CDP/noVNC/Whisper); il gateway costruisce ed esegue il fratello per te. La **vista dal
vivo** è reverse-proxata attraverso l'origine pubblica del gateway stesso, così puoi
guardare la sessione sullo stesso dominio TLS — nessuna porta VNC esposta. Senza il
socket, la funzione resta spenta e il resto dell'app funziona.

## Aggiornamenti

Un container non può sostituire la propria immagine dall'interno, quindi imposta
`HOMUN_UPDATE_WEBHOOK` sul **webhook di redeploy** del tuo PaaS. Il pannello Notifiche
mostra poi un **Aggiorna** a un clic che innesca un redeploy all'ultima immagine.
