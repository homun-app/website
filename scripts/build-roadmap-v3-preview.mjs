import { readFile, writeFile } from "node:fs/promises";

const manifestUrl = new URL("./fixtures/roadmap-v3-manifest.json", import.meta.url);
const roadmapPreviewUrl = new URL("./fixtures/roadmap-v3-preview.json", import.meta.url);
const releasesPreviewUrl = new URL("./fixtures/releases-v3-preview.json", import.meta.url);
const roadmapUrl = new URL("../src/data/roadmap.json", import.meta.url);
const releasesUrl = new URL("../src/data/releases.json", import.meta.url);
const proposalUrl = "https://github.com/homun-app/homun/issues/new?template=roadmap-idea.yml";

const issueBySlug = new Map([
	["homun-mobile", 5],
	["team-spaces-roles", 7],
	["voice-meeting-capture", 8],
]);

const readJson = async (url) => JSON.parse(await readFile(url, "utf8"));
const writeJson = (url, value) => writeFile(url, `${JSON.stringify(value, null, 2)}\n`);

const manifest = await readJson(manifestUrl);
const releases = await readJson(releasesUrl);
const preview = {
	schemaVersion: 3,
	contentUpdatedAt: "2026-07-16T00:00:00.000Z",
	items: manifest.items.map((item) => {
		const issueNumber = issueBySlug.get(item.slug) ?? null;
		return {
			...item,
			githubUrl: issueNumber
				? `https://github.com/homun-app/homun/issues/${issueNumber}`
				: proposalUrl,
			issueNumber,
			votes: 0,
			underReview: false,
		};
	}),
};

const evidenceRelease = releases.items.find(({ version }) => version === "v0.1.1059");
if (!evidenceRelease) throw new Error("Missing v0.1.1059 release evidence baseline");
evidenceRelease.projectSlugs = [...new Set([
	...evidenceRelease.projectSlugs,
	"operational-workspace",
])].sort();

await Promise.all([
	writeJson(roadmapPreviewUrl, preview),
	writeJson(releasesPreviewUrl, releases),
	writeJson(roadmapUrl, preview),
	writeJson(releasesUrl, releases),
]);

console.log("Roadmap v3 branch preview generated");
