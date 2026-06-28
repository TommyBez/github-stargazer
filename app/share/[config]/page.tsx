import type { Metadata } from "next"
import { headers } from "next/headers"
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image"
import { decodeShareConfig } from "@/lib/share-config"

export const runtime = "nodejs"

function getShareConfig(config: string): URLSearchParams {
  return decodeShareConfig(config)
}

function getSharePath(config: string): string {
  return `/share/${encodeURIComponent(config)}`
}

function getConfiguredMetadataBase(): URL {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL

  if (!configuredUrl) {
    return new URL("https://github-stargazers.vercel.app")
  }

  const url =
    configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")
      ? configuredUrl
      : `https://${configuredUrl}`

  return new URL(url)
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null
}

function getOriginFromHeaders(requestHeaders: Headers): URL | null {
  const host = firstHeaderValue(requestHeaders.get("x-forwarded-host")) ?? firstHeaderValue(requestHeaders.get("host"))
  if (!host) return null

  const protocol =
    firstHeaderValue(requestHeaders.get("x-forwarded-proto")) ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : null)
  if (!protocol) return null

  try {
    return new URL(`${protocol}://${host}`)
  } catch {
    return null
  }
}

async function getShareMetadataBase(): Promise<URL> {
  return getOriginFromHeaders(await headers()) ?? getConfiguredMetadataBase()
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
