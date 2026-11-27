import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ENGRAMMA_RELEASE, ENGRAMMA_CAPTURE_LINE } from "../src/data/engramma.mjs";

// The Engramma documentation speaks about a released binary: every command
// and every option it cites must exist in the captured --help of that binary
// (scripts/fixtures/engramma-help.txt), the pages of the spec must exist and
// sit in the sidebar, and no link may point at releases/latest — GitHub's
// "latest" skips prereleases, and Engramma is one.

const docsDir = "src/content/docs/engramma";
const pages = readdirSync(docsDir).filter((name) => name.endsWith(".md"));
const help = readFileSync("scripts/fixtures/engramma-help.txt", "utf8");

// ── The vocabulary of the binary ────────────────────────────────────────────
const sections = new Map();
let current = null;
for (const line of help.split("\n")) {
	const match = /^### (.+)$/.exec(line);
	if (match) {
		current = match[1];
		sections.set(current, []);
	} else if (current) sections.get(current).push(line);
}

const commands = new Set(); // "init", "cell list", "vault sync", …
const options = new Set(); // "--root", "--cells", …
for (const [name, body] of sections) {
	if (name !== "engramma --help") commands.add(name);
	// The Commands: block of any section names its subcommands: "accept" under
	// "proposals" becomes "proposals accept". The main help's block carries the
	// top-level commands bare. Only the block itself: Arguments lines look alike.
	const isMain = name === "engramma --help";
	const joined = body.join("\n");
	const commandsAt = joined.indexOf("\nCommands:");
	if (commandsAt >= 0) {
		const block = joined.slice(commandsAt).split(/\n\n/)[0];
		for (const [, cmd] of block.matchAll(/^\s{2}(\S+)\s{2,}\S/gm)) {
			commands.add(isMain ? cmd : `${name} ${cmd}`);
		}
	}
	// Every flag the help itself names — as an option line or inside a
	// description — belongs to the binary's surface.
	for (const [, flag] of body.join("\n").matchAll(/(--[\w][\w.-]*)/g)) options.add(flag);
}

// The fixture carries the help of the top-level commands. The options of a
// subcommand (`proposals accept --no-embed`, `devices invite --name`) are
// proven by the two captured sessions, where the released binary really ran
// them: those flags validate citations but do not widen the reference's duty:
// the reference follows the help, and the help alone.
const helpOptions = new Set(options);
// Only the lines where the binary itself was run count: the other clients the
// sessions drove (Claude Code, the inspector) have flags of their own.
for (const path of ["scripts/fixtures/engramma-session.txt", "scripts/fixtures/engramma-docs-session.txt"]) {
	let running = false;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		if (line.startsWith("$ ")) running = line.startsWith("$ engramma");
		else if (!/^\s/.test(line)) running = false;
		if (!running) continue;
		for (const [, flag] of line.matchAll(/(--[\w][\w.-]*)/g)) options.add(flag);
	}
}
assert.ok(commands.size > 30, "the fixture must carry the whole command surface");
assert.ok(options.size > 30, "the fixture must carry the options");

// The fixtures are a capture of the release the docs speak of: its version
// line is in both sessions, and nothing of what the CLI printed in Italian
// before 0.6.19 survives.
const italianLabels = ["registro verificato", "punteggio", "in coda", "decisa da", "rettifica"];
const versionLine = ENGRAMMA_CAPTURE_LINE;
const capturedVersion = ENGRAMMA_CAPTURE_LINE.split(" ")[1];
const ulid = /\b([0-9A-HJKMNP-TV-Z]{26})\b/g;
const capturedIds = new Set();
for (const path of ["scripts/fixtures/engramma-session.txt", "scripts/fixtures/engramma-docs-session.txt"]) {
	const fixture = readFileSync(path, "utf8");
	assert.ok(fixture.includes(versionLine), `${path} must be the capture of the released binary: "${versionLine}" is not in it`);
	const label = italianLabels.find((word) => fixture.includes(word));
	assert.equal(label, undefined, `${path} must be the capture of a binary that prints English: "${label}" is in it`);
	for (const [, id] of fixture.matchAll(ulid)) capturedIds.add(id);
}
// The docs say a revert is refused while a later correction stands on it:
// the docs capture has to show it.
assert.ok(readFileSync("scripts/fixtures/engramma-docs-session.txt", "utf8").includes("corrects this note: revert that correction first"), "the docs capture must show a revert refused under a later correction");
assert.ok(help.startsWith(`Engramma ${capturedVersion} — the --help of every command`), "the fixture must be the help of the captured binary");

// ── What the docs cite ──────────────────────────────────────────────────────
// Flags that belong to the other tools quoted in the client snippets, not to
// engramma: listed here so the rule stays "an engramma flag must be in the help".
const foreignFlags = new Set([
	"--proto", "--tlsv1.2", // curl
	"--scope", // claude mcp add
	"--url", // codex mcp add
	"--locked", "--release", "--package", // cargo
	"--options", // codesign
]);

const spec = [
	["index.md", "Overview"],
	["install.md", "Install"],
	["quickstart.md", "Quickstart"],
	["concepts.md", "Concepts"],
	["how-it-works.md", "How search works"],
	["connect.md", "Connect your assistants"],
	["policies-and-reviewers.md", "Policies and reviewers"],
	["sync.md", "Sync between devices"],
	["import-and-the-vault.md", "Import and the vault"],
	["embed-it.md", "Embed it"],
	["compatibility.md", "Compatibility"],
	["privacy.md", "Privacy"],
	["cli-reference.md", "CLI reference"],
	["whats-next.md", "What's next"],
];

const config = readFileSync("astro.config.mjs", "utf8");
const sidebarStart = config.indexOf("label: 'Engramma'");
assert.ok(sidebarStart > 0, "the Engramma topic is missing from the sidebar");
const sidebarBlock = config.slice(sidebarStart, config.indexOf("]),", sidebarStart));
const slugOf = (file) => {
	const slug = `docs/engramma/${file.replace(/\.md$/, "")}`;
	return slug.endsWith("/index") ? slug.slice(0, -"/index".length) : slug;
};

for (const [file, label] of spec) {
	assert.ok(pages.includes(file), `the docs need ${file} (${label})`);
	const slug = slugOf(file);
	assert.ok(
		sidebarBlock.includes(`'${slug}'`),
		`the sidebar must list ${label} (${slug})`,
	);
}
// The spec's order is the sidebar's order.
const positions = spec.map(([, label], index) => {
	const slug = slugOf(spec[index][0]);
	return sidebarBlock.indexOf(`'${slug}'`);
});
for (let index = 1; index < positions.length; index += 1) {
	assert.ok(positions[index] > positions[index - 1], `the sidebar order breaks at ${spec[index][1]}`);
}
// Nothing extra: the folder holds the spec and nothing else.
assert.deepEqual([...pages].sort(), [...spec.map(([file]) => file)].sort(), "the engramma docs folder holds exactly the spec pages");

let citations = 0;
for (const file of pages) {
	const markdown = readFileSync(join(docsDir, file), "utf8");

	// No link to releases/latest: GitHub's "latest" skips prereleases, and
	// Engramma is one. Saying so in prose is fine; pointing there is not.
	for (const [, href] of markdown.matchAll(/\]\(([^)]*)\)/g)) {
		assert.ok(!/releases\/latest/.test(href), `${file}: links releases/latest, which skips prereleases`);
	}

	// Every internal link to these docs resolves.
	for (const [, path] of markdown.matchAll(/\]\((\/docs\/engramma[^)#?]*)\/?\)/g)) {
		const target = `src/content${path.replace(/\/$/, "")}.md`;
		assert.ok(existsSync(target), `${file}: links a page that does not exist: ${path}`);
	}

	// Every `engramma <command…>` citation is a command of the binary.
	for (const [, invocation] of markdown.matchAll(/`engramma ([a-z][\w-]*(?: [a-z][\w-]*)?)/g)) {
		const words = invocation.split(" ");
		const chain = words.join(" ");
		const known = commands.has(chain) || commands.has(words[0]);
		assert.ok(known, `${file}: cites \`engramma ${chain}\`, which the binary does not have`);
		citations++;
	}

	// Every --flag is in the help, or declared as another tool's own.
	for (const [, , flag] of markdown.matchAll(/(^|[\s`'[])(--[\w][\w.-]*)/g)) {
		if (foreignFlags.has(flag)) continue;
		assert.ok(options.has(flag), `${file}: cites ${flag}, which the binary does not have`);
		citations++;
	}

	// The CLI prints in English since 0.6.19: none of its former Italian labels.
	const label = italianLabels.find((word) => markdown.includes(word));
	assert.equal(label, undefined, `${file}: carries an Italian label of the CLI: "${label}"`);

	// Every id the page quotes is in a capture: a capture run again moves them.
	for (const [, id] of markdown.matchAll(ulid)) {
		assert.ok(capturedIds.has(id), `${file}: quotes the id ${id}, which no capture holds`);
	}
}
// The Italian pages (src/content/docs/it/engramma/) are the English pages in
// prose: each one has a page of its own name to send the reader to, and
// inside their code blocks no Italian label of the CLI.
const italianDir = join(docsDir, "..", "it", "engramma");
assert.ok(existsSync(italianDir), "the Italian pages of the docs are missing: src/content/docs/it/engramma");
const italianPages = readdirSync(italianDir).filter((name) => name.endsWith(".md"));
assert.ok(italianPages.length > 0, "src/content/docs/it/engramma holds no page");
for (const file of italianPages) {
	const markdown = readFileSync(join(italianDir, file), "utf8");
	assert.ok(pages.includes(file), `it/${file}: the English page of the same name is missing`);
	const english = file === "index.md" ? "/docs/engramma/" : `/docs/engramma/${file.replace(/\.md$/, "")}/`;
	assert.ok(markdown.includes(`](${english})`), `it/${file}: must send the reader to the English page (${english})`);
	let inBlock = false;
	for (const line of markdown.split("\n")) {
		if (line.startsWith("```")) inBlock = !inBlock;
		else if (inBlock) {
			const label = italianLabels.find((word) => line.includes(word));
			assert.equal(label, undefined, `it/${file}: quotes an Italian label of the CLI: "${label}"`);
		}
	}
}
assert.ok(citations > 100, "the docs must cite the command surface, not paraphrase it");

// ── The CLI reference covers every command and option of the fixture ────────
const reference = readFileSync(join(docsDir, "cli-reference.md"), "utf8");
const referenceCommands = [...reference.matchAll(/^##+ `([^`]+)`/gm)].map(([, name]) => name);
const referenceText = reference;
for (const command of commands) {
	// A single command is covered by its own section; a subcommand by its
	// parent's section, whose verbatim list names it.
	const [parent, sub] = command.split(" ");
	const covered = referenceCommands.includes(parent)
		&& (sub === undefined || new RegExp(`^\\s{2}${sub}\\s{2,}`, "m").test(referenceText));
	assert.ok(covered, `the CLI reference must cover the command: ${command}`);
}
for (const option of helpOptions) {
	assert.ok(referenceText.includes(option), `the CLI reference must cover the option: ${option}`);
}

// The code blocks of the reference are the help of the fixture, block for
// block: "The command list" is the main help, every `## `command`` its own.
const blocks = new Map();
const referenceLines = reference.split("\n");
for (let i = 0; i < referenceLines.length; i++) {
	const heading = /^## (.+)$/.exec(referenceLines[i]);
	if (!heading) continue;
	const name = heading[1] === "The command list" ? "engramma --help" : heading[1].replace(/^`|`$/g, "");
	assert.equal(referenceLines[i + 2], "```text", `the CLI reference must quote \`${name}\` in a text block`);
	let end = i + 3;
	while (end < referenceLines.length && referenceLines[end] !== "```") end++;
	blocks.set(name, referenceLines.slice(i + 3, end).join("\n"));
	i = end;
}
assert.equal(blocks.size, sections.size, "the CLI reference must have one block for each command of the help");
for (const [name, body] of sections) {
	assert.ok(blocks.has(name), `the CLI reference must quote \`${name}\``);
	assert.equal(blocks.get(name), body.join("\n").replace(/\n+$/, ""), `the CLI reference must quote \`${name}\` as the help prints it`);
}

// The fixture is a capture of the released binary, and carries no paths of
// whoever captured it.
assert.ok(help.includes("Usage: engramma [OPTIONS] <COMMAND>"), "the fixture must be the binary's own help");
assert.ok(!help.includes("/Users/") && !help.includes("/home/"), "the fixture is public: no personal path in it");

console.log("Engramma docs contract passed");
