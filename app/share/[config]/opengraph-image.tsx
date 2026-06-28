import { decodeShareConfig } from "@/lib/share-config"
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"

export const runtime = "nodejs"

export const alt = "GitHub star history chart"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// The `opengraph-image` file convention only receives `params` (the dynamic
// route segments), never `searchParams` — so the chart configuration is read
// from the `[config]` segment and rendered with Satori.
export default async function Image({ params }: { params: Promise<{ config: string }> }) {
  const { config } = await params
  return renderOgImage(decodeShareConfig(config))
}
