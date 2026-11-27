---
title: CLI reference
slug: docs/engramma/cli-reference
---

Every top-level command of the `engramma` binary, version `0.6.19-beta.1`, with every option its own `--help` prints — captured verbatim from the released binary. The help and the output the CLI prints at run time are both in English.

Global options, accepted by every command before the subcommand: `--root <ROOT>` (data root, default `~/.engramma`, or `$ENGRAMMA_ROOT`; cells live in `<root>/cells/<name>.sqlite`), `--cell <CELL>` (cell to operate on, default `default`; names are `[a-z0-9_-]+`), `--json` (stable JSON output), `-h, --help`, `-V, --version`.

Exit codes: `0` success · `2` usage error · `3` note not found · `4` internal error · `5` pending work (a purge that could not finish) · `6` cell schema newer than the binary · `7` another sync service holds the root. Note ids accept a unique prefix or a suffix of at least 4 characters; the short ids the CLI prints are the last 8 of the ULID.

Commands that take a subcommand — `cell`, `proposals`, `conflicts`, `policy`, `model`, `devices`, `sync`, `mailbox`, `vault`, `oauth` — document their subcommands in their own list below. Each of those 41 subcommands also answers `engramma <parent> <sub> --help` with its own help, where its own options are (for example `proposals accept --no-embed`).

## The command list

```text
Personal memory engine: notes, graph, time, search

Usage: engramma [OPTIONS] <COMMAND>

Commands:
  init         Create the data root and the default cell
  cell         Manage cells
  add          Add a note (body from a file or stdin)
  get          Read a note (id or id prefix)
  edit         Edit a note in $EDITOR and apply the difference
  rm           Logical delete (tombstone)
  confirm      Promote a quarantined note to active
  purge        Right to be forgotten: the note, its versions, its edges and the payloads of its operations go, for good (v0.3)
  supersede    Close a note and replace it with a new one from a file
  search       Search notes
  neighbors    Graph neighbours of an entity
  path         Shortest path between two entities
  tags         Tags (with children)
  entities     Entities by prefix
  timeline     Notes about an entity ordered by validity
  history      Versions of a note (v0.5: who proposed, who decided, and why)
  proposals    The proposals queue and its decisions (v0.5)
  conflicts    The conflict copies to resolve (v0.6.4): who lost, when, in quarantine or not — the copy is a note, read it with `get`
  decisions    The decisions registry: who, when, what, why (v0.5)
  revert       Cancel decisions — the git revert of the registry (v0.5)
  policy       The cell's policy: who may propose, how far the machine may go (v0.5)
  review       The local review page: the queue, the decisions, the notes (127.0.0.1 only, Ctrl-C to stop) (v0.5)
  restore      Restore a version
  import       Import a folder (Engramma export or `--obsidian` vault)
  export       Export the cell as an Engramma folder
  model        Manage embedding models (list, pull, use)
  embed        Embed pending notes with the configured embedder
  devices      Manage the devices of this data root (v0.6)
  sync         Synchronize this data root's cells (v0.6)
  mailbox      The blind mailbox node (v0.6)
  verify       Verify the log (hash chain + replay)
  repair       Repair what verify found: the phantom notes' content moves to NEW ids, the old (purged) ids are forgotten by the rule
  compact      Compact the log: register a checkpoint (no second copy of the cell) and forget the old payloads
  consolidate  Consolidation candidates: near duplicates and probable contradictions — the engine proposes, the application decides (v0.3)
  vault        The markdown view: two-way sync with a folder of notes (v0.3)
  oauth        The OAuth grants of `mcp --http`: what waits for you, what you approved, and how to cut it off (v0.5.2)
  mcp          Start the MCP server (stdio, or HTTP with --http)

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
  -V, --version      Print version
```

## `init`

```text
Create the data root and the default cell

Usage: engramma init [OPTIONS]

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `add`

```text
Add a note (body from a file or stdin)

Usage: engramma add [OPTIONS] --source <SOURCE> --confidence <CONFIDENCE> <FILE>

Arguments:
  <FILE>  File with the body markdown ("-" = stdin)

Options:
      --no-embed                 Skip the embedding pass at the end (notes stay pending)
      --root <ROOT>              Data root (default: ~/.engramma)
      --cell <CELL>              Cell to operate on (default: "default") [default: default]
      --source <SOURCE>          Provenance (required)
      --confidence <CONFIDENCE>  Reliability (required)
      --json                     Stable JSON output
      --type <TYPE>              Note type [default: fact]
      --title <TITLE>            Title
      --tag <TAGS>               Tag (repeatable)
      --valid-from <VALID_FROM>  Valid from (date or datetime)
      --lang <LANG>              Language override for stemming
  -h, --help                     Print help
```

## `get`

```text
Read a note (id or id prefix)

Usage: engramma get [OPTIONS] <ID>

Arguments:
  <ID>  

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `edit`

```text
Edit a note in $EDITOR and apply the difference

Usage: engramma edit [OPTIONS] <ID>

Arguments:
  <ID>  

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `rm`

```text
Logical delete (tombstone)

Usage: engramma rm [OPTIONS] <ID>

Arguments:
  <ID>  

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `confirm`

```text
Promote a quarantined note to active

Usage: engramma confirm [OPTIONS] <ID>

Arguments:
  <ID>  

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `purge`

```text
Right to be forgotten: the note, its versions, its edges and the payloads of its operations go, for good (v0.3)

Usage: engramma purge [OPTIONS] --reason <REASON> <ID>

Arguments:
  <ID>  

Options:
      --reason <REASON>  Why (kept in the log; never the content)
      --root <ROOT>      Data root (default: ~/.engramma)
      --cell <CELL>      Cell to operate on (default: "default") [default: default]
      --yes              Skip the interactive confirmation (for scripts)
      --json             Stable JSON output
  -h, --help             Print help
```

## `supersede`

```text
Close a note and replace it with a new one from a file

Usage: engramma supersede [OPTIONS] --source <SOURCE> --confidence <CONFIDENCE> <OLD> <FILE>

Arguments:
  <OLD>   Note to close (id or prefix)
  <FILE>  File with the new note body

Options:
      --root <ROOT>              Data root (default: ~/.engramma)
      --source <SOURCE>          
      --cell <CELL>              Cell to operate on (default: "default") [default: default]
      --confidence <CONFIDENCE>  
      --json                     Stable JSON output
      --type <TYPE>              [default: fact]
      --title <TITLE>            
      --tag <TAGS>               
      --valid-from <VALID_FROM>  
  -h, --help                     Print help
```

## `search`

```text
Search notes

Usage: engramma search [OPTIONS] <TEXT>

Arguments:
  <TEXT>  Query text

Options:
      --mode <MODE>          text | vector | hybrid (default: hybrid when an embedder is ready)
      --root <ROOT>          Data root (default: ~/.engramma)
      --cell <CELL>          Cell to operate on (default: "default") [default: default]
      --fusion <FUSION>      Fusion for hybrid search: rrf | convex-0.3 | convex-0.5 | convex-0.7
      --json                 Stable JSON output
      --tau <TAU>            Abstention threshold for vector-only results (default 0.30)
      --strict               Drop `support: "weak"` results (vector-only, thin cosine margin: near in meaning, unconfirmed by any text match)
      --k <K>                [default: 10]
      --hops <HOPS>          Graph expansion 0-2 [default: 1]
      --as-of <AS_OF>        Valid at this date (YYYY-MM-DD)
      --tag <TAGS>           
      --type <TYPES>         
      --include-quarantined  
      --lang <LANG>          
  -h, --help                 Print help
```

## `neighbors`

```text
Graph neighbours of an entity

Usage: engramma neighbors [OPTIONS] <ENTITY>

Arguments:
  <ENTITY>  

Options:
      --depth <DEPTH>        [default: 1]
      --root <ROOT>          Data root (default: ~/.engramma)
      --cell <CELL>          Cell to operate on (default: "default") [default: default]
      --rel <RELS>           
      --include-quarantined  Include edges declared by quarantined notes
      --json                 Stable JSON output
  -h, --help                 Print help
```

## `path`

```text
Shortest path between two entities

Usage: engramma path [OPTIONS] <A> <B>

Arguments:
  <A>  
  <B>  

Options:
      --include-quarantined  Include edges declared by quarantined notes
      --root <ROOT>          Data root (default: ~/.engramma)
      --cell <CELL>          Cell to operate on (default: "default") [default: default]
      --json                 Stable JSON output
  -h, --help                 Print help
```

## `tags`

```text
Tags (with children)

Usage: engramma tags [OPTIONS] [PREFIX]

Arguments:
  [PREFIX]  

Options:
      --include-quarantined  Count quarantined notes too
      --root <ROOT>          Data root (default: ~/.engramma)
      --cell <CELL>          Cell to operate on (default: "default") [default: default]
      --json                 Stable JSON output
  -h, --help                 Print help
```

## `entities`

```text
Entities by prefix

Usage: engramma entities [OPTIONS] [PREFIX]

Arguments:
  [PREFIX]  

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `timeline`

```text
Notes about an entity ordered by validity

Usage: engramma timeline [OPTIONS] <ENTITY>

Arguments:
  <ENTITY>  

Options:
      --include-quarantined  Include edges declared by quarantined notes
      --root <ROOT>          Data root (default: ~/.engramma)
      --cell <CELL>          Cell to operate on (default: "default") [default: default]
      --json                 Stable JSON output
  -h, --help                 Print help
```

## `history`

```text
Versions of a note (v0.5: who proposed, who decided, and why)

Usage: engramma history [OPTIONS] <ID>

Arguments:
  <ID>  

Options:
      --diff         Line-by-line diff between consecutive versions
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `decisions`

```text
The decisions registry: who, when, what, why (v0.5)

Usage: engramma decisions [OPTIONS]

Options:
      --by <BY>                    Only this actor (exact or prefix, e.g. `reviewer:`)
      --root <ROOT>                Data root (default: ~/.engramma)
      --cell <CELL>                Cell to operate on (default: "default") [default: default]
      --proposed-by <PROPOSED_BY>  Only decisions on this proposer's proposals (exact or prefix, e.g. `mcp:`) (v0.6.18)
      --json                       Stable JSON output
      --since <SINCE>              Decided since this date (YYYY-MM-DD)
      --until <UNTIL>              Decided until this date (YYYY-MM-DD, inclusive)
      --state <STATE>              Only this standing (active | reverted)
  -h, --help                       Print help
```

## `revert`

```text
Cancel decisions — the git revert of the registry (v0.5)

Usage: engramma revert [OPTIONS] [DECISION]

Arguments:
  [DECISION]  A decision op id (or its last-8 prefix)

Options:
      --by <BY>                    Bulk: every decision of this actor (prefix), e.g. `reviewer:x`
      --root <ROOT>                Data root (default: ~/.engramma)
      --cell <CELL>                Cell to operate on (default: "default") [default: default]
      --proposed-by <PROPOSED_BY>  Bulk: every decision taken on this proposer's proposals (exact or prefix), e.g. `mcp:claude-code` (v0.6.18)
      --json                       Stable JSON output
      --since <SINCE>              Bulk: only decisions taken since this date (YYYY-MM-DD)
      --until <UNTIL>              Bulk: only decisions taken until this date (YYYY-MM-DD)
      --dry-run                    Show what would happen, change nothing
      --yes                        Skip the interactive confirmation (for scripts)
  -h, --help                       Print help
```

## `review`

```text
The local review page: the queue, the decisions, the notes (127.0.0.1 only, Ctrl-C to stop) (v0.5)

Usage: engramma review [OPTIONS]

Options:
      --port <PORT>  Port (default: any free one)
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --open         Open the browser at the printed address
      --json         Stable JSON output
  -h, --help         Print help
```

## `restore`

```text
Restore a version

Usage: engramma restore [OPTIONS] <ID> <VERSION>

Arguments:
  <ID>       
  <VERSION>  

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `import`

```text
Import a folder (Engramma export or `--obsidian` vault)

Usage: engramma import [OPTIONS] <DIR>

Arguments:
  <DIR>  

Options:
      --obsidian     Import a plain Obsidian vault
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --no-embed     Skip the embedding pass at the end (notes stay pending)
      --json         Stable JSON output
  -h, --help         Print help
```

## `export`

```text
Export the cell as an Engramma folder

Usage: engramma export [OPTIONS] <DIR>

Arguments:
  <DIR>  

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `embed`

```text
Embed pending notes with the configured embedder

Usage: engramma embed [OPTIONS]

Options:
      --all          Re-embed every living note, even fresh ones
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `verify`

```text
Verify the log (hash chain + replay)

Usage: engramma verify [OPTIONS]

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `repair`

```text
Repair what verify found: the phantom notes' content moves to NEW ids, the old (purged) ids are forgotten by the rule

Usage: engramma repair [OPTIONS]

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `compact`

```text
Compact the log: register a checkpoint (no second copy of the cell) and forget the old payloads

Usage: engramma compact [OPTIONS]

Options:
      --keep-last <KEEP_LAST>  Keep the last N operations uncompacted (default 1000) [default: 1000]
      --root <ROOT>            Data root (default: ~/.engramma)
      --cell <CELL>            Cell to operate on (default: "default") [default: default]
      --keep-snapshot          Also keep a snapshot FILE next to the cell (the v0.3.1 behavior: the logical state; purge scrubs it with the cell)
      --experimental           v0.6.15 (F2): the compaction is experimental — without this flag the command refuses and says why (the declared defects of the cut are open: crates/engramma-core/tests/open-defects.txt). v0.6.19: `--sperimentale`, the beta's name, still answers
      --json                   Stable JSON output
  -h, --help                   Print help
```

## `consolidate`

```text
Consolidation candidates: near duplicates and probable contradictions — the engine proposes, the application decides (v0.3)

Usage: engramma consolidate [OPTIONS]

Options:
      --limit <LIMIT>  Max candidates per kind [default: 20]
      --root <ROOT>    Data root (default: ~/.engramma)
      --cell <CELL>    Cell to operate on (default: "default") [default: default]
      --json           Stable JSON output
  -h, --help           Print help
```

## `mcp`

```text
Start the MCP server (stdio, or HTTP with --http)

Usage: engramma mcp [OPTIONS]

Options:
      --cells <CELLS>            Exposed cells (comma-separated; without this flag no cell is exposed)
      --root <ROOT>              Data root (default: ~/.engramma)
      --cell <CELL>              Cell to operate on (default: "default") [default: default]
      --write <WRITE>            Cells that also accept PROPOSALS through `memory_propose` (comma-separated; a subset of --cells)
      --actor <ACTOR>            Who signs the proposals (`mcp:<actor>`); required with --write (stdio only: over HTTP the actor is the grant's label)
      --json                     Stable JSON output
      --http <HTTP>              Serve over HTTP on this loopback address instead of stdio (v0.5.2): `--http 127.0.0.1:8787`
      --public-url <PUBLIC_URL>  The https URL the tunnel publishes for this server (required with --http)
      --allow-dcr                Accept RFC 7591 dynamic client registration (off by default)
      --compat <COMPAT>          Client compatibility shims: `chatgpt` adds the fixed-schema `search`/`fetch` tools its connectors want
  -h, --help                     Print help
```

## `cell`

```text
Manage cells

Usage: engramma cell [OPTIONS] <COMMAND>

Commands:
  list    List cells
  create  Create a cell
  drop    Forget a whole cell: its notes, its files (WAL and snapshots included) and the note files of its bound views (v0.4.2) — irreversible

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `proposals`

```text
The proposals queue and its decisions (v0.5)

Usage: engramma proposals [OPTIONS] [COMMAND]

Commands:
  show    One proposal in full: note, proposer, decision, reviewer metadata
  accept  Accept it: the note becomes active (with --edit, fix the text first)
  reject  Reject it: the lapide keeps the text, the revert can undo
  review  Retry the FAILED automatic reviews (never the escalated ones)

Options:
      --root <ROOT>    Data root (default: ~/.engramma)
      --state <STATE>  Only this state (pending | accepted | rejected | reverted)
      --by <BY>        Only this proposer (exact or prefix, e.g. `mcp:`)
      --cell <CELL>    Cell to operate on (default: "default") [default: default]
      --json           Stable JSON output
  -h, --help           Print help
```

## `conflicts`

```text
The conflict copies to resolve (v0.6.4): who lost, when, in quarantine or not — the copy is a note, read it with `get`

Usage: engramma conflicts [OPTIONS] [COMMAND]

Commands:
  show     Read one copy in full (v0.6.5): the original's body, the copy's body and the fork's — the quarantined copies too, which `get` never shows
  resolve  Resolve one copy: `--keep original` (the delete), `--keep copy` (the copy's body wins), `--keep merged --body-file <f>` (the hand merge; `-` = stdin)

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `policy`

```text
The cell's policy: who may propose, how far the machine may go (v0.5)

Usage: engramma policy [OPTIONS] <COMMAND>

Commands:
  show  The current policy
  set   Change it: `write=... reviewer=... min_confidence=... kinds=a,b allow_supersede=... max_auto_per_hour=...` (only from here — never from the web, never from MCP)

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `model`

```text
Manage embedding models (list, pull, use)

Usage: engramma model [OPTIONS] <COMMAND>

Commands:
  list  List the known models and their state in this cell
  pull  Download a model (pinned revision, sha256-verified)
  use   Set the cell's embedding model (blue/green: builds while the old one serves)

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `devices`

```text
Manage the devices of this data root (v0.6)

Usage: engramma devices [OPTIONS] <COMMAND>

Commands:
  init    Create the device key (or show the existing one)
  invite  Bind the pairing endpoint and print the invite ticket with the real address; waits (10 minutes, one use) for the device that enters
  code    Print a short pairing code
  join    Join with a ticket or a code
  list    List the devices (name, short id, last contact, epochs)
  remove  Remove a device (rotates every shared cell's key)
  log     The device list's own log

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `sync`

```text
Synchronize this data root's cells (v0.6)

Usage: engramma sync [OPTIONS] <COMMAND>

Commands:
  share      Share a cell with the other devices (adopt + key epoch 0)
  unshare    Stop sharing a cell from here (copies elsewhere stay)
  run        One pass with every reachable device and the mailbox, then exit
  serve      Serve: sync on every local write and every 5 minutes
  status     Per cell: devices, last session, pending ops, frontier, epoch
  conflicts  The conflict copies this copy holds

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `mailbox`

```text
The blind mailbox node (v0.6)

Usage: engramma mailbox [OPTIONS] <COMMAND>

Commands:
  serve   Run the blind mailbox node
  add     Add the mailbox to this data root's device list
  remove  Remove the mailbox
  status  The mailbox's health

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `vault`

```text
The markdown view: two-way sync with a folder of notes (v0.3)

Usage: engramma vault [OPTIONS] <COMMAND>

Commands:
  init    Export the cell into the folder and bind every note to its file
  sync    One reconciliation, with the report
  watch   Reconcile on filesystem events (500 ms debounce) and every 60 s; Ctrl-C exits
  unbind  Detach a view (v0.4): the cell forgets it and ITS bindings — the files stay on disk, they were never the engine's. Accepts the folder or the view id (even just its first 8 characters)

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```

## `oauth`

```text
The OAuth grants of `mcp --http`: what waits for you, what you approved, and how to cut it off (v0.5.2)

Usage: engramma oauth [OPTIONS] <COMMAND>

Commands:
  pending  The authorization requests waiting for your decision
  approve  Approve one: the code is the one the user's browser shows
  deny     Refuse one (or, with --all, every pending request at once)
  grants   The grants: label, client, cells, scopes, when, last use
  revoke   Revoke a grant (or all of them): its tokens die at the next request
  log      The event log: approvals, refusals, revocations, alarms

Options:
      --root <ROOT>  Data root (default: ~/.engramma)
      --cell <CELL>  Cell to operate on (default: "default") [default: default]
      --json         Stable JSON output
  -h, --help         Print help
```
