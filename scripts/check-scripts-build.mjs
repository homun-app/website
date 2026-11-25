import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Every script of the build must parse as the JavaScript the browser will run.
// A script that is not valid JavaScript still loads with a 200: the page looks
// fine and its buttons quietly do nothing. The parser is V8's, on purpose:
// Node on its own also accepts TypeScript in a module, a browser does not.
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const scripts = [];
const collect = async (name, source) => scripts.push({ name, source });

for (const entry of await readdir(join(dist, "_astro"), { withFileTypes: true })) {
	if (entry.isFile() && entry.name.endsWith(".js")) collect(`_astro/${entry.name}`, await readFile(join(dist, "_astro", entry.name), "utf8"));
}
let inline = 0;
for (const entry of await readdir(dist, { recursive: true, withFileTypes: true })) {
	if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
	const path = join(entry.parentPath, entry.name);
	const html = await readFile(path, "utf8");
	for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
		if (/\bsrc=/.test(attributes) || !body.trim() || /type="application\/(?:ld\+)?json"/.test(attributes)) continue;
		collect(`${path.slice(dist.length)} (inline)`, body);
		inline += 1;
	}
}
assert.ok(scripts.length > 0, "the build has no scripts");

// A type argument left in a module script is valid JavaScript with another
// meaning (`f<T>(x)` reads as comparisons), and throws when it runs. The
// minifier even drops the brackets, so what is looked for is the comparison
// itself: a name "lower than" a capitalized name.
const typed = scripts.filter(({ source }) => /[A-Za-z0-9_$)\]]\s*<\s*[A-Z][A-Za-z0-9_$]*\s*>/.test(source));
assert.deepEqual(typed.map(({ name }) => name), [], "a script carries a TypeScript type: module scripts are plain JavaScript");

const parser = `
	const { SourceTextModule } = require("node:vm");
	const broken = [];
	for (const { name, source } of JSON.parse(require("node:fs").readFileSync(0, "utf8"))) {
		try { new SourceTextModule(source, { identifier: name }); }
		catch (error) { broken.push(name + ": " + error.message); }
	}
	process.stdout.write(JSON.stringify(broken));
`;
const child = spawnSync(process.execPath, ["--no-warnings", "--experimental-vm-modules", "-e", parser], {
	input: JSON.stringify(scripts), encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
});
assert.equal(child.status, 0, `the parser did not run:\n${child.stderr}`);
const broken = JSON.parse(child.stdout);
assert.deepEqual(broken, [], "scripts the browser cannot parse");

console.log(`Built scripts parse: ${scripts.length - inline} files, ${inline} inline scripts`);
