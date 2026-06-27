"use client"

import { useMemo, useState } from "react"
import { Star, Download, LoaderCircle, Link2, Check, ImageDown, FileDown, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ColorPicker } from "@/components/color-picker"
import {
  buildChartSvg,
  THEME_PRESETS,
  STYLE_PRESETS,
  SPACING_CONFIGS,
  DEFAULT_STYLE,
  type ThemeName,
  type ChartStyle,
  type CurveType,
  type GridStyle,
  type AreaFill,
} from "@/lib/chart-svg"
import type { RepoStarData } from "@/lib/github"

const PREVIEW_W = 1000
const PREVIEW_H = 500

const LINE_COLORS = [
  { name: "Star Gold", value: "#facc15" },
  { name: "Emerald", value: "#10b981" },
  { name: "Sky", value: "#38bdf8" },
  { name: "Rose", value: "#fb7185" },
  { name: "Orange", value: "#fb923c" },
  { name: "Slate", value: "#94a3b8" },
]

const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "midnight", label: "Midnight" },
]

const CURVE_OPTIONS: { value: CurveType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "smooth", label: "Smooth" },
  { value: "step", label: "Step" },
]

const GRID_OPTIONS: { value: GridStyle; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "full", label: "Full" },
  { value: "none", label: "None" },
]

const AREA_OPTIONS: { value: AreaFill; label: string }[] = [
  { value: "gradient", label: "Gradient" },
  { value: "solid", label: "Solid" },
]

export function StarsChartApp() {
  const [repoInput, setRepoInput] = useState("")
  const [activeRepo, setActiveRepo] = useState("")
  const [data, setData] = useState<RepoStarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Customization
  const [title, setTitle] = useState("")
  const [theme, setTheme] = useState<ThemeName>("dark")
  const [lineColor, setLineColor] = useState(LINE_COLORS[0].value)
  const [showArea, setShowArea] = useState(true)
  // Font + spacing are driven together by the Style menu.
  const [styleName, setStyleName] = useState(STYLE_PRESETS[0].name)
  // Everything else is individually selectable.
  const [style, setStyle] = useState<ChartStyle>(DEFAULT_STYLE)

  const [copied, setCopied] = useState(false)

  const namedStyle = useMemo(
    () => STYLE_PRESETS.find((p) => p.name === styleName) ?? STYLE_PRESETS[0],
    [styleName],
  )
  const spacing = SPACING_CONFIGS[namedStyle.spacing]
  const font = namedStyle.font

  const resolvedTitle = useMemo(() => {
    if (title.trim()) return title.trim()
    return data ? data.fullName : "Star History"
  }, [title, data])

  function updateStyle(patch: Partial<ChartStyle>) {
    setStyle((s) => ({ ...s, ...patch }))
  }

  const svg = useMemo(() => {
    if (!data) return ""
    return buildChartSvg(data.history, {
      title: resolvedTitle,
      lineColor,
      fillColor: lineColor,
      showArea,
      width: PREVIEW_W,
      height: PREVIEW_H,
      font,
      spacing,
      typography: namedStyle.typography,
      sketch: namedStyle.sketch,
      ...THEME_PRESETS[theme],
      ...style,
    })
  }, [data, resolvedTitle, lineColor, showArea, theme, style, font, spacing, namedStyle])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    const value = repoInput.trim()
    if (!value) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/stars?repo=${encodeURIComponent(value)}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.")
        setData(null)
      } else {
        setData(json as RepoStarData)
        setActiveRepo((json as RepoStarData).fullName)
      }
    } catch {
      setError("Network error. Please try again.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleDownloadSvg() {
    if (!svg || !data) return
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${data.name}-stars.svg`)
  }

  function handleDownloadPng() {
    if (!svg || !data) return
    const scale = 2
    const img = new Image()
    img.crossOrigin = "anonymous"
    const dataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = PREVIEW_W * scale
      canvas.height = PREVIEW_H * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, PREVIEW_W, PREVIEW_H)
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${data.name}-stars.png`)
      }, "image/png")
    }
    img.src = dataUri
  }

  const ogUrl = useMemo(() => {
    if (!activeRepo) return ""
    const params = new URLSearchParams({
      repo: activeRepo,
      theme,
      color: lineColor,
      curve: style.curve,
      lw: String(style.lineWidth),
      grid: style.grid,
      area: showArea ? style.areaFill : "none",
      glow: style.glow ? "1" : "0",
      font,
      spacing: namedStyle.spacing,
      style: namedStyle.name,
    })
    if (title.trim()) params.set("title", title.trim())
    return `/api/og?${params.toString()}`
  }, [activeRepo, theme, lineColor, title, style, showArea, font, namedStyle])

  async function handleCopyOg() {
    if (!ogUrl) return
    const absolute = `${window.location.origin}${ogUrl}`
    await navigator.clipboard.writeText(absolute)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Search */}
      <form onSubmit={handleGenerate} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Star className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="owner/repo  or  https://github.com/owner/repo"
            className="h-11 pl-9 font-mono text-sm"
            aria-label="GitHub repository"
          />
        </div>
        <Button type="submit" disabled={loading} className="h-11 px-6">
          {loading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Fetching
            </>
          ) : (
            "Generate chart"
          )}
        </Button>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {!data && !error && <EmptyState />}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Chart preview + downloads */}
          <div className="flex flex-col gap-4">
            <Card className="overflow-hidden p-0">
              <div
                className="w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
                // The SVG is generated by our own trusted builder.
                dangerouslySetInnerHTML={{ __html: svg }}
                aria-label={`Star history chart for ${data.fullName}`}
                role="img"
              />
            </Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleDownloadPng} variant="default">
                <ImageDown className="size-4" />
                Download PNG
              </Button>
              <Button onClick={handleDownloadSvg} variant="secondary">
                <FileDown className="size-4" />
                Download SVG
              </Button>
              <div className="ml-auto flex items-center gap-1.5 font-mono text-sm text-foreground">
                <Star className="size-4 fill-star text-star" />
                <span className="tabular-nums">{data.totalStars.toLocaleString()}</span>
                <span className="text-muted-foreground">stars</span>
              </div>
            </div>
          </div>

          {/* Customization panel */}
          <Card className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-heading text-sm font-semibold tracking-tight">Customize</h2>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                Controls
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chart-style">Style</Label>
              <Select value={styleName} onValueChange={setStyleName}>
                <SelectTrigger id="chart-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_PRESETS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{namedStyle.description}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chart-title">Title</Label>
              <Input
                id="chart-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={data.fullName}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chart-theme">Theme</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as ThemeName)}>
                <SelectTrigger id="chart-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Line color</Label>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  value={[lineColor]}
                  onValueChange={(groupValue) => {
                    const next = groupValue[0]
                    if (next) setLineColor(next)
                  }}
                  className="flex flex-wrap gap-2"
                >
                  {LINE_COLORS.map((c) => (
                    <ToggleGroupItem
                      key={c.value}
                      value={c.value}
                      aria-label={c.name}
                      className="size-7 rounded-full border-2 border-transparent p-0 transition-transform hover:scale-110 data-[pressed]:border-foreground data-[pressed]:bg-transparent"
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </ToggleGroup>
                <div className="mx-1 h-7 w-px bg-border" aria-hidden="true" />
                <ColorPicker
                  value={lineColor}
                  onChange={setLineColor}
                  aria-label="Custom line color"
                  className="rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chart-curve">Curve</Label>
              <Select value={style.curve} onValueChange={(v) => updateStyle({ curve: v as CurveType })}>
                <SelectTrigger id="chart-curve">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURVE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chart-lw">Line width</Label>
                <span className="text-xs text-muted-foreground">{style.lineWidth.toFixed(1)}px</span>
              </div>
              <Slider
                id="chart-lw"
                min={1}
                max={5}
                step={0.5}
                value={[style.lineWidth]}
                onValueChange={(v) => updateStyle({ lineWidth: v[0] })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chart-grid">Grid</Label>
              <Select value={style.grid} onValueChange={(v) => updateStyle({ grid: v as GridStyle })}>
                <SelectTrigger id="chart-grid">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRID_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="area-toggle">Show area fill</Label>
              <Switch id="area-toggle" checked={showArea} onCheckedChange={setShowArea} />
            </div>

            {showArea && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="chart-area">Area style</Label>
                <Select value={style.areaFill} onValueChange={(v) => updateStyle({ areaFill: v as AreaFill })}>
                  <SelectTrigger id="chart-area">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="glow-toggle">Glow effect</Label>
              <Switch id="glow-toggle" checked={style.glow} onCheckedChange={(v) => updateStyle({ glow: v })} />
            </div>

            {/* Social share */}
            <div className="flex flex-col gap-2 border-t border-border pt-5">
              <Label>Share on social</Label>
              <p className="text-xs text-muted-foreground">
                A 1200×630 image optimized for social posts.
              </p>
              <Button onClick={handleCopyOg} variant="outline" size="sm" className="justify-start">
                {copied ? <Check className="size-4 text-emerald-500" /> : <Link2 className="size-4" />}
                {copied ? "Copied to clipboard" : "Copy shareable image URL"}
              </Button>
              <a
                href={ogUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Open image in new tab
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center sm:p-16">
      <span className="flex size-12 items-center justify-center rounded-lg bg-star-soft">
        <Star className="size-5 fill-star text-star" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-lg font-semibold tracking-tight">
          Enter a repository to get started
        </p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Type any public GitHub repo above, like <span className="font-mono text-foreground">owner/repo</span>,
          then customize and share the chart.
        </p>
      </div>
    </Card>
  )
}
