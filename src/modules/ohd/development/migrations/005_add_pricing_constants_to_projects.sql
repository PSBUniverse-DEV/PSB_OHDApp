-- ============================================================
-- Migration 005: Add pricing constants to projects table
-- ============================================================
-- Started At : 2026-07-05
-- Schema     : public
-- ============================================================

-- [STEP 1/4]
-- Checking table: ohd_t_projects

ALTER TABLE public.ohd_t_projects
  ADD COLUMN IF NOT EXISTS header_seal numeric(18, 2) null;

-- ✔ Column header_seal added successfully.

-- [STEP 2/4]
-- Checking table: ohd_t_projects

ALTER TABLE public.ohd_t_projects
  ADD COLUMN IF NOT EXISTS rev_and_seal numeric(18, 2) null;

-- ✔ Column rev_and_seal added successfully.

-- [STEP 3/4]
-- Checking table: ohd_t_projects

ALTER TABLE public.ohd_t_projects
  ADD COLUMN IF NOT EXISTS multiplier integer null default 1;

-- ✔ Column multiplier added successfully.

-- [STEP 4/4]
-- Migration complete.

-- ============================================================
-- Migration 005 Complete
-- ============================================================
-- Columns Added  : 3
-- Status         : SUCCESS
-- ============================================================

SELECT
    '005' AS migration,
    'Add Pricing Constants to Projects Table' AS name,
    0 AS tables_created,
    1 AS tables_updated,
    3 AS columns_added,
    0 AS columns_skipped,
    0 AS rows_inserted,
    0 AS rows_updated,
    0 AS rows_unchanged,
    0 AS warnings,
    0 AS errors,
    'SUCCESS' AS status,
    now() AS finished_at,
    EXTRACT(EPOCH FROM (now() - now()))::numeric(10,2) AS duration_seconds;