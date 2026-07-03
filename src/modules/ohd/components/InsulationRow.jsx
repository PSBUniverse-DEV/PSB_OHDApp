"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

export default function InsulationRow({ item, index, onUpdate, insulationTypes, trackOptions }) {
  return (
    <div className={styles.formRow}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Insulation</label>
        <Form.Select
          className="ohd-field-control"
          value={item.ins_type_id || ""}
          onChange={(e) => onUpdate(index, "ins_type_id", e.target.value)}
        >
          <option value="">Select...</option>
          {(insulationTypes || []).map((t) => (
            <option key={t.ins_type_id} value={String(t.ins_type_id)}>
              {t.type_name}
            </option>
          ))}
        </Form.Select>
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Model</label>
        <div className={styles.fieldValue}>—</div>
      </div>
      <div className={styles.field}>
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
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Price</label>
        <div className={styles.fieldValue}>—</div>
      </div>
    </div>
  );
}