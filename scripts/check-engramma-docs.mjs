import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

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

// The subcommands of the custom-dispatch commands (proposals, oauth, …) have
// no --help of their own; the flags the docs cite for them are proven by the
// two captured sessions, where the released binary really ran them. Those
// flags validate citations but do not widen the reference's duty: the
// reference covers the help, and the help alone.
const helpOptions = new Set(options);
// Only the lines where the binary itself was run count: the other clients the
// sessions drove (Claude Code, Codex, the inspector) have flags of their own.
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

// The fixture is a capture of the released binary, and carries no paths of
// whoever captured it.
assert.ok(help.includes("Usage: engramma [OPTIONS] <COMMAND>"), "the fixture must be the binary's own help");
assert.ok(!help.includes("/Users/") && !help.includes("/home/"), "the fixture is public: no personal path in it");

console.log("Engramma docs contract passed");
