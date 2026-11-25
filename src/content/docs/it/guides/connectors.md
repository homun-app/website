---
title: Plugin
description: Collega Gmail, Trello, Slack e altre mille app, o qualsiasi server MCP, una volta per tutti i bot.
---

Apri **Plugin** dalla barra laterale: connettori, server MCP e skill stanno tutti lì.
Colleghi un'app una volta e **tutti i bot possono usarla** (un'app può anche essere
limitata ad alcuni bot).

## Collegare un'app

Trova l'app nell'elenco dei connettori e premi collega. La scheda di ogni app dice da
dove passano i suoi dati:

- **MCP diretto**: Homun parla con il server del servizio dal tuo computer, senza
  intermediari — Notion, Linear, Cloudflare, Sentry e Stripe oggi funzionano così;
- **tramite Composio**: login e azioni passano dai server di Composio — Gmail, Trello,
  Slack, HubSpot e altre mille. L'accesso avviene nel browser, senza chiavi da creare, e
  la scheda dice che l'app passa da Composio.

## Più account

Puoi collegare più account della stessa app, per esempio la Gmail del lavoro e quella
personale. Ogni account ha un nome, che puoi cambiare, e i bot sanno quale stanno usando.
Le card di bozza mostrano l'account da cui partirà il messaggio.

## Cosa possono fare i bot con un'app

Le app seguono le stesse regole di tutto il resto, quelle di **Quando chiedere** in
[Approvazioni e sicurezza](/it/guides/security/):

- **leggere** è libero;
- **inviare** diventa una [bozza](/it/guides/chat/#le-bozze) che parte solo se confermi;
- **scrivere** (creare, modificare, cancellare) mostra una card di approvazione.

## Server MCP

Dal menu **Aggiungi** scegli **Server MCP personalizzato**: un comando locale (stdio) o
un indirizzo (HTTP). I token bearer vengono salvati cifrati, e la connessione viene
provata appena salvi — la riga dice quanti strumenti offre il server.

## Nessun collegamento? Il browser

Quando un sito non ha un'app, il bot può aprire il browser sul [computer dei
bot](/it/guides/local-computer/) e fare il lavoro lì.
