import { unstable_cache } from "next/cache"

import type { PublicHoliday } from "@/lib/domain/holidays"
import type { MalaysianStateCode } from "@/lib/domain/states"
import {
  getHolidayFallbackByYear,
  getHolidayFallbackYears,
} from "@/holiday-fallback"
import { getSupabaseServerClient } from "@/lib/supabase/server"

function isHolidayApplicableToState(
  row: { is_national: boolean; affected_states: string[] | null },
  state: MalaysianStateCode
): boolean {
  const affectedStates = row.affected_states ?? []

  // If a holiday lists explicit affected states, treat it as state-scoped even if is_national is set.
  if (affectedStates.length > 0) {
    return affectedStates.includes(state)
  }

  return row.is_national
}

function isFallbackHolidayApplicableToState(
  holiday: PublicHoliday,
  state: MalaysianStateCode
): boolean {
  if (holiday.affectedStates.length > 0) {
    return holiday.affectedStates.includes(state)
  }

  return holiday.isNational
}

function getFallbackYearForRequest(requestedYear: number): number | undefined {
  if (getHolidayFallbackByYear(requestedYear)) {
    return requestedYear
  }

  const fallbackYears = getHolidayFallbackYears()
  return fallbackYears.at(-1)
}

function getFallbackHolidaysByStateAndYear(
  state: MalaysianStateCode,
  requestedYear: number
): PublicHoliday[] | null {
  const fallbackYear = getFallbackYearForRequest(requestedYear)
  if (fallbackYear === undefined) {
    return null
  }

  const fallbackHolidays = getHolidayFallbackByYear(fallbackYear)
  if (!fallbackHolidays) {
    return null
  }

  return fallbackHolidays
    .filter((holiday) => isFallbackHolidayApplicableToState(holiday, state))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function listHolidaysByStateAndYear(
  state: MalaysianStateCode,
  year: number
): Promise<PublicHoliday[]> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("public_holidays")
    .select(
      "date,name,is_national,affected_states,kind,replacement_for_date,replacement_reason"
    )
    .eq("year", year)
    .or(`is_national.eq.true,affected_states.cs.{${state}}`)
    .order("date", { ascending: true })

  if (error) {
    const fallback = getFallbackHolidaysByStateAndYear(state, year)
    if (fallback) {
      return fallback
    }

    if (error.message.includes("Expected 3 parts in JWT")) {
      throw new Error(
        "Unable to query public_holidays and no fallback data available: malformed Supabase anon key. Use ANON_KEY from `supabase status -o env` for SUPABASE_ANON_KEY."
      )
    }

    throw new Error(
      `Unable to query public_holidays and no fallback data available: ${error.message}`
    )
  }

  // Keep a server-side guard to prevent cross-state data leakage if PostgREST array filtering changes.
  return (data ?? [])
    .filter((row) => isHolidayApplicableToState(row, state))
    .map((row) => ({
      date: row.date,
      name: row.name,
      isNational: row.is_national,
      affectedStates: row.affected_states ?? [],
      kind: row.kind,
      replacementForDate: row.replacement_for_date ?? undefined,
      replacementReason: row.replacement_reason ?? undefined,
    }))
}

async function listAvailableHolidayYearsUncached(): Promise<number[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from("public_holidays")
    .select("year")
    .order("year", { ascending: true })

  if (error) {
    const fallbackYears = getHolidayFallbackYears()
    if (fallbackYears.length > 0) {
      return fallbackYears
    }

    if (error.message.includes("Expected 3 parts in JWT")) {
      throw new Error(
        "Unable to list available holiday years and no fallback data available: malformed Supabase anon key. Use ANON_KEY from `supabase status -o env` for SUPABASE_ANON_KEY."
      )
    }

    throw new Error(
      `Unable to list available holiday years and no fallback data available: ${error.message}`
    )
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => Number(row.year))
        .filter((year) => Number.isFinite(year) && year >= 1900 && year <= 2100)
    )
  ).sort((a, b) => a - b)
}

const listAvailableHolidayYearsCached = unstable_cache(
  async () => listAvailableHolidayYearsUncached(),
  ["available-holiday-years"],
  { revalidate: 3600 }
)

export async function listAvailableHolidayYears(): Promise<number[]> {
  return listAvailableHolidayYearsCached()
}

export async function resolveRequestedHolidayYear(
  requestedYear: number
): Promise<number> {
  return requestedYear
}
