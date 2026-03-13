import { SignUpForm } from "@/components/auth/sign-up-form"
import { sanitizeRedirectTarget } from "@/lib/auth/safe-redirect"

interface SignUpPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams
  const next = sanitizeRedirectTarget(params.next)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl items-center px-4 py-10 sm:px-6">
      <SignUpForm redirectTo={next} />
    </main>
  )
}
