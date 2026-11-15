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
	},
	integrations: [
		// Documentation lives under /docs (and /it/docs), served by Starlight and
		// themed espresso to match the marketing site. Marketing pages (/, /roadmap,
		// /changelog) are plain Astro pages using their own Tailwind layer.
		starlight({
			title: 'Homun',
			description: 'Local-first personal assistant — documentation.',
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
				Banner: './src/components/docs/Banner.astro',
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
							label: 'Features',
							translations: { it: 'Funzionalità' },
							items: [
								{ label: 'Chat', slug: 'guides/chat' },
								{ label: 'Memory', translations: { it: 'Memoria' }, slug: 'guides/memory' },
								{ label: 'Models & providers', translations: { it: 'Modelli e provider' }, slug: 'guides/models' },
								{ label: 'Channels', translations: { it: 'Canali' }, slug: 'guides/channels' },
								{ label: 'Automations', translations: { it: 'Automazioni' }, slug: 'guides/automations' },
								{ label: 'Skills', translations: { it: 'Skill' }, slug: 'guides/skills' },
								{ label: 'Connectors', translations: { it: 'Connettori' }, slug: 'guides/connectors' },
								{ label: 'The local computer', translations: { it: 'Il computer locale' }, slug: 'guides/local-computer' },
								{ label: 'Proactivity', translations: { it: 'Proattività' }, slug: 'guides/proactivity' },
								{ label: 'Privacy & security', translations: { it: 'Privacy e sicurezza' }, slug: 'guides/security' },
							],
						},
						{
							label: 'Get Homun',
							translations: { it: 'Ottieni Homun' },
							items: [
								{ label: 'Download', slug: 'guides/download' },
								{ label: 'Self-hosting', slug: 'guides/self-hosting' },
							],
						},
						{
							label: 'Reference',
							translations: { it: 'Riferimento' },
							items: [
								{ label: 'Architecture', translations: { it: 'Architettura' }, slug: 'reference/architecture' },
								{ label: 'Components', translations: { it: 'Componenti' }, slug: 'reference/components' },
								{ label: 'Memory model', translations: { it: 'Modello di memoria' }, slug: 'reference/memory-model' },
								{ label: 'Design decisions', translations: { it: 'Decisioni di design' }, slug: 'reference/decisions' },
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
						{ slug: 'docs/engramma' },
						{ slug: 'docs/engramma/how-it-works' },
						{ slug: 'docs/engramma/privacy' },
						{ slug: 'docs/engramma/whats-next' },
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
