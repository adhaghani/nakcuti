import { load } from "cheerio"
import { parse } from "date-fns"

export interface ParsedOfficeHolidayRow {
  date: string
  weekday: string
  name: string
  rawRow: {
    weekday: string
    monthDay: string
    name: string
  }
}

const EXCLUDE_PATTERNS = [/mother's day/i, /father's day/i, /christmas eve/i]

export function parseOfficeHolidaysMalaysiaHtml(year: number, html: string): ParsedOfficeHolidayRow[] {
  const $ = load(html)
  const rows: ParsedOfficeHolidayRow[] = []
  const seen = new Set<string>()

  $("table tr").each((_, element) => {
    const cells = $(element)
      .find("td")
      .map((__, td) => $(td).text().trim())
      .get()

    if (cells.length < 3) {
      return
    }

    const [weekday, monthDay, name] = cells

    if (!weekday || !monthDay || !name) {
      return
    }

    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(name))) {
      return
    }

    const date = parse(`${monthDay} ${year}`, "MMM dd yyyy", new Date())
    if (Number.isNaN(date.getTime())) {
      return
    }

    const isoDate = date.toISOString().slice(0, 10)
    const key = `${isoDate}|${name}`

    if (seen.has(key)) {
      return
    }

    seen.add(key)
    rows.push({
      date: isoDate,
      weekday,
      name,
      rawRow: {
        weekday,
        monthDay,
        name,
      },
    })
  })

  return rows
}
