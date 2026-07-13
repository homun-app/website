---
title: Decisioni di design
description: Le scelte architetturali che danno forma a Homun, e perché.
---

Il design di Homun è deliberato. Queste sono le decisioni che contano di più — il
*perché* dietro a come i pezzi si incastrano.

## Local-first, cloud opzionale

Dati e memoria restano sul dispositivo di default; i modelli cloud sono una delega
opt-in, mai un requisito. Questo guida tutto, dal layout di storage (`~/.homun`) al
modello di permessi deny-by-default.

## Un gateway locale come boundary

La chat non dipende da bridge nativi per gli stream lunghi. Un **gateway HTTP Rust**
locale su `127.0.0.1` è il boundary unico per thread, messaggi, streaming, cancel,
approvazioni, audit e read model redatti. Desktop e server eseguono lo *stesso* gateway.

## Routing dei provider, non un runtime unico

L'inferenza è uno **strato di routing**, non un singolo modello incorporato. Tipi
neutrali rispetto al provider (Ollama, OpenAI-compatibile, Anthropic), un registry dei
modelli e il routing per ruolo fanno sì che non ci sia un modello cablato — e il
local-first resta il default.

## Un solo Brain, il core decide

Un singolo **orchestrator/Brain** pianifica, vedendo card di capacità compatte e
caricando il dettaglio dei tool in modo lazy. Il core Rust resta proprietario di policy,
esecuzione, coda, approvazioni e audit. Il modello propone; il core decide e valida
l'output strutturato prima di agire.

## Esecuzione contenuta

Le azioni del mondo reale girano dentro un **computer Docker contenuto** (un vero browser
via CDP + una shell), isolato dall'host. Le capacità sono deny-by-default e il browser si
ferma prima di login, dati personali, pagamenti e acquisti.

## Un core agnostico + addon

Il core è agnostico rispetto alle capacità; le funzioni si innestano come **addon** con
motore, pannello e permessi circoscritti propri, e si possono staccare in modo pulito. I
connettori spaziano tra nativi, MCP e aggregatori gestiti opt-in, instradati su richiesta.

## Durevole di default

I task sopravvivono ai riavvii grazie a un heartbeat watchdog (rinnovo del lease + guardia
contro la doppia esecuzione). Retention (cascade purge + VACUUM) ed export dei dati sono
di prima classe.

## Inglese di default, multilingua

L'inglese è il substrato neutrale per le istruzioni all'LLM; l'output segue la lingua
dell'utente. La UI è localizzata (inglese + italiano), e ogni plugin porta le proprie
traduzioni come namespace autocontenuto.

## OpenHuman come riferimento, non blueprint

L'arte precedente come OpenHuman è studiata per pattern e trade-off, ma non copiata. Ogni
idea adottata passa da una decisione esplicita su cosa risolve e come viene adattata.
