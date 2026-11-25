---
title: Embed it
slug: docs/engramma/embed-it
---

Engramma is a library before it is a command line. Homun runs it **in process**: the engine you install as a binary is the same code, loaded as a native Node.js module.

## The Node module (N-API)

The binding lives in the repository, in `crates/engramma-node`. It is an **N-API** module (napi-rs 3): N-API is stable across Node and Electron versions, so the compiled `.node` file does not need rebuilding at every Electron update — it is Homun's first native module, and the reason for the choice.

How it is distributed today: **built from the repository**, next to the engine it belongs to.

```console
$ cd crates/engramma-node
$ npm install          # only @napi-rs/cli
$ npm run build        # cargo --release + generated index.js and index.d.ts
$ ls engramma.darwin-arm64.node index.js index.d.ts
```

The release artifacts on GitHub carry the CLI binaries; the module is not on npm today, and nothing here promises it will be. Homun pins the exact build: the lock file holds the sha256 of the `.node`, of `index.js` and of `index.d.ts`, and the vendored files are verified against it before use.

## The contract, in brief

```ts
const engine = await Engine.open({ root: "/path/to/root", actor: "homun" });
const cell = await engine.cell("default");
const hit = await cell.search({ text: "trasloco di Gaia", k: 5 });
await cell.put({ body: "…", source: "user", confidence: "stated" });
await cell.confirm(id);          // quarantine → active, a human gesture
await engine.close();
```

`Engine` opens the root, `Cell` is one memory space. Every method that touches disk or the model is async on libuv's pool; errors are `Error`s with a stable `code` and never contain note text. Reads of a quarantined note answer `null` — the closed-oracle rule holds from every language. The model is not bundled with the module: it lives in `ENGRAMMA_MODEL_DIR` and is pulled once, `engine.pullModel()`.

Two rules that stand above the API:

1. **`decide()` only from a human gesture.** The queue exists because the agent proposes and the person decides: no host code may accept a proposal on the user's behalf — not even with the best intentions.
2. **A confirmed `external` note is read-only.** It is a source: its content changes only by a new version that supersedes it.

The sync cycle is in the module too (`Engine.sync()`), with its events — the CLI is a shell over the same service.

## Inside an Electron app

The `.node` file must stay **outside** the asar and be signed with the app's identity before notarization (`codesign --options runtime`). The daemon loads it once per process; with the model, expect around 900 MB of resident memory after the load on macOS — measured, with the numbers in the repository's own docs.

## Other languages

Python (PyO3) and Swift/Kotlin (UniFFI) are planned after the current series; the engine's core has no I/O of its own, and the cell format does not care who opens it.
