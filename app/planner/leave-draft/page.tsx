import { LeaveDraftPanel } from "@/components/dashboard/leave-draft-panel"

interface PlannerLeaveDraftPageProps {
  searchParams: Promise<{ selectedDates?: string }>
}

export default async function PlannerLeaveDraftPage({ searchParams }: PlannerLeaveDraftPageProps) {
  const params = await searchParams
  const initialLeaveDates = params.selectedDates ?? ""

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Leave Draft Generator</h2>
      <LeaveDraftPanel initialLeaveDates={initialLeaveDates} />
    </section>
  )
}
