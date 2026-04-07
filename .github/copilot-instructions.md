# Project Guidelines

## Overview

Hyperlocal "small favors network" — neighbors request/fulfill help through an open feed with a dynamic trust graph. See [project.md](../project.md) for the full spec (schema, lifecycle, algorithms, phases).

## Tech Stack

- **Frontend**: Astro (deployed on Vercel)
- **Backend**: Convex (realtime subscriptions, mutations, queries)
- **Database**: Convex (built-in)
- **Auth**: Clerk or Lucia (magic link login)
- **Styling**: TailwindCSS (utility-first only)
- **Language**: TypeScript (strict mode)
- **Libraries**: geolib (geo), zod (validation), nanostores (state), date-fns (dates)

## Architecture

- Realtime-first UX via Convex subscriptions — prefer reactive queries over polling
- Request lifecycle: `open → accepted → completed` or `open → cancelled`
- Single helper per request (MVP constraint)
- Privacy: store exact lat/lng, expose rounded (~100m) to clients

## Code Style

- Start files with `// path/filename` one-line comment
- Comments describe _purpose_, not effect
- No `any` types — use strict TypeScript throughout

## Convex Rules

- **Always include `returns` validator** on every function (query, mutation, action, and their internal variants). Use `returns: v.null()` for void functions — omitting `returns` is not allowed.
- **Prefer `.withIndex()` over `.filter()`** — define indexes in the schema and query through them. Never use `.filter()` for fields that have an index.
- **Index naming**: include all fields in the name, e.g. `by_status_and_requesterId` for `["status", "requesterId"]`. Index fields must be queried in definition order.
- **Public vs internal**: use `query`/`mutation`/`action` only for client-facing API. Use `internalQuery`/`internalMutation`/`internalAction` for server-only logic.
- **Actions cannot access `ctx.db`** — read/write data by calling queries/mutations via `ctx.runQuery`/`ctx.runMutation`.
- **Minimize action→query/mutation calls** — each is a separate transaction; splitting logic creates race condition risk.
- **Same-file function calls**: when using `ctx.runQuery`/`ctx.runMutation` to call a function in the same file, add a type annotation on the return value (TypeScript circularity workaround).
- **Add `"use node";`** at the top of any Convex file using Node.js built-in modules.
- **File-based routing**: `convex/foo/bar.ts` export `f` → `api.foo.bar.f` (public) or `internal.foo.bar.f` (internal).
- **System fields** `_id` and `_creationTime` are auto-added — don't define them in the schema.
- **No `.delete()` on queries** — `.collect()` results first, then `ctx.db.delete(doc._id)` in a loop.
- Use `v.int64()` (not deprecated `v.bigint()`), `v.record()` for dynamic keys (no `v.map()`/`v.set()`).
- **Crons**: only use `crons.interval()` or `crons.cron()` — the helper methods (`crons.hourly`, etc.) don't exist.
- Convex functions in `convex/` directory, one file per domain (e.g., `requests.ts`, `users.ts`)

## Astro Rules

- **Partial hydration** — choose the right directive:
  - `client:load` — immediately needed interactivity
  - `client:idle` — non-critical, loads when browser is idle
  - `client:visible` — loads when component scrolls into view
  - Default: no directive (zero JS shipped)
- Minimize client-side JS — static generation by default, hydrate only interactive islands
- Use scoped `<style>` tags in `.astro` files; import global styles only in layouts
- Dynamic routes: `[...slug].astro` + `getStaticPaths()`
- Pages in `src/pages/`, components in `src/components/`, layouts in `src/layouts/`

## Tailwind Rules

- **Never use `@apply`** — use utility classes directly in markup
- Extend the design system in `tailwind.config.cjs`, don't override defaults

## Conventions

- Convex schema defined in `convex/schema.ts` using `defineSchema` / `defineTable`
- Validate all mutation inputs with Convex validators (`v.*`)
- Geo filtering: bounding box first, then distance sort via geolib

## Build & Test

```bash
npm install          # Install dependencies
npx astro dev        # Start Astro dev server
npx convex dev       # Start Convex dev backend
npx astro build      # Production build
```

## Commit Messages

Use conventional commits, lowercase, max 60 characters:

```
<type>[optional scope]: <description>
```

Provide the full `git commit -m '...'` command.
