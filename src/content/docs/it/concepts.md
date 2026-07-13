---
title: Concetti base
description: Il modello mentale dietro Homun — come funziona alle tue condizioni oggi, e l'apprendista verso cui sta crescendo.
---

Homun non è una chat passiva. Oggi ti assiste alle tue condizioni — chat, memoria,
canali, automazioni, deliverable. Il modello mentale verso cui **sta crescendo** è un
**apprendista**: uno che osserva il tuo lavoro, capisce le tue routine, propone e opera
il tuo computer end-to-end con permessi progressivi. Quel loop autonomo è
[sulla roadmap](/roadmap/).

Alcuni principi guidano ogni funzionalità.

## Alle tue condizioni

I tuoi dati e la tua memoria vivono sul dispositivo per impostazione predefinita —
semplice SQLite e file sotto `~/.homun` (desktop) o un volume che monti tu (server). I
modelli cloud sono una delega **opt-in**, mai un requisito: l'[Ollama](https://ollama.com)
locale è il default, e decidi tu se e quando qualcosa lascia la macchina.

## Trasparente

Puoi vedere e correggere ciò che l'assistente sa. La memoria non è un blob di embedding
opaco — è un grafo ispezionabile di entità, relazioni e decisioni, più una wiki Markdown
leggibile. Se qualcosa è sbagliato, lo correggi; se vuoi che sparisca, lo
[dimentichi](/it/guides/memory/) per argomento o entità.

## Operativo, con contratti

Ogni azione passa da **contratti, permessi e un audit trail**. Il modello produce
output strutturato (un piano, una scrittura in memoria, una valutazione del rischio) che
il core Rust valida *prima* di agire. I permessi sono deny-by-default; il computer
contenuto e i connettori girano dietro concessioni esplicite.

## Proattivo

Homun rileva pattern e offre aiuto prima che tu lo chieda. Un motore supervisore
osserva il lavoro ricorrente e propone **card di suggerimento** — resti tu a decidere se
un suggerimento diventa un'automazione.

## Il product loop

Tutto poggia su un loop di base:

```text
tu scrivi  →  il modello attivo risponde  →  tu capisci la risposta
```

Task, browser, approvazioni, memoria e subagenti sono capacità reali, ma vivono *sotto*
la chat — appaiono come attività inline, non come rumore nella conversazione di base.
Una chat semplice e stabile è la fondazione; la potenza operativa è uno strato sopra.

## I pezzi

| Pezzo | Cosa fa |
| --- | --- |
| [Chat](/it/guides/chat/) | Il loop di base: Markdown, codice, diagrammi, allegati, azioni sui messaggi, streaming. |
| [Memoria](/it/guides/memory/) | Store ibrido — SQLite + grafo + wiki Markdown + contatti curati. |
| [Modelli e provider](/it/guides/models/) | Porta il tuo modello: Ollama locale o cloud, instradato per compito. |
| [Canali](/it/guides/channels/) | WhatsApp e Telegram, in memoria e in bozze con approvazione. |
| [Automazioni](/it/guides/automations/) | Regole Quando → Allora che eseguono task agentici. |
| [Skill](/it/guides/skills/) | Capacità installabili e sandboxate da un catalogo. |
| [Connettori](/it/guides/connectors/) | Nativi, MCP e integrazioni gestite opt-in. |
| [Il computer locale](/it/guides/local-computer/) | Un computer Docker contenuto che puoi guardare dal vivo. |

Tutto è governato da un singolo **gateway** locale — vedi
[Architettura](/it/reference/architecture/) per come i pezzi si collegano.
