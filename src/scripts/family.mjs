// Movement of the family components, in three parts. CSS does the animating;
// this only decides when it starts. With "reduce motion" on, or without
// IntersectionObserver, nothing starts and the page keeps its final state.

// `data-motion` marks an element that animates once it enters the screen: it
// gets the class `in` a single time. `data-motion="now"` animates from load.
function enterWhenVisible() {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add("in");
				observer.unobserve(entry.target);
			}
		},
		{ threshold: 0.15 },
	);
	for (const element of document.querySelectorAll("[data-motion]")) {
		if (element.dataset.motion === "now") element.classList.add("in");
		else observer.observe(element);
	}
}

// Numbers count up to their value when they enter the screen. The value in the
// markup is the final one, and it is what stays.
function countUp() {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
	const easeOut = (k) => 1 - Math.pow(1 - k, 3);
	const observer = new IntersectionObserver(
		(entries, io) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				io.unobserve(entry.target);
				const element = entry.target;
				const text = element.textContent ?? "";
				const number = text.match(/\d+(?:[.,]\d+)?/);
				if (!number) continue;
				const end = parseFloat(number[0].replace(",", "."));
				const decimals = (number[0].split(/[.,]/)[1] ?? "").length;
				const started = performance.now();
				const step = (now) => {
					const k = Math.min(1, (now - started) / 1400);
					element.textContent = text.replace(number[0], (end * easeOut(k)).toFixed(decimals).replace(".", number[0].includes(",") ? "," : "."));
					if (k < 1) requestAnimationFrame(step);
				};
				requestAnimationFrame(step);
			}
		},
		{ threshold: 0.4 },
	);
	for (const element of document.querySelectorAll("[data-count]")) observer.observe(element);
}

export function initFamilyMotion() {
	enterWhenVisible();
	countUp();
}
