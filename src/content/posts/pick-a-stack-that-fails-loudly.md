---
title: 'Pick a stack that fails loudly'
description: 'How I chose a deliberately boring blog stack for one person, a few coding agents, and the occasional interactive idea.'
pubDate: 2026-08-15
tags: ['meta', 'astro', 'tooling', 'agents']
aliases: ['stack choice', 'fails loudly', 'building this blog']
---

I wanted something like Medium, except single-player.

Git instead of a CMS. Mostly text, with room for the occasional interactive
thing. Tags, backlinks, and search. It had to live on Vercel's hobby plan
without accumulating a small fleet of databases and services. I also wanted to
build most of it with coding agents.

## Bear was the adjective

I started by trying to remember the name of a minimal blogging platform. It was
[Bear Blog](https://bearblog.dev/). Bear gets the important part right: the text
is the product, there is almost no chrome, and publishing shouldn't require a
platform team.

But I didn't really want Bear. I wanted **Bear as an adjective**: small,
text-first, fast, and mine. Bear can bit a bit too minimal to pop IMO.

And sometimes hypermedia makes sense. The implementation still needed to be
flexible enough for diagrams, custom components, linked notes, and maybe
hybrid search later. I got four options back from my Chat GPT search:

- [Eleventy](https://www.11ty.dev/) was the purest document-to-HTML choice.
- [Zola](https://www.getzola.org/) was similarly simple, fast, and pleasantly
  traditional.
- [Quartz](https://quartz.jzhao.xyz/) already understood the Obsidian-shaped
  world of wikilinks, backlinks, transclusion, and graphs.
- [Astro](https://astro.build/) treated Markdown as first-class content but
  left an escape hatch into components and interactive islands.

Eleventy and Zola were easy to respect and easy to rule out. I wasn't only
building a sequence of documents. I wanted the site to be able to become a
small web platform without first replacing the publishing system.

Quartz was harder. I use Obsidian heavily, and my default mode is Markdown,
wikilinks, and docs-as-code. Quartz's content model already matched the way I
think.

The useful distinction turned out to be this:

> Quartz starts with a knowledge base. Astro starts with a website.

If the goal had been "publish this vault," I would have picked Quartz. My goal
was closer to "build a publication whose source happens to be an
Obsidian-friendly set of files." I wanted Quartz's document semantics, but I
wanted Astro's programmable edge.

It seemed easier to teach Astro `[[wikilinks]]` than to make the post itself a
programmable page.

## The Architecture

The resulting architecture is:

```text
Markdown / occasional MDX
          │
          ▼
     Astro build
       ├─ validate frontmatter
       ├─ resolve wikilinks
       ├─ derive backlinks and tags
       ├─ render RSS and sitemap
       └─ compile per-page islands
          │
          ▼
     static HTML
          │
          ├─ Pagefind builds a static search index
          └─ Vercel serves the files
```

There is no database, application server, admin panel, authentication layer, or
search account. Git is the editor interface. A push to `main` publishes.

Ordinary posts stay `.md`. A post only becomes `.mdx` when it imports a
component. [[hello-world]] loads no hydrated island or React runtime, while
[[widgets]] can hydrate a React island without turning the rest of the site
into a React application. Shared chrome still uses a little vanilla JavaScript
for things like the theme toggle.

I chose React because it's popular. The agent advised me to defer a framework.
The advice was reasonable, but if I don't add it now next time I'm building something
with an agent, what is it going to use? Fuck if I know. Will I remember to tell it --
don't create a bunch of widgets by hand and use a framework, please? Maybe. But instead
of worrying about this, I just injected a framework up front.

The rest stayed conservative: one `posts` collection, optional hero images,
Atkinson Hyperlegible, a token-based dark theme, callouts that work in plain
Markdown, and notes/projects deferred until they exist.

## Start search boring

I originally asked about hybrid search. The fun version would combine lexical
matches, embeddings, tags, and even the link graph:

```text
score = lexical + semantic + shared tags + graph proximity
```

That is possible without paying for a hosted vector database. Embeddings can be
generated at build time, a static index can ship with the site, and something
like [Orama](https://oramasearch.com/) can run hybrid retrieval in the browser.

It is also a lot of machinery for a blog with two posts.

So v1 uses [Pagefind](https://pagefind.app/). It indexes the rendered HTML after
the Astro build and writes static files beside the site. No API key, crawler
service, database, or recurring bill. The browser downloads the pieces of the
index it needs.

Semantic search remains an additive experiment rather than infrastructure the
site needs in order to work. A few hundred essays from one author may turn out
to be the ideal corpus for it. Until then, exact words are a useful feature.

## Then the agents built it

The research going in was good. It was also confidently wrong in several
specific but minor ways:

- It said Pagefind would write to `dist/_pagefind/`. The installed version
  writes to `dist/pagefind/`.
- Installing the newest TypeScript broke `astro check`; Astro still depended on
  an API removed in TypeScript 7, so the project had to stay on 6.x.
- The proposed Astro Markdown configuration used an API Astro 7 had deprecated.
- Hydration directives did not work through a generic component mapping. An
  interactive component had to be imported directly by the `.mdx` post.

None of these was a serious problem. Each one became obvious.

The more interesting failure was a feature that appeared to work.

Unresolved wikilinks are meant to render visibly and emit a build warning. I
added one, built the site, and got silence. Switching from `console.warn` to a
direct stderr write didn't seem to help. Instrumentation suggested the remark
plugin wasn't running at all.

It wasn't.

Astro had cached the rendered Markdown. The unchanged post never went through
the plugin again, so there was no warning to print. Adding a new broken link
forced the render and both warnings appeared. The code was correct; the check
I'd just written simply had not executed.

:::warn{title="Green is not the same as checked"}
A failing build is easy to fix. A green build that quietly skipped the thing
you meant to test is the dangerous one.
:::

In an agent-heavy workflow, I care less about whether an agent can generate the code.
It usually can. I care about
whether the system makes confident wrongness visible.

## Tripwires, not ceremony

A few architectural choices now exist mainly to make half-working states harder
to produce:

**Frontmatter is a schema.** A post without a title, description, or valid date
fails the build. Those fields feed routes, listings, RSS, and metadata; there is
no useful fallback.

**Draft filtering has one entry point.** Pages read posts through the same
helper. Calling Astro's collection API directly would look correct in local
development, where drafts are intentionally visible, and leak them in
production.

**Link resolution lives in one file.** The remark plugin that renders a
wikilink and the graph builder that derives its backlink use the same resolver.
Otherwise a link could work in the article while silently disappearing from the
graph.

**The island boundary is tested in built HTML.** The check first confirms both
expected HTML files exist. A Markdown post must then contain zero
`astro-island` elements, while the MDX widget example must contain at least one.
That marker measures hydrated framework islands, not every `<script>` emitted by
shared chrome. It turns "plain posts don't hydrate React" from an aspiration
into a grep.

**The deploy gate is local and repeatable.** Formatting, linting, types, static
analysis, secrets, dependency audit, a production build, and the island check
run before a push. CI runs the same things again.

A pile of tools can be a lot for a human. But for an agent, it creates a better
defined definition of done. In a world of Mr. MeSeeks, the agent will do anything to
complete its tasks. It will manipulate requirements to get it's reward. That's how it's trained.

Not every tripwire is fatal. A malformed date stops the build; a missing
wikilink prints a warning. Mechanical correctness should be strict. Editorial
work should still be allowed to be unfinished. Maybe? Jury is still out.

## What I ended up choosing

The stack is Astro, Markdown by default, MDX by exception, typed content
collections, React islands, Pagefind, and Vercel. It borrows wikilinks and
backlinks from digital gardens without making the whole site a garden. It
borrows restraint from Bear while peppering in a little whimsy.

The recurring infrastructure cost is zero. More importantly, the center is
boring: files go in, static files come out, and every clever feature is kept at
the edge.

That feels right.
