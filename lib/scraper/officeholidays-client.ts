export interface OfficeHolidaysFetchResult {
  year: number
  sourceUrl: string
  html: string
}

const DEFAULT_TIMEOUT_MS = 20000

export async function fetchOfficeHolidaysMalaysiaYear(year: number): Promise<OfficeHolidaysFetchResult> {
  const sourceUrl = `https://www.officeholidays.com/countries/malaysia/${year}`
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.HOLIDAY_SOURCE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
  )

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "nakcuti-holiday-sync/1.0 (+https://nakcuti.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`OfficeHolidays fetch failed with status ${response.status}`)
    }

    const html = await response.text()
    return { year, sourceUrl, html }
  } finally {
    clearTimeout(timeout)
  }
}
