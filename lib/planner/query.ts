import type { MalaysianStateCode } from "@/lib/domain/states"
import { MALAYSIAN_STATES } from "@/lib/domain/states"

export interface PlannerQueryState {
  state: MalaysianStateCode
  year: number
  annualLeaveBudget: number
}

export interface PlannerQueryDraftState {
  state?: MalaysianStateCode
  year?: number
  annualLeaveBudget?: number
}

export const DEFAULT_PLANNER_QUERY: PlannerQueryState = {
  state: "SGR",
  year: 2027,
  annualLeaveBudget: 12,
}

export function parsePlannerQueryDraft(params: URLSearchParams): PlannerQueryDraftState {
  const rawState = params.get("state")
  const rawYear = params.get("year")
  const rawBudget = params.get("annualLeaveBudget")
  console.log("Parsing query params:", { rawState, rawYear, rawBudget })

  const parsedYear = rawYear === null ? Number.NaN : Number(rawYear)
  const parsedBudget = rawBudget === null ? Number.NaN : Number(rawBudget)

  const state = MALAYSIAN_STATES.includes(rawState as MalaysianStateCode)
    ? (rawState as MalaysianStateCode)
    : undefined

  const year =
    Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? Math.trunc(parsedYear) : undefined

  const annualLeaveBudget =
    Number.isFinite(parsedBudget) && parsedBudget >= 0 && parsedBudget <= 30 ? Math.trunc(parsedBudget) : undefined

  return {
    state,
    year,
    annualLeaveBudget,
  }
}

export function isPlannerQueryComplete(query: PlannerQueryDraftState): query is PlannerQueryState {
  return query.state !== undefined && query.year !== undefined && query.annualLeaveBudget !== undefined
}

export function parsePlannerQuery(params: URLSearchParams): PlannerQueryState {
  const parsed = parsePlannerQueryDraft(params)

  return {
    state: parsed.state ?? DEFAULT_PLANNER_QUERY.state,
    year: parsed.year ?? DEFAULT_PLANNER_QUERY.year,
    annualLeaveBudget: parsed.annualLeaveBudget ?? DEFAULT_PLANNER_QUERY.annualLeaveBudget,
  }
}

export function plannerQueryString(query: PlannerQueryDraftState): string {
  const params = new URLSearchParams()

  if (query.state !== undefined) {
    params.set("state", query.state)
  }

  if (query.year !== undefined) {
    params.set("year", String(query.year))
  }

  if (query.annualLeaveBudget !== undefined) {
    params.set("annualLeaveBudget", String(query.annualLeaveBudget))
  }

  return params.toString()
}
