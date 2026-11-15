---
title: Approvazioni e sicurezza
description: Quando un bot chiede prima di agire, come ti proteggono le bozze e la Cassaforte, e dove stanno i tuoi dati.
---

Homun fa fare ai bot lavoro vero, quindi le impostazioni di partenza tendono a chiedere. Sei
tu a decidere quanto un bot può fare da solo.

## Le card di approvazione

Prima di un'azione che cambia qualcosa, il bot ti mostra una **card di approvazione** con
cosa vuole fare e perché. Puoi:

- **Consentire** una volta;
- consentire **Per questo turno**, per lo stesso strumento finché il bot non finisce la
  richiesta in corso;
- consentire **Sempre**, che salva un consenso revocabile;
- **Rifiutare**.

I messaggi ad altre persone non partono mai da una card di approvazione: diventano
[bozze](/it/guides/chat/#le-bozze) che partono solo quando premi **Invia**.

## Quando chiedere

**Impostazioni › Approvazioni** ha tre modalità:

- **Chiedi**: il bot chiede prima di ogni azione che cambia qualcosa: inviare, scrivere,
  eseguire comandi. Leggere non chiede.
- **Automatico**: un modello controlla ogni azione rispetto alla tua richiesta. Fa
  passare quello che serve, anche i passi che non hai detto, e ti chiede quando il bot va
  chiaramente oltre e l'azione non si annulla facilmente: scrivere a qualcuno che non hai
  nominato, pagare, cancellare, pubblicare.
- **Non chiedere**: ogni azione parte senza aspettare.

Le tue regole vengono prima in ogni modalità. **Continua da solo quando…** allarga ciò che
passa da solo; **Fermati e chiedimi sempre quando…** vince sempre e trasforma l'azione in
una card. I bot possono proporti una regola: la aggiungi o la ignori.

**Consensi salvati** elenca tutto ciò che hai consentito con **Sempre**, ognuno con
**Revoca**.

## La Cassaforte

La **Cassaforte** conserva i login dei siti, i segreti come le chiavi API e i contatti. I
valori sono cifrati sul tuo computer con una chiave custodita dal portachiavi di sistema.

I bot vedono solo i **nomi** dei segreti, mai i valori. Quando un bot usa un segreto, Homun
inserisce il valore all'ultimo momento e lo toglie da ogni risultato, quindi non finisce
mai in chat né in ciò che legge il modello. La card di approvazione ti dice quali
credenziali usa un'azione.

## I tuoi dati

Bot, chat, memoria, routine e Libreria stanno sul tuo computer. Cosa arriva a un servizio
cloud dipende dalle tue scelte:

- il [modello](/it/guides/models/) che scegli: con il modello integrato o con uno sulla tua
  rete, le conversazioni restano sulla tua macchina;
- le [app](/it/guides/connectors/) che colleghi: le app Dirette parlano con il servizio dal
  tuo computer, quelle Tramite Composio passano dai server di Composio.

Homun 0.3 è open source con [licenza Apache-2.0](/it/license/), quindi puoi leggere come
funziona tutto questo.

## Il computer del bot

I bot eseguono comandi e navigano dentro un [box separato](/it/guides/local-computer/),
lontano dal tuo sistema. Quando un passo richiede te, come un accesso, il bot ti passa lo
schermo e la password non passa da lui.

## Analisi del sito

Questo sito usa Umami Cloud per misurare visualizzazioni di pagina aggregate e alcune
interazioni selezionate, come i tentativi di download, i link in uscita verso GitHub e
la partecipazione alla roadmap. Le analisi del sito non ricevono dati dell'account
Homun, contenuti degli spazi di lavoro, prompt o file, e Homun non le usa per
identificare i singoli visitatori.

Per informazioni su titolare, fornitore, conservazione e diritti, leggi l'[informativa privacy del sito](/it/privacy/).
