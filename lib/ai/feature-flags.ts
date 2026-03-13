function isEnabled(value: string | undefined): boolean {
  return (value ?? "").toLowerCase() === "true"
}

export function isLeaveDraftAiEnabled(): boolean {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  return isEnabled(process.env.AI_LEAVE_DRAFT_ENABLED) && Boolean(apiKey)
}