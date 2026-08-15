// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import remarkDirective from 'remark-directive';
import { SITE_URL } from './src/consts.ts';
import { remarkCallout } from './src/plugins/remark-callout.ts';
import { remarkWikilink } from './src/plugins/remark-wikilink.ts';

// Static output. No adapter — Vercel auto-detects Astro and serves `dist/`.
// Search is layered on afterwards by the `pagefind` step in `pnpm build`.
export default defineConfig({
	// Imported rather than repeated so the origin has exactly one definition.
	site: SITE_URL,
	trailingSlash: 'always',

	integrations: [mdx(), react(), sitemap({ filter: (page) => !page.includes('/search') })],

	vite: {
		plugins: [tailwindcss()],
	},

	markdown: {
		// Astro 7 deprecated top-level `remarkPlugins`; the pipeline is now
		// configured by handing `markdown.processor` a `unified()` instance.
		//
		// Order matters: remarkDirective parses `:::` containers into directive
		// nodes, and remarkCallout only sees them because it runs after.
		processor: unified({
			remarkPlugins: [remarkDirective, remarkCallout, remarkWikilink],
		}),
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
			wrap: false,
		},
	},

	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
