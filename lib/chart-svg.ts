import type { StarPoint } from "./github"

export type CurveType = "smooth" | "linear" | "step"
export type GridStyle = "full" | "horizontal" | "none"
export type AreaFill = "gradient" | "solid"
export type FontFamily = "sans" | "mono" | "serif" | "geometric" | "display" | "grotesque"

/** Individually-selectable visual properties (everything except font + spacing). */
export interface ChartStyle {
  curve: CurveType
  lineWidth: number
  grid: GridStyle
  areaFill: AreaFill
  glow: boolean
}

export const DEFAULT_STYLE: ChartStyle = {
  curve: "linear",
  lineWidth: 2.5,
  grid: "horizontal",
  areaFill: "gradient",
  glow: false,
}

export const FONT_STACKS: Record<FontFamily, string> = {
  sans: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  serif: "ui-serif, Georgia, Cambria, Times New Roman, serif",
  geometric: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  display: "'Fraunces', ui-serif, Georgia, serif",
  grotesque: "'Archivo', ui-sans-serif, system-ui, sans-serif",
}

export interface ChartPad {
  top: number
  right: number
  bottom: number
  left: number
}

/** A spacing/density profile: plot padding plus type sizes. */
export interface SpacingConfig {
  pad: ChartPad
  titleSize: number
  badgeSize: number
  labelSize: number
}

export type SpacingName = "compact" | "cozy" | "comfortable" | "spacious"

export const SPACING_CONFIGS: Record<SpacingName, SpacingConfig> = {
  compact: { pad: { top: 52, right: 28, bottom: 44, left: 56 }, titleSize: 18, badgeSize: 16, labelSize: 11 },
  cozy: { pad: { top: 62, right: 32, bottom: 50, left: 64 }, titleSize: 20, badgeSize: 18, labelSize: 12 },
  comfortable: { pad: { top: 72, right: 36, bottom: 56, left: 72 }, titleSize: 22, badgeSize: 20, labelSize: 13 },
  spacious: { pad: { top: 96, right: 52, bottom: 76, left: 96 }, titleSize: 26, badgeSize: 22, labelSize: 15 },
}

/** Typographic treatment that gives each style a distinct visual signature. */
export interface Typography {
  titleWeight: number
  titleCase: "none" | "upper"
  titleTracking: number // letter-spacing in em
  labelCase: "none" | "upper"
  labelTracking: number
}

const TYPO_DEFAULT: Typography = {
  titleWeight: 700,
  titleCase: "none",
  titleTracking: 0,
  labelCase: "none",
  labelTracking: 0,
}

/** Predefined font + spacing + typography combinations from the Style menu. */
export interface NamedStyle {
  name: string
  font: FontFamily
  spacing: SpacingName
  typography: Typography
}

export const STYLE_PRESETS: NamedStyle[] = [
  // Clean, balanced baseline.
  { name: "Modern", font: "sans", spacing: "comfortable", typography: { ...TYPO_DEFAULT } },
  // Dense data-viz: heavy title, tight tracking.
  {
    name: "Compact",
    font: "sans",
    spacing: "compact",
    typography: { titleWeight: 800, titleCase: "none", titleTracking: -0.02, labelCase: "none", labelTracking: 0 },
  },
  // Light & airy: thin title, wide tracking, uppercase labels.
  {
    name: "Airy",
    font: "sans",
    spacing: "spacious",
    typography: { titleWeight: 400, titleCase: "none", titleTracking: 0.08, labelCase: "upper", labelTracking: 0.12 },
  },
  // Elegant serif, understated.
  {
    name: "Editorial",
    font: "serif",
    spacing: "spacious",
    typography: { titleWeight: 400, titleCase: "none", titleTracking: 0, labelCase: "none", labelTracking: 0 },
  },
  // Magazine masthead: bold uppercase serif title.
  {
    name: "Magazine",
    font: "serif",
    spacing: "comfortable",
    typography: { titleWeight: 700, titleCase: "upper", titleTracking: 0.04, labelCase: "upper", labelTracking: 0.08 },
  },
  // Terminal: monospace, uppercase tracked labels.
  {
    name: "Terminal",
    font: "mono",
    spacing: "compact",
    typography: { titleWeight: 700, titleCase: "upper", titleTracking: 0.05, labelCase: "upper", labelTracking: 0.05 },
  },
  // Geometric sans, slightly bold.
  {
    name: "Geometric",
    font: "geometric",
    spacing: "comfortable",
    typography: { titleWeight: 700, titleCase: "none", titleTracking: 0.01, labelCase: "upper", labelTracking: 0.06 },
  },
  // Big display serif.
  {
    name: "Display",
    font: "display",
    spacing: "spacious",
    typography: { titleWeight: 600, titleCase: "none", titleTracking: -0.01, labelCase: "none", labelTracking: 0 },
  },
  // Bold grotesque headline: heavy uppercase, tight.
  {
    name: "Grotesque",
    font: "grotesque",
    spacing: "cozy",
    typography: { titleWeight: 800, titleCase: "upper", titleTracking: -0.01, labelCase: "none", labelTracking: 0 },
  },
]

export interface ChartOptions extends ChartStyle {
  title: string
  lineColor: string
  fillColor: string
  bgColor: string
  textColor: string
  gridColor: string
  showArea: boolean
  width: number
  height: number
  font: FontFamily
  spacing: SpacingConfig
  typography: Typography
}

export const THEME_PRESETS = {
  light: { bgColor: "#ffffff", textColor: "#1f2328", gridColor: "#e6e8eb" },
  dark: { bgColor: "#0d1117", textColor: "#e6edf3", gridColor: "#21262d" },
  midnight: { bgColor: "#0b1020", textColor: "#cdd6f4", gridColor: "#1e2333" },
} as const

export type ThemeName = keyof typeof THEME_PRESETS

export interface ChartGeometry {
  width: number
  height: number
  plotLeft: number
  plotRight: number
  plotTop: number
  plotBottom: number
  linePath: string
  areaPath: string
  gridLines: { y: number }[]
  yLabels: { y: number; text: string }[]
  xLabels: { x: number; text: string }[]
  lastStars: number
}

interface Pt {
  x: number
  y: number
}

/** Build the stroke path for a series of points using the chosen curve style. */
function buildLinePath(pts: Pt[], curve: CurveType): string {
  if (pts.length === 0) return ""
  if (pts.length === 1) return `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`

  if (curve === "step") {
    let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
    for (let i = 1; i < pts.length; i++) {
      d += ` L${pts[i].x.toFixed(2)},${pts[i - 1].y.toFixed(2)} L${pts[i].x.toFixed(2)},${pts[i].y.toFixed(2)}`
    }
    return d
  }

  if (curve === "smooth") {
    let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] ?? p2
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
    }
    return d
  }

  // linear
  return pts.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ")
}

/**
 * Compute the pure geometry (paths, grid + tick positions, formatted labels)
 * for a star-history chart. Shared by the SVG download builder and the OG image
 * route so both stay visually identical, while letting the OG route render text
 * with a real embedded font instead of relying on the rasterizer's font set.
 */
export function computeChartGeometry(
  points: StarPoint[],
  width: number,
  height: number,
  curve: CurveType = "linear",
  pad: ChartPad = SPACING_CONFIGS.comfortable.pad,
): ChartGeometry {
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const plotBottom = pad.top + plotH

  const xs = points.map((p) => new Date(p.date).getTime())
  const minX = points.length ? Math.min(...xs) : 0
  const maxX = points.length ? Math.max(...xs) : 1
  const maxY = points.length ? Math.max(...points.map((p) => p.stars)) : 1
  const rangeX = maxX - minX || 1

  const sx = (t: number) => pad.left + ((t - minX) / rangeX) * plotW
  const sy = (v: number) => pad.top + plotH - (v / maxY) * plotH

  const coords = points.map((p) => ({ x: sx(new Date(p.date).getTime()), y: sy(p.stars) }))

  const linePath = buildLinePath(coords, curve)

  const areaPath = coords.length
    ? `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${plotBottom.toFixed(2)} L${coords[0].x.toFixed(2)},${plotBottom.toFixed(2)} Z`
    : ""

  const yTicks = 5
  const gridLines: { y: number }[] = []
  const yLabels: { y: number; text: string }[] = []
  for (let i = 0; i <= yTicks; i++) {
    const value = (maxY / yTicks) * i
    const y = sy(value)
    gridLines.push({ y })
    yLabels.push({ y, text: formatNumber(Math.round(value)) })
  }

  const xTickIdx = points.length ? [0, Math.floor(points.length / 2), points.length - 1] : []
  const xLabels = xTickIdx.map((idx) => ({
    x: coords[idx].x,
    text: formatDate(points[idx].date),
  }))

  return {
    width,
    height,
    plotLeft: pad.left,
    plotRight: pad.left + plotW,
    plotTop: pad.top,
    plotBottom,
    linePath,
    areaPath,
    gridLines,
    yLabels,
    xLabels,
    lastStars: points.length ? points[points.length - 1].stars : 0,
  }
}

export { formatNumber }

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
  const {
    title,
    lineColor,
    fillColor,
    bgColor,
    textColor,
    gridColor,
    showArea,
    width,
    height,
    curve,
    lineWidth,
    grid,
    areaFill,
    glow,
    font,
    spacing,
    typography,
  } = options

  const fontStack = FONT_STACKS[font]
  const { pad, titleSize, badgeSize, labelSize } = spacing
  const titleBaseline = Math.round(pad.top * 0.55)

  const titleText = typography.titleCase === "upper" ? title.toUpperCase() : title
  const titleTrack = (typography.titleTracking * titleSize).toFixed(2)
  const labelTrack = (typography.labelTracking * labelSize).toFixed(2)
  const applyLabelCase = (s: string) => (typography.labelCase === "upper" ? s.toUpperCase() : s)
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const plotBottom = pad.top + plotH

  if (points.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${bgColor}"/><text x="${width / 2}" y="${height / 2}" fill="${textColor}" font-family="${fontStack}" font-size="20" text-anchor="middle">No star data</text></svg>`
  }

  const xs = points.map((p) => new Date(p.date).getTime())
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...points.map((p) => p.stars))
  const rangeX = maxX - minX || 1

  const sx = (t: number) => pad.left + ((t - minX) / rangeX) * plotW
  const sy = (v: number) => pad.top + plotH - (v / maxY) * plotH

  const coords = points.map((p) => ({
    x: sx(new Date(p.date).getTime()),
    y: sy(p.stars),
  }))

  const linePath = buildLinePath(coords, curve)
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${plotBottom.toFixed(
    2,
  )} L${coords[0].x.toFixed(2)},${plotBottom.toFixed(2)} Z`

  // Y grid lines + labels (5 ticks)
  const yTicks = 5
  let gridLines = ""
  let yLabels = ""
  for (let i = 0; i <= yTicks; i++) {
    const value = (maxY / yTicks) * i
    const y = sy(value)
    if (grid !== "none") {
      gridLines += `<line x1="${pad.left}" y1="${y.toFixed(2)}" x2="${(pad.left + plotW).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${gridColor}" stroke-width="1"/>`
    }
    yLabels += `<text x="${pad.left - 12}" y="${(y + 4).toFixed(2)}" fill="${textColor}" font-family="${fontStack}" font-size="${labelSize}" letter-spacing="${labelTrack}" text-anchor="end" opacity="0.7">${escapeXml(applyLabelCase(formatNumber(Math.round(value))))}</text>`
  }

  // X axis labels (start, middle, end) + optional vertical grid lines
  const xTickIdx = [0, Math.floor(points.length / 2), points.length - 1]
  let xLabels = ""
  for (const idx of xTickIdx) {
    const c = coords[idx]
    if (grid === "full") {
      gridLines += `<line x1="${c.x.toFixed(2)}" y1="${pad.top}" x2="${c.x.toFixed(2)}" y2="${plotBottom.toFixed(2)}" stroke="${gridColor}" stroke-width="1"/>`
    }
    xLabels += `<text x="${c.x.toFixed(2)}" y="${(plotBottom + Math.round(labelSize * 1.6)).toFixed(2)}" fill="${textColor}" font-family="${fontStack}" font-size="${labelSize}" letter-spacing="${labelTrack}" text-anchor="middle" opacity="0.7">${escapeXml(applyLabelCase(formatDate(points[idx].date)))}</text>`
  }

  const lastStars = points[points.length - 1].stars
  const gradId = "starGrad"
  const glowId = "starGlow"

  const areaMarkup = showArea
    ? areaFill === "solid"
      ? `<path d="${areaPath}" fill="${fillColor}" fill-opacity="0.14"/>`
      : `<path d="${areaPath}" fill="url(#${gradId})"/>`
    : ""

  const lineMarkup = glow
    ? `<path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round" stroke-linecap="round" filter="url(#${glowId})" opacity="0.9"/>
  <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round" stroke-linecap="round"/>`
    : `<path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round" stroke-linecap="round"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${fillColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${fillColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${(lineWidth * 1.6).toFixed(1)}"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <text x="${pad.left}" y="${titleBaseline}" fill="${textColor}" font-family="${fontStack}" font-size="${titleSize}" font-weight="${typography.titleWeight}" letter-spacing="${titleTrack}">${escapeXml(titleText)}</text>
  <text x="${(width - pad.right).toFixed(2)}" y="${titleBaseline}" fill="${lineColor}" font-family="${fontStack}" font-size="${badgeSize}" font-weight="700" text-anchor="end">★ ${formatNumber(lastStars)}</text>
  ${gridLines}
  ${areaMarkup}
  ${lineMarkup}
  ${yLabels}
  ${xLabels}
</svg>`
}
