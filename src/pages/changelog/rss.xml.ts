import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { allReleases } from "../../lib/product-data";

const id = (version: string) => version.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();

export async function GET(context: APIContext) {
	return rss({
		title: "Homun — Changelog",
		description: "Published Homun desktop releases.",
		site: context.site ?? "https://homun.app",
		items: allReleases.map((release) => ({
			title: `Homun ${release.version}${release.prerelease ? " (pre-release)" : ""}`,
			pubDate: new Date(release.publishedAt),
			description: release.highlights.join(" · ") || "Published Homun desktop release.",
			link: `/changelog/#${id(release.version)}`,
		})),
	});
}
