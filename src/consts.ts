/**
 * Global site configuration.
 *
 * This is the single source of truth for site identity. Nothing else should
 * hardcode the title, author, or domain — import from here.
 */

export const SITE_TITLE = "Nigel's Blog";
export const SITE_DESCRIPTION =
	'Writing on software, systems, and whatever else is holding my attention.';
export const SITE_AUTHOR = 'Nigel S.';

/**
 * Canonical origin. Imported by astro.config.mjs as `site`, which is what
 * drives canonical URLs, RSS, and the sitemap. Change it here only.
 */
export const SITE_URL = 'https://blog.nigels.dev';

/** Personal site this blog belongs to. Linked from the footer. */
export const HOME_URL = 'https://nigels.dev';

export const SOCIAL_LINKS = [
	{ label: 'GitHub', href: 'https://github.com/zew1me' },
	{ label: 'Twitter', href: 'https://twitter.com/SoftNigel' },
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/nstuke/' },
] as const;

/** Primary navigation. */
export const NAV_LINKS = [
	{ label: 'Posts', href: '/posts/' },
	{ label: 'Tags', href: '/tags/' },
	{ label: 'Search', href: '/search/' },
] as const;

/** How many posts the homepage lists below the featured lead. */
export const HOME_POST_COUNT = 10;
