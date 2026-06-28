"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  className?: string
  "aria-label"?: string
}

interface Hsv {
  h: number // 0-360
  s: number // 0-1
  v: number // 0-1
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== "string") return null
  const m = hex.replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

function hsvToRgb({ h, s, v }: Hsv): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

function hexToHsv(hex: string): Hsv {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 0, s: 0, v: 0 }
  return rgbToHsv(rgb.r, rgb.g, rgb.b)
}

function hsvToHex(hsv: Hsv) {
  const { r, g, b } = hsvToRgb(hsv)
  return rgbToHex(r, g, b)
}

export function ColorPicker({ value, onChange, className, "aria-label": ariaLabel }: ColorPickerProps) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value))
  const [hexText, setHexText] = useState(value)
  const saturationRef = useRef<HTMLDivElement>(null)

  // Sync internal state when the external value changes (e.g. preset swatch click).
  useEffect(() => {
    setHexText(value)
    // Avoid resetting hue when the resulting hex is identical (prevents jumps on grayscale).
    const next = hexToHsv(value)
    setHsv((prev) => (hsvToHex(prev).toLowerCase() === value.toLowerCase() ? prev : next))
  }, [value])

  const commit = useCallback(
    (next: Hsv) => {
      setHsv(next)
      const hex = hsvToHex(next)
      setHexText(hex)
      onChange(hex)
    },
    [onChange],
  )

  const handleSaturationPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = saturationRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const s = clamp((clientX - rect.left) / rect.width, 0, 1)
      const v = 1 - clamp((clientY - rect.top) / rect.height, 0, 1)
      commit({ ...hsv, s, v })
    },
    [commit, hsv],
  )

  function startSaturationDrag(e: React.PointerEvent) {
    e.preventDefault()
    handleSaturationPointer(e.clientX, e.clientY)
    const move = (ev: PointerEvent) => handleSaturationPointer(ev.clientX, ev.clientY)
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function onHexChange(raw: string) {
    setHexText(raw)
    const normalized = raw.startsWith("#") ? raw : `#${raw}`
    if (hexToRgb(normalized)) {
      const next = hexToHsv(normalized)
      setHsv(next)
      onChange(normalized.toLowerCase())
    }
  }

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 })

  return (
    <Popover>
      <PopoverTrigger
        aria-label={ariaLabel ?? "Open color picker"}
        className={cn(
          "relative size-7 overflow-hidden rounded-full border border-border shadow-sm outline-none ring-offset-background transition-transform motion-safe:hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        style={{
          background: "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      >
        {/* Inner swatch reflects the currently selected color */}
        <span
          className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-white/70 shadow-sm"
          style={{ backgroundColor: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        {/* Saturation / Value area */}
        <div
          ref={saturationRef}
          onPointerDown={startSaturationDrag}
          className="relative h-40 w-full cursor-crosshair rounded-md"
          style={{ backgroundColor: hueColor }}
        >
          <div className="absolute inset-0 rounded-md" style={{ background: "linear-gradient(to right, #fff, transparent)" }} />
          <div className="absolute inset-0 rounded-md" style={{ background: "linear-gradient(to top, #000, transparent)" }} />
          <div
            className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              backgroundColor: value,
            }}
          />
        </div>

        {/* Hue slider */}
        <div className="flex flex-col gap-1.5">
          <Label className="sr-only" htmlFor="hue-range">
            Hue
          </Label>
          <input
            id="hue-range"
            type="range"
            min={0}
            max={360}
            value={Math.round(hsv.h)}
            onChange={(e) => commit({ ...hsv, h: Number(e.target.value) })}
            className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
            style={{
              background:
                "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
            }}
          />
        </div>

        {/* Hex input + preview */}
        <div className="flex items-center gap-2">
          <div className="size-9 shrink-0 rounded-md border border-border" style={{ backgroundColor: value }} />
          <div className="flex flex-1 items-center gap-1.5">
            <Label htmlFor="hex-input" className="text-muted-foreground">
              Hex
            </Label>
            <Input
              id="hex-input"
              value={hexText}
              onChange={(e) => onHexChange(e.target.value)}
              spellCheck={false}
              className="h-9 font-mono uppercase"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
