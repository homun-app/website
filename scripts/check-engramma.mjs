import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as brand from "../src/data/brand.mjs";
import {
	ENGRAMMA_RELEASE, ENGRAMMA_SHORT_INSTALL, ENGRAMMA_HERO_TERMINAL, ENGRAMMA_HUB,
	ENGRAMMA_RULES, ENGRAMMA_NUMBERS, ENGRAMMA_CLIENTS, ENGRAMMA_ROADMAP, ENGRAMMA_PLATFORMS_LINE,
} from "../src/data/engramma.mjs";

const output = "dist/engramma/index.html";
assert.ok(existsSync(output), "Build must include the Engramma product page");
const html = readFileSync(output, "utf8");
const plain = (fragment) => fragment
	.replace(/<[^>]+>/g, " ")
	.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
	.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const section = (from, to) => html.slice(html.indexOf(`id="${from}"`), html.indexOf(`id="${to}"`));

// The order and the ids are the mockup's. The band of the numbers has no id.
const anchors = [...html.matchAll(/<(?:header|section)\b[^>]*\sid="([^"]+)"/g)].map(([, id]) => id);
assert.deepEqual(
	anchors.slice(anchors.indexOf("install")),
	["install", "shared", "how", "meaning", "graph", "time", "trust", "truth", "different", "connect", "roadmap", "faq", "start"],
);

// The hero installs Engramma with the short command; Homun's download stays in the nav only.
const hero = section("install", "shared");
assert.ok(plain(hero).includes(ENGRAMMA_SHORT_INSTALL), "The hero must carry the short install");
assert.ok(hero.includes(`href="${ENGRAMMA_RELEASE.installerUrl}"`), "The hero must link the installer of this version");
assert.ok(hero.includes(`href="${ENGRAMMA_RELEASE.releaseUrl}"`), "The hero must link the release");
assert.doesNotMatch(hero, /\bdata-homun-download\b/, "The hero must not download Homun");
// The hero keeps the command and one line with the platforms and the links:
// the beta notice and the Gatekeeper note live at the bottom of the page.
assert.doesNotMatch(hero, /Gatekeeper|A beta:/, "The hero carries no beta notice and no Gatekeeper note");
const start = html.slice(html.indexOf('id="start"'));
assert.match(start, /A beta:/, "The beta notice is at the bottom of the page");
assert.match(start, /Gatekeeper/, "The Gatekeeper note is at the bottom of the page");

// Every line of the hero terminal is a line of the capture: the released
// binary wrote it (scripts/fixtures/engramma-session.txt), on the notes of the page.
const capture = readFileSync("scripts/fixtures/engramma-session.txt", "utf8").split("\n");
assert.ok(capture.includes("engramma 0.6.17-beta.1 (commit 1bfc611, schema 24)"), "The capture must be of the released binary");
assert.doesNotMatch(capture.join("\n"), /\/Users\/|\/home\//, "The capture is public: no personal path in it");
const words = (line) => (typeof line === "string" ? line : line.map((part) => (typeof part === "string" ? part : part[1])).join(""));
const quoted = (value) => value.replace(/"/g, "").replace(/\s+/g, " ");
for (const [index, line] of ENGRAMMA_HERO_TERMINAL.lines.entries()) {
	const value = words(line);
	if (!value) continue;
	const inCapture = value.startsWith("$ ")
		? capture.some((row) => quoted(row.replace(" --cell work", "")) === quoted(value))
		: capture.includes(value);
	assert.ok(inCapture, `Line ${index + 1} of the hero terminal is not in the capture: ${value}`);
}
assert.ok(html.includes("The CLI speaks Italian today; English output is coming"), "The terminal must say that the CLI prints Italian");

// The hub shows the signatures and the policies the engine really prints.
const hub = section("shared", "how");
for (const signature of ["mcp:claude-code", "mcp:cursor", "mcp:chatgpt", "user@cli", "reviewer:local", "write=propose", "write=auto"]) {
	assert.ok(hub.includes(signature), `The hub must show the real signature or policy: ${signature}`);
}
assert.equal((hub.match(/\bdata-scene=/g) ?? []).length, ENGRAMMA_HUB.scenes.length * 3, "Each story of the hub writes three rows");
assert.equal((hub.match(/class="read(?:\s|")/g) ?? []).length, ENGRAMMA_HUB.scenes.length, "A read is a row apart, never a signature");
assert.ok(plain(hub).includes("a read leaves no trace in the log"), "The hub must say that reads are not logged");
for (const { proposedAt, decided, actor, fact } of ENGRAMMA_HUB.scenes) {
	for (const value of [proposedAt, decided.at]) {
		assert.ok(capture.some((row) => row.includes(value)), `The time ${value} must be in the capture`);
	}
	assert.ok(capture.some((row) => row.includes(actor)), `The actor ${actor} must be in the capture`);
	assert.ok(capture.some((row) => row.includes(fact.replaceAll("’", "'")) || row.includes(fact)), `The fact of ${actor} must be in the capture`);
}

// Each rule of truth names the document that makes the engine keep it, and
// none promises what the binary does not do: `revert --by` undoes decisions,
// and an assistant signs proposals, never decisions.
const truth = section("truth", "different");
for (const { title, body, source } of ENGRAMMA_RULES) {
	assert.ok(plain(truth).includes(title), `Truth needs the rule: ${title}`);
	assert.ok(plain(truth).includes(body), `Truth needs the body of: ${title}`);
	assert.ok(truth.includes(`href="${source.url}"`), `The rule "${title}" must link its document`);
	assert.ok(source.url.startsWith(ENGRAMMA_RELEASE.repository), `The rule "${title}" must link the repository`);
}
assert.ok(capture.some((row) => row.includes("annullerò 0 decisioni")), "The capture must show what `revert --by mcp:` undoes");

// Only measured figures, each with its source in the repository.
for (const { value, source } of ENGRAMMA_NUMBERS) {
	assert.ok(html.includes(`href="${source.url}"`), `The figure ${value} must link its source`);
	assert.ok(source.url.startsWith(ENGRAMMA_RELEASE.repository), `The figure ${value} must come from the repository`);
}

// Connect: a card for each client. "tested" only where the engine was
// exercised with that client, end to end.
const connect = section("connect", "roadmap");
for (const { id, name, code } of ENGRAMMA_CLIENTS) {
	assert.ok(html.includes(`id="panel-${id}"`) && connect.includes(name), `Connect needs ${name}`);
	if (code.includes("--cells")) assert.match(code, /--cells"?,?\s*"?default/, `${name} must use the default cell, the one \`engramma init\` creates`);
}
// Each window shows its snippet line by line: what the copy button takes is
// the snippet itself, with its line breaks (a comment on its own line must
// stay on its own line).
const decode = (fragment) => fragment.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#39;/g, "'");
for (const { id, name, lang, code } of ENGRAMMA_CLIENTS) {
	const start = html.indexOf("<pre", html.indexOf(`id="panel-${id}"`));
	const window = html.slice(html.indexOf("<code", start), html.indexOf("</code>", start));
	assert.equal(decode(window), lang === "sh" ? `$ ${code}` : code, `${name}: the window must show its snippet line by line`);
}

// "tested" goes to a client that was exercised end to end on this beta, and
// to the two that were on the 12th of November: each note says which.
const tested = ENGRAMMA_CLIENTS.filter(({ tested }) => tested).map(({ name }) => name);
assert.deepEqual(tested, ["Claude Code", "Codex", "ChatGPT", "claude.ai"]);
assert.equal((connect.match(/class="tested(?:\s|")/g) ?? []).length, tested.length, "The tested mark belongs to the tested clients only");
assert.ok(plain(connect).includes("12 November 2026"), "The tested mark must say when, and that it was not re-run on this beta");
assert.ok(plain(connect).includes("Not re-run on this beta yet"));
// Claude Code is "tested" because story 1 of the capture is real on both
// sides: the note says where the story is.
const claudeCode = ENGRAMMA_CLIENTS.find(({ id }) => id === "claude-code");
assert.equal(claudeCode.tested, true);
assert.ok(claudeCode.note.includes("story 1 of the capture"), "Claude Code's note must point to story 1 of the capture");
assert.ok(claudeCode.note.includes("scripts/fixtures/engramma-session.txt"), "Claude Code's note must name the capture");
assert.ok(plain(connect).includes("story 1 of the capture"), "The page must say where Claude Code was exercised");
// Codex is "tested" because story 1 was run again with it as the reader: the
// capture holds its own call, and the note it found.
const codex = ENGRAMMA_CLIENTS.find(({ id }) => id === "codex");
assert.equal(codex.tested, true);
assert.ok(codex.note.includes("run again with Codex as the reader"), "Codex's note must say how it was exercised");
assert.ok(capture.some((row) => row.includes('mcp_tool_call: {"server":"engramma","tool":"memory_search"')), "The capture must hold the call Codex made");
assert.ok(capture.some((row) => row.includes("Auth: JWT | source: mcp:claude-code")), "The capture must hold what Codex found");
assert.ok(plain(hero).includes("what Claude Code learned, Codex knows"), "With Codex exercised, the hero says what it proves");
// Under the hub, the line that says how much of it is real.
assert.ok(plain(hub).includes("Replayed from a real session on 0.6.17-beta.1"), "The hub must say it replays a real session");
assert.ok(plain(hub).includes("the clients were a driver carrying their configuration"), "The hub must say which stories had a driver for a client");

// The roadmap: the phases of DESIGN § 12, "Your documents" in Next.
const roadmap = html.slice(html.indexOf('id="roadmap"'), html.indexOf('id="faq"'));
for (const era of [...ENGRAMMA_ROADMAP.shipped, ENGRAMMA_ROADMAP.now, ENGRAMMA_ROADMAP.next]) {
	assert.ok(roadmap.includes(era.label), `Roadmap needs the era ${era.label}`);
	for (const { title, version } of era.releases) assert.ok(plain(roadmap).includes(title), `Roadmap needs ${title}`);
}
assert.deepEqual(ENGRAMMA_ROADMAP.next.releases.map(({ version }) => version), ["planned", "0.7", "0.7.1", "0.8", "0.9"]);
// The shipped phases are tags of the repository, one link each.
const phases = [...roadmap.matchAll(/href="([^"]+\/tree\/fase-v0\.[^"]+)"/g)].map(([, href]) => href);
assert.equal(phases.length, ENGRAMMA_ROADMAP.shipped.flatMap(({ releases }) => releases).length, "Each shipped phase links its tag");
for (const href of phases) assert.ok(href.startsWith(`${ENGRAMMA_RELEASE.repository}/tree/fase-v0.`), `A phase links the repository: ${href}`);

// The developer preview is a prerelease, so every link names the version
// (GitHub's releases/latest skips prereleases).
assert.match(ENGRAMMA_RELEASE.version, /^\d+\.\d+\.\d+-beta\.\d+$/);
assert.ok(html.includes(ENGRAMMA_RELEASE.installerUrl), "The page must carry the versioned installer");
for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
	assert.doesNotMatch(href, /releases\/latest/, "No releases/latest link while Engramma is a prerelease");
	assert.doesNotMatch(href, /\.mcpb|engramma[^/?#]*\.(?:dmg|exe|msi|deb|appimage|zip|tar\.xz|tar\.gz)$/i, "No direct binary downloads: the installer checks them");
}
// The platforms the release does not ship yet are named as such, not left out.
assert.ok(plain(hero).includes(ENGRAMMA_PLATFORMS_LINE), "The hero must say which platforms the release ships");
const notShipped = ENGRAMMA_RELEASE.platforms.filter(({ shipped }) => !shipped);
assert.deepEqual(notShipped.map(({ label }) => label.split(" · ").pop()), ["Intel", "Windows"]);
for (const { label, shipped } of notShipped) {
	assert.ok(!shipped && ENGRAMMA_PLATFORMS_LINE.includes(label.split(" · ").pop()), `${label} is listed as not shipped`);
}

// The short install is a redirect of nginx to the installer of the current
// release: the rule and the data must say the same address.
assert.ok(ENGRAMMA_SHORT_INSTALL.endsWith("homun.app/engramma/install.sh | sh"));
assert.ok(!existsSync("dist/engramma/install.sh"), "The site must not ship a copy of the installer");
const nginx = readFileSync("nginx/default.conf", "utf8");
const rule = nginx.match(/location = \/engramma\/install\.sh\s*\{[^}]*return\s+(\d{3})\s+(\S+);/);
assert.ok(rule, "nginx must answer /engramma/install.sh");
assert.equal(rule[1], "302", "The redirect must not be cached: the address changes with every release");
assert.equal(rule[2], ENGRAMMA_RELEASE.installerUrl, "The redirect must point at the installer of the current release");

assert.ok(brand.ENGRAMMA_LETTERS?.[0]);
assert.ok(readFileSync("src/assets/brand/engramma-wordmark-light.svg", "utf8").includes(brand.ENGRAMMA_LETTERS[0]));
console.log("Engramma product page contract passed");
