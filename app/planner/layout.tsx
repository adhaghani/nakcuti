import type { ReactNode } from "react"
import { Suspense } from "react"

import { PlannerShell } from "@/components/planner/planner-shell"

interface PlannerLayoutProps {
  children: ReactNode
}

export default function PlannerLayout({ children }: PlannerLayoutProps) {
  return (
    <Suspense fallback={<section className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading planner...</section>}>
      <PlannerShell>{children}</PlannerShell>
    </Suspense>
  )
}
