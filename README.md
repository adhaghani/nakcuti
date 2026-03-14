# Nak Cuti: Cuti Optimiser 2026

Nak Cuti helps Malaysians maximize annual leave by finding sandwich days and long weekends with state-aware holiday handling.

## Implemented in this phase

- Next.js App Router dashboard scaffold on `/`.
- Supabase migration for `public_holidays` with state arrays and replacement metadata.
- 2026 baseline holiday seed including:
  - CNY: `2026-02-17` and `2026-02-18`.
  - Raya Aidilfitri weekend case with replacements.
  - Hari Raya Haji: `2026-05-27`.
  - Malaysia Day: `2026-09-16`.
  - Feb 1 overlap: Thaipusam + FT Day with Monday/Tuesday observed days.
- TypeScript optimization engine with sandwich-day detection and ranked opportunities.
- API routes:
  - `GET /api/optimizer/opportunities`
  - `GET /api/optimizer/score`
  - `POST /api/leave-draft`
  - `POST /api/admin/sync-holidays`
  - `GET/POST /api/drafts` (authenticated)
- UI modules:
  - State selector
  - Cuti score card
  - Opportunities list
  - Leave draft generator (BM/EN, user-selected tone)
  - Budget travel sync placeholder
  - Multi-page planner routes with interactive calendar
  - Auth-aware planner header and settings

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with your Supabase values:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...
HOLIDAY_SYNC_ADMIN_TOKEN=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL_PRIMARY=openai/gpt-4o-mini
OPENROUTER_MODEL_FALLBACK=anthropic/claude-3.5-haiku
OPENROUTER_TIMEOUT_MS=12000
AI_LEAVE_DRAFT_ENABLED=false
```

4. Apply migration in Supabase SQL editor:

`supabase/migrations/20260313000100_create_public_holidays.sql`

`supabase/migrations/20260313000200_ingestion_pipeline.sql`

`supabase/migrations/20260313000300_auth_persistence.sql`

5. Run dev server:

```bash
npm run dev
```

## AI Leave Draft (OpenRouter)

- Enable AI drafting by setting `AI_LEAVE_DRAFT_ENABLED=true` and providing `OPENROUTER_API_KEY`.
- Primary model defaults to `OPENROUTER_MODEL_PRIMARY=openai/gpt-4o-mini`.
- Fallback model defaults to `OPENROUTER_MODEL_FALLBACK=anthropic/claude-3.5-haiku`.
- Request timeout is controlled by `OPENROUTER_TIMEOUT_MS`.
- Fallback order is strict: template (`template-v1`) when AI is disabled, primary model, fallback model, then template with `fallbackReason=openrouter_unavailable` if OpenRouter is unavailable.

## API quick usage

### Opportunities

```bash
curl "http://localhost:3000/api/optimizer/opportunities?state=SGR&year=2026&annualLeaveBudget=12"
```

### Cuti Score

```bash
curl "http://localhost:3000/api/optimizer/score?state=SGR&year=2026&annualLeaveBudget=12"
```

### Leave draft

```bash
curl -X POST "http://localhost:3000/api/leave-draft" \
	-H "Content-Type: application/json" \
	-d '{
		"language": "bm",
		"tone": "formal",
		"employeeName": "Ali",
		"managerName": "Puan Siti",
		"leaveDates": ["2026-02-16"],
		"reason": "Balik kampung sempena Tahun Baru Cina"
	}'
```

### Admin holiday sync (OfficeHolidays fallback)

```bash
curl -X POST "http://localhost:3000/api/admin/sync-holidays" \
	-H "Content-Type: application/json" \
	-H "x-admin-token: $HOLIDAY_SYNC_ADMIN_TOKEN" \
	-d '{
		"year": 2027,
		"dryRun": true
	}'
```

When `dryRun` is `false`, normalized rows are upserted into `public_holidays` and run details are stored in:

- `holiday_ingestion_runs`
- `holiday_staging`

## Generate yearly holiday SQL snippet

Use the CLI script to fetch OfficeHolidays for a specific year and generate a SQL upsert snippet:

```bash
npm run getyear -- 2027
```

Output file:

- `supabase/snippets/holidays-2027.sql`

The generated SQL uses:

- `INSERT ... ON CONFLICT (date, name, affected_states) DO UPDATE`
- conflict updates are skipped for locked rows via `WHERE public.public_holidays.is_locked = false`

## Notes

- If Supabase env vars are missing, holiday reads fallback to in-repo 2026 seed data.
- Auth is enabled with Email + Password (`/auth/sign-in`, `/auth/sign-up`).
- Planner browsing remains public; saving draft history requires sign-in.
- Automated fallback ingestion is available via `/api/admin/sync-holidays` and uses OfficeHolidays source pages.
