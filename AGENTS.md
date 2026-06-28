# AGENTS

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, Turbopack, React 19) app — a GitHub repository
star-history chart generator. There is no backend service beyond Next.js route handlers
under `app/api/*`; star data is fetched live from the public GitHub REST API.

Standard commands live in `package.json` (`pnpm dev`, `pnpm build`, `pnpm start`,
`pnpm lint`). Use `pnpm` (there is a `pnpm-lock.yaml`).

Non-obvious notes:
- **`pnpm lint` is broken in the repo as-is**: the `lint` script runs `eslint .`, but
  `eslint` is not a dependency and there is no ESLint config. It fails with
  `eslint: not found`. This is a pre-existing repo gap, not an environment problem.
- **`GITHUB_TOKEN` is optional.** Without it, the `/api/stars` route uses the
  unauthenticated GitHub API, which works but has a low rate limit (~60 req/hr per IP).
  Set `GITHUB_TOKEN` to raise the limit if you hit 403/429 while testing. See
  `lib/github.ts`.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized:
  true`, so `pnpm build` will not fail on type errors and image optimization is disabled.
- The `sharp` and `msw` build scripts are intentionally not approved on install; they are
  not needed for dev/build (image optimization is disabled).
- Dev server runs on http://localhost:3000. The core flow: enter a repo like
  `vercel/next.js` and click "Generate chart" to render the star-history area chart.
