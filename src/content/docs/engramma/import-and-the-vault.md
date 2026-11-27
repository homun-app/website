---
title: Import and the vault
slug: docs/engramma/import-and-the-vault
---

Two ways to live next to your Markdown: bring a folder in once, or keep a folder in two-way sync with a cell.

## Import: `--obsidian`

Any plain Obsidian vault (Markdown only — PDF, Office files and web pages are not ingested yet; they are on the roadmap):

```console
$ engramma import <vault> --obsidian
embedded: 3 (pending: 0)
imported: 2
skipped: 1
  - .obsidian: hidden directory
errors: 0
```

Hidden entries (`.obsidian/`, `.trash/`) and non-Markdown files are skipped; symlinks are never followed; notes without an Engramma header get one, with `source: import:obsidian/<relative path>`. Without `--obsidian`, the command imports an Engramma export folder (`engramma.json` present). Ids that a purge has forgotten come back as `skippedPurged`: the file returns, the id does not — the import does not stop, and rewriting those files with a new id is up to you.

## Export

```console
$ engramma export <dir>
exported: 6 notes to <dir>
```

Writes `<dir>/<type>/<slug>-<id8>.md` plus an `engramma.json`. Tombstones are never exported; superseded notes are. An export is readable text, not a backup of the cell: it carries no operation log, no vectors, no sync state — [the compatibility page](/docs/engramma/compatibility/) says exactly what it is.

## The vault: a two-way view of a cell

```console
$ engramma vault init <dir>
vault initialized: <dir>
```

From then on, the folder and the cell tell each other the truth. Edit a file in the folder — here the note of Gaia, in any editor — and `vault sync` runs one scan-based reconciliation and prints the report:

```console
$ printf '\nA novembre hanno anche cambiato la porta del bagno.\n' >> <dir>/fact/gaia-abita-a-milano-AY3TSRFT.md
$ engramma vault sync <dir>
notes updated from files: 1
  - fact/gaia-abita-a-milano-AY3TSRFT.md
```

`vault watch` reconciles on filesystem events (500 ms debounce) and every 60 seconds. A file is bound to its note by the `id` in the header, never by its path: rename or move a file, and the binding follows. In a conflict the cell wins, and the file's version becomes a `<name>.conflitto-<ts>.md` copy. A guard stops the sync when more than 20 files (or 10% of the notes) vanish at once — an unmounted folder — unless `--allow-deletions`.

The vault opens in Obsidian as it is: the `[[links]]` and the `## Relations` section are its own syntax. `engramma vault unbind <dir>` detaches a view: the cell forgets it and its bindings; the files stay on disk — they were never the engine's.
