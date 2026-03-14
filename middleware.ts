import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { updateAuthSession } from "@/lib/supabase/auth/middleware"

const PROTECTED_PAGE_PREFIXES = ["/planner/settings"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  try {
    response = await updateAuthSession(request)
  } catch {
    // Bypass middleware auth flows if Supabase is unavailable in this environment.
    return response
  }

  const needsAuth = PROTECTED_PAGE_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  )

  if (!needsAuth) {
    return response
  }

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return response
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  if (user) {
    return response
  }

  const signInUrl = request.nextUrl.clone()
  signInUrl.pathname = "/auth/sign-in"
  signInUrl.search = ""
  signInUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  )

  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
