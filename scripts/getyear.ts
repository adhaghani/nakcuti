import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { readdir } from "node:fs/promises"

import { generateHolidaysSql } from "../lib/ingestion/generate-holidays-sql"
import { type NormalizedHolidayRecord, normalizeMalaysiaHolidayRows } from "../lib/ingestion/normalize-malaysia-holidays"
import { fetchOfficeHolidaysMalaysiaYear } from "../lib/scraper/officeholidays-client"
import { parseOfficeHolidaysMalaysiaHtml } from "../lib/scraper/officeholidays-parser"

function escapeTsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")
}

function toFallbackModuleContent(year: number, records: NormalizedHolidayRecord[]): string {
  const sortedRecords = [...records].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }

    return a.name.localeCompare(b.name)
  })

  const rows = sortedRecords
    .map((record) => {
      const affectedStates = record.affectedStates.map((state) => `"${state}"`).join(", ")

      return `  {
    date: "${record.date}",
    name: "${escapeTsString(record.name)}",
    isNational: ${record.isNational},
    affectedStates: [${affectedStates}],
    kind: "${record.kind}",
    replacementForDate: ${record.replacementForDate ? `"${record.replacementForDate}"` : "undefined"},
    replacementReason: ${record.replacementReason ? `"${escapeTsString(record.replacementReason)}"` : "undefined"},
  },`
    })
    .join("\n")

  return `import type { PublicHoliday } from "@/lib/domain/holidays"

export const HOLIDAY_FALLBACK_YEAR = ${year}

export const HOLIDAY_FALLBACK_HOLIDAYS: PublicHoliday[] = [
${rows}
]
`
}

async function writeFallbackIndex(fallbackDir: string): Promise<number[]> {
  const files = await readdir(fallbackDir)
  const years = files
    .map((fileName) => {
      const match = /^holiday-(\d{4})\.ts$/.exec(fileName)
      return match ? Number(match[1]) : null
    })
    .filter((year): year is number => year !== null)
    .sort((a, b) => a - b)

  const imports = years
    .map((year) => `import { HOLIDAY_FALLBACK_HOLIDAYS as holidays${year} } from "@/holiday-fallback/holiday-${year}"`)
    .join("\n")

  const mapEntries = years
    .map((year) => `  ${year}: holidays${year},`)
    .join("\n")

  const indexContent = `import type { PublicHoliday } from "@/lib/domain/holidays"
${imports ? `${imports}\n` : ""}
const HOLIDAY_FALLBACK_BY_YEAR: Record<number, PublicHoliday[]> = {
${mapEntries}
}

export function getHolidayFallbackByYear(year: number): PublicHoliday[] | undefined {
  return HOLIDAY_FALLBACK_BY_YEAR[year]
}

export function getHolidayFallbackYears(): number[] {
  return Object.keys(HOLIDAY_FALLBACK_BY_YEAR)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)
}
`

  await writeFile(resolve(fallbackDir, "index.ts"), indexContent, "utf8")

  return years
}

function parseYearArg(argv: string[]): number {
  const rawYear = argv[2]
  if (!rawYear) {
    throw new Error("Missing year. Usage: npm run getyear -- <year>")
  }

  const year = Number(rawYear)
  if (!Number.isInteger(year) || year < 2026 || year > 2100) {
    throw new Error(`Invalid year \"${rawYear}\". Expected an integer between 2026 and 2100.`)
  }

  return year
}

async function main() {
  const year = parseYearArg(process.argv)
  const fetched = await fetchOfficeHolidaysMalaysiaYear(year)
  const parsed = parseOfficeHolidaysMalaysiaHtml(year, fetched.html)
  const normalized = normalizeMalaysiaHolidayRows(parsed)
  const sql = generateHolidaysSql({
    year,
    source: "officeholidays",
    sourceUrl: fetched.sourceUrl,
    records: normalized,
    generatedAt: new Date(),
  })

  const outputPath = resolve(process.cwd(), `supabase/snippets/holidays-${year}.sql`)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, sql, "utf8")

  const fallbackDir = resolve(process.cwd(), "holiday-fallback")
  await mkdir(fallbackDir, { recursive: true })

  const fallbackPath = resolve(fallbackDir, `holiday-${year}.ts`)
  const fallbackTs = toFallbackModuleContent(year, normalized)
  await writeFile(fallbackPath, fallbackTs, "utf8")

  const fallbackYears = await writeFallbackIndex(fallbackDir)

  console.log(`Generated SQL snippet for ${year}`)
  console.log(`Generated TS fallback for ${year}`)
  console.log(`Parsed rows: ${parsed.length}`)
  console.log(`Normalized rows: ${normalized.length}`)
  console.log(`Output: ${outputPath}`)
  console.log(`Fallback output: ${fallbackPath}`)
  console.log(`Fallback years indexed: ${fallbackYears.join(", ")}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`getyear failed: ${message}`)
  process.exitCode = 1
})