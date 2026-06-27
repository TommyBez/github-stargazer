const GITHUB_API = "https://api.github.com"
const PER_PAGE = 100
// Max sampled requests when a repo has more stars than we can fully paginate.
const MAX_SAMPLE_REQUESTS = 20
// GitHub's stargazers REST endpoint refuses pages beyond this (≈40k stars).
const MAX_PAGE = 400

export interface StarPoint {
  date: string // ISO date (yyyy-mm-dd)
  stars: number // cumulative star count at that date
}

export interface RepoStarData {
  owner: string
  name: string
  fullName: string
  description: string | null
  totalStars: number
  history: StarPoint[]
}

export class GitHubError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "GitHubError"
  }
}

function headers(useToken: boolean) {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3.star+json",
    "User-Agent": "stars-chart-app",
  }
  const token = process.env.GITHUB_TOKEN
  if (useToken && token) h.Authorization = `Bearer ${token}`
  return h
}

/** Parse "owner/repo", a full GitHub URL, or "github.com/owner/repo". */
export function parseRepo(input: string): { owner: string; name: string } | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try URL form first
  const urlMatch = trimmed.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/i)
  if (urlMatch) {
    return { owner: urlMatch[1], name: urlMatch[2].replace(/\.git$/, "") }
  }

  // Try "owner/repo" form
  const slugMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/)
  if (slugMatch) {
    return { owner: slugMatch[1], name: slugMatch[2].replace(/\.git$/, "") }
  }

  return null
}

async function ghFetch(url: string) {
  const hasToken = Boolean(process.env.GITHUB_TOKEN)
  let res = await fetch(url, { headers: headers(hasToken) })

  // A configured token that returns 401 is invalid/expired. Retry
  // unauthenticated so the app still works (subject to the lower rate limit).
  if (res.status === 401 && hasToken) {
    res = await fetch(url, { headers: headers(false) })
  }

  if (!res.ok) {
    if (res.status === 404) throw new GitHubError("Repository not found.", 404)
    if (res.status === 401) {
      throw new GitHubError("GitHub rejected the request. Check that GITHUB_TOKEN is valid.", 401)
    }
    if (res.status === 403 || res.status === 429) {
      throw new GitHubError(
        "GitHub API rate limit reached. Add a valid GITHUB_TOKEN or try again later.",
        res.status,
      )
    }
    throw new GitHubError(`GitHub API error (${res.status}).`, res.status)
  }
  return res
}

interface Stargazer {
  starred_at: string
}

async function fetchPage(owner: string, name: string, page: number): Promise<Stargazer[]> {
  const url = `${GITHUB_API}/repos/${owner}/${name}/stargazers?per_page=${PER_PAGE}&page=${page}`
  const res = await ghFetch(url)
  return (await res.json()) as Stargazer[]
}

/** Like fetchPage but resolves to null instead of throwing (for best-effort sampling). */
async function tryFetchPage(owner: string, name: string, page: number): Promise<Stargazer[] | null> {
  try {
    return await fetchPage(owner, name, page)
  } catch {
    return null
  }
}

function toDay(iso: string): string {
  return iso.slice(0, 10)
}

export async function getStarHistory(owner: string, name: string): Promise<RepoStarData> {
  // 1. Repo metadata
  const repoRes = await ghFetch(`${GITHUB_API}/repos/${owner}/${name}`)
  const repo = (await repoRes.json()) as {
    full_name: string
    description: string | null
    stargazers_count: number
  }

  const totalStars = repo.stargazers_count
  const base: RepoStarData = {
    owner,
    name,
    fullName: repo.full_name,
    description: repo.description,
    totalStars,
    history: [],
  }

  if (totalStars === 0) return base

  const pageCount = Math.ceil(totalStars / PER_PAGE)

  let history: StarPoint[]

  if (pageCount <= MAX_SAMPLE_REQUESTS) {
    // Small enough: fetch every page and build an accurate cumulative timeline.
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, i) => fetchPage(owner, name, i + 1)),
    )
    const gazers = pages.flat()
    // Group by day, counting cumulative.
    const byDay = new Map<string, number>()
    gazers.forEach((g, idx) => {
      byDay.set(toDay(g.starred_at), idx + 1)
    })
    history = Array.from(byDay.entries()).map(([date, stars]) => ({ date, stars }))
  } else {
    // Large repo: sample pages evenly. GitHub won't serve pages past MAX_PAGE,
    // so we sample within the retrievable range and anchor the final point to
    // the true current total.
    const reachablePages = Math.min(pageCount, MAX_PAGE)
    const sampledPages: number[] = []
    const step = reachablePages / MAX_SAMPLE_REQUESTS
    for (let i = 0; i < MAX_SAMPLE_REQUESTS; i++) {
      sampledPages.push(Math.min(reachablePages, Math.max(1, Math.round((i + 1) * step))))
    }
    // Always include the first page for an accurate starting point.
    if (!sampledPages.includes(1)) sampledPages.unshift(1)
    const uniquePages = Array.from(new Set(sampledPages)).sort((a, b) => a - b)

    const results = await Promise.all(
      uniquePages.map(async (page) => {
        const gazers = await tryFetchPage(owner, name, page)
        if (!gazers || gazers.length === 0) return null
        // The first star on this page represents cumulative count (page-1)*PER_PAGE.
        return {
          date: toDay(gazers[0].starred_at),
          stars: (page - 1) * PER_PAGE + 1,
        } as StarPoint
      }),
    )

    history = results.filter((p): p is StarPoint => p !== null)
    // Ensure the final point reflects the true current total (today).
    const last = history[history.length - 1]
    if (!last || last.stars < totalStars) {
      history.push({ date: toDay(new Date().toISOString()), stars: totalStars })
    }
  }

  // De-dupe by date (keep max) and sort ascending.
  const merged = new Map<string, number>()
  for (const p of history) {
    merged.set(p.date, Math.max(merged.get(p.date) ?? 0, p.stars))
  }
  base.history = Array.from(merged.entries())
    .map(([date, stars]) => ({ date, stars }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return base
}
