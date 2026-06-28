"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { Star, Download, LoaderCircle, Link2, Check, ImageDown, FileDown, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ColorPicker } from "@/components/color-picker"
import { encodeShareConfig } from "@/lib/share-config"
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
const CLIPBOARD_API_TIMEOUT_MS = 700
const COPY_FEEDBACK_MS = 4000

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
  const [styleState, setStyleState] = useState<ChartStyle>(DEFAULT_STYLE)
  // Merge over DEFAULT_STYLE while ignoring undefined values, so `style` can
  // never be partial — a missing OR explicitly-undefined field always falls back
  // to its default. Guards against stale Fast Refresh state and partial config.
  const style = useMemo<ChartStyle>(() => {
    const merged: ChartStyle = { ...DEFAULT_STYLE }
    for (const key of Object.keys(DEFAULT_STYLE) as (keyof ChartStyle)[]) {
      const value = styleState[key]
      if (value !== undefined) {
        ;(merged[key] as ChartStyle[keyof ChartStyle]) = value
      }
    }
    return merged
  }, [styleState])

  function updateStyle(patch: Partial<ChartStyle>) {
    setStyleState((prev) => ({ ...prev, ...patch }))
  }

  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [copying, setCopying] = useState(false)
  const copyResetTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current)
      }
    }
  }, [])

  async function handleCopyShare() {
    if (!shareUrl) return
    const absolute = `${window.location.origin}${shareUrl}`
    setCopying(true)
    setCopied(false)
    setCopyError(false)
    const didCopy = await copyTextToClipboard(absolute)

    setCopying(false)
    setCopied(didCopy)
    setCopyError(!didCopy)

    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current)
    }
    copyResetTimer.current = window.setTimeout(() => {
      setCopied(false)
      setCopyError(false)
      copyResetTimer.current = null
    }, COPY_FEEDBACK_MS)
  }

  const resolvedTitle = useMemo(() => {
    if (title.trim()) return title.trim()
    if (data) return `Star history — ${data.fullName}`
    return "Star history"
  }, [title, data])

  const namedStyle = useMemo(() => {
    return STYLE_PRESETS.find((s) => s.name === styleName) || STYLE_PRESETS[0]
  }, [styleName])

  const font = namedStyle.font

  // Defer the inputs that feed the expensive SVG regeneration. This keeps the
  // controls (slider drag, color picker) responsive: the thumb/label update
  // immediately while the heavy chart re-render happens at a lower priority,
  // so dragging the slider never loses pointer capture mid-interaction.
  const deferredStyle = useDeferredValue(style)
  const deferredLineColor = useDeferredValue(lineColor)
  const deferredShowArea = useDeferredValue(showArea)
  const deferredTheme = useDeferredValue(theme)
  const deferredNamedStyle = useDeferredValue(namedStyle)
  const deferredTitle = useDeferredValue(resolvedTitle)

  const svg = useMemo(() => {
    if (!data) return ""
    return buildChartSvg(data.history, {
      title: deferredTitle,
      lineColor: deferredLineColor,
      fillColor: deferredLineColor,
      showArea: deferredShowArea,
      width: PREVIEW_W,
      height: PREVIEW_H,
      font: deferredNamedStyle.font,
      spacing: SPACING_CONFIGS[deferredNamedStyle.spacing],
      typography: deferredNamedStyle.typography,
      sketch: deferredNamedStyle.sketch,
      ...THEME_PRESETS[deferredTheme],
      ...deferredStyle,
    })
  }, [data, deferredTitle, deferredLineColor, deferredShowArea, deferredTheme, deferredStyle, deferredNamedStyle])

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

  const shareUrl = useMemo(() => {
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
    return `/share/${encodeShareConfig(params.toString())}`
  }, [activeRepo, theme, lineColor, title, style, showArea, font, namedStyle])

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
              <Select value={styleName} onValueChange={(v) => v && setStyleName(v)}>
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
              <input
                id="chart-lw"
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={style.lineWidth}
                onChange={(e) => updateStyle({ lineWidth: Number(e.currentTarget.value) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ring [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ring [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
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
              <p
                role="status"
                aria-live="polite"
                className={`text-xs ${copyError ? "text-destructive" : "text-muted-foreground"}`}
              >
                {copyError
                  ? "Clipboard access was blocked. Open the preview, then copy the URL from the address bar."
                  : copying
                    ? "Copying share link..."
                  : copied
                    ? "Share link copied."
                    : "A shareable link that previews just the chart on X, WhatsApp, Slack, and more."}
              </p>
              <Button onClick={handleCopyShare} variant="outline" size="sm" className="justify-start" disabled={copying}>
                {copying ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : copyError ? (
                  <TriangleAlert className="size-4 text-destructive" />
                ) : (
                  <Link2 className="size-4" />
                )}
                {copying ? "Copying link" : copied ? "Copied to clipboard" : copyError ? "Copy failed" : "Copy shareable link"}
              </Button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Open preview
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

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    const didCopy = await copyWithClipboardApi(text)
    if (didCopy) {
      return true
    }
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.readOnly = true
  textarea.style.position = "fixed"
  textarea.style.left = "-9999px"
  textarea.style.top = "0"

  const selection = document.getSelection()
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  let didCopy = false
  try {
    didCopy = document.execCommand("copy")
  } catch {
    didCopy = false
  } finally {
    textarea.remove()
    if (selection && selectedRange) {
      selection.removeAllRanges()
      selection.addRange(selectedRange)
    }
  }

  return didCopy
}

async function copyWithClipboardApi(text: string): Promise<boolean> {
  let timeoutId: number | null = null

  try {
    const clipboardWrite = navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    )
    const timeout = new Promise<boolean>((resolve) => {
      timeoutId = window.setTimeout(() => resolve(false), CLIPBOARD_API_TIMEOUT_MS)
    })

    return await Promise.race([clipboardWrite, timeout])
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
    }
  }
}
