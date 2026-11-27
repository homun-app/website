---
title: Connect your assistants
slug: docs/engramma/connect
---

Claude Code, Claude Desktop, Cursor, VS Code, Codex, Gemini CLI, OpenCode and Homun connect over **stdio**; ChatGPT and claude.ai — which only reach remote HTTPS servers — connect over **HTTP**, through a tunnel you choose, with OAuth 2.1.

Local clients use the `default` cell, the one `engramma init` creates: a cell that does not exist is an error. Read-only first:

```sh
engramma mcp --cells default
```

Five tools, none of them writes: `memory_search`, `memory_get`, `memory_neighbors`, `memory_tags`, `memory_timeline`. Every result carries its explanation and its source; quarantined notes never appear. With `--write default --actor <name>` a sixth tool appears, `memory_propose`: the assistant may *propose* a fact — it lands in the queue, the search does not see it, until you or a reviewer you configured decide ([policies and reviewers](/docs/engramma/policies-and-reviewers/)). No tool ever confirms, deletes or changes a policy.

The actor comes from the configuration, never from what the client says it is: `--actor claude-code` signs `mcp:claude-code`.

## The eight local clients

**Claude Code** — terminal:

```sh
claude mcp add engramma -- ~/.cargo/bin/engramma mcp --cells default
```

The default scope is the current project; `--scope user` makes the server available in every project.

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "engramma": {
      "command": "/Users/you/.cargo/bin/engramma",
      "args": ["mcp", "--cells", "default"]
    }
  }
}
```

The configuration takes absolute paths only. Quit and restart the app after saving the file.

**Cursor** — `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "engramma": {
      "type": "stdio",
      "command": "/Users/you/.cargo/bin/engramma",
      "args": ["mcp", "--cells", "default"]
    }
  }
}
```

**VS Code** — `.mcp.json` at the workspace root (the file Claude Code reads for a project too):

```json
{
  "mcpServers": {
    "engramma": {
      "type": "stdio",
      "command": "/Users/you/.cargo/bin/engramma",
      "args": ["mcp", "--cells", "default"]
    }
  }
}
```

The older `.vscode/mcp.json` uses a format that retires in February 2027.

**Codex** — terminal:

```sh
codex mcp add engramma -- ~/.cargo/bin/engramma mcp --cells default
```

It writes `~/.codex/config.toml`. For the remote server: `codex mcp add engramma --url https://memory.example.net/mcp`, then `codex mcp login engramma`.

**Gemini CLI** — `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "engramma": {
      "command": "/Users/you/.cargo/bin/engramma",
      "args": ["mcp", "--cells", "default"]
    }
  }
}
```

**OpenCode** — `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "engramma": {
        "type": "local",
        "command": ["/Users/you/.cargo/bin/engramma", "mcp", "--cells", "default"]
      }
    }
  }
}
```

Or from the terminal: `opencode mcp add engramma -- ~/.cargo/bin/engramma mcp --cells default`.

**Homun** needs no configuration: Engramma is its memory, in process.

## The remote server, for ChatGPT and claude.ai

Engramma stays a local program with one owner: it listens **on loopback only** and does not terminate TLS. The tunnel you put in front decides who sees the traffic in clear. Tailscale Funnel terminates TLS on your computer (recommended); Cloudflare Tunnel and ngrok terminate it themselves and see the tool responses, so the text of the notes.

```sh
engramma mcp --cells default --http 127.0.0.1:8787 \
  --public-url https://memory.example.net
```

```console
mcp-http: listening on http://127.0.0.1:8787 — public: https://memory.example.net (approve the connections with `engramma oauth pending`)
```

Over HTTP there is no `--actor`: the proposing actor is the **label you choose when you approve the connection**. No token exists until you type, on the computer where Engramma runs, the code your browser shows:

```console
$ engramma oauth pending
$ engramma oauth approve XXXX-XXXX --label chatgpt --yes
```

`engramma oauth grants` lists the connections, `engramma oauth revoke <label>` cuts one off — its token dies at the next request. Choose a stable public URL: the address **is** the identity of the resource, and changing it means every client reconnects and you approve again.

For ChatGPT's deep research, start the server with `--compat chatgpt`: fixed-schema `search`/`fetch` wrappers that exist for that client's document only. claude.ai: Settings → Connectors → Add custom connector, address `https://…/mcp`.
