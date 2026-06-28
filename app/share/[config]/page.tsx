import type { Metadata } from "next"
import { decodeShareConfig } from "@/lib/share-config"

export const runtime = "nodejs"

function getRepo(config: string): string {
  return decodeShareConfig(config).get("repo") ?? ""
}

// og:image / twitter:image meta tags are injected automatically by the
// colocated `opengraph-image.tsx` and `twitter-image.tsx` files. Here we only
// set the title and description shown alongside the preview card.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ config: string }>
}): Promise<Metadata> {
  const { config } = await params
  const repo = getRepo(config)
  const title = repo ? `Star history — ${repo}` : "GitHub Star Charts"
  const description = repo
    ? `Star history for ${repo} on GitHub.`
    : "Star history charts for any public GitHub repository."
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ config: string }>
}) {
  const { config } = await params
  const search = decodeShareConfig(config)
  const repo = search.get("repo") ?? ""
  const imgSrc = `/api/og?${search.toString()}`
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
        padding: 16,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        width={1200}
        height={630}
        style={{ width: "100%", height: "auto", maxWidth: 1200, display: "block", borderRadius: 12 }}
      />
    </main>
  )
}
