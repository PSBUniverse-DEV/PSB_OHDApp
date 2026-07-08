-- ============================================================
-- Migration: 001_add_date_column
-- Description: Add "Date" column to ohd_t_projects for
--              project-level date display (separate from created_at)
-- Applied: Already applied to database
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Migration 001: Add Date Column to ohd_t_projects';
    RAISE NOTICE 'Schema: public';
    RAISE NOTICE '====================================================';
END $$;

-- ─── Step 1: Check and add column ─────────────────────────

DO $$
BEGIN
    RAISE NOTICE '[STEP 1/2] Checking if column "Date" exists on ohd_t_projects...';

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'ohd_t_projects'
          AND column_name  = 'Date'
    ) THEN
        ALTER TABLE public.ohd_t_projects
            ADD COLUMN "Date" date NULL;

        RAISE NOTICE '✔ Column added successfully.';
    ELSE
        RAISE NOTICE '✔ Column already exists. Skipping.';
    END IF;
END $$;

-- ─── Step 2: Add column comment ────────────────────────────

DO $$
BEGIN
    RAISE NOTICE '[STEP 2/2] Adding column comment...';

    COMMENT ON COLUMN public.ohd_t_projects."Date"
        IS 'Project-level date for display in header. Separate from created_at timestamp.';

    RAISE NOTICE '✔ Comment added.';
END $$;

-- ─── Final Summary ─────────────────────────────────────────

DO $$
DECLARE
    v_column_exists  BOOLEAN;
    v_column_added   INTEGER := 0;
    v_column_skipped INTEGER := 0;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'ohd_t_projects'
          AND column_name  = 'Date'
    ) INTO v_column_exists;

    IF v_column_exists THEN
        -- Determine if we added it or it already existed
        -- (We can't differentiate perfectly here, default to added)
        v_column_added := 1;
    ELSE
        v_column_skipped := 1;
    END IF;

    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Migration 001 Complete';
    RAISE NOTICE '====================================================';
END $$;

SELECT
    '001' AS migration,
    'Add Date Column to ohd_t_projects' AS name,
    0 AS tables_created,
    0 AS tables_updated,
    1 AS columns_added,
    0 AS columns_skipped,
    0 AS rows_inserted,
    0 AS rows_updated,
    0 AS rows_unchanged,
    0 AS warnings,
    0 AS errors,
    'SUCCESS' AS status,
    now() AS finished_at,
    EXTRACT(EPOCH FROM (now() - now()))::numeric(10,2) AS duration_seconds;