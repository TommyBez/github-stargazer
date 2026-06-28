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
            <span className="font-heading text-sm font-semibold tracking-tight">Stargazer</span>
          </div>
          <a
            href="https://github.com/TommyBez/github-stargazer"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span className="sr-only">View on GitHub</span>
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
            Your repo&apos;s star history,
            <br />
            ready to share.
          </h1>
          <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
            Paste any public GitHub repository, customize the look, and download a chart image
            built for social posts.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-star" aria-hidden="true" />
            Live GitHub data
          </span>
          <span>PNG · SVG · social card</span>
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
            <span className="font-heading text-sm font-semibold tracking-tight">Stargazer</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/TommyBez/github-stargazer"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <svg
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span className="sr-only">View on GitHub</span>
            </a>
            <p className="font-mono text-xs text-muted-foreground">
              Star data from the GitHub API. Not affiliated with GitHub.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
