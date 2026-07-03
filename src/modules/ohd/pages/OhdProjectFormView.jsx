"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container, Row, Col, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faCheck, faFileLines, faLayerGroup,
  faGear, faCirclePlus, faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import { Button, toastError, toastSuccess, toastWarning } from "@/shared/components/ui";
import { saveOhdProject } from "../data/ohdProjectForm.actions";
import {
  createInitialProject, emptyDoorItem, emptyExtra, mapHeaderToProject,
  calculateOhdQuote, formatCurrency
} from "../data/ohdProjectForm.data";
import DimensionRow from "../components/DimensionRow";
import DoorStyleRow from "../components/DoorStyleRow";
import InsulationRow from "../components/InsulationRow";
import OpenerRow from "../components/OpenerRow";
import WindowRow from "../components/WindowRow";
import doorFormStyles from "../components/DoorQuoteForm.module.css";
import styles from "./OhdProject.module.css";

const MIN_ITEMS = 1;
const MAX_ITEMS = 10;
export default function OhdProjectFormView({ mode = "create", projectId = null, setup = {}, projectData = null }) {
  const router = useRouter();
  const isEdit = mode === "edit" && !!projectId;

  // ─── Parse setup data ──────────────────────────────────
  const statuses = useMemo(() => Array.isArray(setup.statuses) ? setup.statuses : [], [setup.statuses]);
  const tripFeeRates = useMemo(() => Array.isArray(setup.tripRates) ? setup.tripRates : [], [setup.tripRates]);
  const colors = useMemo(() => Array.isArray(setup.colors) ? setup.colors : [], [setup.colors]);
  const paneStyles = useMemo(() => Array.isArray(setup.paneStyles) ? setup.paneStyles : [], [setup.paneStyles]);
  const insulationTypes = useMemo(() => Array.isArray(setup.insulationTypes) ? setup.insulationTypes : [], [setup.insulationTypes]);
  const openers = useMemo(() => Array.isArray(setup.openers) ? setup.openers : [], [setup.openers]);
  const windowTypes = useMemo(() => Array.isArray(setup.windowTypes) ? setup.windowTypes : [], [setup.windowTypes]);
  const trackOptions = useMemo(() => Array.isArray(setup.trackOptions) ? setup.trackOptions : [], [setup.trackOptions]);

  // ─── Warnings ──────────────────────────────────────────
  useEffect(() => {
    if (setup.sourceErrors?.length > 0) {
      toastWarning(`Some setup sources failed: ${setup.sourceErrors.join(", ")}.`, "OHD Setup");
    }
  }, [setup.sourceErrors]);

  // ─── Build initial project state ───────────────────────
  const buildInitialProject = useCallback(() => {
    if (isEdit && projectData?.projectHeader) {
      return mapHeaderToProject(
        projectData.projectHeader,
        projectData.projectItems || [],
      );
    }
    const base = createInitialProject();
    return {
      ...base,
      statusId: String(statuses[0]?.status_id || ""),
      tripId: String(tripFeeRates[0]?.trip_id || ""),
    };
  }, [isEdit, projectData, statuses, tripFeeRates]);

  const [project, setProject] = useState(() => buildInitialProject());
  const [saving, setSaving] = useState(false);

  // ─── Field helpers ─────────────────────────────────────
  const updateField = (field, value) => setProject((p) => ({ ...p, [field]: value }));

  const updateItem = (i, field, value) => {
    setProject((p) => {
      const items = [...(p.items || [])];
      items[i] = { ...items[i], [field]: value };
      return { ...p, items };
    });
  };

  const addItem = () => {
    if ((project.items || []).length >= MAX_ITEMS) return;
    setProject((p) => ({ ...p, items: [...(p.items || []), emptyDoorItem()] }));
  };

  const removeItem = (i) => {
    setProject((p) => ({
      ...p,
      items: (p.items || []).length <= MIN_ITEMS ? p.items : (p.items || []).filter((_, idx) => idx !== i),
    }));
  };

  const updateExtra = (i, field, value) => {
    setProject((p) => {
      const extras = [...(p.extras || [])];
      extras[i] = { ...extras[i], [field]: value };
      return { ...p, extras };
    });
  };

  const addExtra = () => {
    if ((project.extras || []).length >= 4) return;
    setProject((p) => ({ ...p, extras: [...(p.extras || []), emptyExtra()] }));
  };

  const removeExtra = (i) => {
    setProject((p) => ({ ...p, extras: (p.extras || []).filter((_, idx) => idx !== i) }));
  };

  // ─── Quote calculation ─────────────────────────────────
  const quoteResult = useMemo(() => {
    if (!project) return null;
    return calculateOhdQuote(project, setup);
  }, [project, setup]);

  // ─── Lookups ───────────────────────────────────────────
  const colorNameById = useMemo(() => {
    const map = {};
    (colors || []).forEach((c) => { map[String(c.color_id)] = c.color_name || ""; });
    return map;
  }, [colors]);

  const paneStyleNameById = useMemo(() => {
    const map = {};
    (paneStyles || []).forEach((p) => { map[String(p.pane_style_id)] = p.style_name || ""; });
    return map;
  }, [paneStyles]);

  const insTypeNameById = useMemo(() => {
    const map = {};
    (insulationTypes || []).forEach((t) => { map[String(t.ins_type_id)] = t.type_name || ""; });
    return map;
  }, [insulationTypes]);

  const openerNameById = useMemo(() => {
    const map = {};
    (openers || []).forEach((o) => { map[String(o.opener_id)] = o.opener_name || ""; });
    return map;
  }, [openers]);

  const windowsTypeNameById = useMemo(() => {
    const map = {};
    (windowTypes || []).forEach((w) => { map[String(w.windows_type_id)] = w.windows_type || ""; });
    return map;
  }, [windowTypes]);

  // ─── Save ──────────────────────────────────────────────
  const saveProject = useCallback(async () => {
    if (!project) return;

    const toIntOrNull = (v) => { if (v === "" || v == null) return null; const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : null; };
    const toNumOrNull = (v) => { if (v === "" || v == null) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };

    const projectNameMissing = !project.projectName?.trim();

    if (!project.statusId || !project.tripId) {
      toastError("Please select Status and Trip Rate.", "Validation");
      return;
    }
    if (projectNameMissing) {
      toastError("Project Name is required.", "Validation");
      return;
    }

    setSaving(true);
    try {
      const subtotal = Number(quoteResult?.pricing?.subtotal || 0);
      const overallTotal = Number(quoteResult?.pricing?.projectTotal || 0);

      const headerPayload = {
        quote_number: project.quote_number,
        project_name: project.projectName,
        project_address: project.projectAddress,
        request_link: project.requestLink,
        status_id: toIntOrNull(project.statusId),
        trip_id: toIntOrNull(project.tripId),
        discount: project.discountIncluded ? toNumOrNull(project.discountPercent) : null,
        downpayment: project.depositIncluded ? toNumOrNull(project.depositPercent) : null,
        price_subtotal: subtotal,
        price_overall_total: overallTotal,
      };

      const itemRows = (project.items || []).map((i) => {
        const qty = toIntOrNull(i.quantity);
        const w = toNumOrNull(i.width);
        const h = toNumOrNull(i.height);
        if (qty === null && w === null && h === null) return null;
        return {
          quantity: qty,
          width: w,
          height: h,
          color_id: toIntOrNull(i.color_id),
          pane_style_id: toIntOrNull(i.pane_style_id),
          ins_type_id: toIntOrNull(i.ins_type_id),
          opener_id: toIntOrNull(i.opener_id),
          windows_type_id: toIntOrNull(i.windows_type_id),
          track_id: toIntOrNull(i.track_id),
          opener_quantity: toIntOrNull(i.opener_quantity),
          windows_quantity: toIntOrNull(i.windows_quantity),
        };
      }).filter(Boolean);

      const extraRows = project.extrasIncluded
        ? (project.extras || []).map((e) => {
            const qty = toIntOrNull(e.qty);
            const price = toNumOrNull(e.unitPrice);
            const name = String(e.description || "").trim();
            if (!name && qty === null && price === null) return null;
            return { name, quantity: qty, unit_price: price };
          }).filter(Boolean)
        : [];

      const result = await saveOhdProject({
        isEdit,
        projectId: isEdit ? toIntOrNull(projectId) : null,
        header: headerPayload,
        items: itemRows,
        extras: extraRows,
      });

      toastSuccess("Project saved.", "OHD Project");
      if (!isEdit && result?.projId) {
        router.push(`/ohd/${result.projId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toastError(err?.message || "Error saving project.", "OHD Project");
    } finally {
      setSaving(false);
    }
  }, [project, isEdit, projectId, router, quoteResult]);

  // ─── Format helpers ────────────────────────────────────
  const fmt = (n) => typeof n === "number" ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const fmtCurrency = (n) => `$${fmt(Number(n || 0))}`;
  const displayOrDash = (v) => v && String(v).trim() ? String(v).trim() : "—";

  const displayDate = project?.createdAt
    ? new Date(project.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
    : "—";

  const discountAmount = Number(quoteResult?.pricing?.discountAmount || 0);
  const hasDiscount = discountAmount > 0;
  const title = isEdit ? "Edit Project" : "Overhead Door Project";
  const subtitle = isEdit ? project?.projectName || project?.projId || "—" : "Create a door quote project";
  const toggleIdPrefix = isEdit ? `edit-${projectId}` : "new";
  const getToggleId = (name) => `ohd-toggle-${toggleIdPrefix}-${name}`;
  const moneyValueStyle = { minWidth: 136, fontVariantNumeric: "tabular-nums" };

  if (!project) return <Container className="py-4">Loading...</Container>;

  return (
    <div className={`${styles.ohdProjectPage}`}>
      {/* ─── Compact Top Header ─── */}
      <div className={styles.ohdHeader}>
        <div className={styles.ohdHeaderLeft}>
          <Link href="/ohd" className={styles.ohdBackLink}>
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          </Link>
          <div className={styles.ohdHeaderTitle}>
            <h1 className={styles.ohdTitle}>{title}</h1>
            <span className={styles.ohdSubtitle}>{subtitle}</span>
          </div>
          <div className={styles.ohdHeaderMeta}>
            <div className={styles.ohdMetaItem}>
              <span className={styles.ohdMetaLabel}>ID</span>
              <span className={styles.ohdMetaValue}>{project.projId ? String(project.projId) : "New"}</span>
            </div>
          </div>
        </div>
        <div className={styles.ohdHeaderActions}>
          <Button variant="success" onClick={saveProject} disabled={saving} loading={saving}>
            <FontAwesomeIcon icon={faCheck} className="me-1" /> Save Project
          </Button>
        </div>
      </div>

      {/* ─── Workspace Body ─── */}
      <div className={styles.ohdBody}>
        {/* ─── LEFT — Form ─── */}
        <div className={styles.ohdMain}>

          {/* Project Details */}
          <div className={styles.ohdSection}>
            <div className={styles.ohdSectionHeader}>
              <FontAwesomeIcon icon={faFolderOpen} /> Project Details
            </div>
            <div className={styles.ohdSectionBody}>
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Status</Form.Label>
                    <Form.Select className="ohd-field-control" value={project.statusId || ""} onChange={(e) => updateField("statusId", e.target.value)}>
                      <option value="">Select status...</option>
                      {statuses.map((s) => <option key={s.status_id} value={String(s.status_id)}>{s.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Quote #</Form.Label>
                    <Form.Control className="ohd-field-control" value={project.quote_number || ""} onChange={(e) => updateField("quote_number", e.target.value)} placeholder="Optional quote number" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Project Name <span style={{ color: "#d63333" }}>*</span></Form.Label>
                    <Form.Control className="ohd-field-control" value={project.projectName || ""} onChange={(e) => updateField("projectName", e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Project Address</Form.Label>
                    <Form.Control className="ohd-field-control" as="textarea" rows={2} value={project.projectAddress || ""} onChange={(e) => updateField("projectAddress", e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Request Link (Missive)</Form.Label>
                    <Form.Control className="ohd-field-control" placeholder="Paste Missive request link" value={project.requestLink || ""} onChange={(e) => updateField("requestLink", e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>

          {/* Trip Fee */}
          <div className={styles.ohdSection}>
            <div className={styles.ohdSectionHeader}>
              <FontAwesomeIcon icon={faGear} /> Trip Fee
            </div>
            <div className={styles.ohdSectionBody}>
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Trip Rate</Form.Label>
                    <Form.Select className="ohd-field-control" value={project.tripId || ""} onChange={(e) => updateField("tripId", e.target.value)}>
                      <option value="">Select trip fee...</option>
                      {tripFeeRates.map((t) => <option key={t.trip_id} value={String(t.trip_id)}>{t.label} (${t.rate})</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>

          {/* Door Items */}
          <div className={styles.ohdSection}>
            <div className={styles.ohdSectionHeader}>
              <FontAwesomeIcon icon={faLayerGroup} /> Door Items
              <span className={styles.ohdSectionCount}>{(project.items || []).length}/{MAX_ITEMS}</span>
              <Button variant="secondary" className={styles.ohdSectionAction} onClick={addItem} disabled={(project.items || []).length >= MAX_ITEMS}>+ Add Door</Button>
            </div>
            <div className={styles.ohdSectionBody}>
              {(project.items || []).map((item, i) => (
                <div key={i} className={doorFormStyles.doorCard}>
                  <div className={doorFormStyles.doorCardHeader}>
                    <span className={doorFormStyles.doorCardTitle}>Door {i + 1}</span>
                    <Button variant="secondary" disabled={(project.items || []).length <= MIN_ITEMS} onClick={() => removeItem(i)}>Remove</Button>
                  </div>
                  <div className={doorFormStyles.doorForm}>
                    <DimensionRow item={item} index={i} onUpdate={updateItem} />
                    <DoorStyleRow item={item} index={i} onUpdate={updateItem} paneStyles={paneStyles} colors={colors} />
                    <InsulationRow item={item} index={i} onUpdate={updateItem} insulationTypes={insulationTypes} trackOptions={trackOptions} />
                    <OpenerRow item={item} index={i} onUpdate={updateItem} openers={openers} />
                    <WindowRow item={item} index={i} onUpdate={updateItem} windowTypes={windowTypes} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additionals */}
          <div className={styles.ohdSection}>
            <div className={styles.ohdSectionHeader}>
              <FontAwesomeIcon icon={faCirclePlus} /> Additionals
            </div>
            <div className={styles.ohdSectionBody}>
              {/* Extras */}
              <div className={styles.ohdToggleBlock}>
                <div className="additionals-toggle-row additionals-toggle-include">
                  <Form.Check type="switch" id={getToggleId("extras")} className="m-0" checked={Boolean(project.extrasIncluded)} onChange={(e) => updateField("extrasIncluded", e.target.checked)} />
                  <label className="additionals-toggle-label" htmlFor={getToggleId("extras")}>Include Extras</label>
                </div>
              </div>
              {project.extrasIncluded && (
                <div className="mb-3">
                  {(project.extras || []).map((extra, i) => (
                    <Row key={i} className="g-2 mb-2">
                      <Col md={5}>
                        <Form.Group>
                          <Form.Label className={styles.ohdFormLabel}>Description</Form.Label>
                          <Form.Control className="ohd-field-control" placeholder="Description" value={extra.description || ""} onChange={(e) => updateExtra(i, "description", e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className={styles.ohdFormLabel}>Qty</Form.Label>
                          <Form.Control className="ohd-field-control" type="number" value={extra.qty || ""} onChange={(e) => updateExtra(i, "qty", e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className={styles.ohdFormLabel}>Unit Price</Form.Label>
                          <Form.Control className="ohd-field-control" type="number" step="0.01" value={extra.unitPrice || ""} onChange={(e) => updateExtra(i, "unitPrice", e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <Button variant="secondary" onClick={() => removeExtra(i)}><FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /></Button>
                      </Col>
                    </Row>
                  ))}
                  <Button variant="secondary" onClick={addExtra} disabled={(project.extras || []).length >= 4} className="mt-1">+ Add Extra</Button>
                </div>
              )}

              {/* Discount */}
              <div className={styles.ohdToggleBlock}>
                <div className="additionals-toggle-row additionals-toggle-include">
                  <Form.Check type="switch" id={getToggleId("discount")} className="m-0" checked={Boolean(project.discountIncluded)} onChange={(e) => updateField("discountIncluded", e.target.checked)} />
                  <label className="additionals-toggle-label" htmlFor={getToggleId("discount")}>Include Discount</label>
                </div>
              </div>
              {project.discountIncluded && (
                <Row className="g-2 mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className={styles.ohdFormLabel}>Discount (%)</Form.Label>
                      <Form.Control className="ohd-field-control" type="number" step="0.01" min="0" max="100" value={project.discountPercent || ""} onChange={(e) => updateField("discountPercent", e.target.value)} />
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {/* Deposit */}
              <div className={styles.ohdToggleBlock}>
                <div className="additionals-toggle-row additionals-toggle-include">
                  <Form.Check type="switch" id={getToggleId("deposit")} className="m-0" checked={Boolean(project.depositIncluded)} onChange={(e) => { updateField("depositIncluded", e.target.checked); if (!e.target.checked) updateField("depositPercent", ""); }} />
                  <label className="additionals-toggle-label" htmlFor={getToggleId("deposit")}>Include Deposit</label>
                </div>
              </div>
              {project.depositIncluded && (
                <Form.Group className="mt-2" style={{ maxWidth: 260 }}>
                  <Form.Label className={styles.ohdFormLabel}>Deposit (%)</Form.Label>
                  <Form.Control className="ohd-field-control" type="number" step="0.01" min="0" max="100" value={project.depositPercent || ""} onChange={(e) => updateField("depositPercent", e.target.value)} />
                </Form.Group>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT — Quote Preview ─── */}
        <div className={styles.ohdSidebar}>
          <div className={styles.ohdSection}>
            <div className={styles.ohdSectionHeader}>
              <FontAwesomeIcon icon={faFileLines} /> Quote Preview
            </div>
            <div className={styles.ohdSectionBody}>
              {quoteResult?.pricing ? (
                <div className="ohd-quote-document">
                  {/* Project details */}
                  <div className="mb-3">
                    <div className="small text-uppercase text-muted fw-semibold mb-2">Project Details</div>
                    <div className="ohd-quote-detail-stack">
                      {[
                        ["Project Name", project.projectName],
                        ["Address", project.projectAddress],
                        ["Quote #", project.quote_number],
                      ].map(([label, val]) => (
                        <div key={label} className="ohd-quote-detail-row">
                          <span className="ohd-quote-detail-label">{label}</span>
                          <span className="ohd-quote-detail-value">{displayOrDash(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <h6 className="mb-2 fw-semibold" style={{ fontSize: "0.8rem" }}>Pricing Summary</h6>
                    <div className="ohd-price-row">
                      <span>Door Price (Subtotal)</span>
                      <span className="ohd-price-value" style={moneyValueStyle}>{fmtCurrency(quoteResult.pricing.subtotal)}</span>
                    </div>
                    <div className="ohd-price-row">
                      <span>Trip Fee</span>
                      <span className="ohd-price-value" style={moneyValueStyle}>{fmtCurrency(quoteResult.pricing.tripFee)}</span>
                    </div>
                    {Number(quoteResult.pricing.discountAmount || 0) > 0 && (
                      <div className="ohd-price-row" style={{ color: "#d63333" }}>
                        <span>Discount ({(quoteResult.pricing.discountPercent * 100).toFixed(2)}%)</span>
                        <span className="ohd-price-value" style={moneyValueStyle}>-{fmtCurrency(quoteResult.pricing.discountAmount)}</span>
                      </div>
                    )}
                    <div className="ohd-price-divider" />
                    <div className="ohd-price-row ohd-price-total">
                      <span className="fw-bold">Project Total</span>
                      <span className="fw-bold" style={moneyValueStyle}>{fmtCurrency(quoteResult.pricing.projectTotal)}</span>
                    </div>
                    <div className="ohd-price-row">
                      <span className="text-muted">Deposit ({(quoteResult.pricing.depositPercentDisplay).toFixed(2)}%)</span>
                      <span className="ohd-price-value" style={moneyValueStyle}>{fmtCurrency(quoteResult.pricing.depositAmount)}</span>
                    </div>
                    <div className="ohd-price-row ohd-price-balance">
                      <span className="fw-semibold">Remaining Balance</span>
                      <span className="fw-semibold" style={moneyValueStyle}>{fmtCurrency(quoteResult.pricing.remainingBalance)}</span>
                    </div>
                  </div>

                  {/* Door Items Breakdown */}
                  {(project.items || []).some((i) => Number(i.quantity) > 0 || Number(i.width) > 0) && (
                    <div>
                      <h6 className="mb-2 fw-semibold" style={{ fontSize: "0.78rem" }}>Door Items</h6>
                      <table className="ohd-quote-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Qty</th>
                            <th>W x H</th>
                            <th>Color</th>
                            <th>Pane</th>
                            <th>Insulation</th>
                            <th>Opener</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(project.items || []).map((item, i) => {
                            if (!Number(item.quantity) && !Number(item.width)) return null;
                            return (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{item.quantity || "—"}</td>
                                <td>{item.width || "—"}x{item.height || "—"}</td>
                                <td>{colorNameById[String(item.color_id)] || "—"}</td>
                                <td>{paneStyleNameById[String(item.pane_style_id)] || "—"}</td>
                                <td>{insTypeNameById[String(item.ins_type_id)] || "—"}</td>
                                <td>{item.opener_id ? `${openerNameById[String(item.opener_id)] || "—"} x${item.opener_quantity || 1}` : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted mb-0">Fill in the form to see the quote preview.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

