"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

export default function DoorStyleRow({ item, index, onUpdate, paneStyles, colors }) {
  return (
    <div className={styles.formRow}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Pane Style Door</label>
        <Form.Select
          className="ohd-field-control"
          value={item.pane_style_id || ""}
          onChange={(e) => onUpdate(index, "pane_style_id", e.target.value)}
        >
          <option value="">Select...</option>
          {(paneStyles || []).map((p) => (
            <option key={p.pane_style_id} value={String(p.pane_style_id)}>
              {p.style_name}
            </option>
          ))}
        </Form.Select>
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Color</label>
        <div className={styles.colorGroup}>
          <Form.Control
            className="ohd-field-control"
            placeholder="%"
            value={item.color_percent || ""}
            onChange={(e) => onUpdate(index, "color_percent", e.target.value)}
          />
          <Form.Select
            className="ohd-field-control"
            value={item.color_id || ""}
            onChange={(e) => onUpdate(index, "color_id", e.target.value)}
          >
            <option value="">Select...</option>
            {(colors || []).map((c) => (
              <option key={c.color_id} value={String(c.color_id)}>
                {c.color_name}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>&nbsp;</label>
        <div className={styles.fieldValue}>&nbsp;</div>
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Price</label>
        <div className={styles.fieldValue}>—</div>
      </div>
    </div>
  );
}