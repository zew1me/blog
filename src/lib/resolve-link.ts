/**
 * Shared wikilink resolution.
 *
 * There are two consumers, and they MUST agree:
 *   1. `src/plugins/remark-wikilink.ts` — renders [[target]] into an anchor.
 *   2. `src/lib/backlinks.ts`           — builds the forward/reverse graph.
 *
 * If these two ever disagree, you get links that render but produce no
 * backlink (or vice versa). That is why the matching logic lives here alone.
 *
 * See SPEC.md for the authored contract.
 */

/** The minimum shape a post needs to be a resolution target. */
export type LinkTarget = {
	/** Collection entry id — the file path minus extension, e.g. "hello-world". */
	id: string;
	title: string;
	aliases: string[];
};

export type ResolvedLink = {
	/** Entry id of the matched post. */
	id: string;
	/** Site-absolute href. */
	href: string;
	/** Canonical title of the matched post. */
	title: string;
};

/** Route prefix for posts. Change here if the route table changes. */
const POST_BASE = '/posts';

export function postHref(id: string): string {
	return `${POST_BASE}/${id}/`;
}

/**
 * Normalize a wikilink target or a candidate key for comparison.
 * Case-insensitive, whitespace-collapsed, and tolerant of `-`/`_`/space
 * being used interchangeably so `[[Hello World]]` finds `hello-world.md`.
 */
function normalizeKey(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/\.mdx?$/, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * A lookup index built once per build and reused for every link.
 *
 * Resolution order is slug -> aliases -> title. Earlier tiers win outright,
 * so an alias can never shadow a real slug.
 */
export type LinkIndex = {
	bySlug: Map<string, LinkTarget>;
	byAlias: Map<string, LinkTarget>;
	byTitle: Map<string, LinkTarget>;
};

export function buildLinkIndex(targets: LinkTarget[]): LinkIndex {
	const bySlug = new Map<string, LinkTarget>();
	const byAlias = new Map<string, LinkTarget>();
	const byTitle = new Map<string, LinkTarget>();

	for (const target of targets) {
		bySlug.set(normalizeKey(target.id), target);
	}
	// Aliases and titles are registered second so they can never clobber a slug
	// match, and a first-writer-wins rule keeps collisions deterministic.
	for (const target of targets) {
		for (const alias of target.aliases) {
			const key = normalizeKey(alias);
			if (!bySlug.has(key) && !byAlias.has(key)) byAlias.set(key, target);
		}
	}
	for (const target of targets) {
		const key = normalizeKey(target.title);
		if (!bySlug.has(key) && !byAlias.has(key) && !byTitle.has(key)) {
			byTitle.set(key, target);
		}
	}

	return { bySlug, byAlias, byTitle };
}

/** Returns the matched post, or `null` for a broken link. */
export function resolveLink(index: LinkIndex, rawTarget: string): ResolvedLink | null {
	const key = normalizeKey(rawTarget);
	if (!key) return null;

	const match = index.bySlug.get(key) ?? index.byAlias.get(key) ?? index.byTitle.get(key);
	if (!match) return null;

	return { id: match.id, href: postHref(match.id), title: match.title };
}

/**
 * Matches `[[target]]` and `[[target|label]]`.
 *
 * Deliberately rejects `]`, `[`, and newlines inside the target so an
 * unclosed bracket can't swallow the rest of a paragraph.
 */
export const WIKILINK_PATTERN = /\[\[([^\u005B\u005D\n|]+?)(?:\|([^\u005B\u005D\n]+?))?\]\]/g;

export type ParsedWikilink = {
	target: string;
	label: string | null;
};

/** Extracts every wikilink in a raw markdown body, in source order. */
export function parseWikilinks(body: string): ParsedWikilink[] {
	const found: ParsedWikilink[] = [];
	// `matchAll` needs a fresh lastIndex each call; the global regex is shared.
	WIKILINK_PATTERN.lastIndex = 0;
	for (const match of body.matchAll(WIKILINK_PATTERN)) {
		const target = match.at(1);
		if (target) found.push({ target, label: match.at(2) ?? null });
	}
	return found;
}
