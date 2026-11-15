export function eyeOffset(dx, dy, max) {
	const distance = Math.hypot(dx, dy);
	if (distance === 0) return { x: 0, y: 0 };

	const strength = max * Math.min(1, distance / 300);
	return {
		x: (dx / distance) * strength,
		y: (dy / distance) * strength * 0.7,
	};
}

export function shouldAnimate({ reducedMotion, hidden }) {
	return !reducedMotion && !hidden;
}

// The optional callback lets the existing page background share the pointer listener.
export function initMascots(root = document, onPagePointerMove) {
	const doc = root.ownerDocument ?? root;
	const win = doc.defaultView;
	const motion = win.matchMedia("(prefers-reduced-motion: reduce)");
	const marks = [...root.querySelectorAll("svg[data-mascot][data-mascot-animated]")];
	const removeMorphs = () => {
		for (const morph of root.querySelectorAll("[data-mascot-morph]")) morph.remove();
	};

	if (motion.matches) {
		removeMorphs();
		return () => {};
	}

	const controller = new win.AbortController();
	const { signal } = controller;
	const mascots = marks.map((mark) => ({
		mark,
		body: mark.querySelector("[data-mascot-body]"),
		eyes: mark.querySelector("[data-mascot-eyes]"),
		morph: mark.querySelector("[data-mascot-morph]"),
		hopTimeout: 0,
	}));
	let frame = 0;
	let pointer;

	function syncVisibility() {
		const active = shouldAnimate({ reducedMotion: motion.matches, hidden: doc.hidden });
		for (const { mark } of mascots) {
			mark.classList.toggle("is-paused", !active);
			if (active) mark.unpauseAnimations?.();
			else mark.pauseAnimations?.();
		}

		if (!active) {
			win.cancelAnimationFrame(frame);
			frame = 0;
		}
	}

	function cleanup() {
		controller.abort();
		win.cancelAnimationFrame(frame);
		for (const mascot of mascots) {
			const { mark, eyes, morph, hopTimeout } = mascot;
			win.clearTimeout(hopTimeout);
			mark.unpauseAnimations?.();
			morph?.endElement?.();
			mark.removeAttribute("data-mascot-active");
			mark.classList.remove("is-paused", "is-squish", "is-awake", "is-hop");
			eyes.removeAttribute("transform");
		}
	}

	syncVisibility();
	for (const mascot of mascots) {
		const { mark, morph } = mascot;
		mark.setAttribute("data-mascot-active", "");
		morph?.beginElement?.();

		mark.addEventListener("pointerenter", () => {
			mark.classList.add("is-squish");
			if (mark.dataset.product === "engramma") mark.classList.add("is-awake");
		}, { signal });
		mark.addEventListener("pointerleave", () => {
			mark.classList.remove("is-squish", "is-awake");
		}, { signal });
		mark.addEventListener("click", () => {
			mark.classList.add("is-hop");
			win.clearTimeout(mascot.hopTimeout);
			mascot.hopTimeout = win.setTimeout(() => mark.classList.remove("is-hop"), 700);
		}, { signal });
	}

	if (mascots.length || onPagePointerMove) {
		win.addEventListener("pointermove", (event) => {
			if (!shouldAnimate({ reducedMotion: motion.matches, hidden: doc.hidden })) return;

			onPagePointerMove?.(event);
			if (!mascots.length) return;
			pointer = event;
			if (frame) return;
			frame = win.requestAnimationFrame(() => {
				frame = 0;
				for (const { body, eyes } of mascots) {
					const { left, top, right, bottom, width, height } = body.getBoundingClientRect();
					if (right < 0 || left > win.innerWidth || bottom < 0 || top > win.innerHeight) continue;
					const { x, y } = eyeOffset(
						pointer.clientX - (left + width / 2),
						pointer.clientY - (top + height / 2),
						Number(eyes.dataset.max),
					);
					eyes.setAttribute("transform", `translate(${x} ${y})`);
				}
			});
		}, { passive: true, signal });
	}

	doc.addEventListener("visibilitychange", syncVisibility, { signal });
	motion.addEventListener("change", () => {
		if (!motion.matches) return;
		cleanup();
		removeMorphs();
	}, { signal });

	return cleanup;
}
