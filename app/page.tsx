import { Star } from "lucide-react"
import { StarsChartApp } from "@/components/stars-chart-app"

const GITHUB_URL = "https://github.com/TommyBez/github-stargazer"

function GitHubGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

function Wordmark({ size = "sm" }: { size?: "sm" | "xs" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`star-emblem grid place-items-center rounded-lg bg-star-soft ${
          size === "sm" ? "size-7" : "size-6"
        }`}
      >
        <Star className={`fill-star text-star ${size === "sm" ? "size-3.5" : "size-3"}`} />
      </span>
      <span className="font-heading text-sm font-semibold tracking-tight">Stargazer</span>
    </div>
  )
}

export default function Page() {
  return (
    <main className="relative min-h-screen">
      {/* Tier-A CSS atmosphere: warm gold bloom + masked grid mesh */}
      <div className="atmosphere" aria-hidden="true" />

      {/* N10 · scroll-morph masthead — sticky, backdrop-blurred, hairline rule */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Wordmark />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-star/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <GitHubGlyph className="size-3.5 transition-colors group-hover:text-foreground" />
            <span className="hidden sm:inline">Star on GitHub</span>
            <span className="sm:hidden">GitHub</span>
          </a>
        </div>
      </header>

      {/* Marquee Hero — confident display statement over the atmosphere */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24 sm:pb-14">
        <div className="flex flex-col items-center text-center duration-700 animate-in fade-in slide-in-from-bottom-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-star opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-star" />
            </span>
            Live GitHub star data
          </span>

          <h1 className="mt-7 max-w-3xl font-heading text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance [overflow-wrap:anywhere]">
            Star history,{" "}
            <span className="text-gold-gradient">beautifully</span> rendered.
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Paste any public GitHub repository, tune the look to taste, and export a
            chart built to stop the scroll — as PNG, SVG, or a ready-made social card.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="size-3 fill-star text-star" />
              PNG · SVG · social card
            </span>
            <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden="true" />
            <span>Live from the GitHub API</span>
            <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden="true" />
            <span>No account required</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <StarsChartApp />
      </section>

      {/* Ft5 · statement footer — composed close on a hairline rule */}
      <footer className="relative border-t border-border">
        <div className="atmosphere-footer pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-star/40 to-transparent" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md">
              <Wordmark />
              <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
                Beautiful, shareable star-history charts for any public repository.
                Star data comes live from the GitHub API.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-star/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <GitHubGlyph className="size-4" />
                View source on GitHub
              </a>
              <p className="font-mono text-[0.7rem] text-muted-foreground/80">
                Not affiliated with GitHub.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
