import type { ReactNode } from "react"

import { PlannerShell } from "@/components/planner/planner-shell"

interface PlannerLayoutProps {
  children: ReactNode
}

export default function PlannerLayout({ children }: PlannerLayoutProps) {
  return <PlannerShell>{children}</PlannerShell>
}
