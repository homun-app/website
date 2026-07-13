---
title: Architettura
description: Come i pezzi di Homun si incastrano.
---

Homun è un **gateway** più una UI web, impacchettato in due modi dallo stesso codice:
un'app desktop (shell Electron attorno al gateway) e un container self-hosted. Le build
desktop e server eseguono lo *stesso* gateway — cambia solo come asset ed env sono
cablati.

## Il gateway

Un piccolo servizio nativo (Rust + axum) che possiede tutto: chat, lo store di memoria,
task e automazioni, provider/routing dei modelli, canali e il computer contenuto. Serve
la UI web e l'API su una sola porta, e tiene tutto lo stato sotto `HOMUN_DATA_DIR`
(`~/.homun` su desktop, un volume montato su un server).

## Memoria

Un grafo privato in semplice SQLite + file. I fatti sono estratti dalle conversazioni,
collegati a entità (persone, progetti, luoghi…) e consolidati nel tempo. È locale per
impostazione predefinita; nulla lascia la macchina.

## Provider e routing dei modelli

Configuri uno o più provider di inferenza (Ollama locale o API cloud). Ognuno ha un
interruttore **abilita/disabilita** indipendente. Il router risolve un modello **per
ruolo** (un binding manuale, o un match automatico per capacità) tra i provider
*abilitati* — non c'è un singolo modello cablato.

## Automazioni

Una regola = **trigger → azione**. Il trigger è a tempo (una pianificazione) o a evento
(un messaggio in arrivo, un servizio connesso). L'azione è un task agentico con tutto il
toolset — skill, connettori, browser, memoria.

## Il computer contenuto

Per i task del mondo reale l'agente guida un container Docker in sandbox (un browser
headed via CDP + una shell). Sulla build server, la sua vista dal vivo (noVNC) è
reverse-proxata attraverso il gateway così un browser remoto può guardarla sullo stesso
dominio TLS.

## Distribuzione

L'app desktop si auto-aggiorna da un feed di release pubblico (build firmate +
notarizzate); il sorgente resta privato. L'immagine server si ri-builda a ogni modifica e
si aggiorna via un webhook di redeploy del PaaS. Vedi
[Self-hosting](/it/guides/self-hosting/).
