import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const homun = [
	"docs", "concepts", "guides/getting-started", "guides/settings", "guides/chat", "guides/teams",
	"guides/memory", "guides/models", "guides/automations", "guides/skills", "guides/connectors",
	"guides/local-computer", "guides/security", "guides/download", "reference/architecture", "license",
];
// Homun 2 pages without a 0.3 counterpart redirect to their closest page.
const redirected = {
	"guides/channels": "/guides/connectors/", "guides/proactivity": "/guides/automations/",
	"guides/self-hosting": "/guides/download/", "reference/components": "/reference/architecture/",
	"reference/decisions": "/reference/architecture/", "reference/memory-model": "/docs/engramma/how-it-works/",
};
// Homun 2 wording that must not come back into the Homun docs.
const stale = ["apprentice", "apprendista", "~/.homun", "/guides/self-hosting", "WhatsApp and Telegram", "Rust core"];
const engramma = ["engramma", "engramma/how-it-works", "engramma/privacy", "engramma/whats-next"];
for (const locale of ["", "it/"]) {
	for (const slug of [...homun, ...engramma]) {
		const path = 'dist/' + locale + (engramma.includes(slug) ? 'docs/' + slug : slug) + '/index.html';
		assert.ok(existsSync(path), path);
	}
	for (const [from, to] of Object.entries(redirected)) {
		const html = readFileSync('dist/' + locale + from + '/index.html', "utf8");
		const target = (locale ? '/it' : '') + to;
		assert.ok(html.includes('url=' + target), 'dist/' + locale + from + ' must redirect to ' + target);
	}
	for (const slug of homun) {
		const html = readFileSync('dist/' + locale + slug + '/index.html', "utf8");
		const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
		for (const word of stale) assert.ok(!main.includes(word), 'Homun 2 wording "' + word + '" in ' + locale + slug);
	}
	const docs = readFileSync('dist/' + locale + 'docs/index.html', "utf8");
	assert.ok(docs.includes('href="/' + locale + 'docs/engramma/"'), "Engramma topic link missing");
}
console.log("Documentation product topics and preserved routes passed");
