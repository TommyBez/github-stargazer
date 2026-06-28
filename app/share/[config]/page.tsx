import type { Metadata } from "next"
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image"
import { decodeShareConfig } from "@/lib/share-config"

export const runtime = "nodejs"

function getShareConfig(config: string): URLSearchParams {
  return decodeShareConfig(config)
}

function getSharePath(config: string): string {
  return `/share/${encodeURIComponent(config)}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ config: string }>
}): Promise<Metadata> {
  const { config } = await params
  const search = getShareConfig(config)
  const repo = search.get("repo") ?? ""
  const title = repo ? `Star history — ${repo}` : "GitHub Star Charts"
  const description = repo
    ? `Star history for ${repo} on GitHub.`
    : "Star history charts for any public GitHub repository."
  const sharePath = getSharePath(config)
  const imageAlt = repo ? `Star history chart for ${repo}` : "GitHub star history chart"

  return {
    title,
    description,
    alternates: {
      canonical: sharePath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: sharePath,
      images: [
        {
          url: `${sharePath}/opengraph-image`,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          alt: imageAlt,
          type: OG_CONTENT_TYPE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: `${sharePath}/twitter-image`,
          alt: imageAlt,
        },
      ],
    },
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ config: string }>
}) {
  const { config } = await params
  const search = getShareConfig(config)
  const repo = search.get("repo") ?? ""
  const imgSrc = `${getSharePath(config)}/opengraph-image`
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
