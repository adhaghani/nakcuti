"use client"

import { useEffect, useState } from "react"

import type { PlannerCalendarResponse } from "@/lib/domain/holidays"
import { usePlannerQuery } from "@/hooks/use-planner-query"

interface PlannerCalendarState {
  data: PlannerCalendarResponse | null
  loading: boolean
  error: string | null
}

export function usePlannerCalendar(): PlannerCalendarState {
  const { queryString, isReady } = usePlannerQuery()

  const [data, setData] = useState<PlannerCalendarResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/planner/calendar?${queryString}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error("Unable to load planner calendar")
        }

        const payload = (await response.json()) as PlannerCalendarResponse
        setData(payload)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setError("Could not load calendar data. Please try again.")
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
    data,
    loading,
    error,
  }
}
