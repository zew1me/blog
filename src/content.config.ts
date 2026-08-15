import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * The `posts` collection.
 *
 * One collection for now. `notes` and `projects` are deferred — when they
 * arrive they should reuse this same shape so wikilinks, backlinks, tags, and
 * search keep working without a migration. See ARCHITECTURE.md.
 */
const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			/** Post title. Also a wikilink resolution target. */
			title: z.string(),
			/** One-sentence dek. Used in listings, meta description, and RSS. */
			description: z.string(),
			/** Publication date. Drives ordering everywhere. */
			pubDate: z.coerce.date(),
			/** Set when materially revising an already-published post. */
			updatedDate: z.coerce.date().optional(),
			/** Optional — most posts won't have one. Not required to publish. */
			heroImage: z.optional(image()),
			/** Lowercase, kebab-case, flat. No hierarchy. */
			tags: z.array(z.string()).default([]),
			/** Hidden from production builds; always visible in `astro dev`. */
			draft: z.boolean().default(false),
			/** Extra names this post can be reached by via [[wikilinks]]. */
			aliases: z.array(z.string()).default([]),
		}),
});

export const collections = { posts };
