---
title: Download
description: Ottieni l'app desktop Homun per macOS, Windows o Linux — oppure ospitala tu.
---

Homun è distribuito come app desktop per macOS, Windows e Linux. La homepage riconosce
il sistema operativo e seleziona automaticamente l'installer più recente. Puoi anche
scegliere un'altra piattaforma o consultare manualmente
[l'ultima release](https://github.com/homun-app/homun-releases/releases/latest).
Preferisci un server? [Ospitalo tu](/it/guides/self-hosting/).

## macOS

Il feed pubblico contiene attualmente un `.dmg` firmato e notarizzato per Apple Silicon.

1. Usa il [download automatico nella homepage](/#download), oppure scarica l'ultimo
   `.dmg` dalla [pagina della release](https://github.com/homun-app/homun-releases/releases/latest).
2. Aprilo e trascina **Homun** in `Applicazioni`.
3. Avvialo — la build è **firmata e notarizzata**, quindi si apre senza l'avviso di
   Gatekeeper.

L'app include il proprio backend e **si aggiorna da sola**: quando esce una nuova
versione, il pannello Notifiche (la campanella nel menù laterale) offre uno scarica +
riavvia a un clic.

## Windows

Scarica il `.exe` pubblico dalla [homepage](/#download) o
[dall'ultima release](https://github.com/homun-app/homun-releases/releases/latest).
Windows potrebbe mostrare un avviso SmartScreen finché la firma del codice non è
confermata per la build selezionata.

## Linux

Il feed pubblico offre due formati:

- `.AppImage` — portabile tra le distribuzioni; rendilo eseguibile con
  `chmod +x Homun-*.AppImage` prima di avviarlo.
- `.deb` — si installa su Debian, Ubuntu e distribuzioni compatibili.

Scegli il formato dal [selettore di download nella homepage](/#download) o
[dall'ultima release](https://github.com/homun-app/homun-releases/releases/latest).

## Requisiti di sistema

- **Disco/RAM** per un modello locale dipendono dalla scelta del
  [provider](/it/guides/models/) — [Ollama](https://ollama.com) locale ha bisogno di
  spazio per il modello; i provider cloud quasi nessuno.
- **Docker** (Docker Desktop, OrbStack o Colima) è opzionale, solo per il
  [computer contenuto](/it/guides/local-computer/).
