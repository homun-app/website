import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// Marketplace add-ons — one Markdown file per add-on (frontmatter = card, body =
// detail page). The catalog stays static; PocketBase will gate installs later.
const addons = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/addons" }),
	schema: z.object({
		name: z.string(),
		tagline: z.string(),
		category: z.string(),
		icon: z.string(),
		price: z.string().default("Free"),
		badge: z.string().optional(),
		author: z.string().default("Homun"),
		docsHref: z.string().optional(),
		screenshot: z.string().optional(),
		order: z.number().default(0),
	}),
});

// Starlight's documentation collection (migrated from the standalone docs site).
const docs = defineCollection({ loader: docsLoader(), schema: docsSchema() });

export const collections = { addons, docs };
