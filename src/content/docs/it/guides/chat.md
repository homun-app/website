---
title: Chat
description: Il loop di base — Markdown ricco, allegati e vision, branching dei messaggi, streaming e attività inline.
---

La chat è la fondazione di Homun. Tutto il resto — task, memoria, browser — è uno
strato *sotto* di essa, che emerge come attività inline invece di ingombrare la
conversazione. L'obiettivo è una chat semplice e stabile, che non si blocca mai.

![Una chat di Homun: l'assistente risponde con prosa, codice inline e un blocco di codice che mostra i test passati](../../../../assets/screenshots/chat.png)
*Una risposta resa con Markdown, codice inline e un blocco di codice — in streaming dal vivo.*

## Risposte ricche

Le risposte rendono tutto il **Markdown**: titoli, elenchi, tabelle, citazioni e
**blocchi di codice con evidenziazione della sintassi**. Diagrammi e contenuti
strutturati si renderizzano inline, così un piano o un confronto si legge come un
documento, non come un muro di testo.

Le risposte arrivano in **streaming** token per token, e puoi **annullare** una
generazione a metà. Passa a un'altra conversazione mentre una risposta continua a
generarsi in background — il gateway esegue più worker indipendenti, così una risposta
lenta non blocca mai le altre (vedi [Modelli e provider](/it/guides/models/) per il
modello di concorrenza).

## Allegati e vision

Trascina dentro file e immagini. Con un modello capace di vision, Homun legge
screenshot, foto e documenti direttamente nella conversazione — utile per "cosa c'è di
sbagliato in questo screenshot d'errore?" o "riassumi questo PDF".

## Artefatti

I file che l'assistente crea o modifica finiscono in un **workspace** come
**artefatti** che puoi aprire, **versionare** e riutilizzare nella conversazione — non
sepolti in un blocco di codice da copiare a mano.

## Azioni sui messaggi

Non sei vincolato alla trascrizione così com'è:

- **Modifica** un messaggio e ri-esegui da quel punto.
- **Branch** — modificare biforca la conversazione, così esplori un'alternativa senza
  perdere l'originale. Ogni branch conserva la propria cronologia.
- **Salva una risposta in memoria**, o trasformala in un task o un'automazione, dalle
  azioni sotto ogni messaggio.
- Organizza le conversazioni in **cartelle** e **progetti/workspace**.

## Modello per messaggio

Ogni messaggio può sovrascrivere il modello. Lascialo in automatico e il router sceglie
per compito, oppure fissa un modello specifico per una risposta — comodo per mandare una
domanda difficile a un modello cloud più forte mentre la chat quotidiana resta locale.
Vedi [Modelli e provider](/it/guides/models/).

## Attività inline

Quando una risposta avvia lavoro vero — un [task](/it/reference/architecture/), una
sessione browser, un'approvazione — compare come **card di attività** dentro la chat:
una timeline con progresso, anteprime/thumbnail e controlli di approvazione/takeover.

Questa è *progressive disclosure*: la chat di base resta pulita, e il dettaglio
operativo è a un colpo d'occhio quando lo vuoi. Il
[computer contenuto](/it/guides/local-computer/) appare allo stesso modo, con una vista
dal vivo che puoi guardare e di cui puoi prendere il controllo.

:::note
Le capacità pesanti — task runtime, browser, approvazioni, memoria, subagenti — non
appaiono mai come comportamento di base della chat. Compaiono come card solo quando un
turno le usa davvero. Il loop di base resta *scrivi → rispondi → capisci*.
:::

## Lingue

Homun è multilingua. L'interfaccia è disponibile in inglese e italiano, e le risposte
seguono **la tua** lingua automaticamente — scrivi nella tua, l'assistente risponde
nella tua. I system prompt girano in inglese sotto il cofano; solo l'output è
localizzato.
