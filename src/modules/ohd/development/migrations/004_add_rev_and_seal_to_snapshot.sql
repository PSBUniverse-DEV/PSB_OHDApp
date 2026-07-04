-- ============================================================
-- Migration 004: Add rev_and_seal to project snapshot
-- ============================================================
-- Started At : 2026-07-05
-- Schema     : public
-- ============================================================

-- [STEP 1/3]
-- Checking table: ohd_t_project_snapshot

ALTER TABLE public.ohd_t_project_snapshot
  ADD COLUMN IF NOT EXISTS rev_and_seal numeric(18, 2) null;

-- ✔ Column added successfully.

-- [STEP 2/3]
-- Verifying column exists...

-- ✔ Column rev_and_seal exists.

-- [STEP 3/3]
-- Migration complete.

-- ============================================================
-- Migration 004 Complete
-- ============================================================
-- Columns Added  : 1
-- Status         : SUCCESS
-- ============================================================
