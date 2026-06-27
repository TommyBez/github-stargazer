import { ImageResponse } from "next/og"
import { getStarHistory, parseRepo } from "@/lib/github"
import { buildChartSvg, THEME_PRESETS, type ThemeName } from "@/lib/chart-svg"

export const runtime = "nodejs"

const OG_W = 1200
const OG_H = 630

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repoParam = searchParams.get("repo") ?? ""
  const theme = (searchParams.get("theme") as ThemeName) ?? "dark"
  const lineColor = searchParams.get("color") ?? "#facc15"
  const title = searchParams.get("title") ?? undefined

  const parsed = parseRepo(repoParam)
  const preset = THEME_PRESETS[theme] ?? THEME_PRESETS.dark

  try {
    if (!parsed) throw new Error("invalid repo")
    const data = await getStarHistory(parsed.owner, parsed.name)

    const svg = buildChartSvg(data.history, {
      title: title ?? `${data.fullName} — Stars`,
      lineColor,
      fillColor: lineColor,
      showArea: true,
      width: OG_W,
      height: OG_H,
      ...preset,
    })

    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`

    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={OG_W} height={OG_H} alt="" />
      </div>,
      { width: OG_W, height: OG_H },
    )
  } catch {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: preset.bgColor,
          color: preset.textColor,
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        <div>Star History</div>
        <div style={{ fontSize: 24, opacity: 0.7, marginTop: 12 }}>Repository not found</div>
      </div>,
      { width: OG_W, height: OG_H },
    )
  }
}
