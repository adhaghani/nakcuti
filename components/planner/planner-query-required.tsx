import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlannerQueryDraftState } from "@/lib/planner/query"

interface PlannerQueryRequiredProps {
  query: PlannerQueryDraftState
}

export function PlannerQueryRequired({ query }: PlannerQueryRequiredProps) {
  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Complete Planner Inputs</CardTitle>
          <CardDescription>
            Fill state, year, and annual leave budget in the header before planner data is loaded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>State: {query.state ? "Done" : "Required"}</p>
          <p>Year: {query.year !== undefined ? "Done" : "Required"}</p>
          <p>Annual leave budget: {query.annualLeaveBudget !== undefined ? "Done" : "Required"}</p>
        </CardContent>
      </Card>
    </section>
  )
}
