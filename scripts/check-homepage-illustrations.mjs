import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const homepage = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

for (const marker of [
	'data-illustration="workshop"',
	'data-illustration="engines"',
	'data-illustration="memory-continuity"',
	'data-illustration="work-code"',
	'data-illustration="work-deliverables"',
	'data-illustration="work-local"',
	'data-illustration="work-continuity"',
	'data-illustration="ecosystem"',
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing illustration contract: ${marker}`);
}

for (const marker of [
	'data-illustration="connected-workspace"',
	'data-illustration="automation-whatsapp"',
	'data-illustration="automation-gmail-brief"',
	'data-illustration="automation-invoice"',
]) {
	assert.ok(homepage.includes(marker), `Homepage is missing connected-action illustration: ${marker}`);
}

for (const content of [
	"From a message to real action.",
	"Two ways to begin. Countless ways to continue.",
	"WhatsApp",
	"Telegram",
	"Composio",
	"MCP",
	"Skills",
	"Schedule",
	"Event",
]) {
	assert.ok(homepage.includes(content), `Homepage is missing connected-action content: ${content}`);
}

for (const href of [
	'href="/guides/channels/"',
	'href="/guides/connectors/"',
	'href="/guides/automations/"',
]) {
	assert.ok(homepage.includes(href), `Homepage is missing connected-action guide link: ${href}`);
}

const modelsPosition = homepage.indexOf('id="models"');
const memoryPosition = homepage.indexOf('id="memory"');
const productPosition = homepage.indexOf('id="product"');
const connectedPosition = homepage.indexOf('id="connected-action"');
const controlPosition = homepage.indexOf('id="control"');

for (const [name, position] of [
	["models", modelsPosition],
	["memory", memoryPosition],
	["product", productPosition],
	["connected action", connectedPosition],
	["control", controlPosition],
]) {
	assert.ok(position >= 0, `Homepage is missing the ${name} section`);
}

assert.ok(
	modelsPosition < memoryPosition &&
		memoryPosition < productPosition &&
		productPosition < connectedPosition &&
		connectedPosition < controlPosition,
	"Homepage sections must render in the approved product-story order",
);

for (const component of [
	"WorkshopIllustration.astro",
	"EngineTransition.astro",
	"EcosystemIllustration.astro",
	"MemoryContinuityIllustration.astro",
	"ConnectedWorkspaceIllustration.astro",
	"AutomationStoryIllustration.astro",
]) {
	const source = await readFile(
		new URL(`../src/components/illustrations/${component}`, import.meta.url),
		"utf8",
	);
	assert.ok(
		source.includes("@media (prefers-reduced-motion: reduce)"),
		`${component} is missing its reduced-motion override`,
	);
}

for (const forbidden of ["ai-brain", "robot-mascot", "laptop-illustration", "bg-grid"]) {
	assert.ok(!homepage.includes(forbidden), `Homepage contains banned illustration metaphor: ${forbidden}`);
}

for (const preserved of [
	"Your work. Your models. Your system.",
	"Real work, not isolated prompts.",
	"Useful memory requires ownership.",
	"Start without creating an account.",
	"data-homun-download",
]) {
	assert.ok(homepage.includes(preserved), `Homepage lost required content: ${preserved}`);
}

const heroSource = await readFile(
	new URL("../src/components/Hero.astro", import.meta.url),
	"utf8",
);
assert.ok(
	heroSource.includes("leading-[1.04]"),
	"Hero title must preserve descenders with a 1.04 line height",
);
assert.ok(heroSource.includes("pb-[0.08em]"), "Hero title must include descender padding");
assert.ok(
	heroSource.includes("min-[1100px]:text-[5.2rem]"),
	"Hero title must delay its largest size until the split layout is wide enough",
);
assert.ok(
	!heroSource.includes("lg:text-[5.2rem]"),
	"Hero title must not use its largest size at the 1024px split breakpoint",
);

const connectedSource = await readFile(
	new URL("../src/components/illustrations/ConnectedWorkspaceIllustration.astro", import.meta.url),
	"utf8",
);
for (const part of [
	'data-scene="miniature-workshop"',
	'data-workshop-part="incoming-message"',
	'data-workshop-part="telegram-channel"',
	'data-workshop-part="composio-tool"',
	'data-workshop-part="mcp-skills-tool"',
	'data-workshop-part="homun-machine"',
	'data-workshop-part="reply-output"',
]) {
	assert.ok(connectedSource.includes(part), `Miniature workshop is missing: ${part}`);
}
for (const retired of ["class=\"peripheral", "class=\"action-rail", "MESSAGE · SCHEDULE · EVENT"]) {
	assert.ok(
		!connectedSource.includes(retired),
		`Miniature workshop retained the old network diagram: ${retired}`,
	);
}

const memorySource = await readFile(
	new URL("../src/components/illustrations/MemoryContinuityIllustration.astro", import.meta.url),
	"utf8",
);

for (const marker of [
	'aria-labelledby="memory-continuity-title memory-continuity-description"',
	'id="memory-continuity-title"',
	'id="memory-continuity-description"',
	'data-memory-stage="capture"',
	'data-memory-stage="three-faces"',
	'data-memory-stage="recall"',
	'data-memory-face="sql"',
	'data-memory-face="graph"',
	'data-memory-face="wiki"',
	'data-memory-action="inspect"',
	'data-memory-action="correct"',
	'data-memory-action="forget"',
]) {
	assert.ok(memorySource.includes(marker), `Memory continuity contract is missing: ${marker}`);
}
const memoryReducedMotion = memorySource.slice(
	memorySource.indexOf("@media (prefers-reduced-motion: reduce)"),
);
for (const declaration of [
	"animation: none !important;",
	"transform: none;",
	"opacity: 1;",
]) {
	assert.ok(
		memoryReducedMotion.includes(declaration),
		`Memory reduced-motion state is missing: ${declaration}`,
	);
}

for (const label of [
	"Yesterday · Project Atlas",
	"One memory · three synchronized faces",
	"Today · New chat",
	"Recall",
	"SQLite + FTS",
	"Connections",
	"Graph + why",
	"Understanding",
	"Markdown wiki",
	"Source · Project Atlas",
]) {
	assert.ok(memorySource.includes(label), `Memory continuity illustration is missing: ${label}`);
}

for (const retired of [
	'data-memory-part="core"',
	'class="memory-core"',
	'class="memory-orbit"',
	"One continuous system",
]) {
	assert.ok(!memorySource.includes(retired), `Memory continuity retained the old diagram: ${retired}`);
}

console.log("Homepage illustration contract passed");
