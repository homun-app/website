---
title: Download
description: Ottieni l'app desktop Homun per macOS, Windows o Linux — oppure ospitala tu.
---

Homun è distribuito come app desktop per tutte e tre le piattaforme. macOS è **firmato,
notarizzato e pubblicato** oggi; Windows e Linux sono buildati e in arrivo. Preferisci un
server? [Ospitalo tu](/it/guides/self-hosting/).

## macOS

Il modo consigliato per provare Homun.

1. Scarica l'ultimo `.dmg` dalla
   [pagina delle release](https://github.com/homun-app/homun-releases/releases/latest).
2. Aprilo e trascina **Homun** in `Applicazioni`.
3. Avvialo — la build è **firmata e notarizzata**, quindi si apre senza l'avviso di
   Gatekeeper.

L'app include il proprio backend e **si aggiorna da sola**: quando esce una nuova
versione, il pannello Notifiche (la campanella nel menù laterale) offre uno scarica +
riavvia a un clic.

## Windows e Linux

Entrambi sono buildati dalla CI (`.exe` per Windows, `.AppImage` e `.deb` per Linux), ma
**non sono ancora firmati**, quindi non sono pubblicati sul feed pubblico delle release e
non si aggiornano ancora da soli.

Cosa significa per ora:

- **Windows** — l'`.exe` non firmato fa scattare un avviso SmartScreen da aggirare a
  mano.
- **Linux** — l'`.AppImage` va reso eseguibile (`chmod +x`) prima di partire; il `.deb`
  si installa su distro basate su Debian/Ubuntu.

Teniamo i download pubblici Windows/Linux finché non sono firmati. Se vuoi eseguire Homun
su quelle piattaforme oggi, il [self-hosting](/it/guides/self-hosting/) è l'opzione
portabile e funziona ovunque ci sia Docker.

## Requisiti di sistema

- **Disco/RAM** per un modello locale dipendono dalla scelta del
  [provider](/it/guides/models/) — [Ollama](https://ollama.com) locale ha bisogno di
  spazio per il modello; i provider cloud quasi nessuno.
- **Docker** (Docker Desktop, OrbStack o Colima) è opzionale, solo per il
  [computer contenuto](/it/guides/local-computer/).
