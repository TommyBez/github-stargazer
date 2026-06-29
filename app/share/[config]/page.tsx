import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShareChartImage } from "@/components/share-chart-image"
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image"
import { decodeShareConfig } from "@/lib/share-config"
import { getRequestOrigin } from "@/lib/site-url"

export const runtime = "nodejs"

function getShareConfig(config: string): URLSearchParams {
  return decodeShareConfig(config)
}

function getSharePath(config: string): string {
  return `/share/${encodeURIComponent(config)}`
}

async function getShareMetadataBase(): Promise<URL> {
  return getRequestOrigin(await headers())
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
  const metadataBase = await getShareMetadataBase()
  const shareUrl = new URL(sharePath, metadataBase)
  const opengraphImageUrl = new URL(`${sharePath}/opengraph-image`, metadataBase)
  const twitterImageUrl = new URL(`${sharePath}/twitter-image`, metadataBase)

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: shareUrl,
      images: [
        {
          url: opengraphImageUrl,
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
          url: twitterImageUrl,
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
    <main className="m-0 flex min-h-dvh flex-col items-center justify-center gap-5 bg-background p-4">
      <ShareChartImage src={imgSrc} alt={alt} />
      <Button render={<Link href="/" />} nativeButton={false} variant="outline">
        Make your own
      </Button>
    </main>
  )
}
