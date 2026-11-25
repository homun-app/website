// The adapter between the two snapshots that sync from GitHub and the family's
// ReleasesRoadmap. The homepage shows what the snapshots hold and nothing else:
// nothing is written by hand here, and the snapshots are never edited.
//
//   releases.json  → the releases, stable and pre-release (the sync keeps both;
//                    the download buttons still resolve to stable only)
//   roadmap.json   → strategic programs by stage: building → Now, next → Next,
//                    exploring → Later; the workflow ideas are counted, not listed

const SHOWN_RELEASES = 4;

// A title a reader can judge a release by is short. A longer lead is a sentence
// about the internals ("Sealed object transfers between host and peer"): until
// the release has a readable title on GitHub, it stays out of the homepage.
const READABLE_TITLE_WORDS = 5;

// Markdown of a release note to plain text: bold, code, links.
const plain = (text) => (text ?? "")
	.replace(/\*\*/g, "")
	.replace(/`([^`]*)`/g, "$1")
	.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
	.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
	.replace(/\s+/g, " ")
	.trim();

// A release note begins with "**A lead sentence.** The rest.": the lead is
// the title, the sentence after it the body. `null` when the lead is not a
// readable title.
function releaseEntry(release, dateFormat) {
	const first = [...release.highlights, ...release.improvements, ...release.fixes][0];
	const [, lead, rest] = /^\*\*(.+?)\.?\*\*\s*(.*)$/.exec(first ?? "") ?? [];
	const title = lead ? plain(lead).replace(/\.$/, "") : "";
	if (!title || title.split(/\s+/).length > READABLE_TITLE_WORDS) return null;
	return {
		version: release.version.replace(/^v/, ""),
		meta: dateFormat.format(new Date(release.publishedAt)),
		title,
		body: plain(rest).match(/^.*?[.!?](?:\s|$)|^.*$/)?.[0] ?? "",
		href: release.githubUrl,
	};
}

// The pre-releases of one version line, as a single line of the column. GitHub
// names a release after its tag and the 0.3 beta notes are in Italian, so
// there is no title to show: the line says how many came out, when the last
// one did, and leaves the reading to the changelog. It invents no title.
function prereleaseEntry(version, label, releases, dateFormat) {
	const newest = releases[0];
	return {
		version,
		meta: label,
		title: `${releases.length} pre-release${releases.length === 1 ? "" : "s"}`,
		body: `The latest on ${dateFormat.format(new Date(newest.publishedAt))}.`,
		href: "/changelog/",
	};
}

// "v0.3.1001-beta.20" is a pre-release of the 0.3 line, a beta one.
function prereleaseLine(release) {
	const [, line, label] = /^v?(\d+\.\d+)\.\d+-([a-z]+)(?:[.-]|$)/i.exec(release.version) ?? [];
	if (line) return { line, label: label.toLowerCase() };
	return { line: release.version.replace(/^v/, ""), label: "pre-release" };
}

const program = ({ slug, area, title, outcome, publicUpdate }, status) => ({
	version: area,
	title,
	body: status ? (publicUpdate ?? outcome) : outcome,
	href: `/roadmap/${slug}/`,
});

const byOrder = (a, b) => a.order - b.order;
const byNewest = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt);

export function homeRoadmap(releaseSnapshot, roadmapSnapshot, { releases = SHOWN_RELEASES, locale = "en" } = {}) {
	const dateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
	const fullDateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
	const programs = roadmapSnapshot.items.filter(({ itemType }) => itemType === "strategic_program").sort(byOrder);
	const ideas = roadmapSnapshot.items.filter(({ itemType }) => itemType === "workflow_idea").sort(byOrder);
	const inStage = (stage) => programs.filter((item) => item.stage === stage);

	const building = inStage("building");
	const milestones = building.flatMap(({ milestones }) => milestones);
	// The snapshot is newest first already; sorting again costs nothing and
	// makes the adapter safe whoever passes the data.
	const shipped = [...releaseSnapshot.items].sort(byNewest);

	// One line per version line in pre-release, newest line first.
	const lines = new Map();
	for (const release of shipped) {
		if (!release.prerelease) continue;
		const { line, label } = prereleaseLine(release);
		if (!lines.has(line)) lines.set(line, { label, releases: [] });
		lines.get(line).releases.push(release);
	}
	const pre = [...lines]
		.sort(([, a], [, b]) => byNewest(a.releases[0], b.releases[0]))
		.map(([line, { label, releases }]) => prereleaseEntry(line, label, releases, fullDateFormat));

	// The stable releases that have a readable title, newest first. At least
	// one of them is shown, whatever the pre-release lines take.
	const stable = shipped
		.filter(({ prerelease }) => !prerelease)
		.map((release) => releaseEntry(release, dateFormat))
		.filter(Boolean)
		.slice(0, Math.max(1, releases - pre.length));

	return {
		shipped: [
			{
				label: "Shipped",
				releases: [...pre, ...stable],
			},
		],
		now: {
			label: "Now",
			releases: building.map((item) => program(item, true)),
		},
		// How far the work of "Now" has come. While nothing is done, the
		// homepage shows no bar and no number for it.
		progress: { done: milestones.filter(({ completed }) => completed).length, total: milestones.length },
		next: {
			label: "Next",
			releases: inStage("next").map((item) => program(item, false)),
		},
		later: {
			label: "Later",
			releases: [
				...inStage("exploring").map((item) => program(item, false)),
				...(ideas.length ? [{
					version: `${ideas.length} workflow ideas`,
					title: "Under exploration",
					// The call to action follows the snapshot: a vote only where voting is open.
					body: `${ideas.map(({ title }) => title).join(", ")}. ${ideas.some(({ voting }) => voting === "open") ? "Vote for the ones you need on the roadmap." : "Read them on the roadmap."}`,
					href: "/roadmap/",
				}] : []),
			],
		},
	};
}
