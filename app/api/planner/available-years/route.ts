import { NextResponse } from "next/server"

import { listAvailableHolidayYears } from "@/lib/repositories/holiday-repository"

export async function GET() {
  const years = await listAvailableHolidayYears()
  return NextResponse.json(
    { years },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  )
}
