import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as brand from "../src/data/brand.mjs";
import {
	ENGRAMMA_RELEASE, ENGRAMMA_SHORT_INSTALL, ENGRAMMA_HERO_TERMINAL, ENGRAMMA_HUB,
	ENGRAMMA_RULES, ENGRAMMA_CONFLICT, ENGRAMMA_MEANING, ENGRAMMA_GRAPH, ENGRAMMA_TIME, ENGRAMMA_CONTROL,
	ENGRAMMA_NUMBERS, ENGRAMMA_CLIENTS, ENGRAMMA_ROADMAP, ENGRAMMA_PLATFORMS_LINE, ENGRAMMA_CAPTURE_LINE
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
// The capture is of the release the page ships, built from its tagged commit.
const versionLine = ENGRAMMA_CAPTURE_LINE;
const capturedVersion = ENGRAMMA_CAPTURE_LINE.split(" ")[1];
assert.ok(capture.includes(versionLine), `The capture must be of the released binary: "${versionLine}" is not in it`);
assert.doesNotMatch(capture.join("\n"), /\/Users\/|\/home\//, "The capture is public: no personal path in it");
// The CLI prints in English since 0.6.19: the labels it printed in Italian
// before are neither in the capture nor on the page.
const italianLabels = ["registro verificato", "punteggio", "in coda", "decisa da", "rettifica"];
for (const label of italianLabels) {
	assert.ok(!capture.some((row) => row.includes(label)), `The capture must be of a binary that prints English: "${label}" is in it`);
	assert.ok(!plain(html).includes(label), `The page must not carry an Italian label of the CLI: "${label}"`);
}
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
	for (const piece of decided.text.split(" · ")) {
		assert.ok(capture.some((row) => row.includes(piece)), `The decision of ${actor} must be in the capture: ${piece}`);
	}
}
// Every reader of a story is a node of the drawing (the animation flies to
// it), and story 1 is read by the client that read the cell in the capture:
// the MCP Inspector, in S6. Codex only read as a driver, in S16.
for (const { to } of ENGRAMMA_HUB.scenes) {
	assert.ok(ENGRAMMA_HUB.tools.some(({ name }) => name === to), `The reader of a story must be a node of the hub: ${to}`);
	assert.ok(plain(hub).includes(`${to} asked`), `The hub must say that ${to} reads`);
}
assert.equal(ENGRAMMA_HUB.scenes[0].to, "MCP Inspector", "Story 1 is read by the MCP Inspector, the client that read in the capture");
assert.ok(capture.some((row) => row.startsWith("$ mcp-inspector --cli engramma mcp --cells work")), "The capture must hold the read of the MCP Inspector in story 1");

// The graph path, the two validity spans, the cosines of the meaning and
// the lines of the control are the ones the engine printed: a capture run
// again moves the ids, and the page has to follow.
const ulid = /\b([0-9A-HJKMNP-TV-Z]{26})\b/g;
assert.ok(capture.some((row) => row.trim() === `via: ${ENGRAMMA_GRAPH.via}`), "The graph path of the page is the one the engine printed");
for (const [, id] of ENGRAMMA_GRAPH.via.matchAll(ulid)) {
	assert.ok(capture.some((row) => row.includes(id)), `The capture must hold the note of the graph path: ${id}`);
}
for (const { valid } of [ENGRAMMA_TIME.old, ENGRAMMA_TIME.now]) {
	assert.ok(capture.includes(`   validity: ${valid}`), `The capture must print the validity span: ${valid}`);
}
for (const { title, cosine } of ENGRAMMA_MEANING.hits) {
	const at = capture.findIndex((row, index) => row.includes(title) && capture.slice(index, index + 6).includes(`   cosine: ${cosine}`));
	assert.ok(at >= 0, `The capture must print the cosine of "${title}": ${cosine}`);
}
assert.ok(capture.includes(ENGRAMMA_CONTROL.verify.result), "The result of verify on the page is a line of the capture");
for (const part of [ENGRAMMA_CONTROL.proposal.why, ENGRAMMA_CONTROL.proposal.decided]) {
	for (const piece of part.split(" · ")) {
		assert.ok(capture.some((row) => row.includes(piece)), `The queue must print what the page says of the proposal: ${piece}`);
	}
}

// Each rule of truth names the document that makes the engine keep it, and
// none promises what the binary does not do: an assistant signs proposals,
// never decisions, and a correction accepted first is the one that stands.
const truth = section("truth", "different");
for (const { title, body, source } of ENGRAMMA_RULES) {
	assert.ok(plain(truth).includes(title), `Truth needs the rule: ${title}`);
	assert.ok(plain(truth).includes(body), `Truth needs the body of: ${title}`);
	assert.ok(truth.includes(`href="${source.url}"`), `The rule "${title}" must link its document`);
	assert.ok(source.url.startsWith(ENGRAMMA_RELEASE.repository), `The rule "${title}" must link the repository`);
}
assert.ok(capture.some((row) => row.includes("decisions are signed by who decides")), "The capture must show that `revert --by mcp:` is a usage error");
assert.ok(capture.some((row) => row.includes("--proposed-by mcp:claude-code")), "The capture must show the way to undo what an assistant proposed");
// Rule 4 and its example follow the binary, through the whole story of S11,
// S11b, S14 and S14b: the second correction is refused while the first
// stands; once the first is reverted the second is accepted, and the other
// is refused in its turn and rejected. What the example keeps is active at
// the end of the story; what it refuses ends in a tombstone.
assert.ok(capture.some((row) => row.includes("is not the current version — already corrected by")), "The capture must show the second correction refused");
assert.ok(plain(truth).includes(ENGRAMMA_CONFLICT.left.text) && plain(truth).includes(ENGRAMMA_CONFLICT.right.text), "Truth needs both corrections of the example");
const proposalId = (text) => {
	const at = capture.findIndex((row) => row.includes("memory_propose(") && row.includes(`"text":"${text}"`));
	return at < 0 ? null : (/\{"decided_by":[^\n]*?"id":"([0-9A-HJKMNP-TV-Z]{26})"/.exec(capture[at + 1] ?? "")?.[1] ?? null);
};
const sides = [ENGRAMMA_CONFLICT.left, ENGRAMMA_CONFLICT.right];
const kept = sides.find(({ text }) => text === ENGRAMMA_CONFLICT.verdict.kept);
const refused = sides.find(({ text }) => text !== ENGRAMMA_CONFLICT.verdict.kept);
assert.ok(kept && refused && kept !== refused, "The verdict of the example must keep one of the two corrections");
for (const text of sides.map(({ text }) => text)) {
	assert.ok(proposalId(text), `The capture must hold the correction: ${text}`);
}
assert.equal(ENGRAMMA_CONFLICT.refused, sides.indexOf(refused) === 0 ? "left" : "right", "The drawing must set a step back the correction the example refuses");
assert.ok(capture.includes(`rejected (tombstone): ${proposalId(refused.text)}`), "The correction the example refuses ends in a tombstone");
const lastActive = capture.findLastIndex((row) => row.includes(`[active] Contratti Acme (${proposalId(kept.text).slice(-8)})`));
assert.ok(lastActive >= 0 && capture.slice(lastActive, lastActive + 14).includes(`   source: ${kept.actor}`), "The correction the example keeps is active at the end of the story");

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
// Claude Code is "tested" because story 1 of the capture is real on its
// proposing side: the capture holds the call it made, and the note says where.
const claudeCode = ENGRAMMA_CLIENTS.find(({ id }) => id === "claude-code");
assert.equal(claudeCode.tested, true);
assert.ok(claudeCode.note.includes("Exercised on this beta"), "Claude Code's note must say it was exercised on this beta");
assert.ok(claudeCode.note.includes("story 1 of the capture"), "Claude Code's note must point to story 1 of the capture");
assert.ok(claudeCode.note.includes("scripts/fixtures/engramma-session.txt"), "Claude Code's note must name the capture");
assert.ok(plain(connect).includes("story 1 of the capture"), "The page must say where Claude Code was exercised");
assert.ok(capture.some((row) => row.includes("tool_use: mcp__engramma__memory_propose")), "Claude Code is \"tested\": the capture must hold the call it made (it has to be logged in when the capture runs)");
// Codex is "tested" because story 1 was run again with it as the reader, on
// 0.6.17-beta.1: on the capture of this release it is a driver carrying its
// configuration, and the note says both things.
const codex = ENGRAMMA_CLIENTS.find(({ id }) => id === "codex");
assert.equal(codex.tested, true);
assert.ok(codex.note.includes("Exercised on 0.6.17-beta.1") && codex.note.includes("run again with Codex as the reader"), "Codex's note must say on which release it was exercised, and how");
assert.ok(codex.note.includes("Not re-run on this beta"), "Codex's note must say that it was not re-run on this beta");
assert.ok(capture.some((row) => row.includes("--actor codex") && row.includes("the configuration Codex's config.toml would carry")), "The capture must show Codex as a driver on this release");
assert.ok(plain(hero).includes("what Claude Code learned, Codex knows"), "The hero says what one memory is for");
// Under the hub, the line that says how much of it is real.
assert.ok(plain(hub).includes(`Replayed from a real session on ${capturedVersion}`), "The hub must say which release its session was captured on");
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
