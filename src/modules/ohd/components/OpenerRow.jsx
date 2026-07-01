"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

export default function OpenerRow({ item, index, onUpdate, openers }) {
  return (
    <div className={styles.formRowOpener}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Opener Qty</label>
        <Form.Control
          className="ohd-field-control"
          type="number"
          min="0"
          step="1"
          value={item.opener_quantity || ""}
          onChange={(e) => onUpdate(index, "opener_quantity", e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Opener</label>
        <Form.Select
          className="ohd-field-control"
          value={item.opener_id || ""}
          onChange={(e) => onUpdate(index, "opener_id", e.target.value)}
        >
          <option value="">Select...</option>
          {(openers || []).map((o) => (
            <option key={o.opener_id} value={String(o.opener_id)}>
              {o.opener_name}
            </option>
          ))}
        </Form.Select>
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Price</label>
        <div className={styles.fieldValue}>—</div>
      </div>
    </div>
  );
}