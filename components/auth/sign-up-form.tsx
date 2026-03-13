"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sanitizeRedirectTarget } from "@/lib/auth/safe-redirect"
import { createSupabaseBrowserClient } from "@/lib/supabase/auth/client"

interface SignUpFormProps {
  redirectTo: string
}

export function SignUpForm({ redirectTo }: SignUpFormProps) {
  const router = useRouter()
  const safeRedirectTo = sanitizeRedirectTarget(redirectTo)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const email = String(formData.get("email") ?? "")
      const password = String(formData.get("password") ?? "")

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (signUpData.session) {
        router.push(safeRedirectTo)
        router.refresh()
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.push(safeRedirectTo)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Save plans, bookmarks, and leave draft history.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit(new FormData(event.currentTarget))
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <Link href={`/auth/sign-in?next=${encodeURIComponent(safeRedirectTo)}`} className="underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
