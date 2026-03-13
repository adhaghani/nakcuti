import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase/auth/server"

export default async function PlannerSettingsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Sign in to unlock saved plans and draft history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Planner browsing is public, but persistence features require an account.</p>
            <Link href="/auth/sign-in" className="inline-flex rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent">
              Sign in now
            </Link>
          </CardContent>
        </Card>
      </section>
    )
  }

  const { data: drafts } = await supabase
    .from("generated_drafts")
    .select("id,created_at,language,tone,leave_dates")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Account and persistence controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Signed in as: {user.email}</p>
          <p>Saved plans and generated drafts are now connected to your account.</p>
          <p>Recent drafts:</p>
          {drafts && drafts.length > 0 ? (
            <div className="space-y-2">
              {drafts.map((draft) => (
                <div key={draft.id} className="rounded border p-2">
                  <p>
                    {draft.language.toUpperCase()} | {draft.tone} | {draft.leave_dates.join(", ")}
                  </p>
                  <p className="text-xs">{new Date(draft.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs">No saved drafts yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
