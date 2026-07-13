---
title: Skill
description: Capacità installabili e sandboxate — scansiona le skill locali, sfoglia un catalogo ed eseguile in sicurezza.
---

Una **skill** è una capacità impacchettata che l'assistente può usare. Homun scopre
quelle che hai già, ti fa installare le altre da un catalogo e le esegue in una sandbox.

## Skill locali

Homun **scansiona** le skill presenti sulla tua macchina e le elenca, così ciò che è
installato è sempre visibile — nessuna capacità nascosta.

![La scheda Active della vista Skill: un gruppo "Personal skills" e il pacchetto di coding "HomunCoder"](../../../../assets/screenshots/skills.png)
*Skill attive — le tue, sempre attive, più il pacchetto HomunCoder incluso di default.*

## Il catalogo

Sfoglia e installa dal **catalogo OpenClaw / ClawHub**: ricercabile, organizzato per
categoria. Ogni voce del catalogo ha una **scansione di sicurezza** nella sua vista di
dettaglio, così vedi cosa fa una skill prima di installarla.

Le skill della metodologia **HomunCoder** sono incluse di default.

![Il catalogo Skill: una griglia ricercabile di skill installabili filtrate per categoria](../../../../assets/screenshots/skills-catalog.png)
*Il catalogo — ricercabile, categorizzato, ogni voce installabile con una scansione di sicurezza nel dettaglio.*

## Esecuzione sandboxata

Le skill girano dentro il [computer contenuto](/it/guides/local-computer/) — una sandbox
Docker con shell e toolchain — non direttamente sul tuo host. Insieme ai permessi
deny-by-default ([sicurezza](/it/guides/security/)), una skill installata non può
raggiungere in silenzio oltre ciò che hai concesso.

## Gestiscile

La sezione **Skill** nelle Impostazioni mostra le skill attive e il catalogo, con un
interruttore per abilitare o disabilitare ciascuna — parte del più ampio
[ecosistema di addon](/it/reference/architecture/).
