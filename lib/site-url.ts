function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null
}

function isVercelDeployment(): boolean {
  return process.env.VERCEL === "1"
}

function requireEnv(name: "VERCEL_PROJECT_PRODUCTION_URL" | "VERCEL_URL"): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} must be set on Vercel`)
  }
  return value
}

function vercelHostToUrl(host: string): URL {
  return new URL(`https://${host}`)
}

/**
 * Site origin for static metadata (e.g. root layout at build time).
 *
 * Vercel system variables (https://vercel.com/docs/environment-variables/system-environment-variables):
 * - production  → VERCEL_PROJECT_PRODUCTION_URL (custom domain or *.vercel.app)
 * - preview     → VERCEL_URL (this deployment)
 * - development → VERCEL_URL (vercel dev)
 * - local pnpm dev → http://localhost:${PORT}
 */
export function getMetadataBase(): URL {
  if (!isVercelDeployment()) {
    return new URL(`http://localhost:${process.env.PORT ?? "3000"}`)
  }

  switch (process.env.VERCEL_ENV) {
    case "production":
      return vercelHostToUrl(requireEnv("VERCEL_PROJECT_PRODUCTION_URL"))
    case "preview":
    case "development":
      return vercelHostToUrl(requireEnv("VERCEL_URL"))
    default:
      throw new Error(`Unsupported VERCEL_ENV: ${process.env.VERCEL_ENV ?? "(unset)"}`)
  }
}

/**
 * Site origin for a live request (share pages, canonical/OG URLs).
 * Uses the incoming Host / X-Forwarded-* headers, which reflect the domain
 * the user is actually visiting.
 */
export function getRequestOrigin(requestHeaders: Headers): URL {
  const host =
    firstHeaderValue(requestHeaders.get("x-forwarded-host")) ??
    firstHeaderValue(requestHeaders.get("host"))

  if (!host) {
    throw new Error("Missing Host header")
  }

  if (!isVercelDeployment()) {
    return new URL(`http://${host}`)
  }

  const protocol = firstHeaderValue(requestHeaders.get("x-forwarded-proto"))
  if (!protocol) {
    throw new Error("Missing x-forwarded-proto header on Vercel")
  }

  return new URL(`${protocol}://${host}`)
}
