// Copy buttons of the command and terminal windows. The button copies exactly
// the text the window shows, minus what is only drawn: the `$` prompt of a
// command, which would be pasted into a terminal as a stray character.
export function initCopyButtons() {
	for (const block of document.querySelectorAll("[data-command]")) {
		const button = block.querySelector("[data-copy]");
		const code = block.querySelector("code");
		if (!button || !code || button.dataset.copyReady) continue;
		button.dataset.copyReady = "";
		button.addEventListener("click", async () => {
			// A module script is plain JavaScript: it takes no type annotation.
			const shown = code.cloneNode(true);
			for (const prompt of shown.querySelectorAll("[data-prompt]")) prompt.remove();
			try {
				await navigator.clipboard.writeText(shown.textContent ?? "");
				button.textContent = "Copied";
			} catch {
				button.textContent = "Select and copy";
			}
			setTimeout(() => (button.textContent = "Copy"), 1800);
		});
	}
}
