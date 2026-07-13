---
title: Connettori
description: Uno strato di capacità — connettori nativi, server MCP e integrazioni gestite opt-in, instradate su richiesta.
---

I connettori sono il modo in cui Homun raggiunge il mondo esterno. Stanno dietro uno
**strato di capacità neutrale rispetto al provider**, così l'assistente lavora allo
stesso modo che una capacità sia nativa, venga da un server MCP o da un aggregatore
gestito.

## Tre tipi

| Tipo | Cos'è |
| --- | --- |
| **Nativi** | connettori integrati in Homun |
| **MCP** | qualsiasi server [Model Context Protocol](https://modelcontextprotocol.io) che aggiungi |
| **Gestiti** | aggregatori opt-in (stile Composio) — adattatori espliciti, mai una dipendenza implicita del core |

### Gestiti: il toolkit Composio

Il toolkit gestito collega centinaia di servizi — Gmail, GitHub, Slack, Notion, Google
Calendar, Google Drive, Linear, HubSpot, Airtable e altri — organizzati per categoria
(developer tools, CRM, documenti, analytics, marketing…). Colleghi solo quelli che
concedi, e ogni connessione è esplicita.

![Connettori → Composio: una griglia di servizi con Gmail, GitHub, Slack, Notion e Google Calendar, alcuni marcati Connected](../../../../assets/screenshots/connectors.png)
*Il toolkit Composio — collega un servizio, associa il tuo account e i suoi tool diventano disponibili sotto approvazione.*

#### Ottenere una chiave API Composio

Il toolkit gestito è opt-in: resta spento finché non dai a Homun una chiave API Composio.
Un account gratuito è sufficiente per iniziare.

1. Accedi alla **dashboard Composio** su [composio.dev](https://composio.dev) (la console
   al momento è su `dashboard.composio.dev`).
2. Apri **Settings → API Keys**.
3. Clicca **Generate new API key** e **copiala subito** — Composio mostra la chiave una
   sola volta.
4. In Homun: **Impostazioni → Connettori → Composio**, incolla la chiave (ha la forma
   `comp_…`) e premi **Connect**.

La chiave è cifrata nel [secret store](/it/guides/security/) locale di Homun — mai in
chiaro. Una volta connesso, collega i singoli servizi che vuoi (Gmail, GitHub, Slack…);
ogni connessione è esplicita e i suoi tool girano sotto approvazione.

### Server MCP

Aggiungi qualsiasi server [Model Context Protocol](https://modelcontextprotocol.io), o
sfoglia il **catalogo MCP** integrato, preso dal registry ufficiale.

![Il catalogo MCP: un elenco ricercabile di server MCP dal registry ufficiale, ognuno con un'azione Details](../../../../assets/screenshots/connectors-mcp.png)
*Il catalogo MCP — cerca nel registry ufficiale e aggiungi un server con un clic.*

## Routing delle capacità

Il modello non vede centinaia di tool grezzi. Vede **card di capacità** compatte e carica
il dettaglio dei tool **su richiesta** via `find_capability` / Tool Search. Il core Rust
resta il proprietario di policy, esecuzione, coda, approvazioni e audit — il modello
propone, il core decide.

## Auth e concessioni, memorizzate in locale

Configurazione dei provider, concessioni per utente/workspace, connessioni, cache dei
tool e contesto delle policy sono persistiti in **SQLite locale**. Connettere un servizio
è una concessione esplicita, e vive sulla tua macchina come tutto il resto.

## Abbinali al resto

Un connettore è solo un'altra capacità che un'[automazione](/it/guides/automations/) o
una [skill](/it/guides/skills/) possono usare, sotto gli stessi permessi deny-by-default
([sicurezza](/it/guides/security/)).
