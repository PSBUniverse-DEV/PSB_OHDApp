"use client";

import { Form } from "react-bootstrap";
import styles from "./DoorQuoteForm.module.css";

export default function DoorStyleRow({ item, index, onUpdate, doorConfigurations }) {
  return (
    <div className={styles.formRow}>
      <div className={styles.field} style={{ flex: 1 }}>
        <label className={styles.fieldLabel}>Door Configuration</label>
        <Form.Select
          className="ohd-field-control"
          value={item.ins_type_id || ""}
          onChange={(e) => onUpdate(index, "ins_type_id", e.target.value)}
        >
          <option value="">Select configuration...</option>
          {(doorConfigurations || []).map((dc) => (
            <option key={dc.ins_type_id} value={String(dc.ins_type_id)}>
              {dc.type_name} - {dc.r_value} - {dc.model}
            </option>
          ))}
        </Form.Select>
      </div>
    </div>
  );
}
