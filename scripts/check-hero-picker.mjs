import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BOT_TEMPLATES, DEFAULT_TEMPLATE_ID } from "../src/data/bot-templates.mjs";
import { sceneFrames } from "../src/scripts/hero-picker.mjs";
import { TEMPLATE_ALLOWLIST } from "../src/scripts/analytics.mjs";
import { RELEASES_PAGE_URL } from "../src/scripts/downloads.mjs";

// Hero "choose your first bot" contract (Task 4). The six templates come from
// Homun 0.3 (Sandbot/src/main/templates/*.json) in this exact order; every
// scene is short chat copy grounded in what the template really does; the
// default Inbox Manager scene must be complete in the static HTML so the page
// works without JavaScript.

const EXPECTED_IDS = [
	"inbox-manager",
	"meeting-prep",
	"daily-briefing",
	"chief-of-staff",
	"mention-monitor",
	"executive-assistant",
];

assert.deepEqual(
	BOT_TEMPLATES.map((template) => template.id),
	EXPECTED_IDS,
	"BOT_TEMPLATES ids and order must match the Homun 0.3 templates",
);
assert.equal(
	DEFAULT_TEMPLATE_ID,
	"inbox-manager",
	"inbox-manager must be the preselected template",
);
assert.deepEqual(
	[...TEMPLATE_ALLOWLIST],
	EXPECTED_IDS,
	"analytics TEMPLATE_ALLOWLIST must match the hero templates",
);

const inbox = BOT_TEMPLATES[0];

for (const template of BOT_TEMPLATES) {
	assert.ok(
		template.name && template.emoji && template.tagline,
		`template ${template.id} needs name, emoji and tagline`,
	);
	assert.equal(
		typeof template.shortName,
		"string",
		`template ${template.id} needs a shortName chip label`,
	);
	assert.ok(
		template.shortName.length > 0 && template.shortName.length <= 20,
		`shortName of ${template.id} must be at most 20 characters: ${template.shortName}`,
	);
	assert.ok(
		template.scene.length >= 4 && template.scene.length <= 8,
		`scene of ${template.id} must have 4–8 messages`,
	);
	assert.ok(
		template.scene.some((message) => message.from === "user"),
		`scene of ${template.id} needs at least one user message`,
	);
	assert.ok(
		template.scene.some((message) => message.from === "bot"),
		`scene of ${template.id} needs at least one bot message`,
	);
	for (const message of template.scene) {
		assert.ok(
			["user", "bot", "system"].includes(message.from),
			`scene of ${template.id} has an unknown sender: ${message.from}`,
		);
		assert.equal(typeof message.text, "string", `scene of ${template.id} has a non-string message`);
		assert.ok(
			message.text.length > 0 && message.text.length <= 140,
			`scene of ${template.id} has a message longer than 140 characters: ${message.text}`,
		);
		assert.equal(
			message.text,
			message.text.toLowerCase(),
			`scene copy must be lowercase: ${message.text}`,
		);
		if (message.status !== undefined) {
			assert.ok(
				["done", "draft", "held"].includes(message.status),
				`scene of ${template.id} has an unknown status: ${message.status}`,
			);
		}
	}
}

assert.deepEqual(
	sceneFrames("inbox-manager", { reducedMotion: true }),
	[{ delayMs: 0, upTo: inbox.scene.length }],
	"reduced motion must produce one instant frame with the whole scene",
);
assert.deepEqual(
	sceneFrames("nope", { reducedMotion: true }),
	[{ delayMs: 0, upTo: inbox.scene.length }],
	"an unknown template id must fall back to the default scene",
);
const animated = sceneFrames("nope", { reducedMotion: false });
assert.equal(
	animated.length,
	inbox.scene.length,
	"animated playback must produce one frame per message",
);
animated.forEach((frame, index) => {
	assert.ok(
		frame.delayMs >= 400 && frame.delayMs <= 1400,
		`frame ${index} must keep the 400–1400 ms chat rhythm`,
	);
	assert.equal(frame.upTo, index + 1);
});

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const text = html
	.replace(/<[^>]+>/g, " ")
	.replace(/&#39;/g, "'")
	.replace(/\s+/g, " ");

const heading = html
	.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]
	?.replace(/<[^>]+>/g, " ")
	.replace(/\s+/g, " ");
assert.ok(heading?.includes("Your bot team."), 'hero h1 must contain "Your bot team."');
assert.ok(heading?.includes("On your computer."), 'hero h1 must contain "On your computer."');

const tabs = [...html.matchAll(/<button\b[^>]*\brole="tab"[^>]*>/g)].map(([tag]) => tag);
assert.equal(tabs.length, 6, "hero must render exactly 6 template tabs");
const selected = tabs.filter((tag) => tag.includes('aria-selected="true"'));
assert.equal(selected.length, 1, "exactly one tab must be selected");
assert.ok(
	selected[0].includes('data-template-id="inbox-manager"'),
	"the selected tab must be inbox-manager",
);
assert.equal(
	tabs.filter((tag) => tag.includes('aria-selected="false"')).length,
	5,
	"the other five tabs must be unselected",
);

const scenes = [...html.matchAll(/<div\b[^>]*>/g)]
	.map(([tag]) => tag)
	.filter((tag) => tag.includes("data-hero-scene"));
assert.equal(scenes.length, 6, "hero must render all 6 scenes in the static HTML");
assert.equal(
	scenes.filter((tag) => /\bhidden\b/.test(tag)).length,
	5,
	"without JavaScript only the default scene is visible",
);
for (const message of inbox.scene) {
	assert.ok(
		text.includes(message.text),
		`default scene message must be present in the static HTML: ${message.text}`,
	);
}

assert.ok(text.includes("Requires Docker Desktop"), "hero must state the Docker Desktop requirement");
assert.ok(
	html.includes("https://www.docker.com/products/docker-desktop/"),
	"Docker Desktop note must link the official page",
);
assert.ok(text.includes("Other platforms"), "hero must offer the other-platforms link");

const heroAnchor = [...html.matchAll(/<a\b[^>]*>/g)]
	.map(([tag]) => tag)
	.find((tag) => tag.includes('data-analytics-download-source="hero"'));
assert.ok(heroAnchor, "hero must render its download button");
assert.ok(heroAnchor.includes("data-homun-download"), "hero download button must be a download control");
assert.ok(
	heroAnchor.includes(`href="${RELEASES_PAGE_URL}"`),
	"hero download link must fall back to the releases list",
);
assert.ok(
	heroAnchor.includes('data-analytics-template="inbox-manager"'),
	"hero download button starts with the default template",
);

console.log("Hero picker contract passed");
