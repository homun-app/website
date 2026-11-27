// Engramma's public release, clients and roadmap, in one place: the product
// page and the contract test read them from here. A new Engramma release
// changes VERSION only.
//
// Every terminal line and every log row below is a capture of the released
// binary on the synthetic notes of the page (Gaia, Milano, Torino, Acme).
// Nothing is typed by hand or translated: the CLI prints in English since
// 0.6.19, and the page shows its lines as they are.
const REPOSITORY = "https://github.com/homun-app/engramma";
const VERSION = "0.6.19-beta.1";
const TAG = `v${VERSION}`;
const DOCS = `${REPOSITORY}/blob/main/docs`;
const DESIGN = `${DOCS}/DESIGN.md`;
const CLI = `${DOCS}/cli.md`;

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
	designUrl: DESIGN,
	platforms: [
		{ label: "macOS · Apple Silicon", shipped: true },
		{ label: "Linux · x86_64", shipped: true },
		{ label: "Linux · arm64", shipped: true },
		{ label: "macOS · Intel", shipped: false },
		{ label: "Windows", shipped: false },
	],
};

// The platforms line of the hero, from the table of the README: what shipped,
// then what did not yet.
export const ENGRAMMA_PLATFORMS_LINE = "macOS (Apple Silicon) and Linux (x86_64, arm64) · Intel Macs and Windows not yet";

// Clients named in the hero's "works with" row; each has its card in #connect.
export const ENGRAMMA_WORKS_WITH = ["Claude", "ChatGPT", "Cursor", "VS Code", "Codex", "Gemini CLI", "OpenCode", "Homun"];

// The short install: homun.app/engramma/install.sh answers with a redirect to
// the versioned installer above (nginx/default.conf; the test keeps the two
// equal). The long form names the installer and works without the redirect.
export const ENGRAMMA_SHORT_INSTALL = "curl -LsSf homun.app/engramma/install.sh | sh";
export const ENGRAMMA_INSTALL_COMMAND = `curl --proto '=https' --tlsv1.2 -LsSf \\
  ${ENGRAMMA_RELEASE.installerUrl} | sh`;

// ── The captures ────────────────────────────────────────────────────────────
// A terminal line is a string, or a list where [tone, text] is coloured:
// p the prompt, d dim, ok what the engine confirms, hl the value to read.
const CAPTURED_WITH = "engramma 0.6.19-beta.1";

// The hero: a search that explains its first result, then the check.
// `engramma search "where does Gaia live now?"` and `engramma verify`.
export const ENGRAMMA_HERO_TERMINAL = {
	capturedWith: CAPTURED_WITH,
	lines: [
		[["p", "$"], " engramma search \"where does Gaia live now?\""],
		["1. [active] Gaia abita a Milano ", ["d", "(GC7GVP4H)"]],
		["   score ", ["hl", "1.0000"], " (raw 0.6500)"],
		["   lists: ", ["ok", "text, vector"]],
		["   terms: ", ["hl", "gai"]],
		"   cosine: 0.8857",
		["   validity: ", ["ok", "2026-09-01 → now"]],
		"   source: user",
		"",
		[["p", "$"], " engramma verify"],
		[["ok", "log verified:"], " 9 operations, hash chain, reconstruction and FTS index in place"],
	],
};

// The note the search found, as `engramma get` prints it.
export const ENGRAMMA_HERO_NOTE = {
	title: "Gaia abita a Milano",
	fields: [
		{ name: "source", value: "user" },
		{ name: "confidence", value: "stated" },
		{ name: "valid_from", value: "2026-09-01" },
		{ name: "tags", value: "[casa/milano]" },
	],
	body: "Gaia ha traslocato a [[Milano]] con [[Giulia]] a settembre 2026.",
};

// The hub: three stories, each run on one cell ("work") of the released binary.
// `actor` is what the tool's configuration signs with (`--actor` over stdio,
// the grant's label over HTTP): it comes from the configuration, never from
// what the client says it is. `decided` is what `engramma decisions` shows.
export const ENGRAMMA_HUB = {
	// The nodes of the drawing. Story 1 is read by the MCP Inspector, the
	// client that read the cell in the capture; Codex read only as a driver.
	tools: [
		{ name: "Claude Code", x: 300, y: 46 },
		{ name: "MCP Inspector", x: 505, y: 130 },
		{ name: "Cursor", x: 520, y: 312 },
		{ name: "OpenCode", x: 300, y: 396 },
		{ name: "ChatGPT", x: 80, y: 312 },
		{ name: "Homun", x: 80, y: 130 },
	],
	scenes: [
		{
			from: "Claude Code", actor: "mcp:claude-code", policy: "write=propose",
			fact: "Auth moved to JWT; the sessions table was dropped.", why: "Read in commit 4f1c",
			proposedAt: "07:38:34Z",
			decided: { actor: "user@cli", text: "accepted from the CLI", at: "07:38:43Z" },
			to: "MCP Inspector", asks: "How do we authenticate?",
			answer: "Auth moved to JWT; the sessions table was dropped.",
			found: true,
		},
		{
			from: "Cursor", actor: "mcp:cursor", policy: "write=auto · reviewer local · min_confidence 0.8",
			fact: "Use pnpm, never npm, in this repo.", why: "The user said so in this chat",
			proposedAt: "07:38:45Z",
			decided: { actor: "reviewer:local", text: "confidence 0.9", at: "07:38:45Z" },
			to: "OpenCode", asks: "Which package manager?",
			answer: "Use pnpm, never npm, in this repo.",
			found: true,
		},
		{
			from: "ChatGPT", actor: "mcp:chatgpt", policy: "write=auto · the reviewer passes it to a person",
			fact: "Acme’s CFO is leaving in March.", why: "Read on acme.example.com/news",
			proposedAt: "07:38:47Z",
			decided: { actor: null, text: "queued · status: quarantined", at: "07:38:47Z" },
			to: "Homun", asks: "Who is Acme’s CFO?",
			answer: "Nothing confirmed yet.",
			found: false,
		},
	],
};

// ── Inside the engine ───────────────────────────────────────────────────────
// How the engine works, in the order a note travels through it.
export const ENGRAMMA_PIPELINE = [
	{ name: "Write", title: "Anyone can propose", body: "You, Homun, or an assistant over MCP. Third-party content and agent writes wait in quarantine.", items: ["CLI · Node · MCP", "proposals + review"] },
	{ name: "Log", title: "Every change recorded", body: "One operation per write, ordered by a hybrid logical clock and chained by hashes.", items: ["HLC ordering", "hash chain", "replayable"] },
	{ name: "Memory", title: "Notes, graph, vectors", body: "Markdown notes with source, confidence and validity; [[names]] become entities in a graph; text becomes vectors.", items: ["SQLite + FTS5", "entity graph", "int8 vectors"], core: true },
	{ name: "Search", title: "Three lists, one answer", body: "Words and meaning are fused, then the graph and time weigh in.", items: ["BM25 · 6 languages", "embeddings", "personalized PageRank"] },
	{ name: "Answer", title: "With its reasons", body: "Each result says which list found it, the graph path, its validity and its source.", items: ["explain", "MCP tools"] },
];

// `engramma search "Where does she live now?"`: an English question, an Italian
// note, no word in common. The cosine values are the ones the engine printed.
export const ENGRAMMA_MEANING = {
	question: "Where does she live now?",
	hits: [
		{ title: "Gaia abita a Milano", body: "Gaia ha traslocato a [[Milano]] con [[Giulia]] a settembre 2026.", lists: "vector", cosine: 0.7958 },
		{ title: "Il lavoro di Giulia", body: "[[Giulia]] ha iniziato a novembre in [[Acme]]: si occupa di pricing.", lists: "vector", cosine: 0.7747 },
	],
};

// The graph of the page's notes. `via` is the path the engine printed for the
// question: Gaia's note mentions Milano, which the office note mentions too.
export const ENGRAMMA_GRAPH = {
	query: "What about Gaia?",
	via: "[[note:01M8DZ1WRK3PJQ9WT0GC7GVP4H]] -mentions-> [[Milano]] -mentions-> (note F339GJK6)",
	nodes: {
		start: "Gaia",
		middle: "Milano",
		other: "Giulia",
		target: "the office",
		second: "Giulia’s job",
	},
};

// `engramma search "office"`, today and on the first of August.
export const ENGRAMMA_TIME = {
	topic: "The office",
	old: { title: "Ufficio a Torino", span: "Torino · until Sep 2026", valid: "2026-01-05 → 2026-09-01" },
	now: { title: "Ufficio a Milano", span: "Milano", valid: "2026-09-01 → now" },
};

// The queue of the cell, as `engramma proposals` prints it, and the check.
// A claim read on a web page waits outside the search results; a proposal is
// decided by the person; `verify` replays the log.
export const ENGRAMMA_CONTROL = {
	held: {
		title: "CFO di Acme", text: "Acme’s CFO is leaving in March.", tag: "quarantine",
		why: "source: mcp:chatgpt · confidence: inferred · read on acme.example.com/news · not in search results",
	},
	proposal: {
		title: "Auth: JWT", text: "Auth moved to JWT; the sessions table was dropped.",
		why: "proposed by mcp:claude-code · queued", decided: "decided by user@cli",
	},
	verify: { command: "engramma verify", result: "log verified: 9 operations, hash chain, reconstruction and FTS index in place" },
};

// ── How truth is kept ───────────────────────────────────────────────────────
// Each rule names the document that makes the engine keep it. The bodies say
// what the released binary does: where the two differ from an earlier draft,
// the binary wins and the difference is in the site report.
export const ENGRAMMA_RULES = [
	{
		title: "The log is the truth",
		body: "Notes, graph and indexes are derived from one hash-chained log. engramma verify replays it and must find the same state.",
		source: { label: "cli.md · verify", url: `${CLI}#verify` },
	},
	{
		title: "Every fact is signed",
		body: "Who proposed it (you, mcp:claude-code, an assistant over HTTP), from which source, with what confidence, valid from when, and who decided.",
		source: { label: "DESIGN § 8.5", url: `${DESIGN}#85-proposte-revisori-storico-e-rollback-v05` },
	},
	{
		title: "Your policy is the gate",
		body: "Per memory space: proposals wait for you, or a reviewer you configured decides within your limits — a minimum confidence, note types, a cap per hour. Below the limit, the decision comes back to you.",
		source: { label: "DESIGN § 8.5 · the policy", url: `${DESIGN}#la-politica-per-cella` },
	},
	{
		title: "Disagreements stay visible",
		body: "Two tools that correct the same fact both land in the queue, each signed. The correction you accept first stands; the other is refused and waits in the queue — reject it, or revert the first and it becomes valid. Two devices that write the same note make a conflict copy. Never last-write-wins.",
		source: { label: "node.md · v0.6.18, F3", url: `${DOCS}/node.md#una-correzione-vale-contro-la-versione-che-correggeva-v0618-f3` },
	},
	{
		title: "Change keeps history",
		body: "A new fact supersedes the old one with dates; ask what was true on any day.",
		source: { label: "cli.md · search --as-of", url: `${CLI}#search-text` },
	},
	{
		title: "Mistakes undo in one move",
		body: "Revert in bulk what a reviewer decided since Tuesday, what you decided, or what an assistant proposed — with a preview first. Any single decision goes back the same way, and the proposal returns to the queue. Purge forgets for real.",
		source: { label: "cli.md · revert", url: `${CLI}#engramma-revert-decision---by-actor---proposed-by-actor---since-date` },
	},
];

// The example of rule 4, the whole story as it ran (S11, S11b, S14, S14b):
// two corrections of one note, both proposed before either was decided, both
// in the queue. Claude Code's is accepted first; Codex's is refused and waits.
// The first is reverted and the second accepted; the first, in its turn, is
// refused as not the current version and rejected. `refused` is the side the
// drawing sets a step back.
export const ENGRAMMA_CONFLICT = {
	target: "Contratti Acme",
	left: { tool: "Claude Code", actor: "mcp:claude-code", text: "Acme signs quarterly contracts." },
	right: { tool: "Codex", actor: "mcp:codex", text: "Acme signs two-year contracts." },
	refused: "left",
	verdict: { kept: "Acme signs two-year contracts.", tag: "decided by you", other: "refused as long as the correction accepted first stood, accepted once it was reverted; that correction was then refused in its turn, and rejected" },
};

// What sets Engramma apart from the usual memory layer for assistants.
export const ENGRAMMA_DIFFERENT = [
	{ topic: "Where it runs", usual: "A cloud service, or a server with a vector database", engramma: "One file per memory space, on your computer" },
	{ topic: "What it stores", usual: "Embeddings only the system can read", engramma: "Markdown notes you can read, edit and export" },
	{ topic: "When a fact changes", usual: "The old value is overwritten", engramma: "The old version stays, with its dates" },
	{ topic: "Why this answer", usual: "A similarity score", engramma: "Source, confidence, graph path and validity" },
	{ topic: "What the assistant adds", usual: "Anything it reads goes into memory", engramma: "Proposals and third-party content wait for you" },
	{ topic: "Proof", usual: "Trust the database", engramma: "A hash-chained log anyone can replay" },
];

// Mirrors Engramma's docs/DESIGN.md § 12, in plain language. The releases are
// all tagged in the repository (`fase-v0.1` … `fase-v0.6.19`, `v0.6.19-beta.1`).
export const ENGRAMMA_ROADMAP = {
	shipped: [
		{
			label: "Foundations · shipped",
			releases: [
				{ version: "0.1", title: "Notes and the log", body: "Markdown notes, one SQLite file, a hash-chained log, text search, quarantine, read-only MCP.", href: `${REPOSITORY}/tree/fase-v0.1` },
				{ version: "0.2", title: "Meaning", body: "The embedded model, int8 vectors, mixed search.", href: `${REPOSITORY}/tree/fase-v0.2` },
				{ version: "0.3", title: "Graph and forgetting", body: "Personalized PageRank, purge, the Markdown vault view.", href: `${REPOSITORY}/tree/fase-v0.3` },
			],
		},
		{
			label: "Inside Homun · shipped",
			releases: [
				{ version: "0.4", title: "Node module", body: "Engramma becomes Homun’s memory; tuned on LongMemEval.", href: `${REPOSITORY}/tree/fase-v0.4` },
				{ version: "0.5", title: "Other assistants", body: "Proposals, review and rollback; MCP over HTTPS, exercised with ChatGPT, claude.ai and Codex.", href: `${REPOSITORY}/tree/fase-v0.5` },
				{ version: "0.6", title: "Encrypted sync", body: "Your devices share one memory, end to end encrypted.", href: `${REPOSITORY}/tree/fase-v0.6` },
			],
		},
	],
	now: {
		label: "Now",
		releases: [
			{ version: `${VERSION.split("-")[0]} · beta`, title: "Developer preview", body: "Public binaries, installer, the compatibility promise.", href: ENGRAMMA_RELEASE.releaseUrl },
			{ version: "planned", title: "More platforms", body: "Windows and Intel Macs, once their builds pass every test.", href: ENGRAMMA_RELEASE.readmeUrl },
		],
	},
	next: {
		label: "Next",
		releases: [
			{ version: "planned", title: "Your documents", body: "PDF, Office files and web pages become sourced notes. Today Engramma reads Markdown only." },
			{ version: "0.7", title: "Organizations", body: "Shared memory with signed rules: who reads, proposes, writes.", href: DESIGN },
			{ version: "0.7.1", title: "Protection at rest", body: "Encrypted company memory, device revocation.", href: DESIGN },
			{ version: "0.8", title: "Engramma server", body: "Many spaces in one service, SSO, admin console, read audit.", href: DESIGN },
			{ version: "0.9", title: "Cluster", body: "Replicas, placement, backups to object storage.", href: DESIGN },
		],
	},
	vision: [
		{ title: "You", body: "One person’s memory, on their own devices, shared with the assistants they choose." },
		{ title: "Your team", body: "Spaces shared by role, with rules everyone can verify and no central server required." },
		{ title: "Your company", body: "An optional server, single sign-on and audit, scaling to a cluster." },
	],
};

export const ENGRAMMA_FAQ = [
	{
		question: "Does it replace a RAG stack?",
		answer: "For your notes and conversations, yes: it embeds and searches them by words, meaning and graph in one file, with no vector database and no embedding API, and says why each result matched. Point it at a Markdown folder or an Obsidian vault with <code>engramma import</code>. PDF, Office files and web pages are not ingested yet: they are on the roadmap.",
	},
	{
		question: "Can several tools use the same memory at once?",
		answer: "Yes. Each connects with its own name; reads are shared, writes are proposals signed by that tool and handled by the memory space’s policy. Reads are not written to the log: only changes are signed.",
	},
	{
		question: "Does it need an API key or a GPU?",
		answer: "No. The embedding model runs on the CPU inside the engine. A remote embedding endpoint is optional.",
	},
	{
		question: "Where is my data?",
		answer: "In one file per memory space on your disk. Sync between your devices is end-to-end encrypted; a relay can forward it but never read it.",
	},
	{
		question: "How does it relate to Homun?",
		answer: "Engramma is Homun’s memory. The same engine ships as a command line and an MCP server for any assistant.",
	},
	{
		question: "Will my memory survive updates?",
		answer: "Yes: every later version opens memory written by this one. The promise and its tests are in the repository.",
	},
];

// ── The numbers ─────────────────────────────────────────────────────────────
// Only measured figures, each with the place in the repository it comes from.
// The links that depend on a count are pinned to the released tag.
export const ENGRAMMA_NUMBERS = [
	{
		value: "97.5%",
		label: "LongMemEval: the right session in the top 5, on 320 questions held out until the end",
		source: { label: "DESIGN § 6.3", url: `${DESIGN}#63-la-domanda` },
	},
	{
		value: "6",
		label: "languages with a stemmer: Italian, English, French, German, Spanish, Portuguese",
		source: { label: "text.rs · ALL_STEM_LANGS", url: `${REPOSITORY}/blob/${TAG}/crates/engramma-core/src/text.rs#L22` },
	},
	{
		value: "0",
		label: "services to call: the model, the search and the index run inside the engine",
		source: { label: "README · Embedded", url: ENGRAMMA_RELEASE.readmeUrl },
	},
	{
		value: "700+",
		label: "tests in the repository, 676 in Rust and 67 in JavaScript, run on every push: 29 property tests and the golden files with them",
		source: { label: "ci.yml", url: `${REPOSITORY}/blob/${TAG}/.github/workflows/ci.yml` },
	},
	{
		value: "1",
		label: "file per memory space on your disk: plain SQLite",
		source: { label: "compatibilita.md", url: `${DOCS}/compatibilita.md#i-file-delle-celle` },
	},
];

// ── Connect ─────────────────────────────────────────────────────────────────
// How each client starts the server. Local ones use the `default` cell, the
// one `engramma init` creates: a cell that does not yet exist is an error.
// `tested` means exercised end to end with the engine (docs/http.md): the mark
// is on the two web clients that searched and proposed on 12 November 2026.
const BIN = "~/.cargo/bin/engramma";
const ABS_BIN = "/Users/you/.cargo/bin/engramma";
const ARGS = '["mcp", "--cells", "default"]';
const STDIO = (fields) => `{\n  "mcpServers": {\n    "engramma": {\n${fields}    }\n  }\n}`;
const REMOTE = `engramma mcp --cells default --http 127.0.0.1:8787 \\
  --public-url https://memory.example.net

# then add https://memory.example.net/mcp as a connector,
# and approve the code your browser shows:
engramma oauth pending
engramma oauth approve XXXX-XXXX --label chatgpt --yes`;
const TESTED_ON = "Exercised on 12 November 2026 through a tunnel: claude.ai searched, showed the proposal form and was revoked; ChatGPT searched, queued a proposal and was revoked. Not re-run on this beta yet.";
// Story 1 of the capture is real on its proposing side, on THIS beta: Claude
// Code 2.1.332 proposed through its own MCP client and MCP Inspector 2.16.0
// read the same cell (scripts/fixtures/engramma-session.txt, in the website
// repository).
const TESTED_ON_THIS_BETA = "Exercised on this beta: story 1 of the capture behind this page — Claude Code 2.1.332 proposed through its own MCP client, MCP Inspector 2.16.0 read the same cell (the session is scripts/fixtures/engramma-session.txt in the website repository).";
// Codex was the reader of story 1 on 0.6.17-beta.1: its own CLI searched
// through its own MCP client and found what Claude Code had proposed. On the
// capture of 0.6.19 it is not installed: a driver carried its configuration.
const TESTED_ON_THIS_BETA_CODEX = "Exercised on 0.6.17-beta.1: story 1 of the capture of that release, run again with Codex as the reader — the Codex CLI 0.171.0-alpha.13.2 searched through its own MCP client and found the note Claude Code had proposed. Not re-run on this beta: Codex is not installed on the machine of the 0.6.19 capture, where a driver carried its configuration.";

export const ENGRAMMA_CLIENTS = [
	{
		id: "claude-code", name: "Claude Code", kind: "local", tested: true, file: "Terminal", lang: "sh",
		code: `claude mcp add engramma -- ${BIN} mcp --cells default`,
		note: `The default scope is the current project. --scope user makes the server available in every project. ${TESTED_ON_THIS_BETA}`,
	},
	{
		id: "claude-desktop", name: "Claude Desktop", kind: "local", tested: false,
		file: "~/Library/Application Support/Claude/claude_desktop_config.json", lang: "json",
		code: STDIO(`      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n`),
		note: "The configuration takes absolute paths only. Quit and restart the app after saving the file.",
	},
	{
		id: "cursor", name: "Cursor", kind: "local", tested: false, file: "~/.cursor/mcp.json", lang: "json",
		code: STDIO(`      "type": "stdio",\n      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n`),
		note: "~/.cursor/mcp.json holds the servers of every project; .cursor/mcp.json inside a project holds its own.",
	},
	{
		id: "vscode", name: "VS Code", kind: "local", tested: false, file: ".mcp.json (workspace root)", lang: "json",
		code: STDIO(`      "type": "stdio",\n      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n`),
		note: "The file Claude Code reads for a project too. The older .vscode/mcp.json uses a format that retires in February 2027.",
	},
	{
		id: "codex", name: "Codex", kind: "local", tested: true, file: "Terminal", lang: "sh",
		code: `codex mcp add engramma -- ${BIN} mcp --cells default`,
		note: `It writes ~/.codex/config.toml. For the remote server: codex mcp add engramma --url https://memory.example.net/mcp, then codex mcp login engramma. ${TESTED_ON_THIS_BETA_CODEX}`,
	},
	{
		id: "gemini", name: "Gemini CLI", kind: "local", tested: false, file: "~/.gemini/settings.json", lang: "json",
		code: STDIO(`      "command": "${ABS_BIN}",\n      "args": ${ARGS}\n`),
	},
	{
		id: "opencode", name: "OpenCode", kind: "local", tested: false, file: "opencode.json", lang: "json",
		code: `{\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    "servers": {\n      "engramma": {\n        "type": "local",\n        "command": ["${ABS_BIN}", "mcp", "--cells", "default"]\n      }\n    }\n  }\n}`,
		note: "Or from the terminal: opencode mcp add engramma -- ~/.cargo/bin/engramma mcp --cells default.",
	},
	{
		id: "chatgpt", name: "ChatGPT", kind: "remote", tested: true, file: "Plugins → Add custom MCP server", lang: "sh",
		code: REMOTE,
		note: `ChatGPT reaches remote servers only: publish yours behind an HTTPS tunnel you choose, then add it under Plugins (the plus button, Add custom MCP server). Full MCP, proposals included, is for Business, Enterprise and Edu plans; Pro connects custom servers with read and fetch permissions. For deep research or “knowledges”, start the server with --compat chatgpt. ${TESTED_ON}`,
	},
	{
		id: "claude-ai", name: "claude.ai", kind: "remote", tested: true, file: "Customize → Connectors → Add custom connector", lang: "sh",
		code: REMOTE,
		note: `Remote only, on the standard HTTPS port. Add it under Customize → Connectors (+ Add, then Add custom connector) with the address including its path. Free plans can hold one custom connector. ${TESTED_ON}`,
	},
];
