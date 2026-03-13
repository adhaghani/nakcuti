import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LeaveOpportunity } from "@/lib/domain/holidays"

interface OpportunitiesListProps {
  opportunities: LeaveOpportunity[]
  year?: number
}

export function OpportunitiesList({ opportunities, year }: OpportunitiesListProps) {
  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Optimal Leave Days</CardTitle>
          <CardDescription>No opportunities available for the selected annual leave budget.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimal Leave Days</CardTitle>
        <CardDescription>
          {year !== undefined
            ? `Top sandwich and long-weekend suggestions for ${year}`
            : "Top sandwich and long-weekend suggestions"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.slice(0, 6).map((opportunity, index) => (
            <div key={`${opportunity.startDate}-${opportunity.endDate}-${index}`} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {opportunity.startDate} to {opportunity.endDate}
              </p>
              <p className="text-muted-foreground">{opportunity.reason}</p>
              <p>
                Leave days: {opportunity.leaveDays.join(", ")} | Break: {opportunity.totalBreakDays} days | Score: {opportunity.efficiencyScore}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
