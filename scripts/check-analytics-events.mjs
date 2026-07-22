import assert from "node:assert/strict";
import {
	classifyAnalyticsClick,
	initAnalyticsTracking,
} from "../src/scripts/analytics.mjs";

assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun-releases/releases/latest",
		currentPath: "/",
		dataset: { analyticsDownloadSource: "hero" },
		detectedPlatform: "macos",
	}),
	{
		name: "download_click",
		data: { platform: "macos", format: "release_page", source: "hero" },
	},
);

assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun-releases/releases/download/v1/Homun.exe",
		currentPath: "/",
		inDownloadList: true,
	}),
	{
		name: "download_click",
		data: { platform: "windows", format: "exe", source: "download_selector" },
	},
);

assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun/issues/42",
		currentPath: "/roadmap/client-work/",
		dataset: {
			analyticsRoadmapAction: "discuss",
			analyticsRoadmapProject: "client-work",
			analyticsRoadmapSource: "roadmap_detail",
		},
	}),
	{
		name: "roadmap_participation",
		data: {
			action: "discuss",
			project: "client-work",
			source: "roadmap_detail",
		},
	},
);

assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun-core",
		currentPath: "/guides/security/",
		dataset: {},
	}),
	{
		name: "github_click",
		data: { destination: "core_repository", source: "documentation" },
	},
);

assert.deepEqual(
	classifyAnalyticsClick({
		href: "/roadmap/client-work/",
		currentPath: "/roadmap/",
		dataset: {},
	}),
	{
		name: "roadmap_project_open",
		data: { project: "client-work", source: "roadmap_overview" },
	},
);

assert.equal(
	classifyAnalyticsClick({
		href: "https://example.com/elsewhere",
		currentPath: "/",
	}),
	null,
);

function trackingFixture(track) {
	const listeners = new Map();
	const root = {
		addEventListener: (type, listener) => listeners.set(type, listener),
	};
	const anchor = {
		href: "https://github.com/homun-app/homun-core",
		dataset: {},
		closest(selector) {
			if (selector === "a[href]") return anchor;
			if (selector === "[data-download-list]") return null;
			return null;
		},
	};
	const browserWindow = {
		location: { pathname: "/" },
		navigator: { platform: "MacIntel" },
		umami: { track },
	};
	initAnalyticsTracking(root, browserWindow);
	return { anchor, click: () => listeners.get("click")({ target: anchor }) };
}

const tracked = [];
trackingFixture((name, data) => tracked.push({ name, data })).click();
assert.deepEqual(tracked, [
	{
		name: "github_click",
		data: { destination: "core_repository", source: "homepage" },
	},
]);

const blocked = trackingFixture(() => {
	throw new Error("blocked");
});
assert.doesNotThrow(() => blocked.click());

console.log("Analytics event contract passed");
