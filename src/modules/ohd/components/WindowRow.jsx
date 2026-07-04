"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

export default function WindowRow({ item, index, onUpdate, windowTypes }) {
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
        <label className={styles.fieldLabel}>Type and Glass</label>
        <Form.Select
          className="ohd-field-control"
          value={item.windows_type_id || ""}
          onChange={(e) => onUpdate(index, "windows_type_id", e.target.value)}
        >
          <option value="">Select...</option>
          {(windowTypes || []).map((w) => (
            <option key={w.windows_type_id} value={String(w.windows_type_id)}>
              {w.windows_type} - {w.windows_glass_category || "N/A"}
            </option>
          ))}
        </Form.Select>
      </div>
    </div>
  );
}
