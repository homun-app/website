import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
	classifyAnalyticsClick,
	initAnalyticsTracking,
	ROADMAP_PROJECT_ALLOWLIST,
} from "../src/scripts/analytics.mjs";

const roadmap = JSON.parse(
	await readFile(new URL("../src/data/roadmap.json", import.meta.url), "utf8"),
);
const roadmapProjects = roadmap.items.map((item) => item.slug);
if (!roadmapProjects.includes("new")) roadmapProjects.push("new");

assert.deepEqual(
	[...ROADMAP_PROJECT_ALLOWLIST].sort(),
	[...new Set([...roadmap.items.map((item) => item.slug), "new"])].sort(),
	"Roadmap analytics allowlist must exactly match canonical projects plus new",
);

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

const releasePrecedence = classifyAnalyticsClick({
	href: "https://github.com/homun-app/homun-releases/releases/latest",
	currentPath: "/",
	dataset: { analyticsDownloadSource: "navigation" },
});
assert.equal(releasePrecedence?.name, "download_click");

const roadmapPrecedence = classifyAnalyticsClick({
	href: "https://github.com/homun-app/homun/issues/42",
	currentPath: "/roadmap/",
	dataset: {
		analyticsRoadmapAction: "vote",
		analyticsRoadmapProject: "client-work",
		analyticsRoadmapSource: "roadmap_card",
	},
});
assert.equal(roadmapPrecedence?.name, "roadmap_participation");

for (const project of roadmapProjects) {
	const classified = classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun/issues/42",
		currentPath: "/roadmap/",
		dataset: {
			analyticsRoadmapAction: "vote",
			analyticsRoadmapProject: project,
			analyticsRoadmapSource: "roadmap_card",
		},
	});
	assert.equal(
		classified?.data.project,
		project,
		`Roadmap project ${project} must be allowlisted for analytics`,
	);
}

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

for (const hostname of ["homun.app", "www.homun.app"]) {
	assert.deepEqual(
		classifyAnalyticsClick({
			href: `https://${hostname}/roadmap/client-work/`,
			currentPath: "/roadmap/",
			dataset: {},
		}),
		{
			name: "roadmap_project_open",
			data: { project: "client-work", source: "roadmap_overview" },
		},
		`HTTPS roadmap links on ${hostname} must be classified as internal`,
	);
}

for (const href of [
	"http://homun.app/roadmap/client-work/",
	"http://www.homun.app/roadmap/client-work/",
	"ftp://homun.app/roadmap/client-work/",
	"https://preview.homun.app/roadmap/client-work/",
	"https://homun.app.example.com/roadmap/client-work/",
]) {
	assert.equal(
		classifyAnalyticsClick({ href, currentPath: "/roadmap/" }),
		null,
		`${href} must not be classified as an internal roadmap link`,
	);
}

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

let rejectionHandler;
const rejectedThenable = {
	then() {
		return rejectedThenable;
	},
	catch(onRejected) {
		rejectionHandler = onRejected;
		return rejectedThenable;
	},
};
assert.doesNotThrow(() => trackingFixture(() => rejectedThenable).click());
assert.equal(typeof rejectionHandler, "function");
assert.doesNotThrow(() => rejectionHandler(new Error("blocked asynchronously")));

assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun/issues/42?email=visitor@example.com#prompt",
		currentPath: "/roadmap/client-work/?email=visitor@example.com#workspace",
		dataset: {
			analyticsRoadmapAction: "vote",
			analyticsRoadmapProject: "client-work",
			analyticsRoadmapSource: "roadmap_detail",
			email: "visitor@example.com",
			prompt: "ignore this",
			workspace: "private",
		},
	}),
	{
		name: "roadmap_participation",
		data: { action: "vote", project: "client-work", source: "roadmap_detail" },
	},
);

assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun-releases/releases/latest",
		currentPath: "/marketplace/?email=visitor@example.com",
		dataset: {
			analyticsDownloadSource: "visitor@example.com",
			analyticsDownloadPlatform: "visitor@example.com",
		},
	}),
	{
		name: "download_click",
		data: {
			platform: "unknown",
			format: "release_page",
			source: "marketplace",
		},
	},
);

assert.deepEqual(
	classifyAnalyticsClick({
		href: "https://github.com/homun-app/homun/issues/42",
		currentPath: "/roadmap/client-work/?prompt=private",
		dataset: {
			analyticsRoadmapAction: "vote",
			analyticsRoadmapProject: "visitor@example.com",
			analyticsRoadmapSource: "workspace=private",
		},
	}),
	{
		name: "roadmap_participation",
		data: { action: "vote", project: "unknown", source: "roadmap" },
	},
);

assert.deepEqual(
	classifyAnalyticsClick({
		href: "/roadmap/visitor-email/",
		currentPath: "/roadmap/",
	}),
	{
		name: "roadmap_project_open",
		data: { project: "unknown", source: "roadmap_overview" },
	},
);

console.log("Analytics event contract passed");
