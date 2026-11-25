---
title: Approvazioni e sicurezza
description: Quando un bot chiede prima di agire, come ti proteggono le bozze e la Cassaforte, e dove stanno i tuoi dati.
---

Homun fa fare ai bot lavoro vero, quindi le impostazioni di partenza tendono a chiedere.
Sei tu a decidere quanto un bot può fare da solo.

## Le card di approvazione

Prima di un'azione che cambia qualcosa, il bot ti mostra una **card di approvazione** con
cosa vuole fare e perché. Puoi:

- **Consentire** una volta;
- consentire **Per questo turno**, per lo stesso strumento finché il bot non finisce la
  richiesta in corso;
- consentire **Sempre** — per quel bot, per un'app, per dieci minuti: la scelta salva un
  consenso revocabile;
- **Rifiutare**.

I messaggi ad altre persone non partono mai da una card di approvazione: diventano
[bozze](/it/guides/chat/#le-bozze) che aspettano te. In **Automatico** un revisore può
lasciar partire una bozza quando la tua richiesta o una tua regola la copre — la card lo
dice («Inviata automaticamente»).

## Quando chiedere

**Impostazioni › Approvazioni** ha tre modalità:

- **Chiedi**: il bot chiede prima di ogni azione che cambia qualcosa: inviare, scrivere,
  eseguire comandi. Leggere non chiede, e dentro il [computer dei
  bot](/it/guides/local-computer/) comandi e file non chiedono: il box è isolato dal tuo
  Mac.
- **Automatico**: un modello controlla, contro la tua richiesta, le azioni che altrimenti
  chiederebbero. Fa passare quello che la richiesta serve, anche i passi che non hai
  detto, e ti chiede quando il bot va chiaramente oltre e l'azione non si annulla
  facilmente: scrivere a qualcuno che non hai nominato, pagare, cancellare, pubblicare.
  Alcune azioni arrivano sempre a te, i login per primi.
- **Non chiedere**: ogni azione parte senza aspettare. Le protezioni fisse restano: le
  azioni bloccate restano bloccate, e le bozze in uscita aspettano comunque te.

In **Automatico** le tue regole vengono prima. **Continua da solo quando…** allarga ciò
che passa da solo; **Fermati e chiedimi sempre quando…** vince sempre e trasforma
l'azione in una card. I bot possono proporti una regola: la aggiungi o la ignori.

**Consensi salvati** elenca tutto ciò che hai consentito con **Sempre**, ognuno con
**Revoca**.

## La Cassaforte

La **Cassaforte** conserva i login dei siti, i segreti come le chiavi API e i contatti. I
valori sono cifrati sul tuo computer, con una chiave sigillata nel portachiavi di sistema.

I bot vedono solo i **nomi** di segreti e login, mai i valori — i contatti, per loro
natura, sono visibili ai bot. Quando un bot usa un segreto, Homun inserisce il valore
all'ultimo momento e lo toglie da ogni risultato, quindi non finisce mai in chat né in ciò
che legge il modello. La card di approvazione ti dice quali credenziali usa un'azione.

## I tuoi dati

Bot, chat, memoria, routine e Libreria stanno sul tuo computer. Cosa arriva a un servizio
cloud dipende dalle tue scelte:

- il [modello](/it/guides/models/) che scegli: con il modello integrato o con uno sulla tua
  rete, le conversazioni restano sulla tua macchina;
- le [app](/it/guides/connectors/) che colleghi: la scheda di ogni app dice se parla
  direttamente con il servizio o passa dai server di Composio;
- le ricerche web: le ricerche di un bot arrivano a servizi di ricerca gratuiti, accesi di
  default — puoi spegnerle in **Impostazioni › Generali › Avanzate**.

Homun 0.3 è open source con [licenza Apache-2.0](/it/license/), quindi puoi leggere come
funziona tutto questo.

## Il computer dei bot

I bot eseguono comandi e navigano dentro un [box contenuto](/it/guides/local-computer/),
separato dal tuo sistema. Quando un passo richiede te, come un accesso, il bot ti passa lo
schermo e la password non passa da lui.

## Analisi del sito

Questo sito usa Umami Cloud per misurare visualizzazioni di pagina aggregate e alcune
interazioni selezionate, come i tentativi di download, i link in uscita verso GitHub e
la partecipazione alla roadmap. Le analisi del sito non ricevono dati dall'app Homun —
conversazioni, prompt o file — e Homun non le usa per identificare i singoli visitatori.

Per informazioni su titolare, fornitore, conservazione e diritti, leggi l'[informativa privacy del sito](/it/privacy/).
