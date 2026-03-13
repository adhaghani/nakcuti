import { SignInForm } from "@/components/auth/sign-in-form"
import { sanitizeRedirectTarget } from "@/lib/auth/safe-redirect"

interface SignInPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  const next = sanitizeRedirectTarget(params.next)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl items-center px-4 py-10 sm:px-6">
      <SignInForm redirectTo={next} />
    </main>
  )
}
