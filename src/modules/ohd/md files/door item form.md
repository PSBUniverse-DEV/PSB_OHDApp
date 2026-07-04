Here's a clearer implementation specification you can give to the AI/developer.

---

# Door Items Form Layout Review

The current **Door Items** form does not match the intended layout. Please redesign it to follow the layout shown in the reference image.

The Door Items section is **strictly for collecting user inputs**. It should not display calculated prices or pricing-related fields.

Use the database reference (`database-table-reference.md`) to ensure every input corresponds to the appropriate database column.

## Layout

Each door should be displayed as its own card (Door 1, Door 2, etc.) with the following sections.

---

## Section 1 — Door Dimensions

This is the first row and should contain six evenly spaced fields.

| Field       | Source                            |
| ----------- | --------------------------------- |
| Quantity    | `ohd_t_project_items.quantity`    |
| Width (in)  | `ohd_t_project_items.width`       |
| Height (in) | `ohd_t_project_items.height`      |
| Header Seal | `ohd_t_project_items.header_seal` |
| Rev Seal    | `ohd_t_project_items.rev_seal`    |
| Multiplier  | `ohd_t_project_items.multiplier`  |

These six fields should occupy the full width of the card with consistent spacing.

---

## Section 2 — Door Style

Second row.

| Field           | Source                                                   |
| --------------- | -------------------------------------------------------- |
| Pane Style Door | `ohd_t_project_items.pane_style_id` → `ohd_s_pane_style` |
| Color %         | `ohd_t_project_items.color_opacity`                      |
| Color           | `ohd_t_project_items.color_id` → `ohd_s_colors`          |

Notes:

* Pane Style is a dropdown.
* Color % is a numeric input.
* Color is a dropdown.

There should **not** be any additional disabled textbox after the Color dropdown. If it has no functional purpose, remove it.

---

## Section 3 — Insulation

Third row.

| Field        | Source                                                                   |
| ------------ | ------------------------------------------------------------------------ |
| Insulation   | `ohd_t_project_items.ins_type_id` → `ohd_s_insulation_type.type_name`    |
| Model        | `ohd_t_project_items.model` (filtered from the selected insulation type) |
| Track Option | `ohd_t_project_items.track_id` → `ohd_s_track_options`                   |

Notes:

* Selecting an insulation type should filter the available models.
* Track Option is an independent dropdown.

---

## Section 4 — Opener

Fourth row.

| Field      | Source                                            |
| ---------- | ------------------------------------------------- |
| Opener Qty | `ohd_t_project_items.opener_quantity`             |
| Opener     | `ohd_t_project_items.opener_id` → `ohd_s_openers` |

---

## Section 5 — Windows

Fifth row.

| Field       | Source                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| Windows Qty | `ohd_t_project_items.windows_quantity`                                    |
| Type        | `ohd_t_project_items.windows_type_id` → `ohd_s_windows_type.windows_type` |
| Glass       | Derived from the selected Window Type (`windows_glass_category`)          |

If the glass selection is determined by the selected window type, populate it accordingly. Otherwise, keep it as a dropdown if the database supports multiple glass options.

---

# Remove From Door Items

The following fields should **not** appear anywhere in the Door Items form:

* Dimension Price
* Pane Style Price
* Insulation Price
* Track Price
* Opener Price
* Windows Price
* Item Total
* Any calculated or read-only pricing fields

These belong exclusively in the **Quote Review** section.

---

# UI Requirements

* Match the spacing shown in the reference layout.
* Align fields into clean rows.
* Use consistent widths.
* Remove unused placeholders and disabled controls.
* Keep the form focused on data entry only.
* Ensure every visible field maps directly to a column in `ohd_t_project_items` or its related setup tables defined in `database-table-reference.md`.




---


Here's the specification with a sample wireframe that follows your intended layout.

---

# Door Items Form Layout

The **Door Items** section should be used **only for collecting user inputs**. It should not display any pricing, calculated values, or read-only fields. All pricing and calculations belong in the **Quote Review** panel.

Each door should be displayed as its own card (Door 1, Door 2, etc.).

---

## Section 1 — Door Dimensions

```
+---------------------------------------------------------------------------------------------+
| DOOR 1                                                              [ Remove ]             |
+---------------------------------------------------------------------------------------------+

+----------+-----------+-----------+-------------+-----------+--------------+
| Qty      | Width (") | Height(") | Header Seal | Rev Seal  | Multiplier   |
| [_____]  | [_____]   | [_____]   | [_____]     | [_____]   | [_____]      |
+----------+-----------+-----------+-------------+-----------+--------------+
```

Database Mapping

| Field       | Database                          |
| ----------- | --------------------------------- |
| Qty         | `ohd_t_project_items.quantity`    |
| Width       | `ohd_t_project_items.width`       |
| Height      | `ohd_t_project_items.height`      |
| Header Seal | `ohd_t_project_items.header_seal` |
| Rev Seal    | `ohd_t_project_items.rev_seal`    |
| Multiplier  | `ohd_t_project_items.multiplier`  |

---

## Section 2 — Door Style

```
+----------------------+-------------+---------------------------------------+
| Pane Style Door      | Color %     | Color                                |
| [ Select ▼ ]         | [____]      | [ Select ▼ ]                         |
+----------------------+-------------+---------------------------------------+
```

Database Mapping

| Field           | Database        |
| --------------- | --------------- |
| Pane Style Door | `pane_style_id` |
| Color %         | `color_opacity` |
| Color           | `color_id`      |

> Remove the unused disabled textbox currently displayed after the Color field.

---

## Section 3 — Insulation & Track

```
+----------------------+-------------------------+---------------------------+
| Insulation           | Model                   | Track Option              |
| [ Select ▼ ]         | [ Select ▼ ]            | [ Select ▼ ]              |
+----------------------+-------------------------+---------------------------+
```

Database Mapping

| Field        | Database      |
| ------------ | ------------- |
| Insulation   | `ins_type_id` |
| Model        | `model`       |
| Track Option | `track_id`    |

**Behavior**

* Selecting an **Insulation Type** should filter the available **Models**.
* Track Option is independent.

---

## Section 4 — Opener

```
+-------------------+-------------------------------------------------------+
| Opener Qty        | Opener                                                |
| [_____]           | [ Select ▼ ]                                          |
+-------------------+-------------------------------------------------------+
```

Database Mapping

| Field      | Database          |
| ---------- | ----------------- |
| Opener Qty | `opener_quantity` |
| Opener     | `opener_id`       |

---

## Section 5 — Windows

```
+-------------------+---------------------------+---------------------------+
| Windows Qty       | Type                      | Glass                     |
| [_____]           | [ Select ▼ ]              | [ Select ▼ ]              |
+-------------------+---------------------------+---------------------------+
```

Database Mapping

| Field       | Database                 |
| ----------- | ------------------------ |
| Windows Qty | `windows_quantity`       |
| Type        | `windows_type_id`        |
| Glass       | `windows_glass_category` |

---

# Complete Sample Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ DOOR 1                                                          [ Remove ]                  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤

 Qty          Width        Height       Header Seal    Rev Seal      Multiplier
 ┌───────┐    ┌────────┐   ┌────────┐   ┌─────────┐    ┌────────┐    ┌─────────┐
 │       │    │        │   │        │   │         │    │        │    │         │
 └───────┘    └────────┘   └────────┘   └─────────┘    └────────┘    └─────────┘


 Pane Style Door        Color %            Color
 ┌─────────────────┐    ┌────────┐         ┌──────────────────────────────┐
 │ Select... ▼     │    │        │         │ Select... ▼                  │
 └─────────────────┘    └────────┘         └──────────────────────────────┘


 Insulation            Model                    Track Option
 ┌─────────────────┐   ┌──────────────────┐     ┌──────────────────────────┐
 │ Select... ▼     │   │ Select... ▼      │     │ Select... ▼              │
 └─────────────────┘   └──────────────────┘     └──────────────────────────┘


 Opener Qty            Opener
 ┌─────────┐           ┌────────────────────────────────────────────────────┐
 │         │           │ Select... ▼                                        │
 └─────────┘           └────────────────────────────────────────────────────┘


 Windows Qty           Type                     Glass
 ┌─────────┐           ┌──────────────────┐     ┌──────────────────────────┐
 │         │           │ Select... ▼      │     │ Select... ▼              │
 └─────────┘           └──────────────────┘     └──────────────────────────┘

└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Design Principles

* No pricing fields inside the Door Items form.
* No calculated values inside the Door Items form.
* One purpose only: **collect user inputs**.
* Pricing, calculations, material breakdown, and totals should be displayed only in the **Quote Review** panel.
* Use a responsive CSS grid so each row spans the full width with consistent spacing, matching the reference wireframe. This keeps the form clean, easy to scan, and scalable as additional door items are added.
