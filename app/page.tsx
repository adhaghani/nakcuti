import Link from "next/link"

const QUICK_LINK = "state=SGR&year=2026&annualLeaveBudget=12"

export default function Page() {
  return (
    <main className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,oklch(0.95_0.07_185)_0%,transparent_42%),radial-gradient(circle_at_20%_30%,oklch(0.92_0.05_200)_0%,transparent_35%)]" />

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
              Malaysian Leave Optimization Platform
            </p>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Take fewer leave days,
                <span className="block text-primary">get longer breaks.</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Nak Cuti helps you plan around state-specific holidays, observed replacements, and sandwich windows so every annual leave day gives maximum return.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/planner/overview?${QUICK_LINK}`} className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Start Planning
              </Link>
              <Link href="/auth/sign-up" className="rounded-md border bg-background/80 px-4 py-2.5 text-sm font-medium backdrop-blur hover:bg-accent">
                Create Account
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded border bg-background/80 px-2 py-1">State-aware holidays</span>
              <span className="rounded border bg-background/80 px-2 py-1">Observed replacement logic</span>
              <span className="rounded border bg-background/80 px-2 py-1">Calendar-first planning</span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sample Win</p>
              <p className="mt-2 text-2xl font-semibold">1 day leave into 5 days off</p>
              <p className="mt-1 text-sm text-muted-foreground">CNY 2026: take Monday, chain with weekend + Tue/Wed holidays.</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">State Intelligence</p>
              <p className="mt-2 text-lg font-medium">Selangor vs Terengganu differences built-in</p>
              <p className="mt-1 text-sm text-muted-foreground">Recommendations update instantly when you switch state and leave budget.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-8 sm:grid-cols-3 sm:px-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Cuti Score</p>
          <p className="mt-2 text-2xl font-semibold">Efficiency-first</p>
          <p className="mt-1 text-sm text-muted-foreground">Quantifies how effectively annual leave becomes total days off.</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Calendar View</p>
          <p className="mt-2 text-2xl font-semibold">Interactive overlays</p>
          <p className="mt-1 text-sm text-muted-foreground">See weekends, holidays, observed replacements, and suggested leave days on one grid.</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Leave Draft AI</p>
          <p className="mt-2 text-2xl font-semibold">Formal BM or EN</p>
          <p className="mt-1 text-sm text-muted-foreground">Generate manager-ready requests based on selected date ranges.</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/planner/opportunities?${QUICK_LINK}`}
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <p className="text-sm font-medium">Explore Calendar Opportunities</p>
            <p className="mt-1 text-sm text-muted-foreground">Use month/list views and budget-aware date selection.</p>
          </Link>
          <Link
            href={`/planner/leave-draft?${QUICK_LINK}`}
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <p className="text-sm font-medium">Generate Leave Draft</p>
            <p className="mt-1 text-sm text-muted-foreground">Turn selected leave windows into polished email drafts.</p>
          </Link>
          <Link
            href={`/planner/travel-sync?${QUICK_LINK}`}
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <p className="text-sm font-medium">Preview Travel Sync</p>
            <p className="mt-1 text-sm text-muted-foreground">See long weekend windows ready for future budget travel matching.</p>
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-lg border bg-primary p-4 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <p className="text-sm font-medium">Create Account for Saved Plans</p>
            <p className="mt-1 text-sm text-primary-foreground/80">Unlock saved scenarios, preferences, and draft history.</p>
          </Link>
        </div>
      </section>
    </main>
  )
}
