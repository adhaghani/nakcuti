"use client"

import { TravelSyncPlaceholder } from "@/components/dashboard/travel-sync-placeholder"
import { PlannerQueryRequired } from "@/components/planner/planner-query-required"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlannerOptimizer } from "@/hooks/use-planner-optimizer"
import { usePlannerQuery } from "@/hooks/use-planner-query"

export default function PlannerTravelSyncPage() {
  const { draftQuery, query, isReady } = usePlannerQuery()
  const { opportunities } = usePlannerOptimizer()

  if (!isReady || !query) {
    return <PlannerQueryRequired query={draftQuery} />
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <TravelSyncPlaceholder />
      <Card>
        <CardHeader>
          <CardTitle>Long Weekend Feed</CardTitle>
          <CardDescription>Top windows that can be paired with future travel sync</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {opportunities.slice(0, 4).map((opportunity,index) => (
            <p key={`${opportunity.startDate}-${opportunity.endDate}-${index}`}>
              {opportunity.startDate} to {opportunity.endDate} ({opportunity.totalBreakDays} days)
            </p>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
