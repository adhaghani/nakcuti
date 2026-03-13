import type { ReactNode } from "react"

import { PlannerHeader } from "@/components/planner/planner-header"

interface PlannerShellProps {
  children: ReactNode
}

export function PlannerShell({ children }: PlannerShellProps) {
  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <PlannerHeader />
      {children}
    </main>
  )
}
