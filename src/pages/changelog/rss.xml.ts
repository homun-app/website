import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	const entries = await getCollection("changelog");
	return rss({
		title: "Homun — Changelog",
		description: "What's new in Homun.",
		site: context.site ?? "https://homun.app",
		items: entries
			.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
			.map((e) => ({
				title: e.data.title,
				pubDate: e.data.date,
				description: e.data.tags.join(" · "),
				link: `/changelog/#${e.id}`,
			})),
	});
}
