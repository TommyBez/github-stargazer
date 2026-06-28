import { renderOgImage } from "@/lib/og-image"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return renderOgImage(searchParams)
}
