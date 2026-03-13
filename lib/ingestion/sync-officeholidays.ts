import { normalizeMalaysiaHolidayRows } from "@/lib/ingestion/normalize-malaysia-holidays"
import { upsertHolidaysIntoSupabase } from "@/lib/ingestion/upsert-holidays"
import { fetchOfficeHolidaysMalaysiaYear } from "@/lib/scraper/officeholidays-client"
import { parseOfficeHolidaysMalaysiaHtml } from "@/lib/scraper/officeholidays-parser"

export interface SyncOfficeHolidaysOptions {
  year: number
  dryRun?: boolean
}

export async function syncOfficeHolidaysYear(options: SyncOfficeHolidaysOptions) {
  const fetched = await fetchOfficeHolidaysMalaysiaYear(options.year)
  const parsed = parseOfficeHolidaysMalaysiaHtml(options.year, fetched.html)
  const normalized = normalizeMalaysiaHolidayRows(parsed)

  return upsertHolidaysIntoSupabase({
    year: options.year,
    source: "officeholidays",
    sourceUrl: fetched.sourceUrl,
    dryRun: options.dryRun,
    records: normalized,
    rawRows: parsed,
  })
}
