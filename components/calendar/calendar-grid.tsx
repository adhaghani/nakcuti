import { getDate, parseISO } from "date-fns"
import { useMemo } from "react"

import type { PlannerCalendarDay } from "@/lib/domain/holidays"
import { cn } from "@/lib/utils"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarGridProps {
  days: PlannerCalendarDay[]
  selectedDates: string[]
  annualLeaveBudget?: number
  onToggleSelectDate: (date: string) => void
}

export function CalendarGrid({ days, selectedDates, annualLeaveBudget = 12, onToggleSelectDate }: CalendarGridProps) {
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates])
  const firstDayOffset = days[0]?.dayOfWeek ?? 0

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <p key={label}>{label}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDayOffset }).map((_, index) => (
          <div key={`blank-${index}`} className="min-h-20 rounded-md border border-dashed border-border/50" />
        ))}

        {days.map((day) => {
          const hasHoliday = day.holidays.length > 0
          const hasObserved = day.holidays.some((holiday) => holiday.kind === "observed")
          const selected = selectedSet.has(day.date)
          const budgetExhausted = selectedDates.length >= annualLeaveBudget
          const blockedByBudget = annualLeaveBudget <= 0 || (budgetExhausted && !selected)
          const canSelect = !day.isWeekend && !hasHoliday && !blockedByBudget
          const holidaySummary = day.holidays[0]?.name ? `, ${day.holidays[0].name}` : ""
          const stateSummary = selected ? ", selected" : day.isRecommendedLeave ? ", suggested leave" : ""
          const statusSummary = blockedByBudget ? ", budget limit reached" : ""

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onToggleSelectDate(day.date)}
              disabled={!canSelect}
              className={cn(
                "min-h-20 rounded-md border p-2 text-left text-xs transition-colors",
                day.isWeekend && "bg-muted/60",
                hasHoliday && !hasObserved && "bg-primary/10",
                hasObserved && "bg-amber-100",
                day.isRecommendedLeave && "border-emerald-500 bg-emerald-50",
                selected && "bg-accent",
                !canSelect && "cursor-not-allowed opacity-70",
              )}
              aria-label={`${new Date(day.date).toLocaleDateString()}${holidaySummary}${stateSummary}${statusSummary}`}
            >
              <p className="font-medium">{getDate(parseISO(day.date))}</p>
              {day.holidays[0] ? <p className="truncate text-[11px]">{day.holidays[0].name}</p> : null}
              {day.isRecommendedLeave && !hasHoliday ? <p className="mt-1 text-[11px] text-emerald-700">Suggested</p> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
