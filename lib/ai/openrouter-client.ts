const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

type OpenRouterRole = "system" | "user" | "assistant"

export interface OpenRouterMessage {
  role: OpenRouterRole
  content: string
}

export interface CreateOpenRouterChatCompletionParams {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

export interface OpenRouterChatCompletionResult {
  content: string
  modelUsed: string
}

function parseTimeoutMs(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 12000
  }

  return parsed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function extractContent(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }

  if (!Array.isArray(value)) {
    return ""
  }

  const chunks = value
    .map((item) => {
      if (!isRecord(item)) {
        return ""
      }

      const text = item.text
      return typeof text === "string" ? text : ""
    })
    .filter((chunk) => chunk.length > 0)

  return chunks.join("\n").trim()
}

export async function createOpenRouterChatCompletion(
  params: CreateOpenRouterChatCompletionParams,
): Promise<OpenRouterChatCompletionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  const timeoutMs = params.timeoutMs ?? parseTimeoutMs(process.env.OPENROUTER_TIMEOUT_MS)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Title": "nakcuti",
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (siteUrl) {
    headers["HTTP-Referer"] = siteUrl
  }

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `OpenRouter request failed (${response.status} ${response.statusText}): ${errorBody.slice(0, 500)}`,
      )
    }

    const payload: unknown = await response.json()
    if (!isRecord(payload) || !Array.isArray(payload.choices)) {
      throw new Error("OpenRouter response is missing choices")
    }

    const firstChoice = payload.choices[0]
    if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
      throw new Error("OpenRouter response is missing message content")
    }

    const content = extractContent(firstChoice.message.content)
    if (!content) {
      throw new Error("OpenRouter response returned empty content")
    }

    const modelUsed = typeof payload.model === "string" && payload.model.length > 0 ? payload.model : params.model

    return {
      content,
      modelUsed,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}