---
title: 'Hello world'
description: 'What this site is, and the conventions it runs on.'
pubDate: 2026-08-15
tags: ['meta']
aliases: ['colophon', 'first post']
---

This is the first post. It exists to establish the conventions everything else
follows, and to give the build something real to chew on.

## Plain Markdown by default

Posts are `.md` files in `src/content/posts/`. Ordinary Markdown works exactly
as you'd expect — **bold**, _italic_, `inline code`, [links](https://astro.build),
lists, tables, blockquotes, and fenced code blocks:

```ts
function greet(name: string): string {
  return `hello, ${name}`;
}
```

> Posts that need an interactive component switch to `.mdx`. Nothing else does.

## Wikilinks

Any post can link to any other with double brackets. This links to the widgets
post: [[widgets]]. You can override the link text too:
[[widgets|the one with the slider]].

Links resolve against the target's slug, then its `aliases`, then its title —
so `[[Hello world]]` and `[[colophon]]` both find this page. The target's page
grows a "Linked from" panel automatically; there is nothing to maintain by hand.

A link that doesn't resolve renders like this — [[a post that does not exist]] —
and logs a build warning. It won't fail the build. Typos in prose shouldn't
block a deploy.

## Callouts

Three variants, all usable from plain Markdown:

:::note
The default. For an aside that's worth setting apart but isn't urgent.
:::

:::tip{title="Worth knowing"}
Callouts take an optional `title` attribute when the default label isn't
specific enough.
:::

:::warn
For things that will actually bite you.
:::

## Footnotes and the rest

Standard Markdown extensions work, including footnotes[^1] and
~~strikethrough~~.

[^1]: Like this one.

That's the whole authoring surface. See the README for the frontmatter contract.
