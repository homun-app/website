// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import sidebarTopics from 'starlight-sidebar-topics';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://homun.app',
	redirects: {
		'/it': '/it/docs/',
		'/roadmap/mobile-companion': '/roadmap/homun-mobile',
		'/roadmap/shared-spaces': '/roadmap/team-spaces-roles',
		'/roadmap/voice-capture': '/roadmap/voice-meeting-capture',
		// Homun 2 docs pages with no counterpart in Homun 0.3.
		'/guides/channels': '/guides/connectors/',
		'/guides/proactivity': '/guides/automations/',
		'/guides/self-hosting': '/guides/download/',
		'/reference/components': '/reference/architecture/',
		'/reference/decisions': '/reference/architecture/',
		'/reference/memory-model': '/docs/engramma/how-it-works/',
		'/it/guides/channels': '/it/guides/connectors/',
		'/it/guides/proactivity': '/it/guides/automations/',
		'/it/guides/self-hosting': '/it/guides/download/',
		'/it/reference/components': '/it/reference/architecture/',
		'/it/reference/decisions': '/it/reference/architecture/',
		'/it/reference/memory-model': '/it/docs/engramma/how-it-works/',
	},
	integrations: [
		// Documentation lives under /docs (and /it/docs), served by Starlight and
		// themed espresso to match the marketing site. Marketing pages (/, /roadmap,
		// /changelog) are plain Astro pages using their own Tailwind layer.
		starlight({
			title: 'Homun',
			description: 'A team of AI bots that works on your computer — documentation.',
			favicon: '/favicon.svg',
			logo: {
				light: './src/assets/brand/homun-wordmark-light.svg',
				dark: './src/assets/brand/homun-wordmark-dark.svg',
				replacesTitle: true,
				alt: 'Homun',
			},
			customCss: [
				'@fontsource-variable/figtree',
				'@fontsource/m-plus-rounded-1c/latin-800.css',
				'@fontsource/geist-mono/latin-400.css',
				'./src/styles/starlight-theme.css',
			],
			// Default the docs to dark (matching the marketing site); toggle still works.
			components: {
				Head: './src/components/docs/AnalyticsHead.astro',
				Header: './src/components/docs/Header.astro',
				Footer: './src/components/docs/Footer.astro',
				ThemeProvider: './src/components/docs/ThemeProvider.astro',
			},
			expressiveCode: {
				themes: ['github-dark', 'github-light'],
				styles: { borderRadius: '0.5rem' },
			},
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				it: { label: 'Italiano', lang: 'it' },
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/homun-app' },
			],
			plugins: [sidebarTopics([
				{
					label: 'Homun',
					link: '/docs/',
					items: [
						{
							label: 'Overview',
							translations: { it: 'Panoramica' },
							items: [
								{ label: 'Welcome', translations: { it: 'Benvenuto' }, slug: 'docs' },
								{ label: 'Getting started', translations: { it: 'Per iniziare' }, slug: 'guides/getting-started' },
								{ label: 'Core concepts', translations: { it: 'Concetti base' }, slug: 'concepts' },
								{ label: 'Settings', translations: { it: 'Impostazioni' }, slug: 'guides/settings' },
							],
						},
						{
							label: 'Using Homun',
							translations: { it: 'Usare Homun' },
							items: [
								{ label: 'Bots & chat', translations: { it: 'Bot e chat' }, slug: 'guides/chat' },
								{ label: 'Teams', translations: { it: 'Squadre' }, slug: 'guides/teams' },
								{ label: 'Plugins', translations: { it: 'Plugin' }, slug: 'guides/connectors' },
								{ label: 'Skills', translations: { it: 'Skill' }, slug: 'guides/skills' },
								{ label: "The bots' computer", translations: { it: 'Il computer dei bot' }, slug: 'guides/local-computer' },
								{ label: 'Approvals & safety', translations: { it: 'Approvazioni e sicurezza' }, slug: 'guides/security' },
								{ label: 'Routines', translations: { it: 'Routine' }, slug: 'guides/automations' },
								{ label: 'Memory', translations: { it: 'Memoria' }, slug: 'guides/memory' },
								{ label: 'Models', translations: { it: 'Modelli' }, slug: 'guides/models' },
							],
						},
						{
							label: 'Get Homun',
							translations: { it: 'Ottieni Homun' },
							items: [
								{ label: 'Download', slug: 'guides/download' },
							],
						},
						{
							label: 'Reference',
							translations: { it: 'Riferimento' },
							items: [
								{ label: 'Architecture', translations: { it: 'Architettura' }, slug: 'reference/architecture' },
							],
						},
						{ slug: 'privacy' },
						{ slug: 'license' },
					],
				},
				{
					label: 'Engramma',
					link: '/docs/engramma/',
					items: [
						{ slug: 'docs/engramma', label: 'Overview' },
						{ slug: 'docs/engramma/install' },
						{ slug: 'docs/engramma/quickstart' },
						{ slug: 'docs/engramma/concepts' },
						{ slug: 'docs/engramma/how-it-works', label: 'How search works' },
						{ slug: 'docs/engramma/connect', label: 'Connect your assistants' },
						{ slug: 'docs/engramma/policies-and-reviewers' },
						{ slug: 'docs/engramma/sync', label: 'Sync between devices' },
						{ slug: 'docs/engramma/import-and-the-vault', label: 'Import and the vault' },
						{ slug: 'docs/engramma/embed-it', label: 'Embed it' },
						{ slug: 'docs/engramma/compatibility' },
						{ slug: 'docs/engramma/privacy' },
						{ slug: 'docs/engramma/cli-reference', label: 'CLI reference' },
						{ slug: 'docs/engramma/whats-next', label: "What's next" },
					],
				},
			])],
		}),
		sitemap({
			// /dev/* pages are internal specimen sheets: noindex, not in the sitemap.
			filter: (page) => !page.includes('/dev/'),
		}),
	],
	// Tailwind v4 powers the marketing pages only (imported via Base.astro).
	vite: {
		plugins: [tailwindcss()],
	},
});
