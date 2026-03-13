import type { LeaveDraftRequest } from "@/lib/domain/holidays"

export const EMPLOYEE_NAME_TOKEN = "[EMPLOYEE_NAME]"
export const MANAGER_NAME_TOKEN = "[MANAGER_NAME]"
export const REDACTED_EMAIL_TOKEN = "[REDACTED_EMAIL]"
export const REDACTED_PHONE_TOKEN = "[REDACTED_PHONE]"

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE_REGEX = /(?:\+?\d[\d\s()-]{7,}\d)/g

export interface LeaveDraftMaskContext {
  employeeName: string
  managerName: string
  redactedEmail?: string
  redactedPhone?: string
}

export interface MaskedLeaveDraftInput {
  input: LeaveDraftRequest
  context: LeaveDraftMaskContext
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function replaceInsensitive(haystack: string, needle: string, replacement: string): string {
  if (!needle.trim()) {
    return haystack
  }

  return haystack.replace(new RegExp(escapeRegExp(needle), "gi"), replacement)
}

function replaceToken(text: string, token: string, value: string | undefined): string {
  if (!value) {
    return text
  }

  return text.split(token).join(value)
}

export function maskLeaveDraftInput(input: LeaveDraftRequest): MaskedLeaveDraftInput {
  const emails = input.reason.match(EMAIL_REGEX) ?? []
  const phones = input.reason.match(PHONE_REGEX) ?? []

  let maskedReason = input.reason
  maskedReason = maskedReason.replace(EMAIL_REGEX, REDACTED_EMAIL_TOKEN)
  maskedReason = maskedReason.replace(PHONE_REGEX, REDACTED_PHONE_TOKEN)
  maskedReason = replaceInsensitive(maskedReason, input.employeeName, EMPLOYEE_NAME_TOKEN)
  maskedReason = replaceInsensitive(maskedReason, input.managerName, MANAGER_NAME_TOKEN)

  return {
    input: {
      ...input,
      employeeName: EMPLOYEE_NAME_TOKEN,
      managerName: MANAGER_NAME_TOKEN,
      reason: maskedReason,
    },
    context: {
      employeeName: input.employeeName,
      managerName: input.managerName,
      redactedEmail: emails[0],
      redactedPhone: phones[0],
    },
  }
}

export function unmaskLeaveDraftOutput(output: string, context: LeaveDraftMaskContext): string {
  let unmasked = output
  unmasked = replaceToken(unmasked, EMPLOYEE_NAME_TOKEN, context.employeeName)
  unmasked = replaceToken(unmasked, MANAGER_NAME_TOKEN, context.managerName)
  unmasked = replaceToken(unmasked, REDACTED_EMAIL_TOKEN, context.redactedEmail)
  unmasked = replaceToken(unmasked, REDACTED_PHONE_TOKEN, context.redactedPhone)
  return unmasked
}