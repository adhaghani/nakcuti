"use client"

import { CutiScoreCard } from "@/components/dashboard/cuti-score-card"
import { PlannerQueryRequired } from "@/components/planner/planner-query-required"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlannerOptimizer } from "@/hooks/use-planner-optimizer"
import { usePlannerQuery } from "@/hooks/use-planner-query"

export default function PlannerScorePage() {
  const { draftQuery, query, isReady } = usePlannerQuery()
  const { score, opportunities } = usePlannerOptimizer()

  if (!isReady || !query) {
    return <PlannerQueryRequired query={draftQuery} />
  }

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <CutiScoreCard score={score} leaveBudget={query.annualLeaveBudget} />
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
          <CardDescription>How efficiently your leave days are used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Top opportunity efficiency: {opportunities[0]?.efficiencyScore ?? 0}</p>
          <p>Top opportunity break length: {opportunities[0]?.totalBreakDays ?? 0} days</p>
          <p>Total ranked opportunities: {opportunities.length}</p>
        </CardContent>
      </Card>
    </section>
  )
}
