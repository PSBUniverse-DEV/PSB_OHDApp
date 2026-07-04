"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

function getGlassCategory(windowTypes, windowsTypeId) {
  if (!windowsTypeId) return "";
  const wt = windowTypes.find(w => String(w.windows_type_id) === String(windowsTypeId));
  return wt?.windows_glass_category || "";
}

export default function WindowRow({ item, index, onUpdate, windowTypes }) {
  const glassCategory = getGlassCategory(windowTypes, item.windows_type_id);
  return (
    <div className={styles.formRowWindows}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Windows Qty</label>
        <Form.Control
          className="ohd-field-control"
          type="number"
          min="0"
          step="1"
          value={item.windows_quantity || ""}
          onChange={(e) => onUpdate(index, "windows_quantity", e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Type</label>
        <Form.Select
          className="ohd-field-control"
          value={item.windows_type_id || ""}
          onChange={(e) => onUpdate(index, "windows_type_id", e.target.value)}
        >
          <option value="">Select...</option>
          {(windowTypes || []).map((w) => (
            <option key={w.windows_type_id} value={String(w.windows_type_id)}>
              {w.windows_type}
            </option>
          ))}
        </Form.Select>
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Glass</label>
        <div className={styles.fieldValue}>{glassCategory || "—"}</div>
      </div>
    </div>
  );
}
