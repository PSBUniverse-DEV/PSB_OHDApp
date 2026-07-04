-- ============================================================
-- Migration 002: Remove pricing constants from project items
-- ============================================================
-- Date: 2026-07-04
-- Description: Removes header_seal, rev_seal, and multiplier
--   from ohd_t_project_items since these are now stored in
--   ohd_s_pricing_constants as global constants.
--   They remain in ohd_t_project_snapshot for historical accuracy.
-- ============================================================

-- ─── ohd_t_project_items ───

ALTER TABLE public.ohd_t_project_items
  DROP COLUMN IF EXISTS header_seal;

ALTER TABLE public.ohd_t_project_items
  DROP COLUMN IF EXISTS rev_seal;

ALTER TABLE public.ohd_t_project_items
  DROP COLUMN IF EXISTS multiplier;