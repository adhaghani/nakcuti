import { addDays, eachDayOfInterval, format, parseISO } from "date-fns"

import type {
  CalendarDay,
  LeaveOpportunity,
  LeaveRecommendationSet,
  OptimizationResult,
  PublicHoliday,
} from "@/lib/domain/holidays"
import type { MalaysianStateCode } from "@/lib/domain/states"

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function holidayAppliesToState(holiday: PublicHoliday, state: MalaysianStateCode): boolean {
  return holiday.isNational || holiday.affectedStates.length === 0 || holiday.affectedStates.includes(state)
}

function buildCalendar(state: MalaysianStateCode, holidays: PublicHoliday[], year: number): CalendarDay[] {
  const intervalDays = eachDayOfInterval({
    start: new Date(`${year}-01-01`),
    end: new Date(`${year}-12-31`),
  })

  const byDate = new Map<string, PublicHoliday[]>()

  for (const holiday of holidays) {
    if (!holidayAppliesToState(holiday, state)) {
      continue
    }

    const existing = byDate.get(holiday.date) ?? []
    existing.push(holiday)
    byDate.set(holiday.date, existing)
  }

  return intervalDays.map((day) => {
    const key = format(day, "yyyy-MM-dd")
    const entries = byDate.get(key) ?? []
    const weekend = isWeekend(day)
    const holidayNames = entries.map((entry) => entry.name)
    const holiday = entries.length > 0

    return {
      date: key,
      isWeekend: weekend,
      holidayNames,
      isHoliday: holiday,
      isWorkingDay: !weekend && !holiday,
    }
  })
}

function scoreOpportunity(leaveDays: string[], totalBreakDays: number): number {
  if (leaveDays.length === 0) {
    return 0
  }

  return Number((totalBreakDays / leaveDays.length).toFixed(2))
}

function computeBreakLength(calendar: CalendarDay[], leaveSet: Set<string>, startIndex: number): number {
  let idx = startIndex
  let count = 0

  while (idx < calendar.length) {
    const day = calendar[idx]
    if (day.isHoliday || day.isWeekend || leaveSet.has(day.date)) {
      count += 1
      idx += 1
      continue
    }

    break
  }

  return count
}

function detectSandwichOpportunities(calendar: CalendarDay[]): LeaveOpportunity[] {
  const opportunities: LeaveOpportunity[] = []

  for (let i = 1; i < calendar.length - 1; i += 1) {
    const current = calendar[i]
    if (!current.isWorkingDay) {
      continue
    }

    const leaveSet = new Set<string>([current.date])
    const previousDay = calendar[i - 1]
    const nextDay = calendar[i + 1]

    const bridgesOffDays =
      (previousDay.isHoliday || previousDay.isWeekend) &&
      (nextDay.isHoliday || nextDay.isWeekend)

    if (!bridgesOffDays) {
      continue
    }

    let left = i - 1
    while (left >= 0) {
      const day = calendar[left]
      if (day.isHoliday || day.isWeekend) {
        left -= 1
        continue
      }
      break
    }

    const startIndex = left + 1
    const totalBreakDays = computeBreakLength(calendar, leaveSet, startIndex)

    opportunities.push({
      startDate: calendar[startIndex].date,
      endDate: format(addDays(parseISO(calendar[startIndex].date), totalBreakDays - 1), "yyyy-MM-dd"),
      leaveDays: [current.date],
      totalBreakDays,
      efficiencyScore: scoreOpportunity([current.date], totalBreakDays),
      reason: "Single-day sandwich leave to extend weekend/holiday block",
    })
  }

  return opportunities
}

function applyAnnualLeaveBudget(opportunities: LeaveOpportunity[], annualLeaveBudget: number): LeaveOpportunity[] {
  if (annualLeaveBudget <= 0) {
    return []
  }

  const eligible = opportunities.filter((opportunity) => opportunity.leaveDays.length <= annualLeaveBudget)
  const maxSuggestions = Math.min(12, Math.max(2, annualLeaveBudget * 2))

  return eligible.slice(0, maxSuggestions)
}

interface RecommendationDraft {
  opportunityIndexes: number[]
  leaveDateSet: Set<string>
  breakDateSet: Set<string>
}

function buildBreakDateSet(opportunity: LeaveOpportunity): Set<string> {
  return new Set(
    eachDayOfInterval({
      start: parseISO(opportunity.startDate),
      end: parseISO(opportunity.endDate),
    }).map((day) => format(day, "yyyy-MM-dd")),
  )
}

function compareDrafts(a: LeaveRecommendationSet, b: LeaveRecommendationSet): number {
  if (a.exactBudgetMatch !== b.exactBudgetMatch) {
    return a.exactBudgetMatch ? -1 : 1
  }

  if (b.totalBreakDays !== a.totalBreakDays) {
    return b.totalBreakDays - a.totalBreakDays
  }

  if (b.utilizationPercent !== a.utilizationPercent) {
    return b.utilizationPercent - a.utilizationPercent
  }

  if (b.efficiencyScore !== a.efficiencyScore) {
    return b.efficiencyScore - a.efficiencyScore
  }

  return a.leaveDates.join(",").localeCompare(b.leaveDates.join(","))
}

function toRecommendationSet(
  draft: RecommendationDraft,
  annualLeaveBudget: number,
  id: string,
): LeaveRecommendationSet {
  const leaveDates = Array.from(draft.leaveDateSet).sort((a, b) => a.localeCompare(b))
  const totalLeaveDays = leaveDates.length
  const totalBreakDays = draft.breakDateSet.size
  const efficiency = totalLeaveDays > 0 ? totalBreakDays / totalLeaveDays : 0
  const utilization = annualLeaveBudget > 0 ? (totalLeaveDays / annualLeaveBudget) * 100 : 0

  return {
    id,
    opportunityIndexes: [...draft.opportunityIndexes].sort((a, b) => a - b),
    leaveDates,
    totalLeaveDays,
    totalBreakDays,
    efficiencyScore: Number(efficiency.toFixed(2)),
    utilizationPercent: Number(Math.min(100, utilization).toFixed(1)),
    exactBudgetMatch: annualLeaveBudget > 0 && totalLeaveDays === annualLeaveBudget,
  }
}

function buildRecommendationSets(opportunities: LeaveOpportunity[], annualLeaveBudget: number): LeaveRecommendationSet[] {
  if (annualLeaveBudget <= 0 || opportunities.length === 0) {
    return []
  }

  const candidates = opportunities.slice(0, 18)
  const candidateBreakSets = candidates.map((opportunity) => buildBreakDateSet(opportunity))
  const drafts: RecommendationDraft[] = []

  function dfs(
    index: number,
    chosenIndexes: number[],
    leaveDateSet: Set<string>,
    breakDateSet: Set<string>,
  ) {
    if (leaveDateSet.size > annualLeaveBudget) {
      return
    }

    if (chosenIndexes.length > 0) {
      drafts.push({
        opportunityIndexes: [...chosenIndexes],
        leaveDateSet: new Set(leaveDateSet),
        breakDateSet: new Set(breakDateSet),
      })
    }

    if (index >= candidates.length || leaveDateSet.size === annualLeaveBudget) {
      return
    }

    for (let i = index; i < candidates.length; i += 1) {
      const opportunity = candidates[i]
      const nextLeaveDates = new Set(leaveDateSet)
      let exceedsBudget = false

      for (const leaveDate of opportunity.leaveDays) {
        nextLeaveDates.add(leaveDate)
        if (nextLeaveDates.size > annualLeaveBudget) {
          exceedsBudget = true
          break
        }
      }

      if (exceedsBudget) {
        continue
      }

      const nextBreakDates = new Set(breakDateSet)
      for (const breakDate of candidateBreakSets[i]) {
        nextBreakDates.add(breakDate)
      }

      chosenIndexes.push(i)
      dfs(i + 1, chosenIndexes, nextLeaveDates, nextBreakDates)
      chosenIndexes.pop()
    }
  }

  dfs(0, [], new Set<string>(), new Set<string>())

  const uniqueByLeaveDates = new Map<string, LeaveRecommendationSet>()
  for (const draft of drafts) {
    const set = toRecommendationSet(draft, annualLeaveBudget, "")
    const key = set.leaveDates.join(",")
    const existing = uniqueByLeaveDates.get(key)

    if (!existing || compareDrafts(set, existing) < 0) {
      uniqueByLeaveDates.set(key, set)
    }
  }

  const allSets = [...uniqueByLeaveDates.values()].sort(compareDrafts)
  const exact = allSets.filter((set) => set.exactBudgetMatch)
  const fallback = allSets.filter((set) => !set.exactBudgetMatch)
  const top = [...exact, ...fallback].slice(0, 3)

  return top.map((set, index) => ({
    ...set,
    id: `set-${index + 1}`,
  }))
}

export function optimizeLeaveDays(
  state: MalaysianStateCode,
  holidays: PublicHoliday[],
  annualLeaveBudget = 12,
  year?: number,
): OptimizationResult {
  const inferredYear = Number.parseInt(holidays[0]?.date.slice(0, 4) ?? "", 10)
  const effectiveYear =
    typeof year === "number" && Number.isFinite(year)
      ? year
      : Number.isFinite(inferredYear)
        ? inferredYear
        : new Date().getFullYear()

  const calendar = buildCalendar(state, holidays, effectiveYear)
  const sandwich = detectSandwichOpportunities(calendar)

  const opportunities = applyAnnualLeaveBudget(
    sandwich
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore || a.startDate.localeCompare(b.startDate))
      .slice(0, 24),
    annualLeaveBudget,
  )
  const recommendationSets = buildRecommendationSets(opportunities, annualLeaveBudget)

  return {
    state,
    opportunities,
    recommendationSets,
  }
}

export function calculateCutiScore(opportunities: LeaveOpportunity[], leaveBudget: number): number {
  if (leaveBudget <= 0 || opportunities.length === 0) {
    return 0
  }

  const maxEfficiency = Math.max(...opportunities.map((opportunity) => opportunity.efficiencyScore))
  const normalized = Math.min(100, (maxEfficiency / 5) * 100)
  return Number(normalized.toFixed(1))
}
