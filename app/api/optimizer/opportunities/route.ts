import { NextResponse } from "next/server"

import { getOptimizerPayload, parseOptimizerRequest } from "@/lib/planner/optimizer-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const parsed = parseOptimizerRequest(searchParams)
  if (!parsed.ok) {
    return NextResponse.json(parsed.body, { status: parsed.status })
  }

  const payload = await getOptimizerPayload(parsed.data.state, parsed.data.year, parsed.data.annualLeaveBudget)

  return NextResponse.json({
    state: payload.state,
    year: payload.year,
    annualLeaveBudget: payload.annualLeaveBudget,
    opportunities: payload.opportunities,
    recommendationSets: payload.recommendationSets,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
