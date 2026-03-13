import { NextResponse } from "next/server"

import { leaveDraftSchema } from "@/lib/domain/holidays"
import { generateLeaveDraft } from "@/lib/engine/leave-draft-generator"
import { getClientIp, enforceRateLimit } from "@/lib/security/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase/auth/server"

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = enforceRateLimit({
    key: `leave-draft:${user.id}:${getClientIp(request.headers)}`,
    limit: 10,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many draft requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    )
  }

  const payload = await request.json()
  const parsed = leaveDraftSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await generateLeaveDraft(parsed.data)

  return NextResponse.json(result, {
    headers: {
      "X-RateLimit-Remaining": String(rateLimit.remaining),
    },
  })
}
