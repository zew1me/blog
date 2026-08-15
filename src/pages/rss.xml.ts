import type { APIContext } from 'astro';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getPublishedPosts } from '../lib/content.ts';
import { postHref } from '../lib/resolve-link.ts';

/**
 * Summary-only feed. The body is deliberately omitted: posts can contain MDX
 * components and hydrated widgets that have no meaningful RSS representation,
 * and a half-rendered island in a feed reader is worse than a link.
 */
export async function GET(context: APIContext) {
	if (!context.site) throw new Error('The canonical site URL is required to build the RSS feed.');

	const posts = await getPublishedPosts();

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		// `context.site` comes from `site` in astro.config.mjs.
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: [...post.data.tags],
			link: postHref(post.id),
		})),
	});
}
