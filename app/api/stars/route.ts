import { NextResponse } from "next/server"
import { getStarHistory, parseRepo, GitHubError } from "@/lib/github"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repoParam = searchParams.get("repo") ?? ""

  const parsed = parseRepo(repoParam)
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid repository. Use the form owner/repo or a GitHub URL." },
      { status: 400 },
    )
  }

  try {
    const data = await getStarHistory(parsed.owner, parsed.name)
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch (err) {
    if (err instanceof GitHubError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.log("[v0] stars route error:", err)
    return NextResponse.json({ error: "Failed to fetch star history." }, { status: 500 })
  }
}
