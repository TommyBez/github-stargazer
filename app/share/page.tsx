import type { Metadata } from "next"

export const runtime = "nodejs"

type SearchParams = Record<string, string | string[] | undefined>

const OG_PARAM_KEYS = [
  "repo",
  "theme",
  "color",
  "title",
  "curve",
  "lw",
  "grid",
  "area",
  "glow",
  "font",
  "spacing",
  "style",
] as const

function buildOgPath(searchParams: SearchParams): string {
  const params = new URLSearchParams()
  for (const key of OG_PARAM_KEYS) {
    const value = searchParams[key]
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value)
    }
  }
  return `/api/og?${params.toString()}`
}

function getRepo(searchParams: SearchParams): string {
  const repo = searchParams.repo
  return typeof repo === "string" && repo.length > 0 ? repo : ""
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const resolved = await searchParams
  const repo = getRepo(resolved)
  const ogPath = buildOgPath(resolved)
  const title = repo ? `Star history — ${repo}` : "GitHub Star Charts"
  const description = repo
    ? `Star history for ${repo} on GitHub.`
    : "Star history charts for any public GitHub repository."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogPath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogPath],
    },
  }
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolved = await searchParams
  const repo = getRepo(resolved)
  const ogPath = buildOgPath(resolved)
  const alt = repo ? `Star history chart for ${repo}` : "Star history chart"

  return (
    <main
      style={{
        margin: 0,
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ogPath}
        alt={alt}
        width={1200}
        height={630}
        style={{ width: "100%", height: "auto", maxWidth: 1200, display: "block" }}
      />
    </main>
  )
}
