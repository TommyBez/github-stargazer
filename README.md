<p align="center">
  <img src="https://shieldcn.dev/header/gradient.svg?title=Stargazer&subtitle=Beautiful%20GitHub%20star-history%20charts&logo=github&theme=zinc" alt="Stargazer" />
</p>

<p align="center">
  <a href="https://github-stargazer.vercel.app"><img src="https://shieldcn.dev/badge/demo-live-brightgreen.svg?variant=secondary" alt="Live demo" /></a>
  <a href="https://github.com/TommyBez/github-stargazer/stargazers"><img src="https://shieldcn.dev/github/stars/TommyBez/github-stargazer.svg?variant=secondary" alt="GitHub stars" /></a>
  <a href="https://github.com/TommyBez/github-stargazer/network/members"><img src="https://shieldcn.dev/github/forks/TommyBez/github-stargazer.svg?variant=secondary" alt="GitHub forks" /></a>
  <a href="https://github.com/TommyBez/github-stargazer/commits/main"><img src="https://shieldcn.dev/github/last-commit/TommyBez/github-stargazer.svg?variant=secondary" alt="Last commit" /></a>
  <a href="https://github.com/TommyBez/github-stargazer/graphs/contributors"><img src="https://shieldcn.dev/github/contributors/TommyBez/github-stargazer.svg?variant=secondary" alt="Contributors" /></a>
</p>

Generate beautiful, shareable star-history charts for any public GitHub repository.

Paste a repo, customize the look, and download a chart image built for social posts — or copy a share link with Open Graph / Twitter card previews.

## Features

- **Live GitHub data** — star history is fetched from the GitHub REST API at request time
- **Rich customization** — themes (dark, light, midnight), line colors, curve type, grid style, area fill, glow, typography presets, and more
- **Export** — download charts as PNG or SVG
- **Shareable links** — copy a URL that encodes your chart config; shared pages render OG and Twitter preview images automatically
- **No account required** — works with public repositories out of the box

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)

### Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), enter a repository (`owner/repo` or a full GitHub URL), and click **Generate chart**.

### Build for production

```bash
pnpm build
pnpm start
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | No | GitHub personal access token. Without it, the app uses the unauthenticated API (~60 requests/hour per IP). Set it to raise the rate limit. |

Create a `.env.local` file in the project root:

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

## How it works

1. The browser calls `GET /api/stars?repo=owner/name`.
2. The route handler in `app/api/stars/route.ts` parses the repo, fetches stargazer timestamps from GitHub, and returns cumulative star history as JSON.
3. The client renders an SVG chart via `lib/chart-svg.ts` and supports PNG export from that SVG.
4. Share URLs use `/share/[config]` where `config` is a base64url-encoded query string of chart settings. Next.js `opengraph-image` and `twitter-image` routes generate social preview images from the same config.

## Project structure

```
app/
  api/stars/          # GitHub star history API
  api/og/             # OG image generation
  share/[config]/     # Shareable chart pages + social images
  page.tsx            # Main app
components/
  stars-chart-app.tsx # Chart workbench UI
lib/
  github.ts           # GitHub API client
  chart-svg.ts        # SVG chart renderer
  share-config.ts     # Share URL encoding/decoding
  site-url.ts         # Metadata base URL helpers
```

## Tech stack

<p align="center">
  <a href="https://nextjs.org/"><img src="https://shieldcn.dev/npm/next.svg?variant=branded" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://shieldcn.dev/npm/react.svg?variant=branded" alt="React" /></a>
  <a href="https://tailwindcss.com/"><img src="https://shieldcn.dev/npm/tailwindcss.svg?variant=branded" alt="Tailwind CSS" /></a>
  <a href="https://ui.shadcn.com/"><img src="https://shieldcn.dev/badge/shadcn/ui-black.svg?variant=branded&logo=shadcnui" alt="shadcn/ui" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://shieldcn.dev/npm/typescript.svg?variant=branded" alt="TypeScript" /></a>
  <a href="https://vercel.com/"><img src="https://shieldcn.dev/badge/vercel-deployed-black.svg?variant=branded&logo=vercel" alt="Vercel" /></a>
</p>

Custom SVG chart renderer (`lib/chart-svg.ts`).

## Deployment

The app is designed for [Vercel](https://vercel.com/). Set `GITHUB_TOKEN` in the project environment variables for production rate limits. Site URLs for metadata and share pages are derived automatically from Vercel system variables (`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`).

## License

Not specified in this repository.

<p align="center">
  <a href="https://github.com/TommyBez/github-stargazer">
    <img src="https://shieldcn.dev/chart/github/stars/TommyBez/github-stargazer.svg" alt="Star history" />
  </a>
</p>
