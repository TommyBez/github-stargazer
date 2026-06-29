"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { Star, LoaderCircle, Link2, Check, ImageDown, FileDown, TriangleAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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

// Premium card surface: composes with the Card primitive's hairline ring,
// adding a top catch-light + a soft, low-spread drop shadow. Applied via
// className so the shadcn primitives stay untouched.
const PREMIUM_CARD =
  "rounded-2xl shadow-[0_1px_0_0_var(--surface-highlight)_inset,0_2px_4px_-2px_hsl(var(--shadow-color)/0.5),0_18px_44px_-24px_hsl(var(--shadow-color)/0.65)]"
const CLIPBOARD_API_TIMEOUT_MS = 700
const COPY_FEEDBACK_MS = 4000
const DOWNLOAD_FEEDBACK_MS = 2200

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

/** Tracks the OS "reduce motion" preference so JS-driven motion can opt out too. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return reduced
}

/** Eases a number toward `target` for a quick count-up on the star total. */
function useCountUp(target: number, durationMs = 900) {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    if (reduced) {
      setValue(target)
      fromRef.current = target
      return
    }
    const from = fromRef.current
    if (from === target) return
    let raf = 0
    let latest = from
    let startTs: number | null = null
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts
      const t = Math.min(1, (ts - startTs) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      latest = Math.round(from + (target - from) * eased)
      setValue(latest)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(tick)
    // If interrupted mid-flight (target changed), resume from the value on
    // screen instead of snapping back to this run's start.
    return () => {
      cancelAnimationFrame(raf)
      fromRef.current = latest
    }
  }, [target, durationMs, reduced])

  return value
}

export function StarsChartApp() {
  const [repoInput, setRepoInput] = useState("")
  const [activeRepo, setActiveRepo] = useState("")
  const [data, setData] = useState<RepoStarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

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
  const copyButtonRef = useRef<HTMLButtonElement | null>(null)

  const [downloaded, setDownloaded] = useState<"png" | "svg" | null>(null)
  const downloadResetTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current)
      }
      if (downloadResetTimer.current !== null) {
        window.clearTimeout(downloadResetTimer.current)
      }
    }
  }, [])

  function flagDownloaded(kind: "png" | "svg") {
    setDownloaded(kind)
    if (downloadResetTimer.current !== null) {
      window.clearTimeout(downloadResetTimer.current)
    }
    downloadResetTimer.current = window.setTimeout(() => {
      setDownloaded(null)
      downloadResetTimer.current = null
    }, DOWNLOAD_FEEDBACK_MS)
  }

  async function handleCopyShare() {
    if (!shareUrl) return
    const absolute = `${window.location.origin}${shareUrl}`
    setCopying(true)
    setCopied(false)
    setCopyError(false)
    const didCopy = await copyTextToClipboard(absolute, copyButtonRef.current)

    setCopying(false)
    setCopied(didCopy)
    setCopyError(!didCopy)
    window.requestAnimationFrame(() => copyButtonRef.current?.focus({ preventScroll: true }))

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
    if (data) return data.fullName
    return ""
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

  // True while the deferred (rendered) chart lags the live controls — used to
  // gently dim the preview so a customization tweak always registers visually.
  const previewPending =
    deferredStyle !== style ||
    deferredLineColor !== lineColor ||
    deferredShowArea !== showArea ||
    deferredTheme !== theme ||
    deferredNamedStyle !== namedStyle ||
    deferredTitle !== resolvedTitle

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

  const animatedStars = useCountUp(data?.totalStars ?? 0)

  async function runGenerate(rawValue: string) {
    const value = rawValue.trim()
    if (!value || loading) return
    // Clear any lingering "Saved PNG/SVG" feedback so it can't bleed onto the
    // next chart before that artifact has actually been downloaded.
    if (downloadResetTimer.current !== null) {
      window.clearTimeout(downloadResetTimer.current)
      downloadResetTimer.current = null
    }
    setDownloaded(null)
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

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    runGenerate(repoInput)
  }

  function handleClearInput() {
    setRepoInput("")
    inputRef.current?.focus()
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
    flagDownloaded("svg")
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
        if (blob) {
          downloadBlob(blob, `${data.name}-stars.png`)
          flagDownloaded("png")
        }
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

  const trimmedInput = repoInput.trim()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Search */}
      <form onSubmit={handleGenerate} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Star className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="owner/repo  or  https://github.com/owner/repo"
            className="h-12 rounded-xl bg-card/60 pl-10 pr-10 font-mono text-sm shadow-[0_1px_2px_-1px_hsl(var(--shadow-color)/0.4)] backdrop-blur-sm transition-shadow focus-visible:shadow-[0_0_0_4px_var(--star-soft)]"
            aria-label="GitHub repository"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {repoInput && (
            <button
              type="button"
              onClick={handleClearInput}
              aria-label="Clear repository"
              className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading || !trimmedInput}
          className="h-12 rounded-xl bg-star px-7 font-semibold text-[oklch(0.21_0.04_75)] shadow-[0_2px_22px_-6px_var(--star-glow)] transition-all hover:bg-star-strong hover:shadow-[0_4px_30px_-6px_var(--star-glow)] sm:min-w-[160px]"
        >
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
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive duration-300 animate-in fade-in slide-in-from-top-1"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {!data && !loading && !error && <EmptyState />}

      {loading && !data && <ChartSkeleton />}

      {data && (
        <div className="grid gap-6 duration-500 animate-in fade-in slide-in-from-bottom-2 lg:grid-cols-[1fr_320px]">
          {/* Chart preview + downloads */}
          <div className="flex flex-col gap-4">
            <Card className={`relative overflow-hidden p-0 ${PREMIUM_CARD}`}>
              <div
                className={`w-full transition-opacity duration-200 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full ${
                  previewPending ? "opacity-60" : "opacity-100"
                }`}
                // The SVG is generated by our own trusted builder.
                dangerouslySetInnerHTML={{ __html: svg }}
                aria-label={`Star history chart for ${data.fullName}`}
                role="img"
              />
              {/* Dimmed overlay while re-fetching a different repo. */}
              {loading && (
                <div className="absolute inset-0 grid place-items-center bg-card/60 backdrop-blur-[1px] duration-200 animate-in fade-in">
                  <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleDownloadPng} variant="default">
                {downloaded === "png" ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <ImageDown className="size-4" />
                )}
                {downloaded === "png" ? "Saved PNG" : "Download PNG"}
              </Button>
              <Button onClick={handleDownloadSvg} variant="secondary">
                {downloaded === "svg" ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {downloaded === "svg" ? "Saved SVG" : "Download SVG"}
              </Button>
              <div className="ml-auto flex items-center gap-2 rounded-full border border-star/20 bg-star-soft px-3.5 py-1.5 font-mono text-sm text-foreground">
                <Star className="size-4 fill-star text-star" />
                <span className="font-semibold tabular-nums">{animatedStars.toLocaleString()}</span>
                <span className="text-muted-foreground">stars</span>
              </div>
            </div>
          </div>

          {/* Customization panel */}
          <Card className={`flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24 ${PREMIUM_CARD}`}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight">
                <span className="size-1.5 rounded-full bg-star" aria-hidden="true" />
                Customize
              </h2>
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
                      title={c.name}
                      className="relative size-7 rounded-full border-2 border-transparent p-0 transition-transform motion-safe:hover:scale-110 data-[pressed]:scale-110 data-[pressed]:border-foreground data-[pressed]:bg-transparent"
                      style={{ backgroundColor: c.value }}
                    >
                      <Check className="size-3.5 text-white opacity-0 mix-blend-difference transition-opacity duration-150 group-data-[pressed]/toggle:opacity-100" />
                    </ToggleGroupItem>
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
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{style.lineWidth.toFixed(1)}px</span>
              </div>
              <Slider
                id="chart-lw"
                min={1}
                max={5}
                step={0.5}
                value={[style.lineWidth]}
                onValueChange={(v) => updateStyle({ lineWidth: Array.isArray(v) ? v[0] : v })}
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
              <div className="flex flex-col gap-2 duration-200 animate-in fade-in slide-in-from-top-1">
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
              {/* Keep the description constant on the success path so the panel
                  never reflows — the button's check icon is the visible
                  confirmation, and the live region below announces it for screen
                  readers. The error message stays visible because it's rare and
                  the user has to act on it. */}
              <p className={`text-xs ${copyError ? "text-destructive" : "text-muted-foreground"}`}>
                {copyError
                  ? "Clipboard access was blocked. Open the preview, then copy the URL from the address bar."
                  : "A shareable link that previews just the chart on X, WhatsApp, Slack, and more."}
              </p>
              <span role="status" aria-live="polite" className="sr-only">
                {copying ? "Copying share link…" : copied ? "Share link copied." : copyError ? "Copy failed." : ""}
              </span>
              <Button
                ref={copyButtonRef}
                onClick={handleCopyShare}
                variant="outline"
                size="sm"
                className="justify-start"
                disabled={copying}
              >
                {copying ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : copyError ? (
                  <TriangleAlert className="size-4 text-destructive" />
                ) : (
                  <Link2 className="size-4" />
                )}
                {/* Label stays constant; the icon + the status line above carry the
                    copying/copied/error feedback, so the button never resizes. */}
                Copy shareable link
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
    <Card className={`flex flex-col items-center gap-4 p-10 text-center duration-300 animate-in fade-in sm:p-16 ${PREMIUM_CARD}`}>
      <span className="star-emblem flex size-14 items-center justify-center rounded-2xl bg-star-soft">
        <Star className="size-6 fill-star text-star" />
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

/** Layout-matched placeholder so the jump from "nothing" to chart is smooth. */
function ChartSkeleton() {
  return (
    <div
      className="grid gap-6 duration-300 animate-in fade-in lg:grid-cols-[1fr_320px]"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-4">
        <Card className={`overflow-hidden p-0 ${PREMIUM_CARD}`}>
          <div className="aspect-[2/1] w-full animate-pulse bg-muted" />
        </Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="ml-auto h-5 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <Card className={`flex h-fit flex-col gap-5 p-5 ${PREMIUM_CARD}`}>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-14 animate-pulse rounded bg-muted" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </Card>
    </div>
  )
}

async function copyTextToClipboard(text: string, focusTarget: HTMLElement | null): Promise<boolean> {
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
  const activeElement = focusTarget ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)

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
    if (activeElement?.isConnected) {
      activeElement.focus({ preventScroll: true })
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
