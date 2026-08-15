import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import matter from 'gray-matter';
import { buildLinkIndex } from './resolve-link.ts';
import type { LinkIndex, LinkTarget } from './resolve-link.ts';

/**
 * Reads the posts directory straight off disk to build the wikilink index.
 *
 * Why not `getCollection('posts')`? Remark plugins run inside the Vite/Astro
 * config pipeline, where the `astro:content` virtual module does not exist.
 * So the plugin cannot ask the content layer for anything. Reading the same
 * files from disk is the only option available at that point in the build.
 *
 * `src/lib/backlinks.ts` DOES use `getCollection`, because it runs inside
 * pages. Both funnel through the same resolver in `resolve-link.ts`, which is
 * what keeps the two views consistent.
 */

const POSTS_DIR = new URL('../content/posts/', import.meta.url);

function listMarkdownFiles(dir: string): string[] {
	const out: string[] = [];
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		// No posts directory yet — an empty index is correct, not an error.
		return out;
	}
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...listMarkdownFiles(full));
		else if (/\.mdx?$/.test(entry.name)) out.push(full);
	}
	return out;
}

/**
 * Converts an absolute post path into the id Astro's glob loader will use:
 * the path relative to the collection base, without extension, POSIX-style.
 */
function toEntryId(root: string, file: string): string {
	return relative(root, file)
		.replace(/\.mdx?$/, '')
		.split(sep)
		.join('/');
}

function readTargets(): LinkTarget[] {
	const root = POSTS_DIR.pathname;
	return listMarkdownFiles(root).map((file) => {
		const { data } = matter(readFileSync(file, 'utf8'));
		return {
			id: toEntryId(root, file),
			title: typeof data.title === 'string' ? data.title : '',
			aliases: Array.isArray(data.aliases) ? data.aliases.filter((a) => typeof a === 'string') : [],
		};
	});
}

let cached: LinkIndex | null = null;

/**
 * Memoized for the lifetime of the process. A production build is one process,
 * so this costs a single directory walk.
 *
 * In `astro dev` the process is long-lived, so adding or renaming a post
 * requires a dev-server restart before wikilinks to it will resolve.
 * That tradeoff is documented in ARCHITECTURE.md.
 */
export function getLinkIndex(): LinkIndex {
	cached ??= buildLinkIndex(readTargets());
	return cached;
}
