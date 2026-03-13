"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { isPlannerQueryComplete, parsePlannerQueryDraft, plannerQueryString } from "@/lib/planner/query"

export function usePlannerQuery() {
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  const draftQuery = useMemo(() => parsePlannerQueryDraft(new URLSearchParams(searchParamsString)), [searchParamsString])
  const query = useMemo(() => (isPlannerQueryComplete(draftQuery) ? draftQuery : null), [draftQuery])
  const queryString = useMemo(() => (query ? plannerQueryString(query) : ""), [query])

  return {
    draftQuery,
    query,
    queryString,
    isReady: query !== null,
  }
}
