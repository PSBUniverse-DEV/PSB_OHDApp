"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

export default function DimensionRow({ item, index, onUpdate }) {
  return (
    <div className={styles.formRowDimension}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Qty</label>
        <Form.Control
          className="ohd-field-control"
          type="number"
          min="1"
          step="1"
          value={item.quantity || ""}
          onChange={(e) => onUpdate(index, "quantity", e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Width (in)</label>
        <Form.Control
          className="ohd-field-control"
          type="number"
          step="0.01"
          value={item.width || ""}
          onChange={(e) => onUpdate(index, "width", e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Height (in)</label>
        <Form.Control
          className="ohd-field-control"
          type="number"
          step="0.01"
          value={item.height || ""}
          onChange={(e) => onUpdate(index, "height", e.target.value)}
        />
      </div>
    </div>
  );
}
