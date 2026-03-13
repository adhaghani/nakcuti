"use client"

import { useEffect, useState } from "react"

import type { LeaveOpportunity } from "@/lib/domain/holidays"
import { usePlannerQuery } from "@/hooks/use-planner-query"

interface PlannerOptimizerState {
  year: number | null
  score: number
  opportunities: LeaveOpportunity[]
  loading: boolean
}

export function usePlannerOptimizer(): PlannerOptimizerState {
  const { queryString, isReady } = usePlannerQuery()
  const [year, setYear] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [opportunities, setOpportunities] = useState<LeaveOpportunity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isReady) {
      setLoading(false)
      setYear(null)
      setScore(0)
      setOpportunities([])
      return
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setYear(null)
      setScore(0)
      setOpportunities([])

      try {
        const response = await fetch(`/api/optimizer/score?${queryString}`, {
          signal: controller.signal,
        })

        if (response.ok) {
          const payload = (await response.json()) as { year?: number; score?: number; opportunities?: LeaveOpportunity[] }
          setYear(payload.year ?? null)
          setScore(payload.score ?? 0)
          setOpportunities(payload.opportunities ?? [])
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setYear(null)
          setScore(0)
          setOpportunities([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [isReady, queryString])

  return {
    year,
    score,
    opportunities,
    loading,
  }
}
