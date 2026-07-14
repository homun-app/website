import roadmapSnapshot from "../data/roadmap.json";
import releaseSnapshot from "../data/releases.json";
import { selectFeaturedProject } from "./roadmap-presentation.mjs";

export type RoadmapStatus = "ideas" | "next" | "building" | "shipped";
export type VotingState = "open" | "closed";

export interface RoadmapItem {
	slug: string;
	title: string;
	status: RoadmapStatus;
	area: string;
	description: string;
	capabilities: string[];
	featured: boolean;
	progress: number;
	targetRelease: string | null;
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
export const releases = [...(releaseSnapshot.items as ReleaseItem[])].sort(
	(a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf(),
);
export const roadmapSyncedAt = roadmapSnapshot.contentUpdatedAt;
export const releasesSyncedAt = releaseSnapshot.contentUpdatedAt;
export const featuredProject = selectFeaturedProject(roadmapItems);
export const latestRelease = releases[0];

export function itemsByStatus(status: RoadmapStatus) {
	return roadmapItems.filter((item) => item.status === status);
}

export function projectBySlug(slug: string) {
	return roadmapItems.find((item) => item.slug === slug);
}

export function releasesForProject(slug: string) {
	return releases.filter((release) => release.projectSlugs.includes(slug));
}
