"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/auth/client"

interface UserSummary {
  email: string | null
}

export function AuthControls() {
  const router = useRouter()
  const authConfigured = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  )
  const [user, setUser] = useState<UserSummary | null>(null)
  const [loading, setLoading] = useState(authConfigured)

  useEffect(() => {
    if (!authConfigured) {
      return
    }

    const supabase = createSupabaseBrowserClient()

    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user ? { email: data.user.email ?? null } : null)
      setLoading(false)
    }

    void loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? { email: session.user.email ?? null } : null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [authConfigured])

  if (!authConfigured) {
    return (
      <p className="text-xs text-muted-foreground">
        Auth unavailable (configure Supabase env)
      </p>
    )
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return <p className="text-xs text-muted-foreground">Checking session...</p>
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/auth/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Create account</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded border px-2 py-1 text-muted-foreground">
        {user.email}
      </span>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  )
}
