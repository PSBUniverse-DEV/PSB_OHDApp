"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

export default function InsulationRow({ item, index, onUpdate, colors, trackOptions }) {
  return (
    <div className={styles.formRowInsulation}>
      <div className={styles.field} style={{ flex: "0 0 15%" }}>
        <label className={styles.fieldLabel}>Color %</label>
        <Form.Control
          className="ohd-field-control"
          type="number"
          placeholder="%"
          value={item.color_opacity || ""}
          onChange={(e) => onUpdate(index, "color_opacity", e.target.value)}
        />
      </div>
      <div className={styles.field} style={{ flex: "0 0 45%" }}>
        <label className={styles.fieldLabel}>Color Option</label>
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
      <div className={styles.field} style={{ flex: "0 0 40%" }}>
        <label className={styles.fieldLabel}>Track Option</label>
        <Form.Select
          className="ohd-field-control"
          value={item.track_id || ""}
          onChange={(e) => onUpdate(index, "track_id", e.target.value)}
        >
          <option value="">Select...</option>
          {(trackOptions || []).map((t) => (
            <option key={t.track_id} value={String(t.track_id)}>
              {t.track_name} (${Number(t.track_price || 0).toFixed(2)})
            </option>
          ))}
        </Form.Select>
      </div>
    </div>
  );
}
