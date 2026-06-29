"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircle, Star, TriangleAlert } from "lucide-react"

// The shared chart is a server-rendered OG image (1200×630 → 40/21). It can
// take a beat to generate, so we hold its exact aspect ratio and show a
// premium skeleton until it paints — then crossfade the image in. The fixed
// aspect box means there's no layout shift on load or on error.
const PREMIUM_SURFACE =
  "ring-1 ring-foreground/10 shadow-[0_1px_0_0_var(--surface-highlight)_inset,0_2px_4px_-2px_hsl(var(--shadow-color)/0.5),0_18px_44px_-24px_hsl(var(--shadow-color)/0.65)]"

export function ShareChartImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const imgRef = useRef<HTMLImageElement>(null)

  // The image can finish loading from cache *before* React attaches the
  // onLoad/onError handlers — in which case neither event ever fires and we'd
  // be stuck on the skeleton. Reconcile against the actual element state once
  // on mount: a complete image with no intrinsic size means it errored.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete) {
      setStatus(img.naturalWidth > 0 ? "loaded" : "error")
    }
  }, [])

  return (
    <div
      className={`relative aspect-[40/21] w-full max-w-[1200px] overflow-hidden rounded-xl bg-card ${PREMIUM_SURFACE}`}
    >
      {status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={1200}
          height={630}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`absolute inset-0 block h-full w-full object-cover transition-opacity duration-500 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {status === "loading" && (
        <div
          className="absolute inset-0 grid place-items-center duration-300 animate-in fade-in"
          aria-hidden="true"
        >
          <div className="absolute inset-0 animate-pulse bg-muted" />
          <div className="relative flex flex-col items-center gap-3 text-muted-foreground">
            <span className="star-emblem grid size-12 place-items-center rounded-2xl bg-star-soft">
              <Star className="size-5 fill-star text-star" />
            </span>
            <span className="flex items-center gap-2 font-mono text-xs">
              <LoaderCircle className="size-3.5 animate-spin" />
              Rendering chart…
            </span>
          </div>
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="absolute inset-0 grid place-items-center px-6 text-center"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <TriangleAlert className="size-5 text-destructive" />
            <p className="font-mono text-xs">Couldn&apos;t load this chart image.</p>
          </div>
        </div>
      )}
    </div>
  )
}
