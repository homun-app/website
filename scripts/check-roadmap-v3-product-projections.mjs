import assert from "node:assert/strict";
import { getViteConfig } from "astro/config";
import { createServer } from "vite";

const viteConfig = await getViteConfig({
	appType: "custom",
	logLevel: "silent",
	server: { middlewareMode: true },
}, {
	configFile: false,
	root: new URL("../", import.meta.url),
})({ command: "serve", mode: "test" });

const viteServer = await createServer(viteConfig);
try {
	const productData = await viteServer.ssrLoadModule("/src/lib/product-data.ts");
	assert.deepEqual(
		productData.strategicPrograms.map(({ slug }) => slug),
		[
			"operational-workspace", "homun-flow", "team-spaces-roles", "homun-mobile",
			"more-ways-to-reach-homun", "adaptive-company-intelligence",
			"voice-meeting-capture", "developer-platform",
		],
	);
	assert.deepEqual(
		productData.workflowIdeas.map(({ slug }) => slug),
		["client-work", "sales-operations", "content-marketing", "internal-operations", "customer-support"],
	);
	assert.equal(productData.featuredProject.slug, "homun-flow");
	assert.deepEqual(
		productData.programsByStage("next").map(({ slug }) => slug),
		["team-spaces-roles", "homun-mobile", "more-ways-to-reach-homun"],
	);
} finally {
	await viteServer.close();
}

console.log("Roadmap v3 product projections passed");
