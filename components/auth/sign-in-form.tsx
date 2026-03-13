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

interface SignInFormProps {
  redirectTo: string
}

export function SignInForm({ redirectTo }: SignInFormProps) {
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
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Save plans and access draft history. You can still browse planner suggestions without an account.</CardDescription>
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
            <Input id="password" name="password" type="password" required />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          New here? <Link href={`/auth/sign-up?next=${encodeURIComponent(safeRedirectTo)}`} className="underline">Create an account</Link>
        </p>
      </CardContent>
    </Card>
  )
}
