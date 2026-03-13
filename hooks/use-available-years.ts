"use client"

import { useEffect, useState } from "react"

interface UseAvailableYearsResult {
  years: number[]
  loading: boolean
}

export function useAvailableYears(): UseAvailableYearsResult {
  const [years, setYears] = useState<number[]>([2026])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch("/api/planner/available-years", {
          signal: controller.signal,
        })
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { years?: number[] }
        if (Array.isArray(data.years) && data.years.length > 0) {
          setYears(data.years)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
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
  }, [])

  return { years, loading }
}
