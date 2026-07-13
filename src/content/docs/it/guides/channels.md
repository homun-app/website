---
title: Canali
description: Porta WhatsApp e Telegram dentro Homun — in entrata verso memoria e bozze, con approvazione prima di inviare qualsiasi cosa.
---

I canali collegano le tue app di messaggistica a Homun, così le conversazioni
confluiscono in memoria e l'assistente può aiutarti a rispondere — senza mai inviare
qualcosa alle tue spalle.

## Supportati

- **WhatsApp**
- **Telegram** (tramite un sidecar Bot API)

Entrambi riutilizzano la stessa pipeline dei canali, quindi si comportano in modo
coerente.

![Le impostazioni Canali: una card WhatsApp marcata Connected e una card Telegram marcata Not connected, più un pulsante Add channel](../../../../assets/screenshots/channels.png)
*Collega i canali dalle Impostazioni — ognuno mostra il suo stato; qui WhatsApp è collegato e Telegram non ancora.*

## Collegare WhatsApp

WhatsApp si collega come **dispositivo companion** del tuo account (come WhatsApp Web).

1. **Impostazioni → Canali → WhatsApp → Connect**.
2. Collegalo dal telefono, in uno dei due modi che Homun offre:
   - **Scansiona il QR** — sul telefono: **WhatsApp → Impostazioni → Dispositivi collegati → Collega un dispositivo**.
   - oppure **abbina col numero di telefono** — scegli *Collega con numero di telefono* sul telefono e inserisci il codice che Homun mostra.
3. Completato l'handshake, la card passa a **Connected**.

Essendo il tuo account reale, i messaggi in entrata confluiscono in
[memoria](/it/guides/memory/) e nelle bozze — sempre sotto il filtro allowlist +
approvazione qui sotto.

## Collegare Telegram

Telegram è diverso: Homun si collega tramite un **bot che crei tu**, non il tuo account
personale. Sono un paio di passaggi in più, ma significa controllo totale e nessun
abbinamento col telefono.

1. Su Telegram, apri una chat con **[@BotFather](https://t.me/BotFather)**.
2. Invia `/newbot` e segui i passaggi: un **nome visualizzato**, poi uno **username** che
   deve finire in `bot` (es. `mio_assistente_bot`).
3. BotFather risponde con un **token API** tipo `123456789:AAE…`. Copialo.
4. In Homun: **Impostazioni → Canali → Telegram → Connect**, incolla il token e premi
   **Connect**. A verifica avvenuta la card mostra **Connected — @tuo_bot**.
5. Per raggiungere l'assistente, **scrivi direttamente a quel bot** su Telegram.

:::note
Un **bot Telegram vede solo i messaggi inviati a lui** — chat dirette col bot, o gruppi
in cui è aggiunto. Non può leggere le tue altre conversazioni Telegram (è una scelta di
design di Telegram, non un limite di Homun). Il token è salvato lato server, quindi per
riconnetterti basta **Connect** — niente da reinserire.
:::

## In entrata

Quando arriva un messaggio, Homun lo instrada nella pipeline: può estrarre ciò che conta
in [memoria](/it/guides/memory/) (persone, fatti, decisioni) e preparare una **bozza di
risposta** che rivedi tu.

## Risposta automatica, con gate

Le risposte automatiche sono **opt-in e con gate**:

- Una **allowlist** decide chi può mai ricevere una risposta automatica.
- Un passo di **approvazione** ti fa confermare prima che un messaggio parta.

La regola è deny-by-default — vedi [Privacy e sicurezza](/it/guides/security/). Nulla
viene inviato a meno che tu non abbia abilitato quel contatto e (dove configurato)
approvato il messaggio.

## Abbinalo alle automazioni

Poiché un messaggio in arrivo è un evento, un canale può **innescare**
un'[automazione](/it/guides/automations/) — per esempio "quando arriva un messaggio da X,
prepara una risposta e avvisami".
