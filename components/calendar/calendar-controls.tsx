import { format } from "date-fns"

import { Button } from "@/components/ui/button"

interface CalendarControlsProps {
  currentMonthDate: Date
  viewMode: "month" | "list"
  onPreviousMonth: () => void
  onNextMonth: () => void
  onViewModeChange: (next: "month" | "list") => void
}

export function CalendarControls({
  currentMonthDate,
  viewMode,
  onPreviousMonth,
  onNextMonth,
  onViewModeChange,
}: CalendarControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={onPreviousMonth}>
          Previous
        </Button>
        <p className="min-w-36 text-sm font-medium">{format(currentMonthDate, "MMMM yyyy")}</p>
        <Button type="button" variant="outline" onClick={onNextMonth}>
          Next
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={viewMode === "month" ? "default" : "outline"}
          onClick={() => onViewModeChange("month")}
        >
          Month View
        </Button>
        <Button
          type="button"
          variant={viewMode === "list" ? "default" : "outline"}
          onClick={() => onViewModeChange("list")}
        >
          List View
        </Button>
      </div>
    </div>
  )
}
