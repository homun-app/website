---
title: Modelli e provider
description: Porta il tuo modello — Ollama locale o una dozzina di provider cloud, abilitati per provider e instradati per compito.
---

Homun non ha un singolo modello cablato. Colleghi uno o più **provider**, abiliti quelli
che vuoi, e un router sceglie il modello giusto per ogni compito. Il local-first è il
default; il cloud è opt-in.

## Tipi di provider

Sotto il cofano ci sono tre tipi di trasporto. Tutto il resto è costruito su di essi:

| Tipo | Cos'è | Esempi |
| --- | --- | --- |
| `ollama` | un server Ollama locale — completamente offline | Ollama (locale) |
| `openai_compat` | qualsiasi endpoint che parla l'API OpenAI | OpenAI, Groq, OpenRouter, … |
| `anthropic` | l'API Anthropic Messages (Claude) | Anthropic |

Poiché gran parte del settore parla il protocollo OpenAI, un singolo provider
`openai_compat` copre una vasta gamma di servizi.

## Preset a un clic

La schermata Provider mostra **tutto il catalogo insieme**, ognuno con il suo logo
reale. I provider configurati sono a colori con un interruttore di abilitazione; gli
altri sono grigi — clicca su uno grigio per configurarlo (la base URL viene compilata
per te; basta aggiungere una chiave e scegliere un modello):

| Provider | Tipo | Note |
| --- | --- | --- |
| **Ollama (locale)** | `ollama` | il default, completamente offline |
| **Ollama Cloud** | `openai_compat` | modelli `:cloud`; chiave da ollama.com |
| **OpenAI** | `openai_compat` | |
| **Anthropic** | `anthropic` | Claude — la via cloud premium |
| **Z.ai (GLM)** | `openai_compat` | GLM-5 |
| **OpenRouter** | `openai_compat` | molti modelli dietro una chiave |
| **Groq** | `openai_compat` | inferenza veloce |
| **DeepSeek** | `openai_compat` | |
| **Together** | `openai_compat` | |
| **xAI (Grok)** | `openai_compat` | |
| **Moonshot (Kimi)** | `openai_compat` | |
| **Mistral** | `openai_compat` | |
| **Custom** | `openai_compat` | qualsiasi altro endpoint OpenAI-compatibile |

:::note
Non vedi il tuo provider? Scegli **Custom**, incolla la sua base URL OpenAI-compatibile e
la chiave, e funziona come gli altri. L'elenco sopra è comodità, non un limite.
:::

![Impostazioni → Modello e runtime → Provider, con l'intero catalogo provider e i loghi reali — quelli configurati a colori con interruttore, gli altri grigi](../../../../assets/screenshots/models-providers.png)
*L'intero catalogo, ognuno con il suo logo reale: i provider configurati a colori con un interruttore, gli altri grigi — clicca su uno per configurarlo.*

## Abilita / disabilita per provider

Un provider configurato ha un **interruttore** indipendente. Abilitane diversi insieme —
il router sceglie sempre e solo tra quelli *abilitati*. Disabilitare un provider toglie i
suoi modelli dal routing senza cancellarne la configurazione. I provider che non hai
ancora configurato restano grigi e senza interruttore finché non aggiungi una chiave.

## Il registry dei modelli

Ogni modello porta metadati su cui il router ragiona: **supporto ai tool**, **vision**,
**reasoning**, **finestra di contesto** e **tier**. È così che Homun sa che un piccolo
modello locale può gestire una risposta rapida mentre una richiesta con vision serve un
modello capace di vision. Homun può aggiornare l'elenco dei modelli di un provider e
generarne automaticamente i profili.

## Routing: ruolo → modello

Il lavoro è organizzato per **ruolo** — **General management** (capire le richieste,
pianificare, sintetizzare), **Coding**, **Browser model** (il loop osserva-agisci del
web, il consumatore più pesante) e **Memory** (estrazione fatti veloce ed economica). Il
router risolve ogni ruolo in un modello:

- **Automaticamente**, confrontando le esigenze del ruolo con il registry, oppure
- **Esplicitamente**, con un binding che imposti nelle Impostazioni.

Puoi anche sovrascrivere il modello **per messaggio** in [chat](/it/guides/chat/) — fissa
una risposta a un modello più forte senza cambiare i tuoi default.

![Impostazioni → Modello e runtime → Modello per compito, che lega un modello a ogni ruolo con il controllo di concorrenza sotto](../../../../assets/screenshots/models-routing.png)
*Routing per compito: un modello diverso per management, coding, browser e memoria — automatico, o fissato da te.*

## Local-first per impostazione predefinita

I modelli locali via Ollama restano il default; i provider cloud sono un opt-in
esplicito. Decidi tu dove gira ogni tipo di lavoro, e puoi tenere tutto sulla macchina.

## Concorrenza

Il throughput si adatta al provider attivo. Il **ResourceGovernor** imposta quante
richieste di inferenza girano in parallelo:

- **Auto** segue la località — **1** per un provider locale/loopback, **4** per il cloud.
- Puoi **forzare** un valore: alzalo per Ollama su una GPU potente, o abbassalo per
  limitare la spesa cloud.

Il gateway avvia più worker indipendenti; il governor fa il gating reale, così puoi
avviare lavoro in una conversazione e passare a un'altra mentre gira.

## L'output strutturato resta validato

Per gli output operativi — un piano, una scrittura in memoria, una valutazione del
rischio — il modello deve produrre output **strutturato e validato da contratto**. Il
core Rust valida il JSON prima di agire, così una risposta malformata o non sicura viene
intercettata invece che eseguita.

## Configuralo

Apri **Impostazioni → Modello e runtime** per aggiungere un provider (scegli un preset o
Custom, incolla la chiave), aggiornarne i modelli e legare i ruoli. Su un server, i
provider si configurano tramite variabili d'ambiente — vedi
[Self-hosting](/it/guides/self-hosting/).
