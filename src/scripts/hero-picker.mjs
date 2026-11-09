import {
	BOT_TEMPLATES,
	DEFAULT_TEMPLATE_ID,
	findTemplate,
} from "../data/bot-templates.mjs";

export { BOT_TEMPLATES, DEFAULT_TEMPLATE_ID };

// Playback plan for a hero scene. Animated playback gets one frame per
// message with a chat-like pause (400–1400 ms, longer pauses for longer
// lines); `upTo` messages are visible once the frame applies. Reduced motion
// collapses to a single instant frame with the whole scene. Unknown ids fall
// back to the default template.
export function sceneFrames(templateId, { reducedMotion = false } = {}) {
	const template = findTemplate(templateId);
	if (reducedMotion) return [{ delayMs: 0, upTo: template.scene.length }];
	return template.scene.map((message, index) => ({
		delayMs: Math.min(1400, Math.max(400, 320 + message.text.length * 9)),
		upTo: index + 1,
	}));
}

// Wires the hero template picker. The six scenes are fully rendered in the
// static HTML (only the default one visible); this script never creates
// markup — it swaps the visible scene, hides its chat messages and reveals
// them one at a time following sceneFrames.
export function initHeroPicker(root = document, win = window) {
	const tablist = root.querySelector("[data-hero-templates]");
	if (!tablist) return;

	const tabs = [...tablist.querySelectorAll('button[role="tab"]')];
	const scenes = [...root.querySelectorAll("[data-hero-scene]")];
	if (tabs.length === 0 || scenes.length === 0) return;

	const hint = root.querySelector("[data-template-hint]");
	const tagline = root.querySelector("[data-template-tagline]");
	const reduceMedia = win.matchMedia?.("(prefers-reduced-motion: reduce)");
	let reducedMotion = reduceMedia?.matches ?? false;
	let currentId = DEFAULT_TEMPLATE_ID;
	let timers = [];

	const cancelPlayback = () => {
		for (const timer of timers) win.clearTimeout?.(timer);
		timers = [];
	};

	// Pending messages keep their place (visibility, not display) so the
	// window has its final height from the start and the page below never
	// jumps while the scene plays.
	const reveal = (scene, upTo) => {
		scene.querySelectorAll("[data-from]").forEach((message, index) => {
			const pending = index >= upTo;
			message.style.transition = reducedMotion ? "" : "opacity 0.35s ease, transform 0.35s ease";
			message.style.visibility = pending ? "hidden" : "";
			message.style.opacity = pending ? "0" : "";
			message.style.transform = pending && !reducedMotion ? "translateY(6px)" : "";
		});
	};

	const play = (templateId) => {
		cancelPlayback();
		const template = findTemplate(templateId);
		const scene =
			scenes.find((candidate) => candidate.dataset.templateId === template.id) ??
			scenes[0];
		for (const other of scenes) other.hidden = other !== scene;
		reveal(scene, 0);
		let wait = 0;
		for (const frame of sceneFrames(template.id, { reducedMotion })) {
			wait += frame.delayMs;
			if (frame.delayMs === 0) {
				reveal(scene, frame.upTo);
				continue;
			}
			timers.push(win.setTimeout(() => reveal(scene, frame.upTo), wait));
		}
	};

	const select = (templateId, { focus = false } = {}) => {
		currentId = templateId;
		for (const tab of tabs) {
			const selected = tab.dataset.templateId === templateId;
			tab.setAttribute("aria-selected", String(selected));
			tab.tabIndex = selected ? 0 : -1;
			if (selected && focus) tab.focus();
		}
		const template = findTemplate(templateId);
		if (hint) {
			hint.textContent = `Then pick ${template.name} from the templates — it's ready in the app.`;
		}
		if (tagline) tagline.textContent = template.tagline;
		for (const control of root.querySelectorAll("[data-analytics-template]")) {
			control.setAttribute("data-analytics-template", template.id);
		}
		play(template.id);
	};

	for (const tab of tabs) {
		tab.addEventListener("click", () => select(tab.dataset.templateId));
	}

	tablist.addEventListener("keydown", (event) => {
		const index = tabs.findIndex((tab) => tab.dataset.templateId === currentId);
		let next = null;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") {
			next = (index + 1) % tabs.length;
		} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
			next = (index - 1 + tabs.length) % tabs.length;
		} else if (event.key === "Home") {
			next = 0;
		} else if (event.key === "End") {
			next = tabs.length - 1;
		}
		if (next === null) return;
		event.preventDefault();
		select(tabs[next].dataset.templateId, { focus: true });
	});

	reduceMedia?.addEventListener?.("change", (event) => {
		reducedMotion = event.matches;
		if (reducedMotion) play(currentId);
	});

	select(DEFAULT_TEMPLATE_ID);
}
