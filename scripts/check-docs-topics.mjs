import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const homun = [
	"docs", "concepts", "guides/getting-started", "guides/settings", "guides/chat", "guides/memory",
	"guides/models", "guides/channels", "guides/automations", "guides/skills", "guides/connectors",
	"guides/local-computer", "guides/proactivity", "guides/security", "guides/download",
	"guides/self-hosting", "reference/architecture", "reference/components", "reference/memory-model",
	"reference/decisions", "license",
];
const engramma = ["engramma", "engramma/how-it-works", "engramma/privacy", "engramma/whats-next"];
for (const locale of ["", "it/"]) {
	for (const slug of [...homun, ...engramma]) {
		const path = 'dist/' + locale + (engramma.includes(slug) ? 'docs/' + slug : slug) + '/index.html';
		assert.ok(existsSync(path), path);
	}
	const docs = readFileSync('dist/' + locale + 'docs/index.html', "utf8");
	assert.ok(docs.includes('href="/' + locale + 'docs/engramma/"'), "Engramma topic link missing");
}
console.log("Documentation product topics and preserved routes passed");
