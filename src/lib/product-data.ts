import roadmapSnapshot from "../data/roadmap.json";
import releaseSnapshot from "../data/releases.json";
import { selectFeaturedProject } from "./roadmap-presentation.mjs";

export type RoadmapStage = "available" | "building" | "next" | "exploring";
export type RoadmapItemType = "strategic_program" | "workflow_idea";
export type EvaluationState = "evaluating" | "selected_for_pilot" | "removed";
export type VotingState = "open" | "closed";

export interface RoadmapMilestone {
	title: string;
	completed: boolean;
}

export interface RoadmapItem {
	slug: string;
	title: string;
	itemType: RoadmapItemType;
	stage: RoadmapStage;
	evaluationState: EvaluationState | null;
	area: string;
	outcome: string;
	whyNow: string;
	firstRelease: string[];
	milestones: RoadmapMilestone[];
	notIncludedYet: string[];
	strategicRole: string | null;
	targetTeam: string | null;
	exampleProcess: string[];
	likelySystems: string[];
	expectedOutput: string | null;
	featured: boolean;
	publicUpdate: string | null;
	publicUpdateDate: string | null;
	underReview: boolean;
	voting: VotingState;
	order: number;
	githubUrl: string;
	issueNumber: number | null;
	votes: number;
}

export interface ReleaseAsset {
	name: string;
	downloadUrl: string;
}

export interface ReleaseItem {
	version: string;
	name: string;
	publishedAt: string;
	githubUrl: string;
	/** A pre-release of a version to come: the beta channel. */
	prerelease?: boolean;
	highlights: string[];
	improvements: string[];
	fixes: string[];
	platforms: string[];
	assets: ReleaseAsset[];
	projectSlugs: string[];
}

export const roadmapItems = [...(roadmapSnapshot.items as RoadmapItem[])].sort(
	(a, b) => a.order - b.order,
);
const byNewest = (a: ReleaseItem, b: ReleaseItem) =>
	new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf();

/** Every release of the snapshot, newest first: stable and pre-release. */
export const allReleases = [...(releaseSnapshot.items as ReleaseItem[])].sort(byNewest);
/** Stable releases only: what the downloads, the roadmap evidence and the
 * changelog's "Latest" point to. */
export const releases = allReleases.filter((release) => !release.prerelease);
/** The pre-releases of the snapshot, newest first. */
export const prereleases = allReleases.filter((release) => release.prerelease);
export const roadmapSyncedAt = roadmapSnapshot.contentUpdatedAt;
export const releasesSyncedAt = releaseSnapshot.contentUpdatedAt;
export const strategicPrograms = roadmapItems.filter(
	(item) => item.itemType === "strategic_program",
);
export const workflowIdeas = roadmapItems.filter(
	(item) => item.itemType === "workflow_idea",
);
export const featuredProject = selectFeaturedProject(strategicPrograms);
export const latestRelease = releases[0];

export function programsByStage(stage: RoadmapStage) {
	return strategicPrograms.filter((item) => item.stage === stage);
}

export function itemsByStatus(stage: RoadmapStage) {
	return roadmapItems.filter((item) => item.stage === stage);
}

export function projectBySlug(slug: string) {
	return roadmapItems.find((item) => item.slug === slug);
}

export function releasesForProject(slug: string) {
	return releases.filter((release) => release.projectSlugs.includes(slug));
}
