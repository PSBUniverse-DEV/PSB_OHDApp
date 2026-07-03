-- ============================================================
-- Migration 001: Add calculation columns to project items & snapshot
-- ============================================================
-- Date: 2026-07-03
-- Description: Adds per-door pricing columns (dimension_price,
--   pane_style_price, insulation_price, windows_price, item_total)
--   to ohd_t_project_items and ohd_t_project_snapshot.
--   Also adds header_seal and multiplier if not already present.
-- ============================================================

-- ─── ohd_t_project_items ───

ALTER TABLE public.ohd_t_project_items
  ADD COLUMN IF NOT EXISTS header_seal numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_items
  ADD COLUMN IF NOT EXISTS multiplier integer null default 1;

ALTER TABLE public.ohd_t_project_items
  ADD COLUMN IF NOT EXISTS dimension_price numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_items
  ADD COLUMN IF NOT EXISTS pane_style_price numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_items
  ADD COLUMN IF NOT EXISTS insulation_price numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_items
  ADD COLUMN IF NOT EXISTS windows_price numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_items
  ADD COLUMN IF NOT EXISTS item_total numeric(18, 2) null;

-- ─── ohd_t_project_snapshot ───

ALTER TABLE public.ohd_t_project_snapshot
  ADD COLUMN IF NOT EXISTS header_seal numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_snapshot
  ADD COLUMN IF NOT EXISTS multiplier integer null default 1;

ALTER TABLE public.ohd_t_project_snapshot
  ADD COLUMN IF NOT EXISTS dimension_price numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_snapshot
  ADD COLUMN IF NOT EXISTS pane_style_price numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_snapshot
  ADD COLUMN IF NOT EXISTS insulation_price numeric(18, 2) null;

ALTER TABLE public.ohd_t_project_snapshot
  ADD COLUMN IF NOT EXISTS windows_price numeric(18, 2) null;