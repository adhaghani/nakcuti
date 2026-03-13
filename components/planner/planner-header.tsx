"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { AuthControls } from "@/components/auth/auth-controls"
import { StateSelector } from "@/components/dashboard/state-selector"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAvailableYears } from "@/hooks/use-available-years"
import { parsePlannerQueryDraft, plannerQueryString, type PlannerQueryDraftState } from "@/lib/planner/query"

const NAV_ITEMS = [
  { href: "/planner/overview", label: "Overview" },
  { href: "/planner/opportunities", label: "Opportunities" },
  { href: "/planner/score", label: "Cuti Score" },
  { href: "/planner/leave-draft", label: "Leave Draft" },
  { href: "/planner/travel-sync", label: "Travel Sync" },
  { href: "/planner/settings", label: "Settings" },
]

export function PlannerHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const parsed = useMemo(() => parsePlannerQueryDraft(new URLSearchParams(searchParams.toString())), [searchParams])
  const { years: availableYears } = useAvailableYears()
  const activeYear = parsed.year !== undefined && availableYears.includes(parsed.year) ? parsed.year : undefined
  const [pendingAnnualLeaveBudgetInput, setPendingAnnualLeaveBudgetInput] = useState<string | null>(null)
  const annualLeaveBudgetInput =
    pendingAnnualLeaveBudgetInput ?? (parsed.annualLeaveBudget !== undefined ? String(parsed.annualLeaveBudget) : "")

  const debouncedBudget = useMemo(() => {
    const normalized = annualLeaveBudgetInput.trim()
    if (normalized.length === 0) {
      return undefined
    }

    const numericBudget = Number(normalized)
    if (!Number.isFinite(numericBudget)) {
      return null
    }

    const budget = Math.trunc(numericBudget)
    if (budget < 0 || budget > 30) {
      return null
    }

    return budget
  }, [annualLeaveBudgetInput])

  const pushWithQuery = useCallback((next: Partial<PlannerQueryDraftState>, replace = false) => {
    const merged = {
      ...parsed,
      ...next,
    }

    const params = plannerQueryString(merged)
    const href = params.length > 0 ? `${pathname}?${params}` : pathname

    if (replace) {
      router.replace(href)
      return
    }

    router.push(href)
  }, [parsed, pathname, router])

  useEffect(() => {
    if (pendingAnnualLeaveBudgetInput === null) {
      return
    }

    const timeout = setTimeout(() => {
      if (debouncedBudget === null) {
        return
      }

      if (parsed.annualLeaveBudget === debouncedBudget) {
        setPendingAnnualLeaveBudgetInput(null)
        return
      }

      pushWithQuery({ annualLeaveBudget: debouncedBudget }, true)
      setPendingAnnualLeaveBudgetInput(null)
    }, 450)

    return () => {
      clearTimeout(timeout)
    }
  }, [debouncedBudget, parsed.annualLeaveBudget, pendingAnnualLeaveBudgetInput, pushWithQuery])

  return (
    <header className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Planner</p>
          <h1 className="text-2xl font-semibold tracking-tight">Nak Cuti {activeYear ?? "Planner"}</h1>
        </div>
        <div className="space-y-2">
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
            <StateSelector value={parsed.state} onChange={(state) => pushWithQuery({ state })} />
            <Select
              value={activeYear !== undefined ? String(activeYear) : undefined}
              onValueChange={(value) => pushWithQuery({ year: Number(value) })}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="w-full sm:w-28"
              type="number"
              min={0}
              max={30}
              value={annualLeaveBudgetInput}
              placeholder="Leave days"
              onChange={(event) => setPendingAnnualLeaveBudgetInput(event.target.value)}
              aria-label="Annual leave budget"
            />
          </div>
          <AuthControls />
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const query = plannerQueryString(parsed)
          const href = query.length > 0 ? `${item.href}?${query}` : item.href

          return (
            <Link
              key={item.href}
              href={href}
              className={[
                "rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
