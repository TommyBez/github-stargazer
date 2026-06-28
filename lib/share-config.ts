/**
 * The shareable chart configuration is carried inside a single dynamic route
 * segment (`/share/[config]`) rather than as search params. This is required
 * by the Next.js `opengraph-image` / `twitter-image` file conventions, whose
 * generation functions receive only `params` (dynamic route segments) and
 * never `searchParams`.
 *
 * The config is the chart's query string, base64url-encoded so it is safe to
 * place in a path segment (no `/`, `?`, `&`, or `#`).
 */

/** Encode a query string (e.g. "repo=a&theme=dark") into a path-safe segment. */
export function encodeShareConfig(queryString: string): string {
  const base64 = typeof window === "undefined" ? Buffer.from(queryString, "utf-8").toString("base64") : btoa(queryString)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Decode a path segment back into URLSearchParams. */
export function decodeShareConfig(segment: string): URLSearchParams {
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/")
    const queryString =
      typeof window === "undefined" ? Buffer.from(base64, "base64").toString("utf-8") : atob(base64)
    return new URLSearchParams(queryString)
  } catch {
    return new URLSearchParams()
  }
}
