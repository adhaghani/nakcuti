import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseServerClient } from "@/lib/supabase/auth/server"

const createDraftSchema = z.object({
  language: z.string(),
  tone: z.string(),
  leaveDates: z.array(z.string()).min(1),
  reason: z.string(),
  draftContent: z.string().min(1),
})

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("generated_drafts")
    .select("id,language,tone,leave_dates,reason,draft_content,created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ drafts: data ?? [] })
}

export async function POST(request: Request) {
  const payload = await request.json()
  const parsed = createDraftSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase.from("generated_drafts").insert({
    user_id: user.id,
    language: parsed.data.language,
    tone: parsed.data.tone,
    leave_dates: parsed.data.leaveDates,
    reason: parsed.data.reason,
    draft_content: parsed.data.draftContent,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "saved" })
}
