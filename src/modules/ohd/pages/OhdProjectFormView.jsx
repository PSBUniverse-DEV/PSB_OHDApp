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
import { getWorkflowForStatus, canTransitionTo, getAvailableTransitions } from "../data/ohdWorkflow.config";
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
    
    // Auto-populate pricing constants from setup for new projects
    const getDefaultConstant = (constantName) => {
      const constant = (setup.pricingConstants || []).find(c => c.constant_name === constantName);
      return constant ? String(constant.constant_value) : "";
    };
    
    return {
      ...base,
      statusId: String(statuses[0]?.status_id || ""),
      tripId: String(tripFeeRates[0]?.trip_id || ""),
      // Auto-populate pricing constants from setup
      header_seal: getDefaultConstant("Header Seal"),
      rev_and_seal: getDefaultConstant("Rev and Seal"),
      multiplier: getDefaultConstant("Multiplier"),
    };
  }, [isEdit, projectData, statuses, tripFeeRates, setup.pricingConstants]);

  const [project, setProject] = useState(() => buildInitialProject());
  const [saving, setSaving] = useState(false);

  // ─── Workflow State ────────────────────────────────────
  const currentStatusId = Number(project?.statusId) || 1;
  const workflow = getWorkflowForStatus(currentStatusId);
  const isReadOnly = workflow && !workflow.isEditable;
  const canEditProject = workflow ? workflow.editing.projectInfo : true;
  const canEditItems = workflow ? workflow.editing.doorItems : true;
  const canEditAdditionals = workflow ? workflow.editing.additionals : true;
  const canEditPricingConstants = workflow ? workflow.editing.pricingConstants : true;
  const canEditDiscount = workflow ? workflow.editing.discount : true;
  const canEditDeposit = workflow ? workflow.editing.deposit : true;
  const availableActions = workflow ? workflow.actions.filter(a => a.show) : [];
  const statusBadge = workflow && workflow.ui.badge.show ? workflow.ui.badge : null;
  const statusWatermark = workflow ? workflow.ui.watermark : null;

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

  const pricingConstantByName = useMemo(() => {
    const map = {};
    (setup.pricingConstants || []).forEach((c) => { map[c.constant_name] = Number(c.constant_value) || 0; });
    return map;
  }, [setup.pricingConstants]);

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
        // Pricing constants
        header_seal: toNumOrNull(project.header_seal),
        rev_and_seal: toNumOrNull(project.rev_and_seal),
        multiplier: toIntOrNull(project.multiplier),
      };

      const calcResults = quoteResult?.itemResults || [];
      const itemRows = (project.items || []).map((i, idx) => {
        const qty = toIntOrNull(i.quantity);
        const w = toNumOrNull(i.width);
        const h = toNumOrNull(i.height);
        if (qty === null && w === null && h === null) return null;
        const calc = calcResults[idx] || {};
        return {
          quantity: qty,
          width: w,
          height: h,
          color_id: toIntOrNull(i.color_id),
          pane_style_id: toIntOrNull(i.pane_style_id),
          color_opacity: toIntOrNull(i.color_opacity),
          ins_type_id: toIntOrNull(i.ins_type_id),
          model: i.model || null,
          opener_id: toIntOrNull(i.opener_id),
          windows_type_id: toIntOrNull(i.windows_type_id),
          track_id: toIntOrNull(i.track_id),
          dimension_price: toNumOrNull(calc.dimension_price),
          pane_style_price: toNumOrNull(calc.pane_style_price),
          insulation_price: toNumOrNull(calc.insulation_price),
          windows_price: toNumOrNull(calc.windows_price),
          item_total: toNumOrNull(calc.item_total),
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

  // ─── Action Handler ────────────────────────────────────
  const handleAction = useCallback(async (actionId) => {
    switch (actionId) {
      case "approve":
        updateField("statusId", "4");
        await saveProject();
        toastSuccess("Project approved.", "OHD Project");
        break;
      case "cancel":
        if (window.confirm("Are you sure you want to cancel this project?")) {
          updateField("statusId", "7");
          await saveProject();
          toastSuccess("Project cancelled.", "OHD Project");
        }
        break;
      case "put_on_hold":
        updateField("statusId", "6");
        await saveProject();
        toastSuccess("Project put on hold.", "OHD Project");
        break;
      case "resume":
        updateField("statusId", "3");
        await saveProject();
        toastSuccess("Project resumed.", "OHD Project");
        break;
      case "complete":
        updateField("statusId", "5");
        await saveProject();
        toastSuccess("Project completed.", "OHD Project");
        break;
      case "start_project":
        updateField("statusId", "3");
        await saveProject();
        toastSuccess("Project started.", "OHD Project");
        break;
      case "return_for_revision":
        updateField("statusId", "1");
        await saveProject();
        toastSuccess("Returned for revision.", "OHD Project");
        break;
      case "revoke_approval":
        updateField("statusId", "1");
        await saveProject();
        toastSuccess("Approval revoked.", "OHD Project");
        break;
      default:
        toastWarning(`Action "${actionId}" not implemented yet.`, "OHD Project");
    }
  }, [saveProject, updateField]);

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
            {statusBadge && (
              <div className={styles.ohdMetaItem}>
                <span className={styles.ohdMetaLabel}>Status</span>
                <span className={styles.ohdMetaValue} style={{ 
                  background: statusBadge.color, 
                  color: "#fff", 
                  padding: "2px 8px", 
                  borderRadius: 4, 
                  fontSize: "0.75rem",
                  fontWeight: 600 
                }}>
                  {statusBadge.text}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.ohdHeaderActions}>
          {availableActions.slice(0, 3).map((action) => (
            <Button 
              key={action.id} 
              variant={action.variant} 
              onClick={() => handleAction(action.id)}
              disabled={saving}
              size="sm"
              className="me-2"
            >
              {action.label}
            </Button>
          ))}
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
                  <Form.Select className="ohd-field-control" value={project.statusId || ""} onChange={(e) => updateField("statusId", e.target.value)} disabled={isReadOnly}>
                      <option value="">Select status...</option>
                      {statuses.map((s) => <option key={s.status_id} value={String(s.status_id)}>{s.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Quote #</Form.Label>
                  <Form.Control className="ohd-field-control" value={project.quote_number || ""} onChange={(e) => updateField("quote_number", e.target.value)} placeholder="Optional quote number" disabled={isReadOnly || !canEditProject} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Project Name <span style={{ color: "#d63333" }}>*</span></Form.Label>
                  <Form.Control className="ohd-field-control" value={project.projectName || ""} onChange={(e) => updateField("projectName", e.target.value)} disabled={isReadOnly || !canEditProject} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Project Address</Form.Label>
                  <Form.Control className="ohd-field-control" as="textarea" rows={2} value={project.projectAddress || ""} onChange={(e) => updateField("projectAddress", e.target.value)} disabled={isReadOnly || !canEditProject} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Request Link (Missive)</Form.Label>
                  <Form.Control className="ohd-field-control" placeholder="Paste Missive request link" value={project.requestLink || ""} onChange={(e) => updateField("requestLink", e.target.value)} disabled={isReadOnly || !canEditProject} />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>

          {/* Pricing Constants */}
          <div className={styles.ohdSection}>
            <div className={styles.ohdSectionHeader}>
              <FontAwesomeIcon icon={faGear} /> Pricing Constants
            </div>
            <div className={styles.ohdSectionBody}>
              <Row className="g-2">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Header Seal</Form.Label>
                    <Form.Control className="ohd-field-control" type="number" step="0.01" value={project.header_seal || ""} onChange={(e) => updateField("header_seal", e.target.value)} disabled={!canEditPricingConstants} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Rev and Seal</Form.Label>
                    <Form.Control className="ohd-field-control" type="number" step="0.01" value={project.rev_and_seal || ""} onChange={(e) => updateField("rev_and_seal", e.target.value)} disabled={!canEditPricingConstants} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className={styles.ohdFormLabel}>Multiplier</Form.Label>
                    <Form.Control className="ohd-field-control" type="number" step="0.01" value={project.multiplier || ""} onChange={(e) => updateField("multiplier", e.target.value)} disabled={!canEditPricingConstants} />
                  </Form.Group>
                </Col>
              </Row>
              <div className="mt-2 text-muted" style={{ fontSize: "0.75rem" }}>
                These constants are used for dimension price calculations. Leave empty to use setup defaults.
              </div>
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
              {canEditItems && <Button variant="secondary" className={styles.ohdSectionAction} onClick={addItem} disabled={(project.items || []).length >= MAX_ITEMS}>+ Add Door</Button>}
            </div>
            <div className={styles.ohdSectionBody}>
              {(project.items || []).map((item, i) => (
                <div key={i} className={doorFormStyles.doorCard}>
                  <div className={doorFormStyles.doorCardHeader}>
                    <span className={doorFormStyles.doorCardTitle}>Door {i + 1}</span>
                    <Button variant="secondary" disabled={(project.items || []).length <= MIN_ITEMS} onClick={() => removeItem(i)}>Remove</Button>
                  </div>
                  <div className={doorFormStyles.doorForm}>
                    <DimensionRow item={item} index={i} onUpdate={updateItem} disabled={!canEditItems} />
                    <DoorStyleRow item={item} index={i} onUpdate={updateItem} paneStyles={paneStyles} colors={colors} disabled={!canEditItems} />
                    <InsulationRow item={item} index={i} onUpdate={updateItem} insulationTypes={insulationTypes} trackOptions={trackOptions} disabled={!canEditItems} />
                    <OpenerRow item={item} index={i} onUpdate={updateItem} openers={openers} disabled={!canEditItems} />
                    <WindowRow item={item} index={i} onUpdate={updateItem} windowTypes={windowTypes} disabled={!canEditItems} />
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
                  <Form.Check type="switch" id={getToggleId("extras")} className="m-0" checked={Boolean(project.extrasIncluded)} onChange={(e) => updateField("extrasIncluded", e.target.checked)} disabled={!canEditAdditionals} />
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
                  <Form.Control className="ohd-field-control" placeholder="Description" value={extra.description || ""} onChange={(e) => updateExtra(i, "description", e.target.value)} disabled={!canEditAdditionals} />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className={styles.ohdFormLabel}>Qty</Form.Label>
                  <Form.Control className="ohd-field-control" type="number" value={extra.qty || ""} onChange={(e) => updateExtra(i, "qty", e.target.value)} disabled={!canEditAdditionals} />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className={styles.ohdFormLabel}>Unit Price</Form.Label>
                  <Form.Control className="ohd-field-control" type="number" step="0.01" value={extra.unitPrice || ""} onChange={(e) => updateExtra(i, "unitPrice", e.target.value)} disabled={!canEditAdditionals} />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <Button variant="secondary" onClick={() => removeExtra(i)}><FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /></Button>
                      </Col>
                    </Row>
                  ))}
                  {canEditAdditionals && <Button variant="secondary" onClick={addExtra} disabled={(project.extras || []).length >= 4} className="mt-1">+ Add Extra</Button>}
                </div>
              )}

              {/* Discount */}
              <div className={styles.ohdToggleBlock}>
                <div className="additionals-toggle-row additionals-toggle-include">
                  <Form.Check type="switch" id={getToggleId("discount")} className="m-0" checked={Boolean(project.discountIncluded)} onChange={(e) => updateField("discountIncluded", e.target.checked)} disabled={!canEditDiscount} />
                  <label className="additionals-toggle-label" htmlFor={getToggleId("discount")}>Include Discount</label>
                </div>
              </div>
              {project.discountIncluded && (
                <Row className="g-2 mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className={styles.ohdFormLabel}>Discount (%)</Form.Label>
                      <Form.Control className="ohd-field-control" type="number" step="0.01" min="0" max="100" value={project.discountPercent || ""} onChange={(e) => updateField("discountPercent", e.target.value)} disabled={!canEditDiscount} />
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {/* Deposit */}
              <div className={styles.ohdToggleBlock}>
                <div className="additionals-toggle-row additionals-toggle-include">
                  <Form.Check type="switch" id={getToggleId("deposit")} className="m-0" checked={Boolean(project.depositIncluded)} onChange={(e) => { updateField("depositIncluded", e.target.checked); if (!e.target.checked) updateField("depositPercent", ""); }} disabled={!canEditDeposit} />
                  <label className="additionals-toggle-label" htmlFor={getToggleId("deposit")}>Include Deposit</label>
                </div>
              </div>
              {project.depositIncluded && (
                <Form.Group className="mt-2" style={{ maxWidth: 260 }}>
                  <Form.Label className={styles.ohdFormLabel}>Deposit (%)</Form.Label>
                  <Form.Control className="ohd-field-control" type="number" step="0.01" min="0" max="100" value={project.depositPercent || ""} onChange={(e) => updateField("depositPercent", e.target.value)} disabled={!canEditDeposit} />
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

                  {/* Material Breakdown — Per-Door Cards */}
                  {(project.items || []).some((i) => Number(i.quantity) > 0 || Number(i.width) > 0) && (
                    <div>
                      <h6 className="mb-2 fw-semibold" style={{ fontSize: "0.78rem" }}>Material Breakdown</h6>
                      {(project.items || []).map((item, i) => {
                        if (!Number(item.quantity) && !Number(item.width)) return null;
                        const calc = (quoteResult?.itemResults || [])[i] || {};
                        const openerCost = (item.opener_quantity || 0) * (openers.find(o => String(o.opener_id) === String(item.opener_id))?.opener_price || 0);
                        const paneStyle = paneStyleNameById[String(item.pane_style_id)] || "—";
                        const colorName = colorNameById[String(item.color_id)] || "—";
                        const insType = insTypeNameById[String(item.ins_type_id)] || "—";
                        const trackName = trackOptions.find(t => String(t.track_id) === String(item.track_id))?.track_name || "—";
                        const openerName = openerNameById[String(item.opener_id)] || "—";
                        const windowsName = windowsTypeNameById[String(item.windows_type_id)] || "—";
                        const glassCategory = item.windows_type_id ? (windowTypes.find(w => String(w.windows_type_id) === String(item.windows_type_id))?.windows_glass_category || "—") : "—";
                        return (
                          <div key={i} style={{ marginBottom: 10, padding: "10px 12px", background: "#fafcfe", borderRadius: 6, border: "1px solid var(--psb-border, #dde1e6)" }}>
                            {/* Door header */}
                            <div style={{ marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e5e9ed" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--psb-brand, #0d6efd)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Door {i + 1}</span>
                            </div>
                            {/* Section 1 — Door Information */}
                            <div style={{ marginBottom: 10 }}>
                              {/* Row 1: Qty | W × H */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 6, fontSize: "0.72rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Qty</div>
                                  <div style={{ fontWeight: 500 }}>{item.quantity || "—"}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>W × H</div>
                                  <div style={{ fontWeight: 500 }}>{item.width || "—"}" × {item.height || "—"}"</div>
                                </div>
                              </div>
                              {/* Row 2: Pane Style Door | Color */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 6, fontSize: "0.72rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Pane Style Door</div>
                                  <div style={{ fontWeight: 500 }}>{paneStyle}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Color</div>
                                  <div style={{ fontWeight: 500 }}>{item.color_opacity ? `${item.color_opacity}%` : ""} {colorName}</div>
                                </div>
                              </div>
                              {/* Row 3: Insulation + Model | Track Option */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 6, fontSize: "0.72rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Insulation</div>
                                  <div style={{ fontWeight: 500 }}>{insType}{item.model ? ` / ${item.model}` : ""}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Track Option</div>
                                  <div style={{ fontWeight: 500 }}>{trackName}</div>
                                </div>
                              </div>
                              {/* Row 4: Opener Qty | Opener */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 6, fontSize: "0.72rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Opener Qty</div>
                                  <div style={{ fontWeight: 500 }}>{item.opener_quantity || "—"}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Opener</div>
                                  <div style={{ fontWeight: 500 }}>{item.opener_id ? `${openerName} x${item.opener_quantity || 1}` : "—"}</div>
                                </div>
                              </div>
                              {/* Row 5: Windows Qty | Type and Glass */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 6, fontSize: "0.72rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Windows Qty</div>
                                  <div style={{ fontWeight: 500 }}>{item.windows_quantity || "—"}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Type and Glass</div>
                                  <div style={{ fontWeight: 500 }}>{item.windows_type_id ? `${windowsName} - ${glassCategory}` : "—"}</div>
                                </div>
                              </div>
                            </div>
                            {/* Section 2 — Pricing Breakdown */}
                            <div style={{ borderTop: "1px solid #d0d5db", paddingTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: "0.72rem" }}>
                              <span>Dimension Price</span><span style={{ textAlign: "right" }}>{fmtCurrency(calc.dimension_price)}</span>
                              <span>Insulation Price</span><span style={{ textAlign: "right" }}>{fmtCurrency(calc.insulation_price)}</span>
                              <span>Windows Price</span><span style={{ textAlign: "right" }}>{fmtCurrency(calc.windows_price)}</span>
                              <span>Opener Price</span><span style={{ textAlign: "right" }}>{fmtCurrency(openerCost)}</span>
                              <span style={{ fontWeight: 700, borderTop: "1px solid #d0d5db", paddingTop: 4, marginTop: 4 }}>Door Total</span>
                              <span style={{ textAlign: "right", fontWeight: 700, borderTop: "1px solid #d0d5db", paddingTop: 4, marginTop: 4 }}>{fmtCurrency(calc.item_total)}</span>
                            </div>
                            {/* Pricing Constants Used */}
                            <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #eee", fontSize: "0.68rem", color: "#777", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 8px" }}>
                              <span>Header Seal: {fmtCurrency(project.header_seal || pricingConstantByName["Header Seal"])}</span>
                              <span>Rev and Seal: {fmtCurrency(project.rev_and_seal || pricingConstantByName["Rev and Seal"])}</span>
                              <span>Multiplier: {project.multiplier || pricingConstantByName["Multiplier"] || 1}</span>
                            </div>
                          </div>
                        );
                      })}
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