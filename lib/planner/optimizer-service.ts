import { unstable_cache } from "next/cache"

import type { LeaveOpportunity } from "@/lib/domain/holidays"
import { optimizerRequestSchema } from "@/lib/domain/holidays"
import { MALAYSIAN_STATES, type MalaysianStateCode } from "@/lib/domain/states"
import { calculateCutiScore, optimizeLeaveDays } from "@/lib/engine/optimizer"
import { listHolidaysByStateAndYear, resolveRequestedHolidayYear } from "@/lib/repositories/holiday-repository"

export interface OptimizerPayload {
  state: MalaysianStateCode
  year: number
  annualLeaveBudget: number
  score: number
  opportunities: LeaveOpportunity[]
}

export function parseOptimizerRequest(searchParams: URLSearchParams) {
  const rawState = searchParams.get("state")
  const rawYear = searchParams.get("year")
  const rawLeaveBudget = searchParams.get("annualLeaveBudget")

  if (!rawState || !rawYear || !rawLeaveBudget) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: "Missing required query params: state, year, annualLeaveBudget",
      },
    }
  }

  const parsedYear = Number(rawYear)
  const parsedLeaveBudget = Number(rawLeaveBudget)

  if (!MALAYSIAN_STATES.includes(rawState as MalaysianStateCode)) {
    return {
      ok: false as const,
      status: 400,
      body: { error: "Invalid state code" },
    }
  }

  const parsed = optimizerRequestSchema.safeParse({
    state: rawState,
    year: parsedYear,
    annualLeaveBudget: parsedLeaveBudget,
  })

  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      body: { error: parsed.error.flatten() },
    }
  }

  return {
    ok: true as const,
    data: {
      state: parsed.data.state as MalaysianStateCode,
      year: parsed.data.year,
      annualLeaveBudget: parsed.data.annualLeaveBudget,
    },
  }
}

const getOptimizerDataCached = unstable_cache(
  async (state: MalaysianStateCode, year: number, annualLeaveBudget: number): Promise<OptimizerPayload> => {
    const resolvedYear = await resolveRequestedHolidayYear(year)
    const holidays = await listHolidaysByStateAndYear(state, resolvedYear)
    const inferredYear = Number.parseInt(holidays[0]?.date.slice(0, 4) ?? "", 10)
    const effectiveYear = Number.isFinite(inferredYear) ? inferredYear : resolvedYear

    const result = optimizeLeaveDays(state, holidays, annualLeaveBudget, effectiveYear)
    const score = calculateCutiScore(result.opportunities, annualLeaveBudget)

    return {
      state,
      year: effectiveYear,
      annualLeaveBudget,
      score,
      opportunities: result.opportunities,
    }
  },
  ["optimizer-payload"],
  { revalidate: 3600 },
)

export async function getOptimizerPayload(state: MalaysianStateCode, year: number, annualLeaveBudget: number) {
  return getOptimizerDataCached(state, year, annualLeaveBudget)
}
