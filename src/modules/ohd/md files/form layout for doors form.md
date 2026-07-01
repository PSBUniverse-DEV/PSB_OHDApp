page: src\modules\ohd\pages\OhdProjectFormView.jsx
line: 339 - 433


Based on the layout, this is essentially a **compact quote line item form**. It's optimized for fast data entry where related fields are grouped horizontally instead of using the typical vertical form layout.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Qty [Textbox]     Width [Textbox]      Height [Textbox]                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Pane Style Door [Dropdown]      Color [%Textbox] [Color Dropdown]           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Insulation [Dropdown]   Model [Dropdown]   Track Option [Dropdown]          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Opener Qty [Textbox]          Opener [Dropdown]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Windows Qty [Textbox]         Type [Dropdown]      Glass [Dropdown]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# React / HTML Structure

Instead of making everything manually aligned with flexboxes, I would build it using a **12-column CSS Grid**.

```jsx
<div className="door-form">

    {/* Row 1 */}
    <div className="form-row">

        <div className="field qty">
            <label>Qty</label>
            <input />
        </div>

        <div className="field width">
            <label>Width</label>
            <input />
        </div>

        <div className="field height">
            <label>Height</label>
            <input />
        </div>

        <div className="field price">
            <label>Price</label>
            <input readOnly />
        </div>

    </div>

    {/* Row 2 */}

    <div className="form-row">

        <div className="field pane-style">
            <label>Pane Style Door</label>
            <select />
        </div>

        <div className="field color-percent">
            <label>Color</label>
            <select />
        </div>

        <div className="field color-name">
            <select />
        </div>

        <div className="field price">
            <input readOnly />
        </div>

    </div>

    {/* Row 3 */}

    <div className="form-row">

        <div className="field insulation">
            <label>Insulation</label>
            <select />
        </div>

        <div className="field model">
            <label>Model</label>
            <input readOnly />
        </div>

        <div className="field track">
            <label>Track Option</label>
            <select />
        </div>

        <div className="field price">
            <input readOnly />
        </div>

    </div>

    {/* Row 4 */}

    <div className="form-row">

        <div className="field openerQty">
            <label>Opener Qty</label>
            <input />
        </div>

        <div className="field opener">
            <label>Opener</label>
            <select />
        </div>

        <div className="field price">
            <input readOnly />
        </div>

    </div>

    {/* Row 5 */}

    <div className="form-row">

        <div className="field windowQty">
            <label>Windows Qty</label>
            <input />
        </div>

        <div className="field windowType">
            <label>Type</label>
            <select />
        </div>

        <div className="field glass">
            <label>Glass</label>
            <select />
        </div>

    </div>

</div>
```

---

# CSS Layout

```css
.door-form{
    display:flex;
    flex-direction:column;
    gap:8px;
}

.form-row{
    display:grid;
    grid-template-columns:
        80px
        180px
        180px
        220px;
    gap:12px;
    align-items:end;
}

.field{
    display:flex;
    flex-direction:column;
    gap:4px;
}

.field label{
    font-size:.85rem;
    font-weight:600;
}
```

---

# Better UI/UX

Rather than mimicking Excel exactly, I'd modernize it while preserving the fast-entry workflow.

```
Qty        Width       Height                    
[1]        [10]        [10]                     

────────────────────────────────────────────────────────────

Door Style
[ Carriage Panel Short ▼ ]     

Color
[0% ▼]   [White ▼]             

Insulation
[R6.8 ▼]    Model [▼]    Track [0 ▼]    

Opener
Qty [ ]      [None ▼]                     

Windows
Qty [ ]      Type [ ]      Glass [ ]
```

This version:

* Groups related inputs together.
* Makes scanning easier.
* Gives each option its own visual section.
* Still allows very fast keyboard navigation.

---

## Recommended Component Architecture (React)

For maintainability, don't build this as one large form. Break it into reusable row components:

```
DoorQuoteForm
│
├── DimensionRow
│      Qty
│      Width
│      Height
│      Total Price
│
├── DoorStyleRow
│      Panel Style
│      Color %
│      Color
│      Price
│
├── InsulationRow
│      Insulation
│      Model
│      Track Option
│      Price
│
├── OpenerRow
│      Qty
│      Opener
│      Price
│
└── WindowRow
       Qty
       Type
       Glass
```

This approach fits well with your **PSBUniverse** architecture because each row becomes an independent component responsible for its own inputs and calculations, making future additions (e.g., spring options, decorative hardware, locks) straightforward without turning the form into a monolithic component.
