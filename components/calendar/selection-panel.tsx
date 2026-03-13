import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlannerCalendarOpportunity } from "@/lib/domain/holidays"
import type { PlannerQueryState } from "@/lib/planner/query"
import { plannerQueryString } from "@/lib/planner/query"

interface SelectionPanelProps {
  query: PlannerQueryState
  selectedDates: string[]
  opportunities: PlannerCalendarOpportunity[]
  annualLeaveBudget: number
}

export function SelectionPanel({ query, selectedDates, opportunities, annualLeaveBudget }: SelectionPanelProps) {
  const sortedDates = [...selectedDates].sort((a, b) => a.localeCompare(b))
  const matched = opportunities.filter((opportunity) =>
    sortedDates.length > 0 ? sortedDates.every((date) => opportunity.leaveDays.includes(date)) : false,
  )

  const queryWithSelection = new URLSearchParams(plannerQueryString(query))
  if (sortedDates.length > 0) {
    queryWithSelection.set("selectedDates", sortedDates.join(","))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selection Summary</CardTitle>
        <CardDescription>Choose suggested working days and send directly to Leave Draft.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          {sortedDates.length > 0 ? `Selected dates: ${sortedDates.join(", ")}` : "No leave dates selected yet."}
        </p>
        <p className="text-muted-foreground">Budget usage: {sortedDates.length}/{annualLeaveBudget}</p>
        <p className="text-muted-foreground">Matched opportunities: {matched.length}</p>

        {matched.slice(0, 3).map((opportunity) => (
          <div key={opportunity.id} className="rounded-md border p-2">
            <p className="font-medium">
              {opportunity.startDate} to {opportunity.endDate}
            </p>
            <p className="text-muted-foreground">{opportunity.reason}</p>
          </div>
        ))}

        <Link
          href={`/planner/leave-draft?${queryWithSelection.toString()}`}
          aria-disabled={sortedDates.length === 0 || annualLeaveBudget <= 0}
          className="inline-flex rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          Use selected dates in Leave Draft
        </Link>
      </CardContent>
    </Card>
  )
}
