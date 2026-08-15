import { getPublishedPosts } from './content.ts';
import type { Post } from './content.ts';
import { buildLinkIndex, parseWikilinks, postHref, resolveLink } from './resolve-link.ts';

/**
 * Build-time wikilink graph.
 *
 * Runs once per build (memoized below), not once per page. Uses the content
 * layer rather than disk because it executes inside pages, where
 * `astro:content` is available — but it shares `resolve-link.ts` with the
 * remark plugin so the rendered links and the graph can never diverge.
 *
 * Drafts are excluded from BOTH directions: a draft neither receives backlinks
 * nor contributes them. Otherwise an unpublished post would leak its title
 * into a published page's "Linked from" panel.
 */

export type LinkRef = {
	id: string;
	title: string;
	href: string;
	description: string;
};

export type LinkGraph = {
	/** post id -> posts it links out to */
	outbound: Map<string, LinkRef[]>;
	/** post id -> posts that link to it */
	inbound: Map<string, LinkRef[]>;
};

function toRef(post: Post): LinkRef {
	return {
		id: post.id,
		title: post.data.title,
		href: postHref(post.id),
		description: post.data.description,
	};
}

async function computeGraph(): Promise<LinkGraph> {
	const posts = await getPublishedPosts();
	const index = buildLinkIndex(
		posts.map((post) => ({ id: post.id, title: post.data.title, aliases: post.data.aliases })),
	);
	const byId = new Map(posts.map((post) => [post.id, post]));

	const outbound = new Map<string, LinkRef[]>();
	const inbound = new Map<string, LinkRef[]>();

	for (const post of posts) {
		// `body` is the raw markdown source, frontmatter already stripped.
		const body = post.body ?? '';
		const seen = new Set<string>();

		for (const { target } of parseWikilinks(body)) {
			const resolved = resolveLink(index, target);
			if (!resolved) continue;
			// A post linking to itself is not a backlink.
			if (resolved.id === post.id) continue;
			// Two links to the same post count once.
			if (seen.has(resolved.id)) continue;
			seen.add(resolved.id);

			const targetPost = byId.get(resolved.id);
			if (!targetPost) continue;

			appendTo(outbound, post.id, toRef(targetPost));
			appendTo(inbound, resolved.id, toRef(post));
		}
	}

	return { outbound, inbound };
}

function appendTo(map: Map<string, LinkRef[]>, key: string, ref: LinkRef): void {
	const existing = map.get(key);
	if (existing) existing.push(ref);
	else map.set(key, [ref]);
}

let pending: Promise<LinkGraph> | null = null;

/**
 * Memoized on the promise, not the value, so concurrent page renders during a
 * parallel build share one computation instead of racing to build several.
 */
export function getLinkGraph(): Promise<LinkGraph> {
	pending ??= computeGraph();
	return pending;
}

/** Posts that link TO `id`, alphabetical by title. */
export async function getBacklinks(id: string): Promise<LinkRef[]> {
	const { inbound } = await getLinkGraph();
	return [...(inbound.get(id) ?? [])].sort((a, b) => a.title.localeCompare(b.title));
}
