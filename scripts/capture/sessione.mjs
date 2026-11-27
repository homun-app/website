#!/usr/bin/env node
// The capture behind the Engramma page and docs: three sessions on the released
// binary, written verbatim into three fixtures of this repository.
//
//   engramma-session.txt       the page (/engramma/): S0–S16
//   engramma-docs-session.txt  the docs (/docs/engramma/**)
//   engramma-help.txt          the --help of every top-level command
//
//   node scripts/capture/sessione.mjs        the capture
//   node scripts/capture/sessione.mjs driver …   the stdio MCP driver (the
//                                                 capture starts it itself)
//
// Where things live:
// - <tmp>, the temporary folder of a session, is $CATTURA_TMP, or
//   `engramma-site-capture-<version>` in the folder of the OS for temporary
//   files. The binary goes to <tmp>/bin/bin/engramma with the installer of the
//   release (never on the PATH); the data root (<tmp>/root) and the models
//   (<tmp>/models) stay inside <tmp>: nothing reaches ~/.engramma, the model
//   cache of the user or the PATH. The embedding model is pulled from Hugging
//   Face, at its pinned revision.
// - The fixtures go to $CATTURA_OUT, or to scripts/fixtures of the repository
//   this folder belongs to.
// - notes/ holds the synthetic notes of the page (Gaia, Milano, Torino, Acme):
//   user data, in Italian. Only what the CLI prints is English.
//
// The real clients: Claude Code, headless with --mcp-config, proposes in story
// 1 (when it is not logged in, the driver proposes with its configuration, and
// the header of the capture says so); the MCP Inspector reads the same cell.
// Codex, Cursor, OpenCode, ChatGPT and Homun are the driver, carrying the
// configuration each client would carry.

import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const HERE = dirname(SELF);
const REPOSITORY = "https://github.com/homun-app/engramma";
const VERSION = "0.6.19-beta.1";
const COMMIT = "5d0e02a";
const SCHEMA = 24;
const MODEL = "granite-embedding-97m-multilingual-r2";
const INSTALLER = `${REPOSITORY}/releases/download/v${VERSION}/engramma-cli-installer.sh`;

const TMP = resolve(process.env.CATTURA_TMP ?? join(tmpdir(), `engramma-site-capture-${VERSION}`));
const REPO = resolve(process.env.CATTURA_REPO ?? join(HERE, "..", ".."));
const OUT = process.env.CATTURA_OUT ?? join(REPO, "scripts", "fixtures");
const ROOT = join(TMP, "root");
const MODELS = join(TMP, "models");
const LOGDIR = join(TMP, "out");
const BIN = join(TMP, "bin", "bin", "engramma");
const CLAUDE_CWD = join(TMP, "work-claude-run");
const progress = (message) => process.stderr.write(`${message}\n`);

// The commands of the fixtures are shell lines that run as they are written:
// a folder with a space or a quote in its name would need quoting there.
if (/[\s'"\\]/.test(TMP)) throw new Error(`CATTURA_TMP must not contain spaces or quotes: ${TMP}`);

const safeJson = (text) => {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
};
// The JSON answer of an MCP tool on one line: the page's document prints it
// compact, the docs' as the server prints it.
function compact(text) {
	const parsed = safeJson(text);
	return parsed === null ? text.replace(/\n$/, "") : JSON.stringify(parsed);
}
// The MCP Inspector: on the PATH, or in the cache of npx.
function inspectorBin() {
	const onPath = spawnSync("/bin/sh", ["-c", "command -v mcp-inspector || true"], { encoding: "utf8" }).stdout.trim();
	if (onPath) return dirname(onPath);
	const npx = join(homedir(), ".npm", "_npx");
	for (const entry of existsSync(npx) ? readdirSync(npx) : []) {
		const path = join(npx, entry, "node_modules", "@modelcontextprotocol", "inspector", "package.json");
		if (!existsSync(path)) continue;
		const pkg = safeJson(readFileSync(path, "utf8"));
		if (pkg?.name === "@modelcontextprotocol/inspector") return join(npx, entry, "node_modules", ".bin");
	}
	throw new Error("MCP Inspector not found: put mcp-inspector on the PATH (npx @modelcontextprotocol/inspector@2.16.0 --version caches it)");
}
const onPath = (program) => spawnSync("/bin/sh", ["-c", `command -v ${program} || true`], { encoding: "utf8" }).stdout.trim();

// ── the stdio MCP driver ─────────────────────────────────────────────────────
// initialize (it declares `site-capture-driver 0.0.1`), notifications/initialized,
// one tools/call; it prints the text of the tool and exits. The stderr of the
// server is diagnostics, not output, and is dropped. The arguments of the tool
// arrive on stdin as JSON.
if (process.argv[2] === "driver") {
	const argv = process.argv.slice(3);
	const tool = argv.pop();
	const chunks = [];
	for await (const chunk of process.stdin) chunks.push(chunk);
	const args = JSON.parse(Buffer.concat(chunks).toString("utf8"));
	const server = spawn("engramma", argv, { stdio: ["pipe", "pipe", "ignore"], env: process.env });
	const exit = (code) => {
		server.kill();
		process.exit(code);
	};
	server.on("error", (error) => {
		process.stderr.write(`driver: ${error.message}\n`);
		exit(1);
	});
	let buffer = "";
	const waiting = new Map();
	let nextId = 1;
	server.stdout.on("data", (chunk) => {
		buffer += chunk;
		let index;
		while ((index = buffer.indexOf("\n")) >= 0) {
			const line = buffer.slice(0, index);
			buffer = buffer.slice(index + 1);
			if (!line.trim()) continue;
			const message = safeJson(line);
			if (!message) continue;
			if (message.id !== undefined && waiting.has(message.id)) {
				waiting.get(message.id)(message);
				waiting.delete(message.id);
			} else if (message.id !== undefined && message.method) {
				// a request of the server (the confirmation form): declined
				server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { action: "decline" } })}\n`);
			}
		}
	});
	const request = (method, params) => new Promise((done, fail) => {
		const id = nextId++;
		waiting.set(id, done);
		server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
		setTimeout(() => {
			if (waiting.delete(id)) fail(new Error(`timeout: ${method}`));
		}, 90_000);
	});
	try {
		await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "site-capture-driver", version: "0.0.1" } });
		server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
		const call = await request("tools/call", { name: tool, arguments: args });
		const text = call.error ? JSON.stringify(call.error) : call.result.content.map((block) => block.text ?? "").join("\n");
		process.stdout.write(text);
		server.stdin.end();
		setTimeout(() => exit(call.error || call.result.isError ? 1 : 0), 300);
	} catch (error) {
		process.stderr.write(`driver: ${error.message}\n`);
		exit(1);
	}
} else {
	await capture();
}

// ── the capture ───────────────────────────────────────────────────────────────
async function capture() {
	if (!onPath("curl")) throw new Error("curl is needed, to install the binary and to let it pull the model");
	const inspector = inspectorBin();
	mkdirSync(LOGDIR, { recursive: true });

	// The environment of every command: the root and the models inside <tmp>;
	// the binary and the Inspector on the PATH of these processes only.
	const baseEnv = { ...process.env };
	for (const name of Object.keys(baseEnv)) if (name.startsWith("ENGRAMMA_")) delete baseEnv[name];
	const env = (extra = {}) => ({
		...baseEnv,
		PATH: `${dirname(BIN)}:${inspector}:${baseEnv.PATH ?? ""}`,
		ENGRAMMA_ROOT: ROOT,
		ENGRAMMA_MODEL_DIR: MODELS,
		EDITOR: join(TMP, "editor.sh"),
		MCP_CATALOG_PATH: join(TMP, "mcp-inspector-catalog.json"),
		...extra,
	});
	// <tmp> may be reached under two names (a symlinked temporary folder): both
	// are shortened, like the node executable.
	mkdirSync(TMP, { recursive: true });
	const aliases = [...new Set([TMP, realpathSync.native(TMP)])];
	const short = (text) => aliases.reduce((acc, alias) => acc.replaceAll(alias, "<tmp>"), String(text)).replaceAll(process.execPath, "<node>");
	const linesOf = (text) => {
		const body = text.endsWith("\n") ? text.slice(0, -1) : text;
		return body === "" ? [] : body.split("\n").map(short);
	};

	// A run: stdout and stderr in the order they arrive.
	function sh(cmdline, { cwd = TMP, extra = {}, timeout = 90_000, input, stopWhen } = {}) {
		return new Promise((done) => {
			const child = spawn("/bin/sh", ["-c", cmdline], { cwd, env: env(extra), stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"] });
			const ordered = [];
			let out = "";
			let stopped = false;
			let timedOut = false;
			const take = (chunk) => {
				ordered.push(chunk);
				out += chunk;
				if (stopWhen && !stopped && stopWhen.test(out)) {
					stopped = true;
					setTimeout(() => child.kill("SIGINT"), 500);
				}
			};
			child.stdout.on("data", (chunk) => take(chunk.toString("utf8")));
			child.stderr.on("data", (chunk) => take(chunk.toString("utf8")));
			const timer = setTimeout(() => {
				timedOut = true;
				child.kill("SIGINT");
			}, timeout);
			child.on("close", (code, signal) => {
				clearTimeout(timer);
				done({ code, signal, out, text: ordered.join(""), timedOut });
			});
			if (input !== undefined) child.stdin.end(input);
		});
	}
	// A command that stays up (a server, a wait): it waits for the line that
	// says it is ready, runs `meanwhile`, then gets Ctrl-C.
	async function serving(cmdline, { ready, meanwhile = async () => {} }) {
		const child = spawn("/bin/sh", ["-c", cmdline], { cwd: TMP, env: env(), stdio: ["ignore", "pipe", "pipe"] });
		const ordered = [];
		const ready_ = new Promise((done, fail) => {
			const timer = setTimeout(() => fail(new Error(`${cmdline}: not ready in 30 s — ${ordered.join("")}`)), 30_000);
			const take = (chunk) => {
				ordered.push(chunk.toString("utf8"));
				if (ready.test(ordered.join(""))) {
					clearTimeout(timer);
					done();
				}
			};
			child.stdout.on("data", take);
			child.stderr.on("data", take);
			child.on("close", (code) => {
				clearTimeout(timer);
				fail(new Error(`${cmdline}: exited with ${code} before it was ready — ${ordered.join("")}`));
			});
		});
		const closed = new Promise((done) => child.on("close", (code, signal) => done({ code, signal })));
		await ready_;
		await meanwhile();
		child.kill("SIGINT");
		return { ...await closed, text: ordered.join("") };
	}

	// The fixture being written, and the log of what ran.
	const LOG = [];
	const docs = new Map();
	let doc = null;
	const newDoc = (name) => {
		doc = { name, lines: [], scene: "" };
		docs.set(name, doc);
	};
	const raw = (...lines) => {
		doc.lines.push(...lines.flatMap((line) => short(line).split("\n")), "");
	};
	const scene = (tag, title) => {
		doc.scene = tag;
		raw("", `### ${tag} · ${title}`);
	};
	const finishLine = (r) => {
		if (r.timedOut) return "[no answer: stopped at the time limit]";
		if (r.signal) return "[stopped with Ctrl-C]";
		return `[exit ${r.code}]`;
	};
	// A captured run: `$ command`, the output word for word, the outcome.
	const step = async (cmdline, { display, timeout, stopWhen, cwd, extra } = {}) => {
		const r = await sh(cmdline, { timeout, stopWhen, cwd, extra });
		const shown = short(display ?? cmdline);
		raw(`$ ${shown}`, ...linesOf(r.text), finishLine(r));
		LOG.push({ fixture: doc.name, scene: doc.scene, cmd: shown, exit: r.code, signal: r.signal, text: short(r.text) });
		progress(`  [${doc.name} ${doc.scene}] ${shown.split("\n")[0]} → ${finishLine(r)}`);
		return r;
	};
	// A command that stays up, captured: the command and its output come
	// before what runs meanwhile, the outcome after.
	const servingStep = async (cmdline, { ready, first, meanwhile }) => {
		const at = doc.lines.length;
		const r = await serving(cmdline, { ready, meanwhile });
		doc.lines.splice(at, 0, `$ ${short(cmdline)}`, ...(first ? [first] : []), ...linesOf(r.text), "");
		// The capture gave the stop: it says so, whatever the exit code.
		raw("[stopped with Ctrl-C]");
		LOG.push({ fixture: doc.name, scene: doc.scene, cmd: short(cmdline), exit: r.code, signal: r.signal, text: short(r.text) });
		progress(`  [${doc.name} ${doc.scene}] ${cmdline} → ${finishLine(r)}`);
		return r;
	};
	// A call of the driver to the MCP server.
	const mcp = async ({ cells, write, actor, tool, args, comment = "", format = "compact" }) => {
		const server = ["mcp", "--cells", cells];
		if (write) server.push("--write", write);
		if (actor) server.push("--actor", actor);
		const r = await new Promise((done) => {
			const child = spawn(process.execPath, [SELF, "driver", ...server, tool], { cwd: TMP, env: env(), stdio: ["pipe", "pipe", "pipe"] });
			let out = "";
			let err = "";
			child.stdout.on("data", (chunk) => {
				out += chunk;
			});
			child.stderr.on("data", (chunk) => {
				err += chunk;
			});
			child.on("close", (code) => done({ code, out, err }));
			child.stdin.end(JSON.stringify(args));
		});
		// The page's document: the call and the answer on one line; the docs':
		// the answer of the server as it is, between two lines of the driver.
		const command = `engramma ${server.join(" ")}${comment ? `   ${comment}` : ""}`;
		const shown = format === "compact"
			? [`$ ${command}`, `  ${tool}(${JSON.stringify(args)}) ->`, ...compact(r.out).split("\n").map((line) => `    ${line}`)]
			: [`$ ${command}`, `[the driver: initialize, then tools/call ${tool}]`, `[tools/call ${tool} →]`, ...r.out.replace(/\n$/, "").split("\n"), "[driver stopped]"];
		raw(...shown, ...(r.code === 0 ? [] : [`[driver: exit ${r.code}] ${r.err.trim()}`]));
		LOG.push({ fixture: doc.name, scene: doc.scene, cmd: command, exit: r.code, text: short(r.out) });
		progress(`  [${doc.name} ${doc.scene}] ${command} → ${r.code}`);
		return { code: r.code, text: r.out, json: safeJson(r.out) };
	};
	// The last id of an output (the patterns here must be global).
	const lastMatch = (text, pattern) => [...String(text).matchAll(pattern.flags.includes("g") ? pattern : new RegExp(pattern.source, `${pattern.flags}g`))].at(-1)?.[1];
	const write = (name) => {
		mkdirSync(OUT, { recursive: true });
		const text = `${docs.get(name).lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
		// The fixtures are public: no path of whoever captured them.
		const local = [homedir(), TMP, REPO, SELF].filter((path) => path && path !== "/");
		if (/\/Users\/|\/home\//.test(text) || local.some((path) => text.includes(path))) {
			throw new Error(`${name}: a personal path stayed in the capture`);
		}
		writeFileSync(join(OUT, name), text);
		progress(`written ${short(join(OUT, name))}: ${text.split("\n").length} lines`);
	};

	// The binary, from the installer of the release, when it is not there yet.
	if (!existsSync(BIN)) {
		progress(`installing engramma ${VERSION} into <tmp>/bin with the installer of the release`);
		const installer = join(TMP, "engramma-cli-installer.sh");
		const downloaded = await sh(`curl -sSfL -o ${installer} ${INSTALLER}`, { timeout: 180_000 });
		if (downloaded.code !== 0) throw new Error(`the installer of the release did not download: ${downloaded.text.trim()}`);
		const installed = await sh(`ENGRAMMA_CLI_INSTALL_DIR=${join(TMP, "bin")} ENGRAMMA_CLI_NO_MODIFY_PATH=1 XDG_CONFIG_HOME=${join(TMP, ".config")} sh ${installer}`, { timeout: 600_000 });
		if (installed.code !== 0 || !existsSync(BIN)) throw new Error(`the installer did not put engramma into <tmp>/bin: ${installed.text.trim()}`);
	}
	const version = await sh("engramma --version");
	if (version.out.trim() !== `engramma ${VERSION} (commit ${COMMIT}, schema ${SCHEMA})`) throw new Error(`the binary is not the one of the release: ${version.out.trim()}`);
	const inspectorVersion = (await sh("mcp-inspector --version")).out.trim();
	const claudeInstalled = Boolean(onPath("claude"));
	const claudeVersion = claudeInstalled ? (await sh("claude --version")).out.trim() : "";
	const codexInstalled = Boolean(onPath("codex"));

	// The synthetic notes of the page: the bodies are in notes/, in Italian.
	// The flags go on the command line of `engramma add` (and `supersede`, for
	// the note that replaces Ufficio a Torino).
	const NOTES = {
		"ufficio-torino.md": { title: "Ufficio a Torino", flags: ["--source", "user", "--confidence", "stated", "--tag", "ufficio", "--valid-from", "2026-01-05"] },
		"gaia-milano.md": { title: "Gaia abita a Milano", flags: ["--source", "user", "--confidence", "stated", "--tag", "casa/milano", "--valid-from", "2026-09-01"] },
		"trasloco.md": { title: "Trasloco: scatoloni da Torino", flags: ["--source", "user", "--confidence", "stated", "--tag", "casa"] },
		"nuovo-ufficio.md": { title: "Nuovo ufficio", flags: ["--source", "user", "--confidence", "stated", "--tag", "ufficio", "--valid-from", "2027-04-01"] },
		"lavoro-giulia.md": { title: "Il lavoro di Giulia", flags: ["--source", "user", "--confidence", "stated", "--tag", "amici"] },
		"acme-contratti.md": { title: "Contratti Acme", flags: ["--source", "user", "--confidence", "stated", "--tag", "lavoro/acme"] },
		"acme-cfo.md": { title: "CFO di Acme", flags: ["--source", "website", "--confidence", "external", "--tag", "lavoro/acme"] },
		"ufficio-milano.md": { title: "Ufficio a Milano", flags: ["--source", "user", "--confidence", "stated", "--tag", "ufficio", "--valid-from", "2026-09-01"] },
	};
	const PAGE_ORDER = ["ufficio-torino.md", "gaia-milano.md", "trasloco.md", "nuovo-ufficio.md", "lavoro-giulia.md", "acme-contratti.md", "acme-cfo.md"];
	const DOCS_ORDER = ["ufficio-torino.md", "gaia-milano.md", "lavoro-giulia.md", "acme-contratti.md", "acme-cfo.md"];
	// The titles are always quoted: the line is a shell command and must run
	// as it is written. The order of the options is the one of 0.6.17.
	const withTitle = (file) => [...NOTES[file].flags.slice(0, 4), "--title", `"${NOTES[file].title}"`, ...NOTES[file].flags.slice(4)].join(" ");
	const addCommand = (file, { cell = "work", nice = true } = {}) => `${nice ? "nice -n 19 " : ""}engramma add ${join(TMP, "notes", file)} ${cell ? `--cell ${cell} ` : ""}--no-embed ${withTitle(file)}`;
	const supersedeCommand = (old, { cell = "work", nice = true } = {}) => `${nice ? "nice -n 19 " : ""}engramma supersede ${old} ${join(TMP, "notes", "ufficio-milano.md")} ${cell ? `--cell ${cell} ` : ""}${withTitle("ufficio-milano.md")}`;
	// A fresh root, the notes and the fixtures on disk; with the model already
	// pulled when `pull`.
	const prepare = async ({ pull = false } = {}) => {
		rmSync(ROOT, { recursive: true, force: true });
		// The folders of the docs are born empty at every run.
		for (const folder of ["export", "vault"]) rmSync(join(TMP, folder), { recursive: true, force: true });
		mkdirSync(join(TMP, "notes"), { recursive: true });
		for (const file of Object.keys(NOTES)) copyFileSync(join(HERE, "notes", file), join(TMP, "notes", file));
		copyFileSync(join(HERE, "reviewer-local.mjs"), join(TMP, "reviewer-local.mjs"));
		copyFileSync(join(HERE, "editor.sh"), join(TMP, "editor.sh"));
		chmodSync(join(TMP, "editor.sh"), 0o755);
		if (pull) {
			rmSync(MODELS, { recursive: true, force: true });
			await sh(`nice -n 19 engramma model pull ${MODEL}`, { timeout: 600_000 });
		}
	};
	const adds = async (order, cell, nice = true) => {
		const ids = {};
		for (const file of order) ids[file] = lastMatch((await step(addCommand(file, { cell, nice }))).out, /^added: (\S+)$/m);
		ids["ufficio-milano.md"] = lastMatch((await step(supersedeCommand(ids["ufficio-torino.md"], { cell, nice }))).out, /→ (\S+)$/m);
		return ids;
	};
	const decisionOf = async (cell, proposal) => safeJson((await sh(`engramma decisions ${cell ? `--cell ${cell} ` : ""}--json`)).out)?.decisions.find((decision) => decision.proposal === proposal)?.op_id;

	// Claude Code, headless: it proposes with its own MCP client, when it is
	// logged in. It has two minutes; then the driver proposes for it.
	const CLAUDE_PROMPT = 'Use the engramma memory_propose tool exactly once to remember one thing. Pass exactly these arguments and nothing else: text "Auth moved to JWT; the sessions table was dropped.", title "Auth: JWT", tags ["auth"], confidence "stated", reason "Read in commit 4f1c". Do not search the memory first and do not call any other tool. When the tool has answered, reply with the single word done.';
	const claudeDisplay = 'claude -p "<remember one thing…>" \\\n    --mcp-config claude-mcp.json --strict-mcp-config --tools "" \\\n    --allowedTools mcp__engramma__memory_propose --no-session-persistence \\\n    --output-format stream-json --verbose --max-turns 4';
	const claudeConfig = (cell) => JSON.stringify({ mcpServers: { engramma: { type: "stdio", command: join(TMP, "bin", "bin", "engramma"), args: ["mcp", "--cells", cell, "--write", cell, "--actor", "claude-code"], env: { ENGRAMMA_ROOT: ROOT, ENGRAMMA_MODEL_DIR: MODELS } } } });
	async function claudeProposal(cell) {
		if (!claudeInstalled) return { ok: false, notInstalled: true, servers: [] };
		mkdirSync(CLAUDE_CWD, { recursive: true });
		writeFileSync(join(CLAUDE_CWD, "claude-mcp.json"), claudeConfig(cell));
		const started = Date.now();
		const r = await sh(`claude -p '${CLAUDE_PROMPT}' --mcp-config claude-mcp.json --strict-mcp-config --tools "" --allowedTools mcp__engramma__memory_propose --no-session-persistence --output-format stream-json --verbose --max-turns 4`, { cwd: CLAUDE_CWD, timeout: 120_000 });
		const events = r.out.split("\n").map((line) => safeJson(line)).filter(Boolean);
		const init = events.find((event) => event.type === "system" && event.subtype === "init");
		const use = events.flatMap((event) => (event.type === "assistant" && Array.isArray(event.message?.content) ? event.message.content : [])).find((block) => block.type === "tool_use");
		const toolResult = events.flatMap((event) => (event.type === "user" && Array.isArray(event.message?.content) ? event.message.content : [])).find((block) => block.type === "tool_result");
		const result = events.find((event) => event.type === "result");
		return {
			ok: r.code === 0 && Boolean(use) && Boolean(toolResult),
			seconds: Math.round((Date.now() - started) / 1000),
			exit: r.code,
			sessionId: init?.session_id ?? result?.session_id ?? null,
			servers: (init?.mcp_servers ?? []).map((server) => `${server.name}:${server.status}`),
			use: use ? `${use.name} ${JSON.stringify(use.input)}` : null,
			toolResult: toolResult ? compact([].concat(toolResult.content).map((block) => block.text ?? "").join("\n")) : null,
			result: result ? JSON.stringify({ is_error: result.is_error, num_turns: result.num_turns, result: result.result }) : null,
			failure: result?.result ?? (r.out.trim() ? `exit ${r.code}` : r.text.trim().slice(0, 200)),
		};
	}
	const claudeLines = (outcome) => raw(`$ ${claudeDisplay}`, `[exit ${outcome.exit}]`, `  mcp_servers: [${outcome.servers.map((item) => `"${item}"`).join(", ")}]`, `  tool_use: ${outcome.use}`, `  tool_result: ${outcome.toolResult}`, `  result: ${outcome.result}`);
	const authStatus = claudeInstalled ? safeJson((await sh("claude auth status")).out)?.loggedIn : null;

	// ── the page: S0–S15 ─────────────────────────────────────────────────────
	progress("the session of the page");
	await prepare({ pull: true });
	newDoc("engramma-session.txt");
	const ids = {};
	const proposals = {};

	scene("S0", "the binary and an empty memory");
	await step("engramma --version");
	await step("engramma init");
	await step("engramma cell create work");
	await step("engramma model list --cell work");
	await step(`nice -n 19 engramma model use ${MODEL} --cell work`);

	scene("S1", "the synthetic notes of the mockup (Gaia, Milano, Torino, Acme)");
	Object.assign(ids, await adds(PAGE_ORDER, "work"));
	await step("nice -n 19 engramma embed --cell work");
	// The count before the search of S2: a read writes nothing to the log.
	await step("engramma verify --cell work");

	scene("S2", "hero: a search that explains itself, then verify");
	await step("engramma search \"where does Gaia live now?\" --cell work");
	await step("engramma verify --cell work");
	await step(`engramma get ${ids["gaia-milano.md"]} --cell work`);

	scene("S3", "meaning: the same question in other words, in another language");
	await step("engramma search \"Where does she live now?\" --cell work");

	scene("S4", "time: what is true today, and what was true in August");
	await step("engramma search office --cell work");
	await step("engramma search office --cell work --as-of 2026-08-01");

	scene("S5", "control: a claim from a web page waits outside the results");
	await step(`engramma search "Who is Acme's CFO?" --cell work`);
	await step(`engramma search "Who is Acme's CFO?" --cell work --include-quarantined --k 3`);
	await step("engramma proposals --cell work");
	await step("engramma policy show --cell work");

	scene("S6", "hub, story 1: Claude Code proposes, you accept, a second client reads");
	await step("engramma policy set --cell work write=propose");
	await step("engramma policy show --cell work");
	progress("Claude Code, headless, proposes (two minutes at most)…");
	const claudePage = await claudeProposal("work");
	progress(`Claude Code ${claudeVersion}: ${claudePage.ok ? "proposed" : `did not propose — ${claudePage.failure}`}`);
	if (claudePage.ok) {
		claudeLines(claudePage);
		proposals.auth = safeJson(claudePage.toolResult)?.id;
	} else {
		proposals.auth = (await mcp({ cells: "work", write: "work", actor: "claude-code", tool: "memory_propose", comment: "(the configuration Claude Code would carry)", args: { text: "Auth moved to JWT; the sessions table was dropped.", title: "Auth: JWT", tags: ["auth"], confidence: "stated", reason: "Read in commit 4f1c" } })).json?.id;
	}

	scene("S6 (continued)", "you accept it, a second client reads");
	await step("engramma proposals --cell work");
	await step(`engramma proposals show ${proposals.auth} --cell work`);
	await step("engramma search \"How do we authenticate?\" --cell work --k 2");
	await step(`engramma proposals accept ${proposals.auth} --cell work`);
	await step("engramma proposals --cell work");
	await step("engramma decisions --cell work");
	await step(`engramma history ${proposals.auth} --cell work`);
	await step(`engramma get ${proposals.auth} --cell work`);
	await step("engramma verify --cell work");
	await step(`mcp-inspector --cli engramma mcp --cells work \\\n    -e ENGRAMMA_ROOT=${ROOT} -e ENGRAMMA_MODEL_DIR=${MODELS} \\\n    --method tools/call --tool-name memory_search --tool-arg "query=How do we authenticate?" limit=2`);
	await step("engramma verify --cell work");

	scene("S7", "hub, story 2: Cursor proposes, the reviewer you configured decides, OpenCode reads");
	const reviewers = [`reviewers:`, `  local:`, `    command:`, `      argv: ["${process.execPath}", "${join(TMP, "reviewer-local.mjs")}"]`, `      timeout_secs: 10`].join("\n");
	writeFileSync(join(ROOT, "reviewers.yaml"), `${reviewers}\n`);
	raw("$ cat > $ENGRAMMA_ROOT/reviewers.yaml", reviewers);
	await step("engramma policy set --cell work write=auto reviewer=local");
	await step("engramma policy show --cell work");
	proposals.pnpm = (await mcp({ cells: "work", write: "work", actor: "cursor", tool: "memory_propose", comment: "(the client Cursor would run)", args: { text: "Use pnpm, never npm, in this repo.", title: "Package manager", tags: ["repo"], confidence: "stated", reason: "The user said so in this chat" } })).json?.id;
	await step("engramma proposals --cell work");
	await step("engramma decisions --cell work");
	await mcp({ cells: "work", write: "work", actor: "opencode", tool: "memory_search", comment: "(the client OpenCode would run)", args: { query: "Which package manager?", limit: 2 } });

	scene("S8", "hub, story 3: ChatGPT proposes something it read on a web page; Homun reads");
	proposals.cfo = (await mcp({ cells: "work", write: "work", actor: "chatgpt", tool: "memory_propose", comment: "(the client ChatGPT's grant would carry)", args: { text: "Acme's CFO is leaving in March.", title: "CFO di Acme", tags: ["lavoro/acme"], confidence: "inferred", reason: "Read on acme.example.com/news" } })).json?.id;
	await step("engramma proposals --cell work");
	await step(`engramma proposals show ${proposals.cfo} --cell work`);
	await step("engramma decisions --cell work");
	await step(`engramma search "Who is Acme's CFO?" --cell work --k 3`);
	await mcp({ cells: "work", write: "work", actor: "homun", tool: "memory_search", comment: "(the client Homun would run)", args: { query: "Who is Acme's CFO?", limit: 3 } });

	scene("S9", "the limit of confidence: the reviewer is not sure enough");
	proposals.standup = (await mcp({ cells: "work", write: "work", actor: "cursor", tool: "memory_propose", comment: "(the reviewer answers 0.6, under min_confidence 0.8)", args: { text: "The stand-up is at 9:30.", title: "Stand-up", confidence: "stated", reason: "The user said so, once" } })).json?.id;
	await step("engramma proposals --cell work");
	await step(`engramma proposals show ${proposals.standup} --cell work`);
	await step("engramma decisions --cell work");

	scene("S10", "revert --by: whose decisions a bulk revert undoes (dry runs)");
	for (const actor of ["mcp:claude-code", "mcp:", "reviewer:local", "reviewer:", "user", "user@cli"]) await step(`engramma revert --by ${actor} --cell work --dry-run --yes`);
	await step("engramma revert --proposed-by mcp:claude-code --cell work --dry-run --yes");
	await step("engramma revert --proposed-by mcp: --cell work --dry-run --yes");
	await step("engramma decisions --cell work --json");

	scene("S11", "two tools correct the same note before either correction is decided");
	await step("engramma policy set --cell work write=propose");
	proposals.fix1 = (await mcp({ cells: "work", write: "work", actor: "claude-code", tool: "memory_propose", comment: `(corrects the note ${ids["acme-contratti.md"]})`, args: { text: "Acme signs quarterly contracts.", title: "Contratti Acme", tags: ["lavoro/acme"], confidence: "stated", reason: "The user corrected it", supersedes: ids["acme-contratti.md"] } })).json?.id;
	proposals.fix2 = (await mcp({ cells: "work", write: "work", actor: "codex", tool: "memory_propose", comment: `(corrects the note ${ids["acme-contratti.md"]})`, args: { text: "Acme signs two-year contracts.", title: "Contratti Acme", tags: ["lavoro/acme"], confidence: "stated", reason: "The user corrected it on the phone", supersedes: ids["acme-contratti.md"] } })).json?.id;
	await step("engramma proposals --cell work");
	await step(`engramma proposals accept ${proposals.fix1} --cell work`);
	await step("engramma proposals --cell work");
	await step("engramma conflicts --cell work");
	await step("engramma search \"Which contracts does Acme sign?\" --cell work --k 4");
	await step(`engramma get ${ids["acme-contratti.md"]} --cell work`);
	await step(`engramma history ${ids["acme-contratti.md"]} --cell work`);
	await step("engramma verify --cell work");

	scene("S11b", "the second correction is refused: exit 4, and it stays in the queue");
	await step(`engramma proposals accept ${proposals.fix2} --cell work`);
	await step("engramma proposals --cell work");
	await step("engramma conflicts --cell work");
	await step("engramma search \"Which contracts does Acme sign?\" --cell work --k 3");
	await step(`engramma get ${ids["acme-contratti.md"]} --cell work`);
	await step(`engramma history ${ids["acme-contratti.md"]} --cell work`);
	await step("engramma verify --cell work");

	scene("S12", "the accepted notes have their vector at once: `embed` has nothing left");
	await step("engramma verify --cell work");
	await step("nice -n 19 engramma embed --cell work");
	await step("engramma verify --cell work");
	await step("engramma search \"How do we authenticate?\" --cell work --k 3");

	scene("S13", "what a reader gets in each story");
	await step(`engramma search "How do we authenticate?" --cell work --k 3`);
	await step(`engramma search "Which package manager?" --cell work --k 3`);
	await step(`engramma search "Who is Acme's CFO?" --cell work --k 3`);

	scene("S14", "a real revert of the first correction: the second is decidable again");
	const firstFix = await decisionOf("work", proposals.fix1);
	await step(`engramma revert ${firstFix} --cell work --dry-run`);
	await step("engramma verify --cell work");
	await step(`engramma revert ${firstFix} --cell work --yes`);
	await step("engramma proposals --cell work");
	await step("engramma decisions --cell work");
	await step("engramma conflicts --cell work");
	await step(`engramma get ${ids["acme-contratti.md"]} --cell work`);
	await step(`engramma proposals accept ${proposals.fix2} --cell work`);

	scene("S14b", "you keep one correction and refuse the other");
	await step(`engramma proposals accept ${proposals.fix1} --cell work`);
	await step(`engramma proposals reject ${proposals.fix1} --cell work --reason "The user said two-year contracts on the phone"`);
	await step("engramma proposals --cell work");
	await step("engramma decisions --cell work");
	await step(`engramma history ${proposals.fix1} --cell work`);
	await step("engramma search \"Which contracts does Acme sign?\" --cell work --k 3");
	await step("engramma verify --cell work");

	scene("S15", "the graph path the engine prints");
	await step("engramma search \"What about Gaia?\" --cell work --k 3");

	// ── S16: story 1 again, with Codex as the reader ──────────────────────────
	progress("S16: story 1 again, a fresh root and fresh models");
	// The page's models step aside: S16 shows the pull into an empty folder.
	rmSync(join(TMP, "models-page"), { recursive: true, force: true });
	renameSync(MODELS, join(TMP, "models-page"));
	await prepare();
	scene("S16", "story 1 again, with Codex as the reader");
	// The introduction of S16 is written at the end of the scene, when it
	// knows who was real.
	const s16At = doc.lines.length;
	await step("engramma --version");
	await step("engramma init");
	await adds(PAGE_ORDER, "", false);
	await step(`engramma model pull ${MODEL}`);
	await step(`engramma model use ${MODEL}`);
	await step("engramma policy set write=propose");
	await step("engramma policy show");
	await step("engramma embed");
	await step("engramma search \"How do we authenticate?\" --k 2");
	raw("$ cat > claude-mcp.json", claudeConfig("default"));
	const claude16 = claudePage.ok ? await claudeProposal("default") : null;
	if (claude16?.ok) {
		claudeLines(claude16);
	} else {
		await mcp({ cells: "default", write: "default", actor: "claude-code", tool: "memory_propose", comment: "(the configuration Claude Code would carry)", args: { text: "Auth moved to JWT; the sessions table was dropped.", title: "Auth: JWT", tags: ["auth"], confidence: "stated", reason: "Read in commit 4f1c" } });
	}
	const proposal16 = lastMatch((await sh("engramma proposals --json")).out, /"id": "([0-9A-HJKMNP-TV-Z]{26})"/);
	await step("engramma proposals");
	await step(`engramma proposals show ${proposal16}`);
	await step("engramma search \"How do we authenticate?\" --k 2");
	await step(`engramma proposals accept ${proposal16}`);
	await step("engramma proposals");
	await step("engramma decisions");
	await step("engramma embed");
	await step("engramma search \"How do we authenticate?\" --k 2");
	await mcp({ cells: "default", write: "default", actor: "codex", tool: "memory_search", comment: "(the configuration Codex's config.toml would carry)", args: { query: "How do we authenticate?", limit: 3 } });
	await step("engramma verify");
	raw("A server started with `--actor codex` and no `--write`: a usage error since", "0.6.18 (exit 2). On 0.6.17 the server died, and the client saw an internal error.");
	await step("engramma mcp --cells default --actor codex");

	// The header of the page.
	const claudeShort = claudeVersion.replace(/\s*\(.*\)$/, "").replace(/^v/, "");
	const clients = { claudeShort, claudeInstalled, codexInstalled, inspectorVersion, authStatus, page: claudePage, second: claude16 };
	doc.lines.splice(s16At, 0, ...prose(`A second session on the same binary: a fresh root, the default cell (the one \`engramma init\` creates), the same synthetic notes, the model pulled into an empty folder. ${s16Clients(clients)} The notes are added before any model is configured. Since 0.6.18 an accepted proposal has its vector at once: the second \`engramma embed\` finds nothing waiting.`), "");
	const header = [
		`Engramma ${VERSION} — the capture behind the Engramma page`,
		"=".repeat(60),
		"",
		...prose(`The terminal lines, the log rows and the figures of /engramma/ come from this session: the released binary (commit ${COMMIT}), installed by the release installer into a temporary folder, on a fresh data root (ENGRAMMA_ROOT and ENGRAMMA_MODEL_DIR inside <tmp>), with the synthetic notes of the page (Gaia, Milano, Torino, Acme). The CLI prints in English since 0.6.19: commands and output are verbatim, and every command line is a shell line (queries and titles are quoted). What was changed: paths are shortened (<tmp> is the temporary folder of the session, <node> the node executable), the answer of an MCP call is printed on one line, and the capture script's own bookkeeping is left out.`),
		"",
		...prose(`The notes are the synthetic notes of the page, in Italian: they are the user's data, and only what the CLI prints is English. Four bodies — Ufficio a Torino, Trasloco: scatoloni da Torino, Nuovo ufficio, CFO di Acme — were written again for this capture: the files of the 0.6.17 session went with its temporary folder, and that capture never printed them. Titles, tags, validity, sources and the [[names]] they mention are the ones that capture showed; the figures that depend on those four bodies are new. The embedding model (${MODEL}, Apache-2.0) was pulled into <tmp>/models before S0; S16 shows the pull.`),
		"",
		"  S0    the binary and an empty memory",
		"  S1    the synthetic notes, then the count of the log",
		"  S2    hero: a search that explains itself, then verify",
		"  S3    meaning: the same question in other words, in another language",
		"  S4    time: what is true today, and what was true in August",
		"  S5    control: a claim from a web page waits outside the results",
		"  S6    hub, story 1: Claude Code proposes, you accept, a second client reads",
		"  S7    hub, story 2: Cursor proposes, the reviewer decides, OpenCode reads",
		"  S8    hub, story 3: ChatGPT proposes something it read on a web page",
		"  S9    the limit of confidence",
		"  S10   revert --by: whose decisions a bulk revert undoes (dry runs)",
		"  S11   two tools correct the same note: the first is accepted",
		"  S11b  … the second is refused: exit 4, and it stays in the queue",
		"  S12   the accepted notes have their vector at once: `embed` has nothing left",
		"  S13   what a reader gets in each story",
		"  S14   a real revert of the first correction: the second is decidable again",
		"  S14b  you keep one correction and refuse the other",
		"  S15   the graph path the engine prints",
		"  S16   story 1 again, with Codex as the reader",
		"",
		"The clients of the session",
		"-".repeat(26),
		...prose(...clientsParagraph(clients)),
		"",
		"What the session showed, beyond the page",
		"-".repeat(40),
		...bullets(showedParagraph()),
	];
	doc.lines.unshift(...header);
	write("engramma-session.txt");

	// ── the docs ──────────────────────────────────────────────────────────────
	progress("the session of the docs");
	await prepare();
	newDoc("engramma-docs-session.txt");
	const docsIds = {};

	scene("S0", "the first minute");
	await step("engramma --version");
	await step("engramma init");

	scene("S1", "the notes of the examples");
	for (const file of DOCS_ORDER) docsIds[file] = lastMatch((await step(addCommand(file, { cell: "", nice: false }))).out, /^added: (\S+)$/m);
	docsIds["ufficio-milano.md"] = lastMatch((await step(supersedeCommand(docsIds["ufficio-torino.md"], { cell: "", nice: false }))).out, /→ (\S+)$/m);

	scene("S2", "search before any model: words and graph");
	await step('engramma search "trasloco di Gaia"');
	await step('engramma search "CFO di Acme"');
	await step('engramma search "CFO di Acme" --include-quarantined');

	scene("S3", "the model, once");
	await step("engramma model list");
	await step(`engramma model pull ${MODEL}`);
	await step(`engramma model use ${MODEL}`);
	await step("engramma embed");
	await step('engramma search "where does Gaia live now?"');
	await step('engramma search "Where does she live now?"');
	await step('engramma search "ufficio" --as-of 2026-08-01');
	await step("engramma neighbors Milano");
	await step("engramma timeline Giulia");
	await step("engramma tags");
	await step("engramma entities");
	await step("engramma path Milano Acme");

	scene("S4", "a note, read and edited");
	await step("engramma search Gaia --k 1 --json");
	await step(`engramma get ${docsIds["gaia-milano.md"]}`);
	await step(`engramma edit ${docsIds["gaia-milano.md"]}`);
	await step(`engramma history ${docsIds["gaia-milano.md"]} --diff`);

	scene("S5", "the policy, the queue, the decisions");
	await step("engramma policy show");
	await step("engramma policy set write=propose");

	scene("S5b", "an assistant proposes (a stdio MCP driver, actor from --actor)");
	const courseArgs = { text: "Gaia è iscritta al corso di ceramica il giovedì.", title: "Corso di ceramica", tags: ["hobby"], confidence: "inferred" };
	// The second text of the 0.6.17 capture was never printed (its title
	// alone was): it takes one different from the first, or the engine
	// answers `duplicate`.
	const courseAgain = { text: "Il corso di ceramica di Gaia costa duecentoventi euro, materiale compreso.", title: "Corso di ceramica", tags: ["hobby"], confidence: "inferred" };
	const proposePretty = (args) => mcp({ cells: "default", write: "default", actor: "claude-code", tool: "memory_propose", format: "pretty", args });
	const course = (await proposePretty(courseArgs)).json?.id;
	await step("engramma proposals");
	await step("engramma decisions");
	await step(`engramma proposals show ${course.slice(-8)}`);

	scene("S5c", "accept, then change your mind");
	const courseDecision = async () => decisionOf("", course);
	await step(`engramma proposals accept ${course.slice(-8)}`);
	await step("engramma decisions");
	await step("engramma decisions --json");
	await step("engramma verify");
	await step(`engramma revert ${await courseDecision()} --dry-run`);
	await step("engramma verify");
	await step(`engramma revert ${await courseDecision()} --yes`);
	await step("engramma proposals");
	await step("engramma decisions");

	scene("S6", "quarantine and forgetting");
	await step('engramma search "CFO"');
	await step(`engramma confirm ${docsIds["acme-cfo.md"]}`);
	await step('engramma search "CFO"');
	await step(`engramma purge ${docsIds["acme-cfo.md"]} --reason "Gaia asked to forget it" --yes`);

	scene("S7", "export, vault, import");
	await step(`engramma export ${join(TMP, "export")}`);
	await step(`engramma vault init ${join(TMP, "vault")}`);
	// A hand edit to the file of the view: `vault sync` then shows the folder
	// telling the cell (on a view just initialized it answers `nothing to do`).
	const gaiaFile = readdirSync(join(TMP, "vault", "fact")).find((name) => name.startsWith("gaia-abita-a-milano-"));
	await step(`printf '\\nA novembre hanno anche cambiato la porta del bagno.\\n' >> ${join(TMP, "vault", "fact", gaiaFile)}`);
	await step(`engramma vault sync ${join(TMP, "vault")}`);
	const obsidian = join(TMP, "obsidian");
	rmSync(obsidian, { recursive: true, force: true });
	mkdirSync(join(obsidian, ".obsidian"), { recursive: true });
	writeFileSync(join(obsidian, ".obsidian", "app.json"), "{}\n");
	writeFileSync(join(obsidian, "yoga.md"), "Gaia fa yoga il martedì sera, nella palestra sotto casa.\n");
	writeFileSync(join(obsidian, "vacanze.md"), "Ad agosto Gaia e Giulia sono state in vacanza in Sicilia, per due settimane.\n");
	await step(`engramma import ${obsidian} --obsidian`);

	scene("S8", "verify");
	await step("engramma verify");

	scene("S9", "sync: pairing, without a second device");
	await step("engramma devices init");
	await servingStep("engramma devices invite --no-relay --name portatile", { ready: /waiting|attesa/i });
	await step("engramma devices code --no-relay", { stopWhen: /engramma:/ });
	await step("engramma devices list");
	await step("engramma sync status");

	scene("S10", "the review page");
	await servingStep("engramma review", { ready: /http:\/\/127\.0\.0\.1:\d+/ });

	scene("S11", "MCP over HTTP and the grants");
	await servingStep("engramma mcp --cells default --http 127.0.0.1:8787 --public-url https://memory.example.net", {
		ready: /http:\/\/127\.0\.0\.1:8787/,
		first: "[the server keeps running in this terminal]",
		meanwhile: async () => {
			await step("engramma oauth pending");
			await step("engramma oauth grants");
		},
	});

	scene("S12", "a second proposal, the bulk revert with its preview");
	await proposePretty(courseAgain);
	await step("engramma proposals");
	await step(`engramma proposals accept ${course.slice(-8)}`);
	await step("engramma decisions");
	await step("engramma revert --by user --dry-run");
	await step("engramma revert --by user --yes");
	await step("engramma decisions");
	await step("engramma proposals");

	scene("S13", "the policy fields");
	await step("engramma policy set write=auto reviewer=local min_confidence=0.8 kinds=fact,preference max_auto_per_hour=10");
	await step("engramma policy show");
	await step("engramma policy set write=propose");
	await step("engramma cell list");
	await step("engramma verify");

	scene("S11b", "the approve/deny surface, on a code nobody asked");
	await step("engramma oauth approve AAAA-BBBB --label chatgpt --yes");
	await step("engramma oauth deny AAAA-BBBB");

	scene("S7b", "vault sync on a folder that is not there (the flag is the point)");
	await step(`engramma vault sync ${join(TMP, "no-vault")} --allow-deletions`);

	scene("S9b", "the relay flag, accepted (no shared cells: the pass has nothing to say)");
	await step("engramma sync run --relay https://example.invalid");

	doc.lines.unshift(
		`Engramma ${VERSION} — the capture behind the Engramma docs`,
		"=".repeat(64),
		"",
		...prose(`Every command and output quoted by the pages under /docs/engramma/ comes from this session: the released binary (commit ${COMMIT}), installed by the release installer into a temporary folder, on a fresh data root (ENGRAMMA_ROOT and ENGRAMMA_MODEL_DIR inside <tmp>), with the synthetic notes of the site (Gaia, Milano, Torino, Acme). The CLI prints in English since 0.6.19: output is verbatim; what was changed: paths are shortened (<tmp> is the temporary folder of the session) and the capture script's own bookkeeping lines are left out.`),
		"",
		...prose("The proposing client of S5b and S12 is a stdio MCP driver carrying the configuration Claude Code would carry (`--actor claude-code`, so the engine signs `mcp:claude-code`): the engine side is real, the client side is the driver (`declared client: site-capture-driver 0.0.1`). The model was pulled into <tmp>/models before this session (the session behind the page shows the pull, S16); S3 pulls again, and the binary answers that it is already there."),
		"",
		...prose("The notes are the synthetic notes of the site, in Italian. Two bodies — Ufficio a Torino, CFO di Acme — were written again for this capture, as in the session behind the page (its header says why); so was the text of the second proposal of S12, of which the 0.6.17 capture printed the title alone. S7 edits the Gaia file in the vault before `vault sync`, so that the report shows the folder telling the cell: on a vault just initialized the sync answers `nothing to do`. The 0.6.17 capture showed that report without showing the edit."),
		"",
		...prose("The defect the 0.6.17 capture declared is closed since 0.6.18: `engramma revert <id> --dry-run` reverted for real. S5c shows the dry run writing nothing (`verify` counts the same operations before and after) and the real revert after it."),
		"",
	);
	write("engramma-docs-session.txt");

	// ── the help ──────────────────────────────────────────────────────────────
	progress("the help of --help");
	await prepare();
	newDoc("engramma-help.txt");
	const main = await sh("engramma --help");
	const names = [...main.out.matchAll(/^ {2}([a-z][\w-]*) {2,}\S/gm)].map(([, name]) => name);
	// The subcommands: does `engramma <parent> <sub> --help` answer its own?
	const subs = [];
	for (const name of names) {
		const help = await sh(`engramma ${name} --help`);
		const block = help.out.split("\nCommands:\n")[1]?.split(/\n\n/)[0] ?? "";
		for (const [, sub] of block.matchAll(/^ {2}([a-z][\w-]*) {2,}\S/gm)) subs.push({ name: `${name} ${sub}`, answer: await sh(`engramma ${name} ${sub} --help`) });
	}
	// Its own help, not the parent's: the output names the subcommand in its use.
	const own = subs.filter((sub) => sub.answer.code === 0 && sub.answer.out.includes(`Usage: engramma ${sub.name} `)).length;
	const refused = subs.filter((sub) => sub.answer.code !== 0).map((sub) => sub.name);
	progress(`subcommands: ${subs.length}, with their own help: ${own}, refused: ${refused.length ? refused.join(", ") : "none"}`);
	const subSentence = own === subs.length
		? `and every one of their ${subs.length} subcommands answers \`engramma <parent> <sub> --help\` with its own help.`
		: `and ${own} of their ${subs.length} subcommands answer \`engramma <parent> <sub> --help\` with their own help${refused.length ? ` (${refused.length} refuse it: ${refused.join(", ")})` : ""}.`;
	raw(
		`Engramma ${VERSION} — the --help of every command`,
		...prose(`Captured verbatim from the released binary (commit ${COMMIT}). The help and the run-time output are both in English since 0.6.19. This file carries the help of the top-level commands, in the order of the main help. Commands that take a subcommand (cell, proposals, conflicts, policy, model, devices, sync, mailbox, vault, oauth) document their subcommands in their own list, ${subSentence}`),
		"",
		"### engramma --help",
		main.out,
	);
	for (const name of names) {
		const r = await sh(`engramma ${name} --help`);
		if (r.code !== 0) throw new Error(`--help of ${name}: exit ${r.code}`);
		raw(`### ${name}`, r.out);
	}
	write("engramma-help.txt");

	// The page's models served their turn; the log tells what ran (and which
	// Claude Code sessions were started, for whoever wants to tidy up).
	rmSync(join(TMP, "models-page"), { recursive: true, force: true });
	writeFileSync(join(LOGDIR, "log.json"), `${JSON.stringify({ claudeSessions: [claudePage.sessionId, claude16?.sessionId].filter(Boolean), log: LOG }, null, 1)}\n`);
	progress(`done: the fixtures are in ${short(OUT)}`);
}

// ── the prose of the header: wrapped, bullets with a hanging indent ──────────
function wrap(text, width = 76, indent = "") {
	const out = [];
	let line = indent;
	for (const word of text.split(/\s+/).filter(Boolean)) {
		if (line === indent) line += word;
		else if (line.length + 1 + word.length <= width) line += ` ${word}`;
		else {
			out.push(line);
			line = indent + word;
		}
	}
	if (line !== indent) out.push(line);
	return out;
}
function prose(...paragraphs) {
	return paragraphs.flatMap((text, index) => [...wrap(text), ...(index < paragraphs.length - 1 ? [""] : [])]);
}
function bullets(items) {
	return items.flatMap((item) => {
		const lines = wrap(item, 76, "  ");
		lines[0] = `- ${lines[0].slice(2)}`;
		return lines;
	});
}

// Who was real and who was not: the page and S16.
function clientsParagraph({ claudeShort, claudeInstalled, codexInstalled, inspectorVersion, authStatus, page }) {
	const codex = codexInstalled ? "Codex is installed on the machine, but was not driven." : "Codex is not installed on the machine.";
	const first = page.ok
		? `Story 1 is real on the proposing side: Claude Code ${claudeShort} proposed through its own MCP client (\`--mcp-config\`, headless), and the MCP Inspector ${inspectorVersion} read the same cell.`
		: claudeInstalled
			? `No assistant took part in person. Claude Code ${claudeShort} was tried first, headless with \`--mcp-config\` (the command of the 0.6.17 capture): ${page.servers.length ? "its MCP client connected to the server, but" : "its MCP client did not connect and"} the turn ended before any tool call — \`${page.failure}\` (exit ${page.exit}, after ${page.seconds} s) — and \`claude auth status\` answers \`loggedIn: ${authStatus}\`.`
			: "No assistant took part in person: Claude Code is not installed on the machine.";
	const rest = page.ok
		? `${codex} The other actors — Cursor, OpenCode, ChatGPT, Homun, and Codex as the reader of S16 — were a stdio MCP driver carrying the configuration each client would carry.`
		: `${codex} So every actor — Claude Code, Cursor, OpenCode, ChatGPT, Homun, and Codex as the reader of S16 — was a stdio MCP driver carrying the configuration each client would carry. One client is real: the MCP Inspector ${inspectorVersion} read the same cell in S6, with the root and the model folder it reads (\`-e\`, like the \`env\` of Claude Code's configuration).`;
	const side = page.ok
		? "the client side of the proposals by Cursor and ChatGPT, and of the reads by Codex, OpenCode and Homun, is not"
		: "the client side of the proposals, and of the reads by Codex, OpenCode and Homun, is not";
	return [
		`${first} ${rest}`,
		`The engine signs the actor of the configuration, never what the client says it is, so the engine side of every scene is the real one; ${side} (\`declared client: site-capture-driver 0.0.1\`). The reviewer \`local\` is a fixture that answers with a fixed rule (accept what the user stated with confidence 0.9; under the policy's minimum it stays in the queue; the rest goes to the person), not a model.`,
	];
}
function s16Clients({ claudeInstalled, page, second }) {
	if (!page.ok) return claudeInstalled ? 'Claude Code is not tried again (see "The clients of the session"): both clients are the driver, with the configuration each would carry.' : "Claude Code is not installed on the machine: both clients are the driver, with the configuration each would carry.";
	if (second?.ok) return "Claude Code proposed through its own MCP client, as in S6; the reader is the driver, with the configuration Codex's config.toml would carry.";
	return `Claude Code was tried again, headless, and did not propose (\`${second?.failure ?? "it was not run"}\`): both clients are the driver, with the configuration each would carry.`;
}
function showedParagraph() {
	return [
		"`revert --by mcp:<actor>` is a usage error (exit 2): decisions are signed by who decides (user@cli, reviewer:<name>), never by who proposed. The message names the way: `--proposed-by`, which undoes the decisions taken on that actor's proposals (S10).",
		"A read leaves no trace in the log: `verify` counts the same operations before and after the search of S2, by CLI, and around the read of S6, by MCP.",
		"`revert <id> --dry-run` writes nothing: `verify` counts the same operations before and after the preview (S14).",
		"Two corrections of the same note: the first is accepted; the second is refused (exit 4: `… is not the current version — already corrected by …`) and stays in the queue, and `conflicts` reports no copy. Revert the first and the second is decidable again; reject the other and the tombstone keeps its text (`rejected (tombstone)`). Conflict copies come from two devices (S11, S11b, S14, S14b).",
		"A proposal that is accepted has its vector at once (`embedded: 1 (pending: 0)`), so a question with no word in common finds it without `engramma embed`; `embed` only takes what still waits (S6, S12).",
	];
}
