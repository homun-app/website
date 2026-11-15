import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const scrollPath = new URL("../src/styles/scroll.css", import.meta.url);
const css = await readFile(scrollPath, "utf8").catch((error) => {
	if (error.code !== "ENOENT") throw error;
	assert.fail("Missing src/styles/scroll.css");
});
const stylesheet = postcss.parse(css, { from: fileURLToPath(scrollPath) });
const motionClass = /\.(?:reveal-window|section-text|section-visual|play|press|cursor-move|rise-self|timeline-f|timeline-show)(?![\w-])/;

function hasAncestor(node, name, condition) {
	for (let parent = node.parent; parent; parent = parent.parent) {
		if (parent.type === "atrule" && parent.name === name && condition.test(parent.params)) {
			return true;
		}
	}
	return false;
}

function supportsScrollTimeline(node) {
	return hasAncestor(node, "supports", /^\(\s*animation-timeline\s*:\s*view\(\)\s*\)$/);
}

let timelineCount = 0;
let disablesAnimation = false;
stylesheet.walkDecls((declaration) => {
	const { prop, value, parent, source } = declaration;
	const location = `scroll.css:${source.start.line}`;

	if (prop === "animation-timeline") {
		timelineCount++;
		assert.ok(supportsScrollTimeline(declaration), `${location}: animation-timeline requires @supports (animation-timeline: view())`);
	}
	if (prop === "opacity" && /^[-+]?(?:0*\.0+|0+)%?$/.test(value)) {
		assert.ok(
			!motionClass.test(parent.selector ?? "") || supportsScrollTimeline(declaration),
			`${location}: scroll classes must be visible without scroll timeline support`,
		);
	}
	if (
		prop === "animation" &&
		value === "none" &&
		hasAncestor(declaration, "media", /\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/)
	) {
		disablesAnimation = true;
	}
});
assert.ok(timelineCount > 0, "scroll.css must declare scroll-driven animations");
assert.ok(disablesAnimation, "scroll.css must disable animations for reduced motion");

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const files = (await readdir(dist, { recursive: true, withFileTypes: true }))
	.filter((entry) => entry.isFile());

for (const entry of files) {
	const path = join(entry.parentPath, entry.name);
	const contents = await readFile(path);
	for (const host of ["fonts.googleapis.com", "fonts.gstatic.com"]) {
		assert.ok(!contents.includes(host), `${relative(dist, path)} references ${host}`);
	}
}

for (const family of ["m-plus-rounded-1c", "figtree"]) {
	assert.ok(
		files.some(({ name }) => name.endsWith(".woff2") && name.includes(family)),
		`dist is missing a self-hosted ${family} WOFF2 file`,
	);
}

console.log("Foundation checks passed");
