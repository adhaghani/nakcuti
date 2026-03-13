import { NextResponse } from "next/server"

import { sanitizeRedirectTarget } from "@/lib/auth/safe-redirect"
import { createSupabaseServerClient } from "@/lib/supabase/auth/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = sanitizeRedirectTarget(requestUrl.searchParams.get("next"))

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
