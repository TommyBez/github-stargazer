import { Star } from "lucide-react"
import { StarsChartApp } from "@/components/stars-chart-app"

export default function Page() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto mb-10 flex max-w-6xl flex-col gap-3 text-center sm:mb-14">
        <div className="mx-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Star className="size-3.5 fill-current text-[#facc15]" />
          GitHub Star Charts
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Beautiful star history charts
        </h1>
        <p className="mx-auto max-w-xl text-pretty text-muted-foreground leading-relaxed">
          Generate a customizable stars-over-time chart for any public GitHub repository. Download as
          PNG or SVG, or share it as a dynamic OG image.
        </p>
      </div>
      <StarsChartApp />
    </main>
  )
}
