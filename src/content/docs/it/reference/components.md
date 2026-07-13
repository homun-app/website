---
title: Componenti
description: I mattoni dietro il gateway — il core Rust e i suoi crate.
---

[Architettura](/it/reference/architecture/) mostra il quadro generale: un gateway,
impacchettato come app desktop o come container. Questa pagina scende di un livello — i
pezzi che compongono il core.

## La shell desktop

Un'app **Electron** con una UI **React + TypeScript**. La shell è sottile: rende
l'interfaccia e parla con il gateway su un boundary HTTP locale. La stessa UI è servita
direttamente dal gateway su un server self-hosted.

## Il gateway

Un servizio nativo **Rust + axum** che possiede chat, stato, provider, canali, task e il
computer contenuto. Espone l'API e serve la UI web su una porta sola, ed è il boundary
unico per streaming, approvazioni, audit e read model redatti. Internamente è diviso in
crate mirati:

| Crate | Responsabilità |
| --- | --- |
| `desktop-gateway` | il gateway HTTP: thread, messaggi, streaming, read model |
| `orchestrator` | il **Brain** — un router/planner ibrido con registry tool lazy |
| `inference` | routing provider (Ollama, OpenAI-compatibile, Anthropic) + registry modelli |
| `task-runtime` | il durable task runtime (heartbeat, retention, export) |
| `subagents` | subagenti locali coordinati dal core, non dall'LLM |
| `memory` | lo store di memoria ibrido (SQLite + grafo + wiki) |
| `capabilities` | lo strato di capacità neutrale + il routing |
| `skill-runtime` / `process-skill` | esecuzione delle skill, sandboxata |
| `browser-automation` | il sidecar browser (Playwright/CDP) |
| `local-computer-session` | la sessione del computer contenuto e le sue superfici |
| `process-manager` | gestione di processi figli/sidecar |
| `context-compression` | compressione del contesto per le finestre dei modelli |
| `secrets` | storage locale dei segreti |

## Come scorre un turno

1. La UI manda un messaggio al **gateway**.
2. L'**orchestrator** (Brain) pianifica, vedendo card di capacità compatte e caricando il
   dettaglio dei tool su richiesta.
3. **Inference** instrada il lavoro al provider/modello giusto per ruolo.
4. I passi operativi girano nello **strato di capacità** con permessi deny-by-default —
   [skill](/it/guides/skills/), [connettori](/it/guides/connectors/), il
   [computer contenuto](/it/guides/local-computer/) — registrati nell'audit trail.
5. I risultati tornano in streaming; la [memoria](/it/reference/memory-model/) cattura
   ciò che conta.

Il core resta proprietario di policy, esecuzione, coda e approvazioni — il modello
propone, il core decide.
