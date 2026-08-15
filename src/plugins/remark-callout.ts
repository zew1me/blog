import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { buildWarn } from './warn.ts';

/**
 * Turns `remark-directive` container syntax into styled callouts:
 *
 *   :::note
 *   Body text.
 *   :::
 *
 *   :::warn{title="Careful"}
 *   Body text.
 *   :::
 *
 * Emits a plain <aside> with classes. It produces NO components and NO client
 * JS on purpose: callouts must work in plain `.md`, where Astro cannot hydrate
 * anything. See ARCHITECTURE.md on the .md/.mdx hydration constraint.
 *
 * Styling lives in `src/styles/global.css` under the callout section.
 */

const VARIANTS = {
	note: { label: 'Note', icon: '●' },
	tip: { label: 'Tip', icon: '◆' },
	warn: { label: 'Warning', icon: '▲' },
} as const;

type Variant = keyof typeof VARIANTS;

function isVariant(name: string): name is Variant {
	return name in VARIANTS;
}

export function remarkCallout() {
	return function transformer(tree: Root, file: { path?: string }) {
		visit(tree, (node) => {
			if (node.type !== 'containerDirective') return;

			const directive = node as typeof node & {
				name: string;
				attributes?: Record<string, string | null | undefined>;
				data?: Record<string, unknown>;
			};

			if (!isVariant(directive.name)) {
				// An unknown ::: directive is almost always a typo. Warn rather
				// than fail, and leave the node alone so the text still renders.
				buildWarn(
					'callout',
					`unknown directive ":::${directive.name}". Known: ${Object.keys(VARIANTS).join(', ')}`,
					file?.path,
				);
				return;
			}

			const variant = VARIANTS[directive.name];
			const title = directive.attributes?.title?.trim() || variant.label;

			directive.data = {
				...directive.data,
				hName: 'aside',
				hProperties: {
					class: `callout callout-${directive.name}`,
					role: directive.name === 'warn' ? 'note' : undefined,
					'aria-label': title,
				},
			};

			// Prepend the visible header. `aria-hidden` on the glyph keeps the
			// decorative marker out of the accessibility tree.
			node.children.unshift({
				type: 'paragraph',
				data: { hName: 'p', hProperties: { class: 'callout-title' } },
				children: [
					{
						type: 'html',
						value: `<span class="callout-icon" aria-hidden="true">${variant.icon}</span>`,
					},
					{ type: 'text', value: title },
				],
			});
		});
	};
}
