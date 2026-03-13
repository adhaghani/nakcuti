import { createHash } from "node:crypto"

import { getSupabaseAdminClient } from "@/lib/supabase/admin"

import type { NormalizedHolidayRecord } from "@/lib/ingestion/normalize-malaysia-holidays"

export interface UpsertHolidayInput {
  year: number
  source: string
  sourceUrl: string
  dryRun?: boolean
  records: NormalizedHolidayRecord[]
  rawRows: Array<{ date: string; weekday: string; name: string; rawRow: unknown }>
}

export interface UpsertHolidayResult {
  runId: number
  insertedCount: number
  updatedCount: number
  skippedCount: number
  anomalyCount: number
  dryRun: boolean
}

export async function upsertHolidaysIntoSupabase(input: UpsertHolidayInput): Promise<UpsertHolidayResult> {
  const supabase = getSupabaseAdminClient()
  const checksum = createHash("sha256").update(JSON.stringify(input.rawRows)).digest("hex")

  const { data: runData, error: runError } = await supabase
    .from("holiday_ingestion_runs")
    .insert({
      year: input.year,
      source: input.source,
      source_url: input.sourceUrl,
      status: input.dryRun ? "dry_run" : "running",
      checksum,
    })
    .select("id")
    .single()

  if (runError || !runData) {
    throw new Error(`Unable to create ingestion run: ${runError?.message ?? "unknown error"}`)
  }

  const runId = runData.id as number

  const stagingPayload = input.rawRows.map((row) => {
    const normalized = input.records.find((record) => record.date === row.date && record.name === row.name)
    return {
      ingestion_run_id: runId,
      year: input.year,
      source: input.source,
      source_url: input.sourceUrl,
      date: row.date,
      weekday: row.weekday,
      name: row.name,
      raw_row: row.rawRow,
      normalized_name: normalized?.normalizedName,
      inferred_states: normalized?.affectedStates ?? [],
      inferred_is_national: normalized?.isNational ?? true,
      confidence_score: normalized?.confidenceScore ?? 0,
    }
  })

  const { error: stageError } = await supabase.from("holiday_staging").insert(stagingPayload)
  if (stageError) {
    throw new Error(`Unable to write staging rows: ${stageError.message}`)
  }

  if (input.dryRun) {
    await supabase
      .from("holiday_ingestion_runs")
      .update({
        status: "dry_run",
        inserted_count: 0,
        updated_count: 0,
        skipped_count: input.records.length,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId)

    return {
      runId,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: input.records.length,
      anomalyCount: 0,
      dryRun: true,
    }
  }

  const dbRows = input.records.map((record) => ({
    date: record.date,
    name: record.name,
    is_national: record.isNational,
    affected_states: record.affectedStates,
    kind: record.kind,
    replacement_for_date: record.replacementForDate ?? null,
    replacement_reason: record.replacementReason ?? null,
    source: input.source,
    source_url: input.sourceUrl,
    source_last_seen_at: new Date().toISOString(),
    ingestion_run_id: runId,
    normalized_name: record.normalizedName,
    confidence_score: record.confidenceScore,
  }))

  const { data: lockedRows, error: lockedError } = await supabase
    .from("public_holidays")
    .select("date,name,affected_states")
    .eq("year", input.year)
    .eq("is_locked", true)

  if (lockedError) {
    throw new Error(`Unable to fetch locked records: ${lockedError.message}`)
  }

  const lockedKeys = new Set(
    (lockedRows ?? []).map((row) => `${row.date}|${row.name}|${(row.affected_states ?? []).join(",")}`),
  )

  const safeRows = dbRows.filter(
    (row) => !lockedKeys.has(`${row.date}|${row.name}|${(row.affected_states ?? []).join(",")}`),
  )

  const skippedCount = dbRows.length - safeRows.length

  if (safeRows.length === 0) {
    await supabase
      .from("holiday_ingestion_runs")
      .update({
        status: "success",
        inserted_count: 0,
        updated_count: 0,
        skipped_count: skippedCount,
        anomaly_count: 0,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId)

    return {
      runId,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount,
      anomalyCount: 0,
      dryRun: false,
    }
  }

  const { error: upsertError } = await supabase
    .from("public_holidays")
    .upsert(safeRows, { onConflict: "date,name,affected_states" })

  if (upsertError) {
    await supabase
      .from("holiday_ingestion_runs")
      .update({
        status: "failed",
        warning_messages: [upsertError.message],
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId)
    throw new Error(`Unable to upsert holidays: ${upsertError.message}`)
  }

  await supabase
    .from("holiday_ingestion_runs")
    .update({
      status: "success",
      inserted_count: safeRows.length,
      updated_count: 0,
      skipped_count: skippedCount,
      anomaly_count: 0,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId)

  return {
    runId,
    insertedCount: safeRows.length,
    updatedCount: 0,
    skippedCount,
    anomalyCount: 0,
    dryRun: false,
  }
}
