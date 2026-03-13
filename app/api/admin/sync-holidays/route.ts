import { NextResponse } from "next/server"
import { z } from "zod"

import { syncOfficeHolidaysYear } from "@/lib/ingestion/sync-officeholidays"

const syncRequestSchema = z.object({
  year: z.number().int().min(2027).max(2100),
  dryRun: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-token")
  const configuredToken = process.env.HOLIDAY_SYNC_ADMIN_TOKEN

  if (!configuredToken || configuredToken.trim().length < 24) {
    return NextResponse.json({ error: "Admin sync token is not configured securely" }, { status: 503 })
  }

  if (!token || token !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json()
  const parsed = syncRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await syncOfficeHolidaysYear({
      year: parsed.data.year,
      dryRun: parsed.data.dryRun,
    })

    return NextResponse.json({
      status: "ok",
      source: "officeholidays",
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected sync failure",
      },
      { status: 500 },
    )
  }
}
