import { visit } from 'unist-util-visit';
import type { Root, Text, PhrasingContent } from 'mdast';
import { getLinkIndex } from '../lib/post-index.ts';
import { resolveLink, WIKILINK_PATTERN } from '../lib/resolve-link.ts';
import { buildWarn } from './warn.ts';

/**
 * Rewrites `[[target]]` and `[[target|label]]` in Markdown and MDX into links.
 *
 * This plugin ONLY renders. The backlink graph is built separately in
 * `src/lib/backlinks.ts`, because a remark plugin only ever sees one file at
 * a time and cannot know who links to whom.
 *
 * Unresolved links render as a non-link `<span class="wikilink-missing">` and
 * emit a build WARNING, never an error. Failing a build over a typo in prose
 * is hostile to writing — see SPEC.md.
 */
export function remarkWikilink() {
	return function transformer(tree: Root, file: { path?: string }) {
		const index = getLinkIndex();

		visit(tree, 'text', (node: Text, childIndex, parent) => {
			if (!parent || childIndex === undefined) return;
			// Never rewrite inside an existing link — `[[a]]` in a URL stays put.
			if (parent.type === 'link' || parent.type === 'linkReference') return;

			const value = node.value;
			WIKILINK_PATTERN.lastIndex = 0;
			if (!WIKILINK_PATTERN.test(value)) return;

			const replacements: PhrasingContent[] = [];
			let cursor = 0;

			WIKILINK_PATTERN.lastIndex = 0;
			for (const match of value.matchAll(WIKILINK_PATTERN)) {
				const start = match.index!;
				if (start > cursor) {
					replacements.push({ type: 'text', value: value.slice(cursor, start) });
				}

				const rawTarget = match[1]!;
				const label = match[2] ?? null;
				const resolved = resolveLink(index, rawTarget);

				if (resolved) {
					replacements.push({
						type: 'link',
						url: resolved.href,
						title: null,
						data: { hProperties: { class: 'wikilink' } },
						children: [{ type: 'text', value: label ?? resolved.title }],
					});
				} else {
					buildWarn('wikilink', `unresolved: [[${rawTarget}]]`, file?.path);
					replacements.push({
						type: 'html',
						value: `<span class="wikilink-missing" title="Unresolved link: ${escapeAttr(
							rawTarget,
						)}">${escapeText(label ?? rawTarget)}</span>`,
					});
				}

				cursor = start + match[0].length;
			}

			if (cursor < value.length) {
				replacements.push({ type: 'text', value: value.slice(cursor) });
			}

			parent.children.splice(childIndex, 1, ...replacements);
			// Skip past what we just inserted so we don't revisit our own output.
			return childIndex + replacements.length;
		});
	};
}

function escapeText(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
	return escapeText(value).replace(/"/g, '&quot;');
}
