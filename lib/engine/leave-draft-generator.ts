import type { LeaveDraftRequest } from "@/lib/domain/holidays"

import { isLeaveDraftAiEnabled } from "@/lib/ai/feature-flags"
import { maskLeaveDraftInput, unmaskLeaveDraftOutput } from "@/lib/ai/masking"
import { createOpenRouterChatCompletion } from "@/lib/ai/openrouter-client"

const DEFAULT_PRIMARY_MODEL = "openai/gpt-4o-mini"
const DEFAULT_FALLBACK_MODEL = "anthropic/claude-3.5-haiku"

type LeaveDraftLanguage = "bm" | "en"
type LeaveDraftTone = "formal" | "friendly"

interface LeaveDraftMeta {
  language: LeaveDraftLanguage
  tone: LeaveDraftTone
  generator: string
  usedAi: boolean
  model?: string
  fallbackReason?: string
}

export interface LeaveDraftGenerationResult {
  draft: string
  meta: LeaveDraftMeta
}

function getPrimaryModel(): string {
  return process.env.OPENROUTER_MODEL_PRIMARY?.trim() || DEFAULT_PRIMARY_MODEL
}

function getFallbackModel(): string {
  return process.env.OPENROUTER_MODEL_FALLBACK?.trim() || DEFAULT_FALLBACK_MODEL
}

function getTimeoutMs(): number {
  const parsed = Number.parseInt(process.env.OPENROUTER_TIMEOUT_MS ?? "", 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 12000
  }

  return parsed
}

function isValidDraft(value: string): boolean {
  return value.trim().length > 0
}

function createPrompt(input: LeaveDraftRequest): string {
  return [
    `Language: ${input.language}`,
    `Tone: ${input.tone}`,
    `Employee name: ${input.employeeName}`,
    `Manager name: ${input.managerName}`,
    `Leave dates: ${input.leaveDates.join(", ")}`,
    `Reason: ${input.reason}`,
  ].join("\n")
}

function templateMetadata(input: LeaveDraftRequest, fallbackReason?: string): LeaveDraftMeta {
  return {
    language: input.language,
    tone: input.tone,
    generator: "template-v1",
    usedAi: false,
    fallbackReason,
  }
}

async function generateAiDraft(input: LeaveDraftRequest): Promise<LeaveDraftGenerationResult> {
  const masked = maskLeaveDraftInput(input)
  const timeoutMs = getTimeoutMs()
  const models = [getPrimaryModel(), getFallbackModel()]

  for (const model of models) {
    try {
      const response = await createOpenRouterChatCompletion({
        model,
        messages: [
          {
            role: "system",
            content:
              "You write professional leave request letters. Preserve requested language and tone exactly. Include leave dates and reason naturally. Output plain text only with no markdown.",
          },
          {
            role: "user",
            content: createPrompt(masked.input),
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
        timeoutMs,
      })

      const unmasked = unmaskLeaveDraftOutput(response.content, masked.context).trim()
      if (!isValidDraft(unmasked)) {
        continue
      }

      return {
        draft: unmasked,
        meta: {
          language: input.language,
          tone: input.tone,
          generator: "openrouter-v1",
          usedAi: true,
          model: response.modelUsed,
        },
      }
    } catch {
      continue
    }
  }

  return {
    draft: generateTemplateLeaveDraft(input),
    meta: templateMetadata(input, "openrouter_unavailable"),
  }
}

export function generateTemplateLeaveDraft(input: LeaveDraftRequest): string {
  const joinedDates = input.leaveDates.join(", ")

  if (input.language === "bm") {
    const greeting = input.tone === "formal" ? "Tuan/Puan" : "Hi"
    return `Subjek: Permohonan Cuti Tahunan\n\n${greeting} ${input.managerName},\n\nSaya, ${input.employeeName}, ingin memohon cuti tahunan pada tarikh ${joinedDates}.\n\nSebab permohonan: ${input.reason}.\n\nSaya akan memastikan semua tugasan kritikal diserahkan sebelum cuti bermula dan sentiasa boleh dihubungi sekiranya ada perkara mendesak.\n\nTerima kasih atas pertimbangan pihak ${input.managerName}.\n\nYang benar,\n${input.employeeName}`
  }

  const greeting = input.tone === "formal" ? "Dear" : "Hi"
  return `Subject: Annual Leave Request\n\n${greeting} ${input.managerName},\n\nI would like to request annual leave for ${joinedDates}.\n\nReason for leave: ${input.reason}.\n\nI will ensure all critical tasks are handed over before the leave period, and I will remain reachable for urgent matters if needed.\n\nThank you for your consideration.\n\nSincerely,\n${input.employeeName}`
}

export async function generateLeaveDraft(input: LeaveDraftRequest): Promise<LeaveDraftGenerationResult> {
  if (!isLeaveDraftAiEnabled()) {
    return {
      draft: generateTemplateLeaveDraft(input),
      meta: templateMetadata(input),
    }
  }

  return generateAiDraft(input)
}