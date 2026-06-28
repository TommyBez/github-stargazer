import { decodeShareConfig } from "@/lib/share-config"
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"

export const runtime = "nodejs"

export const alt = "GitHub star history chart"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// Twitter/X reads `twitter:image` specifically. Same renderer as the Open
// Graph image so the preview is identical across platforms.
export default async function Image({ params }: { params: Promise<{ config: string }> }) {
  const { config } = await params
  return renderOgImage(decodeShareConfig(config))
}
