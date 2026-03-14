import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LeaveOpportunity, LeaveRecommendationSet, PlannerCalendarRecommendationSet } from "@/lib/domain/holidays"

type RecommendationSetView = PlannerCalendarRecommendationSet | LeaveRecommendationSet

interface OpportunitiesListProps {
  opportunities: LeaveOpportunity[]
  recommendationSets?: RecommendationSetView[]
  year?: number
}

export function OpportunitiesList({ opportunities, recommendationSets = [], year }: OpportunitiesListProps) {
  if (opportunities.length === 0 && recommendationSets.length === 0) {
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
          {year !== undefined ? `Top leave plans for ${year}` : "Top leave plans"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendationSets.length > 0 ? (
          <div className="space-y-3">
            {recommendationSets.slice(0, 3).map((set) => (
              <div key={set.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{set.exactBudgetMatch ? "Exact budget plan" : "Best-effort budget plan"}</p>
                <p className="text-muted-foreground">
                  Leave: {set.totalLeaveDays} day{set.totalLeaveDays === 1 ? "" : "s"} | Break: {set.totalBreakDays} day
                  {set.totalBreakDays === 1 ? "" : "s"}
                </p>
                <p className="text-muted-foreground">Utilization: {set.utilizationPercent}% | Score: {set.efficiencyScore}</p>
                <p>Leave dates: {set.leaveDates.join(", ")}</p>
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  )
}
