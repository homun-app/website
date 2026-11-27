# The capture behind the Engramma page and docs

The terminal lines, the log rows and the figures of `/engramma/` and of `/docs/engramma/` are not typed: they are the output of a released binary, kept in `scripts/fixtures/` and checked by the contract tests of the site.

| fixture | what it holds |
|---|---|
| `engramma-session.txt` | the page: scenes S0–S16 on a cell `work`, with the synthetic notes |
| `engramma-docs-session.txt` | the docs: scenes S0–S9b on the default cell |
| `engramma-help.txt` | the `--help` of every top-level command |

## Run it again

```sh
node scripts/capture/sessione.mjs
```

A run takes about a minute and rewrites the three fixtures. Ids, times, ports and tokens change at every run; labels and figures do not.

It needs:

- Node 18 or later, and `curl`;
- the network, the first time: the installer of the release puts `engramma` into the temporary folder (never on the `PATH`), and the binary pulls the embedding model from Hugging Face;
- the MCP Inspector (`npx @modelcontextprotocol/inspector@2.16.0 --version` caches it): it reads the cell in story 1;
- Claude Code, logged in, for story 1. When it is not, a stdio driver proposes with its configuration and the header of the capture says so. Codex, Cursor, OpenCode, ChatGPT and Homun are always the driver, carrying the configuration each client would carry.

Where things go:

- the temporary folder is `$CATTURA_TMP`, or `engramma-site-capture-<version>` in the folder of the OS for temporary files;
- the fixtures go to `$CATTURA_OUT`, or to `scripts/fixtures` of this repository.

## What is here

- `sessione.mjs` — the three sessions, command after command. The commands are shell lines that run as they are written; paths are shortened to `<tmp>` and `<node>`.
- `notes/` — the synthetic notes of the page (Gaia, Milano, Torino, Giulia, Acme). They are the user's data, in Italian: only what the CLI prints is English.
- `reviewer-local.mjs` — the reviewer `local` of story 2: a fixture with a fixed rule, not a model.
- `editor.sh` — the `$EDITOR` of the docs session: it appends one line to the note.
