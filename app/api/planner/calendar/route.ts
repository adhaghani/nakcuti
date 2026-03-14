import { eachDayOfInterval, format } from "date-fns"
import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"

import type { PlannerCalendarDay } from "@/lib/domain/holidays"
import { MALAYSIAN_STATES, type MalaysianStateCode } from "@/lib/domain/states"
import { optimizeLeaveDays } from "@/lib/engine/optimizer"
import { isPlannerQueryComplete, parsePlannerQueryDraft } from "@/lib/planner/query"
import { listHolidaysByStateAndYear, resolveRequestedHolidayYear } from "@/lib/repositories/holiday-repository"

const getCalendarPayload = unstable_cache(
  async (state: MalaysianStateCode, requestedYear: number, annualLeaveBudget: number) => {
    const resolvedYear = await resolveRequestedHolidayYear(requestedYear)
    const holidays = await listHolidaysByStateAndYear(state, resolvedYear)
    const inferredYear = Number.parseInt(holidays[0]?.date.slice(0, 4) ?? "", 10)
    const effectiveYear = Number.isFinite(inferredYear) ? inferredYear : resolvedYear
    const optimization = optimizeLeaveDays(state, holidays, annualLeaveBudget, effectiveYear)

    const opportunities = optimization.opportunities.map((opportunity, index) => ({
      id: `op-${index + 1}`,
      ...opportunity,
    }))

    const recommendationSets = optimization.recommendationSets.map((set) => ({
      ...set,
      opportunityIds: set.opportunityIndexes
        .map((index) => opportunities[index]?.id)
        .filter((id): id is string => Boolean(id)),
    }))

    const recommendedMap = new Map<string, string[]>()
    for (const opportunity of opportunities) {
      for (const leaveDate of opportunity.leaveDays) {
        const existing = recommendedMap.get(leaveDate) ?? []
        existing.push(opportunity.id)
        recommendedMap.set(leaveDate, existing)
      }
    }

    const holidayMap = new Map<string, typeof holidays>()
    for (const holiday of holidays) {
      const existing = holidayMap.get(holiday.date) ?? []
      existing.push(holiday)
      holidayMap.set(holiday.date, existing)
    }

    const calendarDays: PlannerCalendarDay[] = eachDayOfInterval({
      start: new Date(`${effectiveYear}-01-01`),
      end: new Date(`${effectiveYear}-12-31`),
    }).map((day) => {
      const key = format(day, "yyyy-MM-dd")
      const dayHolidays = holidayMap.get(key) ?? []

      return {
        date: key,
        dayOfWeek: day.getDay(),
        month: day.getMonth(),
        isWeekend: day.getDay() === 0 || day.getDay() === 6,
        holidays: dayHolidays.map((holiday) => ({
          name: holiday.name,
          kind: holiday.kind,
          replacementForDate: holiday.replacementForDate,
          replacementReason: holiday.replacementReason,
        })),
        isRecommendedLeave: recommendedMap.has(key),
        recommendedOpportunityIds: recommendedMap.get(key) ?? [],
      }
    })

    return {
      meta: {
        state,
        year: effectiveYear,
        annualLeaveBudget,
        generatedAt: new Date().toISOString(),
        dataVersion: "planner-calendar-v2",
      },
      calendarDays,
      opportunities,
      recommendationSets,
      legend: {
        weekend: "Weekend",
        holiday: "Public holiday",
        observedHoliday: "Observed replacement holiday",
        recommendedLeave: "Recommended leave day",
      },
    }
  },
  ["planner-calendar"],
  { revalidate: 3600 },
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = parsePlannerQueryDraft(searchParams)

  if (!isPlannerQueryComplete(parsed)) {
    return NextResponse.json(
      { error: "Missing or invalid required query params: state, year, annualLeaveBudget" },
      { status: 400 },
    )
  }

  if (!MALAYSIAN_STATES.includes(parsed.state as MalaysianStateCode)) {
    return NextResponse.json({ error: "Invalid state code" }, { status: 400 })
  }

  const payload = await getCalendarPayload(parsed.state, parsed.year, parsed.annualLeaveBudget)

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
