/** Resolve the public site origin from env (Vercel + optional override). */
export function getConfiguredSiteUrl(): URL | null {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL

  if (!configuredUrl?.trim()) {
    return null
  }

  const normalized = configuredUrl.trim()
  const withProtocol =
    normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `https://${normalized}`

  try {
    return new URL(withProtocol)
  } catch {
    return null
  }
}

/** Site origin for metadata and absolute URLs; localhost in local dev. */
export function getMetadataBase(): URL {
  return getConfiguredSiteUrl() ?? new URL(`http://localhost:${process.env.PORT ?? "3000"}`)
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null
}

/** Prefer the incoming request host (custom domain, preview, localhost). */
export function getOriginFromHeaders(requestHeaders: Headers): URL | null {
  const host =
    firstHeaderValue(requestHeaders.get("x-forwarded-host")) ??
    firstHeaderValue(requestHeaders.get("host"))
  if (!host) return null

  const protocol =
    firstHeaderValue(requestHeaders.get("x-forwarded-proto")) ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : null)
  if (!protocol) return null

  try {
    return new URL(`${protocol}://${host}`)
  } catch {
    return null
  }
}
