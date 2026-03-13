/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { addMonths, startOfMonth } from "date-fns"
import { useEffect, useState, useMemo } from "react"

import { CalendarControls } from "@/components/calendar/calendar-controls"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { CalendarLegend } from "@/components/calendar/calendar-legend"
import { SelectionPanel } from "@/components/calendar/selection-panel"
import { OpportunitiesList } from "@/components/dashboard/opportunities-list"
import { PlannerQueryRequired } from "@/components/planner/planner-query-required"
import { usePlannerCalendar } from "@/hooks/use-planner-calendar"
import { usePlannerQuery } from "@/hooks/use-planner-query"

export default function PlannerOpportunitiesPage() {
  const { draftQuery, query, isReady } = usePlannerQuery()

  const { data, loading, error } = usePlannerCalendar()
  const [viewMode, setViewMode] = useState<"month" | "list">("month")
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date((query?.year ?? new Date().getFullYear()), 0, 1))

  useEffect(() => {
    if (query?.year !== undefined) {
      setCurrentMonth(new Date(query.year, 0, 1))
    }
  }, [query?.year])

  if (!isReady || !query) {
    return <PlannerQueryRequired query={draftQuery} />
  }

  const annualLeaveBudget = query.annualLeaveBudget
  const queryYear = query.year

  const constrainedSelectedDates = useMemo(() => {
    if (annualLeaveBudget <= 0) {
      return []
    }
    return selectedDates.slice(0, annualLeaveBudget)
  }, [annualLeaveBudget, selectedDates])

  const budgetExhausted = constrainedSelectedDates.length >= annualLeaveBudget

  const monthDays = useMemo(() => {
    if (!data) {
      return []
    }

    return data.calendarDays.filter((day) => day.month === currentMonth.getMonth())
  }, [currentMonth, data])

  function toggleDate(date: string) {
    setSelectedDates((previous) => {
      const normalized = annualLeaveBudget <= 0 ? [] : previous.slice(0, annualLeaveBudget)

      if (normalized.includes(date)) {
        return normalized.filter((entry) => entry !== date)
      }

      if (annualLeaveBudget <= 0 || normalized.length >= annualLeaveBudget) {
        return normalized
      }

      return [...normalized, date]
    })
  }

  function previousMonth() {
    const next = addMonths(startOfMonth(currentMonth), -1)
    if (next.getFullYear() !== queryYear) {
      return
    }
    setCurrentMonth(next)
  }

  function nextMonth() {
    const next = addMonths(startOfMonth(currentMonth), 1)
    if (next.getFullYear() !== queryYear) {
      return
    }
    setCurrentMonth(next)
  }

  if (loading) {
    return <section className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading calendar...</section>
  }

  if (error || !data) {
    return <section className="rounded-lg border bg-card p-4 text-sm text-destructive">{error ?? "Unable to load calendar."}</section>
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Optimal Leave Opportunities</h2>

      <CalendarControls
        currentMonthDate={currentMonth}
        viewMode={viewMode}
        onPreviousMonth={previousMonth}
        onNextMonth={nextMonth}
        onViewModeChange={setViewMode}
      />

      <CalendarLegend />

      <p className="text-sm text-muted-foreground">
        Annual leave budget: {annualLeaveBudget} day{annualLeaveBudget === 1 ? "" : "s"}. Selected: {constrainedSelectedDates.length}
        {annualLeaveBudget <= 0 ? " (Selection disabled because budget is zero.)" : ""}
        {annualLeaveBudget > 0 && budgetExhausted ? " (Budget limit reached.)" : ""}
      </p>

      {viewMode === "month" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalendarGrid
              days={monthDays}
              selectedDates={constrainedSelectedDates}
              annualLeaveBudget={annualLeaveBudget}
              onToggleSelectDate={toggleDate}
            />
          </div>
          <SelectionPanel
            query={query}
            selectedDates={constrainedSelectedDates}
            opportunities={data.opportunities}
            annualLeaveBudget={annualLeaveBudget}
          />
        </div>
      ) : (
        <OpportunitiesList opportunities={data.opportunities} year={data.meta.year} />
      )}
    </section>
  )
}
