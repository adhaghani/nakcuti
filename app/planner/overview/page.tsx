"use client"

import Link from "next/link"

import { PlannerQueryRequired } from "@/components/planner/planner-query-required"
import { CutiScoreCard } from "@/components/dashboard/cuti-score-card"
import { OpportunitiesList } from "@/components/dashboard/opportunities-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlannerOptimizer } from "@/hooks/use-planner-optimizer"
import { usePlannerQuery } from "@/hooks/use-planner-query"
import { plannerQueryString } from "@/lib/planner/query"

export default function PlannerOverviewPage() {
  const { draftQuery, query, isReady } = usePlannerQuery()
  const { year, score, opportunities, loading } = usePlannerOptimizer()

  if (!isReady || !query) {
    return <PlannerQueryRequired query={draftQuery} />
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <CutiScoreCard score={score} leaveBudget={query.annualLeaveBudget} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
            <CardDescription>Overview of your best leave optimization windows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>State: {query.state}</p>
            <p>Year: {query.year}</p>
            <p>Suggestions found: {opportunities.length}</p>
            <p>Status: {loading ? "Calculating..." : "Ready"}</p>
          </CardContent>
        </Card>
      </div>

      <OpportunitiesList opportunities={opportunities.slice(0, 4)} year={year ?? query.year} />

      <div className="flex flex-wrap gap-2">
        <Link href={`/planner/opportunities?${plannerQueryString(query)}`} className="rounded-md border px-3 py-2 text-sm">
          View all opportunities
        </Link>
        <Link href={`/planner/leave-draft?${plannerQueryString(query)}`} className="rounded-md border px-3 py-2 text-sm">
          Open leave draft generator
        </Link>
      </div>
    </section>
  )
}
