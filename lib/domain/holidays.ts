import { z } from "zod"

import type { MalaysianStateCode } from "@/lib/domain/states"

export type HolidayKind = "holiday" | "observed"

export interface PublicHoliday {
  date: string
  name: string
  isNational: boolean
  affectedStates: MalaysianStateCode[]
  kind: HolidayKind
  replacementForDate?: string
  replacementReason?: string
}

export interface CalendarDay {
  date: string
  isWeekend: boolean
  holidayNames: string[]
  isHoliday: boolean
  isWorkingDay: boolean
}

export interface LeaveOpportunity {
  startDate: string
  endDate: string
  leaveDays: string[]
  totalBreakDays: number
  efficiencyScore: number
  reason: string
}

export interface OptimizationResult {
  state: MalaysianStateCode
  opportunities: LeaveOpportunity[]
}

export interface PlannerCalendarDay {
  date: string
  dayOfWeek: number
  month: number
  isWeekend: boolean
  holidays: Array<{
    name: string
    kind: HolidayKind
    replacementForDate?: string
    replacementReason?: string
  }>
  isRecommendedLeave: boolean
  recommendedOpportunityIds: string[]
}

export interface PlannerCalendarOpportunity extends LeaveOpportunity {
  id: string
}

export interface PlannerCalendarResponse {
  meta: {
    state: MalaysianStateCode
    year: number
    annualLeaveBudget: number
    generatedAt: string
    dataVersion: string
  }
  calendarDays: PlannerCalendarDay[]
  opportunities: PlannerCalendarOpportunity[]
  legend: {
    weekend: string
    holiday: string
    observedHoliday: string
    recommendedLeave: string
  }
}

export const optimizerRequestSchema = z.object({
  state: z.string(),
  year: z.number().int().min(2000).max(2100).default(2026),
  annualLeaveBudget: z.number().int().min(0).max(30).default(12),
})

export type OptimizerRequest = z.infer<typeof optimizerRequestSchema>

export const leaveDraftSchema = z.object({
  language: z.enum(["bm", "en"]),
  tone: z.enum(["formal", "friendly"]),
  employeeName: z.string().trim().min(2).max(100),
  managerName: z.string().trim().min(2).max(100),
  leaveDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(30),
  reason: z.string().trim().min(3).max(500),
})

export type LeaveDraftRequest = z.infer<typeof leaveDraftSchema>
