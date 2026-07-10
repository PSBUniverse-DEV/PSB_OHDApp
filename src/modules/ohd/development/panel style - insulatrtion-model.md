src\modules\ohd\development\rules and references\database-table-reference.md
src\modules\ohd\development\rules and references\migration_script_requirements.md
src\modules\ohd\components\DoorStyleRow.jsx
src\modules\ohd\components\InsulationRow.jsx
src\modules\ohd\pages\OhdSetupView.jsx
src\modules\ohd\pages\OhdSetupPage.js
src\modules\ohd\pages\OhdProjectFormView.jsx
src\modules\ohd\pages\OhdProjectFormPage.js
---

# Refactor OHD Door Configuration (Combine Pane Style + Insulation + Model)

## Background

During the database design, I made an oversight.

The current UI treats these as three independent selections:

* Pane/Panel Style
* Insulation
* Model

However, the database and pricing sheet do **not** store these as independent entities.

The actual relationship is:

* **Type** = Pane/Panel Style
* **R-Value** = Insulation
* **Model** = Model

These three values always belong to the same record.

Example from the pricing sheet:

| Type                       | R-Value        | Model |
| -------------------------- | -------------- | ----- |
| Classic Raised Panel Short | Non-Insulated  | 5110  |
| Classic Raised Panel Short | Insulated R6.8 | 5210  |
| Classic Raised Panel Short | Insulated R10  | 6410  |

These are **one record**, not three separate lookup tables.

Therefore, the current UI is incorrect because it lets users create combinations that do not exist.

Example of an invalid combination:

* Classic Raised Panel Short
* R10
* Model 5210

That combination should never be possible.

---

# Goal

Replace the three dropdowns with **one dropdown** that represents the complete configuration.

Instead of:

```
Pane Style
Insulation
Model
```

Use a single selector:

```
Classic Raised Panel Short - Non-Insulated - 5110

Classic Raised Panel Short - Insulated R6.8 - 5210

Classic Raised Panel Short - Insulated R10 - 6410

Carriage Panel Short - Insulated R6.8 - 5212
```

The user selects one option.

Internally it contains:

* Pane Style
* Insulation
* Model

---

# Required Changes

## Phase 1 — Database

Review the current database.

Determine whether the current table already contains:

* Type
* RValue
* Model

If yes:

Do **NOT** normalize them into separate tables.

Treat each row as one selectable configuration.

If additional fields are required, make only the minimal changes.

Do not redesign the schema.

---

## Phase 2 — Repository

Update the repository.

Instead of exposing:

```
GetPaneStyles()

GetInsulations()

GetModels()
```

Create something similar to:

```
GetDoorConfigurations()

or

GetDoorModelConfigurations()
```

Each item should contain:

```
Id

Type

RValue

Model

DisplayName
```

Where

DisplayName =

```
{Type} - {RValue} - {Model}
```

Example

```
Classic Raised Panel Short - Insulated R6.8 - 5210
```

---

## Phase 3 — Setup Page

Update the Setup page.

Currently there are separate maintenance pages.

Review whether maintaining Pane Styles separately still makes sense.

If those tables are now only parts of a single configuration, simplify the maintenance accordingly.

Do **not** duplicate data across multiple tables.

Keep maintenance aligned with the pricing sheet.

---

## Phase 4 — Application Form

In Door Items:

Remove

* Pane Style dropdown
* Insulation dropdown
* Model dropdown

Replace them with

```
Door Configuration
```

or

```
Panel Configuration
```

Single dropdown.

Example:

```
Classic Raised Panel Short - Insulated R6.8 - 5210
```

After selection, the application should internally know:

```
Type

RValue

Model
```

without requiring additional user input.

---

## Phase 5 — Pricing Logic

Review every pricing calculation.

Ensure nothing still expects:

```
PaneStyleId

InsulationId

ModelId
```

Update pricing logic to use the selected configuration record instead.

---

## Phase 6 — Validation

Ensure users cannot create impossible combinations anymore.

For example:

❌

Classic Raised Panel

*

R10

*

5210

should never be possible.

Only combinations that exist in the master pricing table should be selectable.

---

# UI Requirements

The new control should be cleaner.

Current:

```
Pane Style

Insulation

Model
```

New:

```
Door Configuration

▼ Classic Raised Panel Short - Insulated R6.8 - 5210
```

Only one control.

Fewer clicks.

No invalid combinations.

Better UX.

---

# Files to Review

Review every file related to:

* Door Item component
* Quote page
* Setup page
* Repositories
* Services
* DTOs
* Models
* Validation
* Pricing calculation
* Snapshot generation (if applicable)

Do not make partial changes.

---

# Second Pass (Mandatory)

After implementation, perform a complete second review before considering the task complete.

### Verify:

* No references remain to the old three-dropdown implementation.
* No orphaned repository methods exist.
* No unused DTO properties remain.
* No dead code related to Pane Style, Insulation, or Model selectors remains.
* All calculations use the new Door Configuration selection.
* Existing projects can still load correctly.
* Editing an existing quote still works.
* Saving and updating quotes still works.
* Snapshot generation still stores the correct values.
* Setup page still allows maintaining the available configurations.
* The UI contains only one Door Configuration selector.
* No validation or runtime errors occur.

Finally, provide a summary listing:

* Files modified
* Database changes (if any)
* Repository changes
* UI changes
* Pricing logic changes
* Any breaking changes
* Any migration required

Do not mark the task as complete until every verification item has been checked.
