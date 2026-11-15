---
title: App
description: Collega Gmail, Trello, Slack e più di mille altre app, o qualsiasi server MCP, una volta per tutti i bot.
---

Apri **App** dalla barra laterale. Colleghi un'app una volta e **tutti i bot possono
usarla**: i bot sanno quali app hai collegato e le usano subito.

## Collegare un'app

Cerca l'app e collegala. Homun ti dice da dove passano i suoi dati:

- **Diretta**: il permesso resta sul tuo computer, e Homun parla direttamente con il
  servizio.
- **Tramite Composio**: login e azioni passano dai server di Composio. Con una tua chiave
  Composio (basta il piano gratuito) colleghi più di mille app, come Gmail, Slack e
  HubSpot.

## Più account

Puoi collegare più account della stessa app, per esempio la Gmail del lavoro e quella
personale. Ogni account ha un nome, che puoi cambiare, e i bot sanno quale stanno usando.
Le card di bozza mostrano l'account da cui partirà il messaggio.

## Cosa possono fare i bot con un'app

Le app seguono le stesse regole di tutto il resto:

- **leggere** è libero;
- **inviare** diventa una [bozza](/it/guides/chat/#le-bozze) che parte solo se confermi;
- **scrivere** (creare, modificare, cancellare) mostra una card di approvazione.

Vedi [Approvazioni e sicurezza](/it/guides/security/) per cambiare quanto spesso chiedono
i bot.

## Server MCP

In **Per sviluppatori** puoi aggiungere i tuoi server MCP, come comando locale (stdio) o
come indirizzo (HTTP). Header e token bearer vengono salvati cifrati. Con **test** vedi gli
strumenti che il server offre.

## Nessun collegamento? Il browser

Quando un sito non ha un'app, il bot apre il browser sul [suo computer](/it/guides/local-computer/)
e fa il lavoro lì.
