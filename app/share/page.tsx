import type { Metadata } from "next"
import { Star } from "lucide-react"

export const runtime = "nodejs"

/** Build the OG image URL from the same query params the /api/og route reads. */
function buildOgImageUrl(base: string, params: URLSearchParams): string {
  return `${base}/api/og?${params.toString()}`
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const sp = await searchParams
  const params = new URLSearchParams()

  // Pass through every param the OG route understands.
  for (const key of [
    "repo",
    "theme",
    "color",
    "curve",
    "lw",
    "grid",
    "area",
    "glow",
    "font",
    "spacing",
    "style",
    "title",
  ]) {
    const val = sp[key]
    if (typeof val === "string" && val) params.set(key, val)
  }

  const repo = (sp.repo as string) || "GitHub"
  const base = "https://github-stargazer.vercel.app"
  const imageUrl = buildOgImageUrl(base, params)

  const title = `Star history — ${repo}`
  const description = `Check out the star history for ${repo} on GitHub Star Charts.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "GitHub Star Charts",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Star history chart for ${repo}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const repo = (sp.repo as string) || "GitHub"

  // Reconstruct the OG image URL for display on the page.
  const params = new URLSearchParams()
  for (const key of [
    "repo",
    "theme",
    "color",
    "curve",
    "lw",
    "grid",
    "area",
    "glow",
    "font",
    "spacing",
    "style",
    "title",
  ]) {
    const val = sp[key]
    if (typeof val === "string" && val) params.set(key, val)
  }

  const ogImage = `/api/og?${params.toString()}`

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-8 px-4 py-16 sm:px-6">
      <div className="flex items-center gap-2">
        <Star className="size-5 fill-star text-star" />
        <span className="font-heading text-lg font-semibold tracking-tight">GitHub Star Charts</span>
      </div>

      <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance text-center sm:text-3xl">
        Star history — <span className="font-mono">{repo}</span>
      </h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ogImage}
        alt={`Star history chart for ${repo}`}
        width={1200}
        height={630}
        className="w-full rounded-lg border border-border shadow-sm"
      />

      <a
        href="/"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Star className="size-4" />
        Create your own chart
      </a>
    </main>
  )
}
