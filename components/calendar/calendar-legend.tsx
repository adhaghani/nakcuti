export function CalendarLegend() {
  return (
    <ul className="flex flex-wrap gap-3 rounded-lg border bg-card p-3 text-xs text-muted-foreground" aria-label="Calendar legend">
      <li className="inline-flex items-center gap-2"><span className="size-3 rounded bg-muted" aria-hidden="true" /> Weekend</li>
      <li className="inline-flex items-center gap-2"><span className="size-3 rounded bg-primary/20" aria-hidden="true" /> Public holiday</li>
      <li className="inline-flex items-center gap-2"><span className="size-3 rounded bg-amber-200" aria-hidden="true" /> Observed replacement</li>
      <li className="inline-flex items-center gap-2"><span className="size-3 rounded bg-emerald-200" aria-hidden="true" /> Recommended leave</li>
      <li className="inline-flex items-center gap-2"><span className="size-3 rounded bg-accent" aria-hidden="true" /> Selected leave</li>
    </ul>
  )
}
