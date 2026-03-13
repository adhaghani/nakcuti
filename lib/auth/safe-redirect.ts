const DEFAULT_AUTH_REDIRECT = "/planner/overview?state=SGR&year=2026&annualLeaveBudget=12"

const ALLOWED_PREFIXES = ["/planner", "/auth"]

export function sanitizeRedirectTarget(nextParam: string | null | undefined): string {
  if (!nextParam) {
    return DEFAULT_AUTH_REDIRECT
  }

  // Block protocol-relative URLs and absolute URLs by requiring an app-relative path.
  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT
  }

  const [pathname] = nextParam.split("?")
  if (!pathname || !ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return DEFAULT_AUTH_REDIRECT
  }

  return nextParam
}

export { DEFAULT_AUTH_REDIRECT }
