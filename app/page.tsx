import { Star } from "lucide-react"
import { StarsChartApp } from "@/components/stars-chart-app"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      {/* N9 · edge-aligned minimal masthead */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Star className="size-4 fill-star text-star" />
            <span className="font-heading text-sm font-semibold tracking-tight">Star Charts</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            github.com
          </a>
        </div>
      </header>

      {/* Workbench intro — left-bias, hairline meta strip, no centered pill */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Star history generator
        </p>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance [overflow-wrap:anywhere] sm:text-5xl">
            Star history charts,
            <br />
            built for READMEs.
          </h1>
          <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
            Plot stars-over-time for any public GitHub repository, tune the look, then export a PNG,
            SVG, or a dynamic social image.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-star" aria-hidden="true" />
            Live GitHub data
          </span>
          <span>PNG · SVG · OG image</span>
          <span>No account required</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <StarsChartApp />
      </section>

      {/* Ft2 · inline single line */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Star className="size-3.5 fill-star text-star" />
            <span className="font-heading text-sm font-semibold tracking-tight">Star Charts</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Star data from the GitHub API. Not affiliated with GitHub.
          </p>
        </div>
      </footer>
    </main>
  )
}
