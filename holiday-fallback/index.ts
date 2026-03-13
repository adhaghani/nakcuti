import type { PublicHoliday } from "@/lib/domain/holidays"
import { HOLIDAY_FALLBACK_HOLIDAYS as holidays2026 } from "@/holiday-fallback/holiday-2026"
import { HOLIDAY_FALLBACK_HOLIDAYS as holidays2027 } from "@/holiday-fallback/holiday-2027"

const HOLIDAY_FALLBACK_BY_YEAR: Record<number, PublicHoliday[]> = {
  2026: holidays2026,
  2027: holidays2027,
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
