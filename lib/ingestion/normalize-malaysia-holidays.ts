import type { MalaysianStateCode } from "@/lib/domain/states"

import type { ParsedOfficeHolidayRow } from "@/lib/scraper/officeholidays-parser"

export interface NormalizedHolidayRecord {
  date: string
  name: string
  normalizedName: string
  isNational: boolean
  affectedStates: MalaysianStateCode[]
  kind: "holiday" | "observed"
  replacementForDate?: string
  replacementReason?: string
  confidenceScore: number
}

const STATE_MATCHERS: Array<{ pattern: RegExp; state: MalaysianStateCode }> = [
  { pattern: /johor/i, state: "JHR" },
  { pattern: /kedah/i, state: "KDH" },
  { pattern: /kelantan/i, state: "KTN" },
  { pattern: /melaka|malacca/i, state: "MLK" },
  { pattern: /negeri sembilan/i, state: "NSN" },
  { pattern: /pahang/i, state: "PHG" },
  { pattern: /perak/i, state: "PRK" },
  { pattern: /perlis/i, state: "PLS" },
  { pattern: /penang|george town/i, state: "PNG" },
  { pattern: /sabah|kaamatan|governor of sabah/i, state: "SBH" },
  { pattern: /sarawak|gawai dayak|governor of sarawak/i, state: "SWK" },
  { pattern: /selangor/i, state: "SGR" },
  { pattern: /terengganu/i, state: "TRG" },
  { pattern: /federal territory|wilayah/i, state: "KUL" },
  { pattern: /federal territory|wilayah/i, state: "LBN" },
  { pattern: /federal territory|wilayah/i, state: "PJY" },
]

function inferStates(name: string): MalaysianStateCode[] {
  const inferred = new Set<MalaysianStateCode>()

  for (const matcher of STATE_MATCHERS) {
    if (matcher.pattern.test(name)) {
      inferred.add(matcher.state)
    }
  }

  return Array.from(inferred)
}

function inferKind(): "holiday" {
  return "holiday"
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
}

export function normalizeMalaysiaHolidayRows(rows: ParsedOfficeHolidayRow[]): NormalizedHolidayRecord[] {
  return rows.map((row) => {
    const states = inferStates(row.name)

    return {
      date: row.date,
      name: row.name,
      normalizedName: normalizeName(row.name),
      isNational: states.length === 0,
      affectedStates: states,
      kind: inferKind(),
      confidenceScore: states.length > 0 ? 0.85 : 0.75,
    }
  })
}
