import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// Roadmap = short structured data → a single JSON file (file loader).
// This is the same content-collection pattern the addon marketplace catalog
// will use in Phase 2.
const roadmap = defineCollection({
	loader: file("src/content/roadmap.json"),
	schema: z.object({
		title: z.string(),
		status: z.enum(["exploring", "planned", "in-progress", "shipped"]),
		area: z.string().optional(),
		description: z.string(),
		order: z.number().default(0),
	}),
});

// Changelog = long-form entries → one Markdown file each (glob loader).
const changelog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/changelog" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		version: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),
});

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

export const collections = { roadmap, changelog, addons, docs };
