This is actually a limitation of **PostgreSQL/Supabase**, not your migration rules.

The "Results" panel in the Supabase SQL Editor **does not display SQL comments** like:

```sql
-- Checking table...
-- Column added...
```

Those are ignored by the SQL engine.

Your current migration examples are essentially documentation, not runtime output. 

## The correct approach for Supabase PostgreSQL

If you want messages to appear in the **Results** pane, your migrations need to **emit output**.

There are three practical options.

### Option 1 — `RAISE NOTICE` (Recommended)

Wrap your migration in a `DO $$ ... $$;` block and use:

```sql
DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Migration 004';
    RAISE NOTICE 'Checking table: ohd_t_project_snapshot';

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='ohd_t_project_snapshot'
          AND column_name='rev_and_seal'
    ) THEN

        ALTER TABLE public.ohd_t_project_snapshot
        ADD COLUMN rev_and_seal numeric(18,2);

        RAISE NOTICE 'Column rev_and_seal added.';
    ELSE
        RAISE NOTICE 'Column already exists.';
    END IF;

    RAISE NOTICE 'Migration Complete.';
END $$;
```

Pros:

* Native PostgreSQL
* Professional
* Easy to read
* Great for debugging

---

### Option 2 — Return a Result Set (My Recommendation)

Instead of relying on notices, have the migration return rows.

Example:

```sql
SELECT
    'Migration 004' AS migration,
    'ohd_t_project_snapshot' AS table_name,
    'Added rev_and_seal column' AS action,
    'SUCCESS' AS result;
```

The Results pane becomes something like:

| migration     | table_name             | action                    | result  |
| ------------- | ---------------------- | ------------------------- | ------- |
| Migration 004 | ohd_t_project_snapshot | Added rev_and_seal column | SUCCESS |

If several operations occur:

| Step | Object                  | Action                  | Result   |
| ---- | ----------------------- | ----------------------- | -------- |
| 1    | ohd_t_project_snapshot  | Add column rev_and_seal | SUCCESS  |
| 2    | ohd_s_pricing_constants | Upsert Header Seal      | UPDATED  |
| 3    | ohd_s_pricing_constants | Upsert Rev and Seal     | INSERTED |

This is much easier to read than scrolling through notices.

---

### Option 3 — Both (My Recommendation)

Use:

* `RAISE NOTICE` while the migration executes.
* A final `SELECT` summary at the end.

Example:

```text
NOTICE: Checking column...
NOTICE: Column already exists.
NOTICE: Updating setup data...
NOTICE: Header Seal updated.
NOTICE: Migration Complete.
```

Then return:

| Migration | Status  | Tables | Columns | Rows |
| --------- | ------- | ------ | ------- | ---- |
| 004       | SUCCESS | 1      | 1       | 3    |

This gives you both real-time execution logs and a concise summary in the Results pane.

---

## I would update your migration standards

I'd replace the current logging section with something like this:

> **Migration logging must use executable PostgreSQL output rather than comments.**
>
> SQL comments (`--`) are documentation only and will not appear in the Supabase SQL Editor Results pane.
>
> Every migration should:
>
> * Use `RAISE NOTICE` for step-by-step execution logs.
> * Use `IF EXISTS` / `IF NOT EXISTS` checks before schema changes.
> * Use `INSERT ... ON CONFLICT DO UPDATE` for setup/master data.
> * Return a final `SELECT` summary showing:
>
>   * Migration ID
>   * Migration Name
>   * Tables Created
>   * Tables Updated
>   * Columns Added
>   * Columns Skipped
>   * Rows Inserted
>   * Rows Updated
>   * Rows Unchanged
>   * Status (SUCCESS / FAILED)

That approach is much more aligned with how PostgreSQL and the Supabase SQL Editor actually work, and it gives you meaningful feedback after every migration rather than relying on comments that are never executed.
