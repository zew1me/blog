import { relative } from 'node:path';

/**
 * Build-time warning channel for the remark plugins.
 *
 * Writes straight to stderr rather than using `console.warn`, because Astro's
 * build logger swallows console output from inside the Vite/remark pipeline —
 * the warning is emitted but never reaches the terminal. This was verified
 * empirically; do not "simplify" it back to console.warn.
 *
 * These are warnings on purpose, never thrown errors. A typo in prose should
 * be visible in the build log without blocking a deploy. See SPEC.md.
 *
 * Caveat worth knowing: Astro's content layer caches rendered Markdown in
 * `node_modules/.astro/data-store.json`. An unchanged post is not re-rendered,
 * so its plugins do not re-run and its warnings do not reappear on the next
 * build. Run `pnpm clean` first if you want to see every warning on the site.
 */

const YELLOW = '[33m';
const DIM = '[2m';
const RESET = '[0m';

/** Deduplicated so a repeated bad link doesn't spam one line per occurrence. */
const seen = new Set<string>();

export function buildWarn(scope: string, message: string, filePath?: string): void {
	const where = filePath ? relative(process.cwd(), filePath) : '';
	const key = `${scope}:${message}:${where}`;
	if (seen.has(key)) return;
	seen.add(key);

	const location = where ? ` ${DIM}(${where})${RESET}` : '';
	process.stderr.write(`${YELLOW}[${scope}]${RESET} ${message}${location}\n`);
}
