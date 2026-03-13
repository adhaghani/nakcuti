"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface LeaveDraftPanelProps {
  initialLeaveDates?: string
}

export function LeaveDraftPanel({ initialLeaveDates }: LeaveDraftPanelProps) {
  const [draft, setDraft] = useState<string>("")
  const [language, setLanguage] = useState<"bm" | "en">("bm")
  const [tone, setTone] = useState<"formal" | "friendly">("formal")
  const [saveMessage, setSaveMessage] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  function parseLeaveDates(rawDates: string): string[] {
    return rawDates
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  }

  function isValidIsoDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date)
  }

  async function copyDraft() {
    if (!draft) {
      return
    }

    try {
      await navigator.clipboard.writeText(draft)
      setSaveMessage("Draft copied to clipboard.")
    } catch {
      setSaveMessage("Could not copy draft automatically. Please copy it manually.")
    }
  }

  async function onGenerate(formData: FormData) {
    setSaveMessage("")
    setErrorMessage("")
    setIsGenerating(true)

    const leaveDates = parseLeaveDates(String(formData.get("leaveDates") ?? ""))
    const hasInvalidDate = leaveDates.some((date) => !isValidIsoDate(date))
    if (leaveDates.length === 0 || hasInvalidDate) {
      setDraft("")
      setErrorMessage("Use at least one valid date in YYYY-MM-DD format, separated by commas.")
      setIsGenerating(false)
      return
    }

    const payload = {
      language: formData.get("language"),
      tone: formData.get("tone"),
      employeeName: formData.get("employeeName"),
      managerName: formData.get("managerName"),
      leaveDates,
      reason: formData.get("reason"),
    }

    try {
      const response = await fetch("/api/leave-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        setDraft("")
        setErrorMessage("Unable to generate draft. Please check your inputs and try again.")
        return
      }

      const data = await response.json()
      setDraft(data.draft)

      const saveResponse = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: payload.language,
          tone: payload.tone,
          leaveDates: payload.leaveDates,
          reason: payload.reason,
          draftContent: data.draft,
        }),
      })

      if (saveResponse.ok) {
        setSaveMessage("Draft saved to your account history.")
        return
      }

      if (saveResponse.status === 401) {
        setSaveMessage("Sign in to save this draft in your history.")
        return
      }

      setSaveMessage("Draft generated but could not be saved right now. You can still copy it below.")
    } catch {
      setDraft("")
      setErrorMessage("Network error while generating draft. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Draft Generator</CardTitle>
        <CardDescription>The Secretary adapter for BM/English leave emails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void onGenerate(new FormData(event.currentTarget))
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="employeeName">Employee Name</Label>
            <Input id="employeeName" name="employeeName" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="managerName">Manager Name</Label>
            <Input id="managerName" name="managerName" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="leaveDates">Leave Dates (comma separated)</Label>
            <Input
              id="leaveDates"
              name="leaveDates"
              placeholder="2026-02-16, 2026-02-17"
              defaultValue={initialLeaveDates}
              required
            />
            <p className="text-xs text-muted-foreground">Use format YYYY-MM-DD, for example 2026-02-16.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as "bm" | "en")}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bm">Bahasa Melayu</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="language" value={language} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(value) => setTone(value as "formal" | "friendly")}>
              <SelectTrigger id="tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal Corporate</SelectItem>
                <SelectItem value="friendly">Friendly Professional</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="tone" value={tone} />
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <Button type="submit" disabled={isGenerating}>{isGenerating ? "Generating..." : "Generate Draft"}</Button>
        </form>
        <Textarea value={draft} readOnly className="min-h-44" placeholder="Generated draft appears here" />
        <Button type="button" variant="outline" onClick={() => void copyDraft()} disabled={!draft}>Copy Draft</Button>
        {saveMessage ? <p className="text-xs text-muted-foreground">{saveMessage}</p> : null}
      </CardContent>
    </Card>
  )
}
