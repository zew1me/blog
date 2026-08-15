import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/**
 * The ONLY way pages should read posts.
 *
 * Centralising this is what makes the draft rule reliable: if a page called
 * `getCollection('posts')` directly it would leak drafts into production, and
 * that mistake is invisible in dev (where drafts are supposed to show).
 *
 * Drafts are visible in `astro dev`, hidden in every production build.
 */
export async function getPublishedPosts(): Promise<Post[]> {
	const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Tags with their post counts, most-used first, then alphabetical. */
export async function getTagCounts(): Promise<{ tag: string; count: number }[]> {
	const posts = await getPublishedPosts();
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
	const posts = await getPublishedPosts();
	return posts.filter((post) => post.data.tags.includes(tag));
}

/** Groups posts by publication year, newest year first. */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
	const groups = new Map<number, Post[]>();
	for (const post of posts) {
		const year = post.data.pubDate.getUTCFullYear();
		const bucket = groups.get(year);
		if (bucket) bucket.push(post);
		else groups.set(year, [post]);
	}
	return [...groups.entries()]
		.map(([year, entries]) => ({ year, posts: entries }))
		.sort((a, b) => b.year - a.year);
}
