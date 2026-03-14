"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  const [isServerReachable, setIsServerReachable] = useState(true)
  const [isCheckingReachability, setIsCheckingReachability] = useState(true)
  const reachabilityRequestId = useRef(0)

  const checkReachability = useCallback(async () => {
    const requestId = ++reachabilityRequestId.current

    setIsCheckingReachability(true)

    if (!navigator.onLine) {
      if (requestId === reachabilityRequestId.current) {
        setIsServerReachable(false)
        setIsCheckingReachability(false)
      }

      return
    }

    try {
      const supabase = createSupabaseBrowserClient()
      const probe = supabase.auth.getSession()
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Reachability check timed out"))
        }, 3000)
      })

      await Promise.race([probe, timeout])

      if (requestId === reachabilityRequestId.current) {
        setIsServerReachable(true)
      }
    } catch {
      if (requestId === reachabilityRequestId.current) {
        setIsServerReachable(false)
      }
    } finally {
      if (requestId === reachabilityRequestId.current) {
        setIsCheckingReachability(false)
      }
    }
  }, [])

  useEffect(() => {
    void checkReachability()

    function handleOffline() {
      setIsServerReachable(false)
      setIsCheckingReachability(false)
    }

    function handleOnline() {
      void checkReachability()
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
      reachabilityRequestId.current += 1
    }
  }, [checkReachability])

  const isServerUnreachable = !isCheckingReachability && !isServerReachable

  async function handleSubmit(formData: FormData) {
    setError(null)

    if (isServerUnreachable) {
      setError("Server is unreachable at the moment")
      return
    }

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

      setIsServerReachable(true)
      router.push(safeRedirectTo)
      router.refresh()
    } catch {
      setIsServerReachable(false)
      setError("Server is unreachable at the moment")
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

          <TooltipProvider>
            <Tooltip open={isServerUnreachable ? undefined : false}>
              <TooltipTrigger asChild>
                <div className="w-full" tabIndex={isServerUnreachable ? 0 : -1}>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isCheckingReachability || isServerUnreachable}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </TooltipTrigger>
              {isServerUnreachable ? (
                <TooltipContent>
                  Server is unreachable at the moment
                </TooltipContent>
              ) : null}
            </Tooltip>
          </TooltipProvider>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          New here? <Link href={`/auth/sign-up?next=${encodeURIComponent(safeRedirectTo)}`} className="underline">Create an account</Link>
        </p>
      </CardContent>
    </Card>
  )
}
