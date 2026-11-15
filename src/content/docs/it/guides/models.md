---
title: Modelli
description: Usa un provider cloud, un modello sulla tua rete, oppure il modello integrato in Homun che gira tutto sul tuo computer.
---

Ogni bot usa un modello che scegli tu. Puoi mescolarli: un modello cloud per il bot che
scrive i report, uno locale per il bot che legge la tua posta.

## Tre tipi di modello

- **Integrato**: un modello che gira dentro Homun sul tuo computer. Niente costi, e i dati
  restano sulla tua macchina. È più lento e sbaglia più spesso dei modelli cloud.
- **Sulla tua rete**: [Ollama](https://ollama.com) e [LM Studio](https://lmstudio.ai) che
  girano sul tuo computer vengono trovati da soli; puoi anche aggiungere un server
  altrove sulla tua rete con il suo indirizzo.
- **Cloud**: OpenAI, Anthropic, Mistral, OpenRouter, Z.ai, xAI, DeepSeek, Groq, o
  qualsiasi servizio compatibile con OpenAI, con la tua chiave API. Paghi il provider a
  consumo.

## Aggiungere un provider

Apri **Impostazioni › Modelli** e premi **Aggiungi provider**. Inserisci la chiave API, o
l'indirizzo per un server sulla tua rete; Homun lo prova e ti dice quanti modelli sono
disponibili. Le chiavi API sono salvate cifrate nella [Cassaforte](/it/guides/security/#la-cassaforte).

## Il modello integrato

Il modello integrato è **Qwen3.5 4B** (circa 2,7 GB, licenza Apache-2.0). Lo installi da
**Impostazioni › Modelli › Integrato**. Homun controlla prima il tuo computer: con meno di
16 GB di memoria ti avverte che sarà lento, e serve abbastanza spazio libero su disco. Puoi
mettere in pausa, riprendere e togliere il download.

## Scegliere il modello di ogni bot

- **Modello dei bot** in **Impostazioni › Modelli** vale per tutti i bot. Aggiungi delle
  **riserve**: se il modello non risponde, i bot passano alla successiva.
- Per dare a un bot un modello diverso, apri il suo pannello e cambia il modello sotto il
  nome.
- **Modello delle approvazioni** è il modello che controlla le azioni quando le
  approvazioni sono su **Automatico**. Senza, Automatico chiede sempre.

## Costi

**Impostazioni › Uso e costi** mostra quanto costano i modelli cloud questo mese, bot per
bot.
