---
title: Architettura
description: I pezzi di Homun 0.3 e come stanno insieme.
---

Homun 0.3 è un'app desktop. Tutto ciò che tiene in vita i tuoi bot sta sul tuo computer;
le sole parti che vanno in rete sono i modelli e le app che scegli tu.

## I pezzi

| Pezzo | Cosa fa |
| --- | --- |
| **L'app** | La finestra che usi: chat, squadre, app, skill, impostazioni. |
| **Il processo in background** | Tiene in vita bot, routine e squadre quando la finestra è chiusa. È l'app stessa, firmata come l'app. Homun resta nella barra dei menu. |
| **Il ciclo dell'agente** | Per ogni richiesta: il modello risponde, chiede strumenti, ogni chiamata passa dalle approvazioni, i risultati tornano al modello, fino a lavoro finito. |
| **La trascrizione** | Ogni chat è una sequenza di eventi (messaggi, chiamate agli strumenti, risultati, approvazioni) salvata in un database SQLite locale. |
| **Il computer del bot** | Un box separato per ogni bot, fatto girare da Apple container o Docker, con browser, terminale e file. |
| **App** | Collegamenti diretti, Composio e server MCP, offerti ai bot come strumenti. |
| **Memoria** | [Engramma](/it/docs/engramma/), un motore locale scritto in Rust, con note, fonti, storia e quarantena. |
| **La Cassaforte** | Segreti e login cifrati; la chiave è custodita dal portachiavi di sistema. |
| **Modelli** | Provider cloud, server locali e modello integrato, dietro un'unica interfaccia. |
| **Aggiornamenti** | Release firmate da GitHub, con le note mostrate prima dell'installazione. |

## Dove gira cosa

- **Sul tuo computer**: l'app, il processo in background, le trascrizioni, la memoria, la
  Cassaforte, la Libreria, i box dei bot, e il modello integrato se lo installi.
- **Sui servizi che scegli**: i modelli cloud, le app collegate Tramite Composio e i
  servizi con cui parlano le tue app.

## Codice sorgente

Homun è open source con [licenza Apache-2.0](/it/license/). Il codice è su
[GitHub](https://github.com/homun-app).
