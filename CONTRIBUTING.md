# Contributing

`main` deploys directly to production. Keep every commit releasable and never bypass the repository checks.

## Setup

Use Node 22.12 or newer and the pinned pnpm version:

```sh
corepack enable
pnpm install
```

Installation registers Lefthook. If Git hooks are missing, run `pnpm lefthook install`.

The repository delays newly published package versions for at least five days.
This is enforced for direct and transitive dependencies by
`pnpm-workspace.yaml`.

## Quality bar

Run the complete local gate before pushing:

```sh
pnpm verify
pnpm audit
```

`pnpm verify` checks formatting, ESLint (including Astro and accessibility
rules), Stylelint, Markdownlint, Astro/TypeScript types, unused code and
dependencies, repository-specific ast-grep policies, duplication, secrets, the
production build, and JavaScript island boundaries.

The hooks split that work deliberately:

- **Pre-commit** fixes staged files with ESLint, Stylelint, Markdownlint, and Prettier, then stages the fixes.
- **Pre-push** blocks on the complete verification and dependency audit.
- **GitHub Actions** repeats the checks on pull requests and `main`.

Do not use `--no-verify`. Fix the cause or, if a rule is wrong, improve the rule and include a regression example.

## Structural rules

The rules in `.ast-grep/rules/` encode narrow React performance practices from
Vercel's React best-practices guidance. Every rule must have valid and invalid
examples in `.ast-grep/rule-tests/`. Prefer precise rules over broad heuristics
that create false positives.

## Changes

- Keep changes focused; separate mechanical autofixes from tooling or behavior changes.
- Use repository scripts rather than one-off global tools.
- Keep posts as Markdown unless they import an interactive component.
- Update `SPEC.md`, `ARCHITECTURE.md`, or `DESIGN-SYSTEM.md` when their contracts change.
- Verify that plain Markdown posts still ship no JavaScript after shared layout changes.
