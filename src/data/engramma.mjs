// Engramma's public release, clients and roadmap, in one place: the product
// page, the docs and the contract test read them from here. A new Engramma
// release changes VERSION only.
const REPOSITORY = "https://github.com/homun-app/engramma";
const VERSION = "0.6.17-beta.1";
const TAG = `v${VERSION}`;
const DOCS = `${REPOSITORY}/blob/main/docs`;

export const ENGRAMMA_RELEASE = {
	version: VERSION,
	tag: TAG,
	repository: REPOSITORY,
	releaseUrl: `${REPOSITORY}/releases/tag/${TAG}`,
	// GitHub's releases/latest skips prereleases: the installer URL names the version.
	installerUrl: `${REPOSITORY}/releases/download/${TAG}/engramma-cli-installer.sh`,
	readmeUrl: `${REPOSITORY}#readme`,
	compatibilityUrl: `${DOCS}/compatibilita.md`,
	mcpDocsUrl: `${DOCS}/mcp.md`,
	httpDocsUrl: `${DOCS}/http.md`,
	designUrl: `${DOCS}/DESIGN.md`,
	platforms: [
		{ label: "macOS · Apple Silicon", shipped: true },
		{ label: "Linux · x86_64", shipped: true },
		{ label: "Linux · arm64", shipped: true },
		{ label: "macOS · Intel", shipped: false },
		{ label: "Windows", shipped: false },
	],
};

export const ENGRAMMA_INSTALL_COMMAND = `curl --proto '=https' --tlsv1.2 -LsSf \\
  ${ENGRAMMA_RELEASE.installerUrl} | sh`;

export const ENGRAMMA_FIRST_COMMANDS = `engramma init
echo "Acme only signs annual contracts." > note.md
engramma add note.md --source user --confidence stated --title "Acme contracts"
engramma search "annual contracts"`;

// How the engine works, in the order a note travels through it.
export const ENGRAMMA_HOW = [
	{ title: "Every change is logged", body: "Each write is one operation in an append-only log, chained by hashes and ordered by a hybrid logical clock. Replaying the log rebuilds exactly the same memory; engramma verify proves it." },
	{ title: "Notes you can read", body: "A memory is a Markdown note with its source, confidence, tags and validity dates. [[Names]] in the text become entities in a graph." },
	{ title: "Search that explains", body: "Words (BM25) and meaning (local multilingual embeddings) are fused, then the graph and time weigh in. Every result says which branch found it and why." },
	{ title: "Nothing enters unchecked", body: "Content from third parties is born in quarantine and stays out of search. An assistant only proposes notes: you accept, reject or roll back." },
];

// What sets Engramma apart from the usual memory layer for assistants.
export const ENGRAMMA_DIFFERENT = [
	{ topic: "Where it runs", usual: "A cloud service, or a server with a vector database", engramma: "One SQLite file per memory space, on your computer; no server" },
	{ topic: "What it stores", usual: "Embeddings and snippets only the system can read", engramma: "Markdown notes you can read, edit and export" },
	{ topic: "When a fact changes", usual: "The old value is overwritten", engramma: "The old version stays, with its dates; ask what was true then" },
	{ topic: "Where an answer came from", usual: "A similarity score", engramma: "The source, the confidence and why the note matched" },
	{ topic: "What the assistant can add", usual: "Anything it reads goes into memory", engramma: "Proposals and third-party content wait for you" },
	{ topic: "Proof", usual: "Trust the database", engramma: "A hash-chained log anyone can replay with engramma verify" },
	{ topic: "Forgetting", usual: "Delete a row, copies may remain", engramma: "purge removes the content everywhere, sync included" },
];

const BIN = "~/.cargo/bin/engramma";
const ABS_BIN = "/Users/you/.cargo/bin/engramma";
const ARGS = '["mcp", "--cells", "default"]';

// Local clients start the server over stdio; only the named cells are
// exposed. Remote clients reach it over HTTPS with OAuth, through a tunnel.
// `tested` means exercised end to end with this engine (docs/http.md).
export const ENGRAMMA_CLIENTS = [
	{ id: "claude-code", name: "Claude Code", kind: "local", tested: false, label: "Terminal", lang: "sh",
		code: `claude mcp add engramma -- ${BIN} mcp --cells default` },
	{ id: "claude-desktop", name: "Claude Desktop", kind: "local", tested: false, label: "claude_desktop_config.json", lang: "json",
		code: `{\n  "mcpServers": {\n    "engramma": {\n      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n    }\n  }\n}`,
		note: "Claude Desktop does not read your shell PATH: use the absolute path of the binary." },
	{ id: "cursor", name: "Cursor", kind: "local", tested: false, label: "~/.cursor/mcp.json", lang: "json",
		code: `{\n  "mcpServers": {\n    "engramma": {\n      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n    }\n  }\n}` },
	{ id: "vscode", name: "VS Code", kind: "local", tested: false, label: ".vscode/mcp.json", lang: "json",
		code: `{\n  "servers": {\n    "engramma": {\n      "type": "stdio",\n      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n    }\n  }\n}` },
	{ id: "codex", name: "Codex CLI", kind: "local", tested: false, label: "Terminal", lang: "sh",
		code: `codex mcp add engramma -- ${BIN} mcp --cells default` },
	{ id: "gemini", name: "Gemini CLI", kind: "local", tested: false, label: "~/.gemini/settings.json", lang: "json",
		code: `{\n  "mcpServers": {\n    "engramma": {\n      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n    }\n  }\n}` },
	{ id: "remote", name: "ChatGPT · claude.ai", kind: "remote", tested: true, label: "Terminal", lang: "sh",
		code: `engramma mcp --cells default --http 127.0.0.1:8787 \\\n  --public-url https://memory.example.net --compat chatgpt\n\n# then add https://memory.example.net/mcp as a custom connector,\n# and approve the code your browser shows:\nengramma oauth pending\nengramma oauth approve XXXX-XXXX --label chatgpt --yes`,
		note: "Web and mobile apps reach Engramma over HTTPS with OAuth 2.1. Engramma listens only on your machine; a tunnel you choose (Tailscale Funnel, Cloudflare Tunnel) publishes it. Exercised end to end with ChatGPT, claude.ai and Codex." },
];

// Why it can be trusted: each line is checkable in the source.
export const ENGRAMMA_TRUST = [
	{ title: "On your computer", body: "Each memory space is one SQLite file on your disk. Search, embeddings and the MCP server run locally." },
	{ title: "No telemetry", body: "No usage pings, no crash reports. Engramma goes online only for what you turn on: downloading a model, syncing your devices, a reviewer model you configure." },
	{ title: "Apache 2.0", body: "The whole engine is open source on GitHub. You need not trust this page: read what the code does." },
	{ title: "Verify it yourself", body: "engramma verify replays the log and checks the hash chain, the rebuilt notes and the search index." },
];

// Clients named in the hero's "works with" row; all are set up in #connect.
export const ENGRAMMA_WORKS_WITH = ["Claude", "ChatGPT", "Cursor", "VS Code", "Codex", "Gemini CLI", "any MCP client"];

// Mirrors Engramma's docs/DESIGN.md § 12, in plain language.
export const ENGRAMMA_ROADMAP = [
	{
		stage: "Available",
		items: [
			{ version: "in Homun", title: "Memory inside Homun", body: "Readable notes with sources, dates and quarantine, on your computer." },
			{ version: VERSION, title: "Developer preview", body: "The engramma CLI and an MCP server for Claude, ChatGPT, Cursor and other MCP clients." },
			{ version: "0.6", title: "Encrypted sync", body: "The same memory on your own devices, end-to-end encrypted: a relay can forward it but never read it, and you can run your own or none." },
		],
	},
	{
		stage: "Next",
		items: [
			{ version: "0.6.x", title: "More platforms", body: "Windows and Intel Macs, once their builds pass every test." },
			{ version: "0.7", title: "Organizations", body: "Shared memory for a team, with signed rules for who can read, propose and write." },
			{ version: "0.7.1", title: "Protection at rest", body: "Encrypted company memory and device revocation." },
		],
	},
	{
		stage: "Later",
		items: [
			{ version: "0.8", title: "Engramma server", body: "Many memory spaces in one service, single sign-on, an optional admin console and read audit." },
			{ version: "0.9", title: "Cluster", body: "Memory spread over many machines, with replicas and backups." },
		],
	},
];
