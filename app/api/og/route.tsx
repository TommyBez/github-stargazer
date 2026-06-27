import { ImageResponse } from "next/og"
import { getStarHistory, parseRepo } from "@/lib/github"
import { computeChartGeometry, formatNumber, THEME_PRESETS, type ThemeName } from "@/lib/chart-svg"

export const runtime = "nodejs"

const OG_W = 1200
const OG_H = 630

// Characters that may appear in the OG image. Used to subset the embedded font.
const FONT_TEXT =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,-—/:_kStarHistoryNotFound"

async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(url)).text()
    const resource = css.match(/src: url\((.+?)\) format\(/)
    if (!resource) return null
    const res = await fetch(resource[1])
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

/** Build an SVG containing only vector shapes (no text). resvg renders these
 * without needing any fonts, so they stay crisp inside the OG image. */
function buildShapesSvg(
  geo: ReturnType<typeof computeChartGeometry>,
  opts: {
    bgColor: string
    gridColor: string
    lineColor: string
    fillColor: string
    area: "gradient" | "solid" | "none"
    grid: "full" | "horizontal" | "none"
    lineWidth: number
    glow: boolean
  },
): string {
  const { bgColor, gridColor, lineColor, fillColor, area, grid, lineWidth, glow } = opts

  let gridLines = ""
  if (grid !== "none") {
    gridLines += geo.gridLines
      .map(
        (g) =>
          `<line x1="${geo.plotLeft}" y1="${g.y.toFixed(2)}" x2="${geo.plotRight.toFixed(2)}" y2="${g.y.toFixed(2)}" stroke="${gridColor}" stroke-width="1"/>`,
      )
      .join("")
  }
  if (grid === "full") {
    gridLines += geo.xLabels
      .map(
        (l) =>
          `<line x1="${l.x.toFixed(2)}" y1="${geo.plotTop}" x2="${l.x.toFixed(2)}" y2="${geo.plotBottom.toFixed(2)}" stroke="${gridColor}" stroke-width="1"/>`,
      )
      .join("")
  }

  const areaMarkup =
    area === "none" || !geo.areaPath
      ? ""
      : area === "solid"
        ? `<path d="${geo.areaPath}" fill="${fillColor}" fill-opacity="0.14"/>`
        : `<path d="${geo.areaPath}" fill="url(#starGrad)"/>`

  const lineMarkup = glow
    ? `<path d="${geo.linePath}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round" stroke-linecap="round" filter="url(#starGlow)" opacity="0.9"/>
  <path d="${geo.linePath}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round" stroke-linecap="round"/>`
    : `<path d="${geo.linePath}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round" stroke-linecap="round"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${geo.width}" height="${geo.height}" viewBox="0 0 ${geo.width} ${geo.height}">
  <defs>
    <linearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${fillColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${fillColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${(lineWidth * 1.6).toFixed(1)}"/>
    </filter>
  </defs>
  <rect width="${geo.width}" height="${geo.height}" fill="${bgColor}"/>
  ${gridLines}
  ${areaMarkup}
  ${lineMarkup}
</svg>`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repoParam = searchParams.get("repo") ?? ""
  const theme = (searchParams.get("theme") as ThemeName) ?? "dark"
  const lineColor = searchParams.get("color") ?? "#facc15"
  const title = searchParams.get("title") ?? undefined

  // Style params (mirrors ChartStyle in the app).
  const curve = (searchParams.get("curve") as "smooth" | "linear" | "step") ?? "linear"
  const lineWidth = Number(searchParams.get("lw") ?? "2.5") || 2.5
  const grid = (searchParams.get("grid") as "full" | "horizontal" | "none") ?? "horizontal"
  const area = (searchParams.get("area") as "gradient" | "solid" | "none") ?? "gradient"
  const glow = searchParams.get("glow") === "1"
  const fontKey = (searchParams.get("font") as "sans" | "mono" | "serif") ?? "sans"

  const parsed = parseRepo(repoParam)
  const preset = THEME_PRESETS[theme] ?? THEME_PRESETS.dark

  const FONT_FAMILY: Record<"sans" | "mono" | "serif", string> = {
    sans: "Inter",
    mono: "JetBrains Mono",
    serif: "Source Serif 4",
  }
  const fontName = FONT_FAMILY[fontKey]

  const [regular, bold] = await Promise.all([
    loadGoogleFont(fontName, 400, FONT_TEXT),
    loadGoogleFont(fontName, 700, FONT_TEXT),
  ])
  const fonts = [
    ...(regular ? [{ name: fontName, data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: fontName, data: bold, weight: 700 as const, style: "normal" as const }] : []),
  ]

  let fallbackMessage = "Repository not found"
  try {
    if (!parsed) throw new Error("invalid repo")
    const data = await getStarHistory(parsed.owner, parsed.name)
    const geo = computeChartGeometry(data.history, OG_W, OG_H, curve)
    const heading = title ?? data.fullName

    const shapesSvg = buildShapesSvg(geo, {
      bgColor: preset.bgColor,
      gridColor: preset.gridColor,
      lineColor,
      fillColor: lineColor,
      area,
      grid,
      lineWidth,
      glow,
    })
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(shapesSvg).toString("base64")}`

    return new ImageResponse(
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          fontFamily: fontName,
          color: preset.textColor,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={OG_W} height={OG_H} alt="" style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Title */}
        <div style={{ position: "absolute", top: 22, left: 72, display: "flex", fontSize: 26, fontWeight: 700 }}>
          {heading}
        </div>

        {/* Star count badge */}
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 22,
            fontWeight: 700,
            color: lineColor,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={lineColor}>
            <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.8z" />
          </svg>
          <div style={{ display: "flex" }}>{formatNumber(geo.lastStars)}</div>
        </div>

        {/* Y axis labels */}
        {geo.yLabels.map((l, i) => (
          <div
            key={`y-${i}`}
            style={{
              position: "absolute",
              top: l.y - 11,
              left: 0,
              width: geo.plotLeft - 16,
              display: "flex",
              justifyContent: "flex-end",
              fontSize: 15,
              opacity: 0.7,
            }}
          >
            {l.text}
          </div>
        ))}

        {/* X axis labels */}
        {geo.xLabels.map((l, i) => (
          <div
            key={`x-${i}`}
            style={{
              position: "absolute",
              top: geo.plotBottom + 14,
              left: l.x - 70,
              width: 140,
              display: "flex",
              justifyContent: "center",
              fontSize: 15,
              opacity: 0.7,
            }}
          >
            {l.text}
          </div>
        ))}
      </div>,
      { width: OG_W, height: OG_H, fonts: fonts.length ? fonts : undefined },
    )
  } catch (err) {
    if (err instanceof Error && err.message && err.message !== "invalid repo") {
      fallbackMessage = err.message
    }
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: preset.bgColor,
          color: preset.textColor,
          fontFamily: fontName,
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex" }}>Star History</div>
        <div style={{ display: "flex", fontSize: 24, opacity: 0.7, marginTop: 12, maxWidth: 900, textAlign: "center" }}>
          {fallbackMessage}
        </div>
      </div>,
      { width: OG_W, height: OG_H, fonts: fonts.length ? fonts : undefined },
    )
  }
}
