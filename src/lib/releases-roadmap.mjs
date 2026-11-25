// The adapter between the two snapshots that sync from GitHub and the family's
// ReleasesRoadmap. The homepage shows what the snapshots hold and nothing else:
// nothing is written by hand here, and the snapshots are never edited.
//
//   releases.json  → the newest stable releases (the sync keeps no prerelease)
//   roadmap.json   → strategic programs by stage: building → Now, next → Next,
//                    exploring → Later; the workflow ideas are counted, not listed

const SHOWN_RELEASES = 4;

// Markdown of a release note to plain text: bold, code, links.
const plain = (text) => (text ?? "")
	.replace(/\*\*/g, "")
	.replace(/`([^`]*)`/g, "$1")
	.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
	.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
	.replace(/\s+/g, " ")
	.trim();

// A release note begins with "**A lead sentence.** The rest.": the lead is
// the title, the sentence after it the body.
function releaseEntry(release, dateFormat) {
	const first = [...release.highlights, ...release.improvements, ...release.fixes][0];
	const [, lead, rest] = /^\*\*(.+?)\.?\*\*\s*(.*)$/.exec(first ?? "") ?? [];
	const version = release.version.replace(/^v/, "");
	const date = dateFormat.format(new Date(release.publishedAt));
	return {
		version,
		meta: date,
		title: lead ? plain(lead).replace(/\.$/, "") : `Release ${release.name}`,
		body: lead ? (plain(rest).match(/^.*?[.!?](?:\s|$)|^.*$/)?.[0] ?? "") : plain(first),
		href: release.githubUrl,
	};
}

const program = ({ slug, area, title, outcome, publicUpdate }, status) => ({
	version: area,
	title,
	body: status ? (publicUpdate ?? outcome) : outcome,
	href: `/roadmap/${slug}/`,
});

const byOrder = (a, b) => a.order - b.order;

export function homeRoadmap(releaseSnapshot, roadmapSnapshot, { releases = SHOWN_RELEASES, locale = "en" } = {}) {
	const dateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
	const programs = roadmapSnapshot.items.filter(({ itemType }) => itemType === "strategic_program").sort(byOrder);
	const ideas = roadmapSnapshot.items.filter(({ itemType }) => itemType === "workflow_idea").sort(byOrder);
	const inStage = (stage) => programs.filter((item) => item.stage === stage);

	const building = inStage("building");
	const milestones = building.flatMap(({ milestones }) => milestones);
	// The snapshot is newest first already; sorting again costs nothing and
	// makes the adapter safe whoever passes the data.
	const shipped = [...releaseSnapshot.items].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

	return {
		shipped: [
			{
				label: `Shipped · stable releases`,
				releases: shipped.slice(0, releases).map((release) => releaseEntry(release, dateFormat)),
			},
		],
		now: {
			label: "Now",
			releases: building.map((item) => program(item, true)),
		},
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
