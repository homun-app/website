---
title: Install
slug: docs/engramma/install
---

Engramma ships as a single `engramma` binary. The shell installer downloads the right archive for your platform, checks its sha256, and puts the binary in cargo's bin directory (`$HOME/.cargo/bin`, created if missing).

```sh
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/homun-app/engramma/releases/download/v0.6.17-beta.1/engramma-cli-installer.sh | sh
```

The URL names the version on purpose: GitHub's `releases/latest` link skips prereleases, so while only `-beta` versions exist it points at nothing. Newer versions are on the [releases page](https://github.com/homun-app/engramma/releases).

The same command, through the site's short address:

```sh
curl -LsSf homun.app/engramma/install.sh | sh
```

## Platforms

| Platform | Status |
|---|---|
| macOS arm64 (Apple Silicon) | **shipped** — the test suite runs on it in CI; the release binary was exercised by hand (`init`, `add`, `search`, `verify`, MCP handshake) |
| Linux arm64 (glibc) | **shipped** — built on a native arm runner; test suite in CI; the binary exercised by hand in Docker |
| Linux x86_64 (glibc) | **shipped** — test suite in CI; the binary exercised by hand in Docker |
| macOS Intel | not shipped — its CI job is exploratory (non-blocking); it enters when it turns green and blocking |
| Windows | not shipped — the engine does not compile there yet (Unix-only APIs in the sync and MCP layers) |

The Linux binaries are built on Ubuntu 22.04 and need **glibc ≥ 2.35** (Ubuntu 22.04+, Debian 12+, Fedora 36+). RHEL 9 and its rebuilds ship 2.34 and are not covered: build from source there.

## macOS, said honestly

The binaries are not signed. A binary installed with the `curl` command above does **not** get the quarantine attribute, so Gatekeeper does not block it — the terminal installer is the recommended road. A tarball downloaded **from the browser** does get it; if you go that way, clear it once:

```sh
xattr -d com.apple.quarantine /path/to/engramma
```

Signing and notarization need an Apple Developer certificate as a repository secret — a decision still open.

## Build from source

Requires Rust 1.95 (edition 2024):

```sh
git clone https://github.com/homun-app/engramma.git
cd engramma
cargo build --release -p engramma-cli
# binary: target/release/engramma
```

`Cargo.lock` pins every dependency (add `--locked` to build exactly those); the first build downloads them from crates.io.

## Where your data lives

Everything Engramma writes stays under one data root, `~/.engramma` by default. Set `ENGRAMMA_ROOT` to put it somewhere else — the whole of this documentation assumes you did, when it shows a command with `--root`:

```console
$ export ENGRAMMA_ROOT=~/engramma-demo
$ engramma init
inizializzato: /home/you/engramma-demo
```

Inside the root: `cells/<name>.sqlite` (one file per memory space), `config.json` (the embedder), `models` (the embedding model, unless `ENGRAMMA_MODEL_DIR` says otherwise), `oauth.db` (the grants of the HTTP server), `device.key` and `devices.db` (sync).

## Uninstall

Remove the binary and, if you want the memory gone with it, the data root:

```sh
rm ~/.cargo/bin/engramma
rm -rf ~/.engramma
```

The notes are plain Markdown with a header; `engramma export` writes them to a folder first, if you want to keep them ([import and the vault](/docs/engramma/import-and-the-vault/)).
