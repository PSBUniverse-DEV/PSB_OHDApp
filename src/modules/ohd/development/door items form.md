<!DOCTYPE html>
<html>
  <head>
    <title>Hello, World!</title>
    <link rel="stylesheet" href="styles.css" />

    <style>
      .door-card{

    background:#fff;

    border:1px solid #d7dee8;

    border-radius:8px;

    padding:20px;

    display:flex;

    flex-direction:column;

    gap:16px;
}

.door-header{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding-bottom:12px;

    border-bottom:1px solid #ececec;
}

.grid{

    display:grid;

    gap:16px;

    align-items:end;
}

.row-3{

    grid-template-columns:

        90px

        1fr

        1fr;
}

.row-2{

    grid-template-columns:

        90px

        1fr;
}

.field{

    display:flex;

    flex-direction:column;

    gap:6px;
}

.field label{

    font-size:11px;

    font-weight:600;

    text-transform:uppercase;

    letter-spacing:.4px;

    color:#42526e;
}

input,
select{

    height:38px;

    border-radius:4px;

    border:1px solid #d8dee8;

    padding:0 12px;

    font-size:14px;

    width:100%;

    box-sizing:border-box;
}

.btn-remove{

    height:34px;

    padding:0 16px;
}
    </style>
  </head>
  <body>
      <div class="door-card">

    <div class="door-header">
        <h3>Door 1</h3>

        <button class="btn-remove">
            Remove
        </button>
    </div>

    <div class="grid row-3">

        <div class="field small">
            <label>Qty</label>
            <input type="number">
        </div>

        <div class="field">
            <label>Width (in)</label>
            <input type="number">
        </div>

        <div class="field">
            <label>Height (in)</label>
            <input type="number">
        </div>

    </div>

    <div class="field">
        <label>Door Configuration</label>

        <select>
            <option>Select configuration...</option>
        </select>
    </div>

    <div class="grid row-3">

        <div class="field small">
            <label>Color %</label>
            <input type="number">
        </div>

        <div class="field">
            <label>Color Option</label>
            <select></select>
        </div>

        <div class="field">
            <label>Track Option</label>
            <select></select>
        </div>

    </div>

    <div class="grid row-2">

        <div class="field small">
            <label>Opener Qty</label>
            <input type="number">
        </div>

        <div class="field">
            <label>Opener</label>
            <select></select>
        </div>

    </div>

    <div class="grid row-2">

        <div class="field small">
            <label>Windows Qty</label>
            <input type="number">
        </div>

        <div class="field">
            <label>Type & Glass</label>
            <select></select>
        </div>

    </div>

</div>
  </body>
</html>