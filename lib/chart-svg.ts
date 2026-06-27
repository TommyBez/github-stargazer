import type { StarPoint } from "./github"

export interface ChartOptions {
  title: string
  lineColor: string
  fillColor: string
  bgColor: string
  textColor: string
  gridColor: string
  showArea: boolean
  width: number
  height: number
}

export const THEME_PRESETS = {
  light: { bgColor: "#ffffff", textColor: "#1f2328", gridColor: "#e6e8eb" },
  dark: { bgColor: "#0d1117", textColor: "#e6edf3", gridColor: "#21262d" },
  midnight: { bgColor: "#0b1020", textColor: "#cdd6f4", gridColor: "#1e2333" },
} as const

export type ThemeName = keyof typeof THEME_PRESETS

const PAD = { top: 72, right: 36, bottom: 56, left: 72 }

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return `${n}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

/** Build a fully self-contained SVG string for the star history chart. */
export function buildChartSvg(points: StarPoint[], options: ChartOptions): string {
  const { title, lineColor, fillColor, bgColor, textColor, gridColor, showArea, width, height } =
    options

  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom

  if (points.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${bgColor}"/><text x="${width / 2}" y="${height / 2}" fill="${textColor}" font-family="sans-serif" font-size="20" text-anchor="middle">No star data</text></svg>`
  }

  const xs = points.map((p) => new Date(p.date).getTime())
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...points.map((p) => p.stars))
  const rangeX = maxX - minX || 1

  const sx = (t: number) => PAD.left + ((t - minX) / rangeX) * plotW
  const sy = (v: number) => PAD.top + plotH - (v / maxY) * plotH

  const coords = points.map((p) => ({
    x: sx(new Date(p.date).getTime()),
    y: sy(p.stars),
  }))

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ")

  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${(PAD.top + plotH).toFixed(
    2,
  )} L${coords[0].x.toFixed(2)},${(PAD.top + plotH).toFixed(2)} Z`

  // Y grid lines + labels (5 ticks)
  const yTicks = 5
  let gridLines = ""
  let yLabels = ""
  for (let i = 0; i <= yTicks; i++) {
    const value = (maxY / yTicks) * i
    const y = sy(value)
    gridLines += `<line x1="${PAD.left}" y1="${y.toFixed(2)}" x2="${(PAD.left + plotW).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${gridColor}" stroke-width="1"/>`
    yLabels += `<text x="${PAD.left - 12}" y="${(y + 4).toFixed(2)}" fill="${textColor}" font-family="sans-serif" font-size="13" text-anchor="end" opacity="0.7">${formatNumber(Math.round(value))}</text>`
  }

  // X axis labels (start, middle, end)
  const xTickIdx = [0, Math.floor(points.length / 2), points.length - 1]
  let xLabels = ""
  for (const idx of xTickIdx) {
    const c = coords[idx]
    xLabels += `<text x="${c.x.toFixed(2)}" y="${(PAD.top + plotH + 28).toFixed(2)}" fill="${textColor}" font-family="sans-serif" font-size="13" text-anchor="middle" opacity="0.7">${escapeXml(formatDate(points[idx].date))}</text>`
  }

  const lastStars = points[points.length - 1].stars
  const gradId = "starGrad"

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${fillColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${fillColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <text x="${PAD.left}" y="38" fill="${textColor}" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(title)}</text>
  <text x="${(width - PAD.right).toFixed(2)}" y="38" fill="${lineColor}" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="end">★ ${formatNumber(lastStars)}</text>
  ${gridLines}
  ${showArea ? `<path d="${areaPath}" fill="url(#${gradId})"/>` : ""}
  <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  ${yLabels}
  ${xLabels}
  <text x="${(width - PAD.right).toFixed(2)}" y="${(height - 16).toFixed(2)}" fill="${textColor}" font-family="sans-serif" font-size="12" text-anchor="end" opacity="0.5">star-history chart</text>
</svg>`
}
