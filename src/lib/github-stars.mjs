const defaultRepo = "homun-app/homun-core";
let cachedStarCount;

async function requestStarCount(fetchImpl, repo, timeoutMs) {
	const controller = new AbortController();
	let timer;
	const timeout = new Promise((resolve) => {
		timer = setTimeout(() => {
			controller.abort();
			resolve(null);
		}, timeoutMs);
	});

	async function request() {
		const response = await fetchImpl(`https://api.github.com/repos/${repo}`, {
			headers: { Accept: "application/vnd.github+json" },
			signal: controller.signal,
		});
		if (!response.ok) return null;
		const data = await response.json();
		const count = data?.stargazers_count;
		return Number.isSafeInteger(count) && count >= 0 ? count : null;
	}

	try {
		return await Promise.race([request(), timeout]);
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

export function fetchStarCount(fetchImpl = fetch, { repo = defaultRepo, timeoutMs = 5000 } = {}) {
	if (fetchImpl === fetch && repo === defaultRepo && timeoutMs === 5000) {
		return cachedStarCount ??= requestStarCount(fetchImpl, repo, timeoutMs);
	}
	return requestStarCount(fetchImpl, repo, timeoutMs);
}

export function formatStars(count) {
	return count < 1000 ? String(count) : `${Math.round(count / 100) / 10}k`;
}
