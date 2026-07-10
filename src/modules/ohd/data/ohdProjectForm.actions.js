"use server";

import { getSupabaseAdmin } from "@/core/supabase/admin";
import { canTransitionTo } from "./ohdWorkflow.config";

// ─── Helpers ───────────────────────────────────────────────

function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function toIntOrNull(v) {
  if (!hasValue(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNumOrNull(v) {
  if (!hasValue(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ─── Load All Setup Data ───────────────────────────────────

export async function loadOhdFormSetup() {
  const supabase = getSupabaseAdmin();

  const queries = {
    statuses:        supabase.from("ohd_s_statuses").select("*").order("status_id"),
    colors:          supabase.from("ohd_s_colors").select("*").order("color_id"),
    paneStyles:      supabase.from("ohd_s_pane_style").select("*").order("pane_style_id"),
    insulationTypes: supabase.from("ohd_s_insulation_type").select("*").order("ins_type_id"),
    openers:         supabase.from("ohd_s_openers").select("*").order("opener_id"),
    tripRates:       supabase.from("ohd_s_trip_rates").select("*").order("trip_id"),
    windowTypes:     supabase.from("ohd_s_windows_type").select("*").order("windows_type_id"),
    trackOptions:    supabase.from("ohd_s_track_options").select("*").order("track_id"),
    pricingConstants: supabase.from("ohd_s_pricing_constants").select("*").order("display_order"),
  };

  const keys = Object.keys(queries);
  const settled = await Promise.allSettled(Object.values(queries));
  const result = {};
  const errors = [];

  settled.forEach((r, i) => {
    const key = keys[i];
    if (r.status === "fulfilled" && !r.value.error) {
      result[key] = r.value.data || [];
    } else {
      result[key] = [];
      errors.push(key);
    }
  });

  return { ...result, sourceErrors: errors };
}

// ─── Load Single Project (for edit) ────────────────────────

export async function loadOhdProject(projId) {
  const id = toIntOrNull(projId);
  if (id === null) throw new Error("projId is required");

  const supabase = getSupabaseAdmin();

  // Load project header + its item rows
  const [headerResult, itemsResult] = await Promise.all([
    supabase.from("ohd_t_projects").select("*").eq("proj_id", id).maybeSingle(),
    supabase.from("ohd_t_project_items").select("*").eq("proj_id", id).order("item_id"),
  ]);

  if (headerResult.error) throw new Error(headerResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);

  return {
    projectHeader: headerResult.data || null,
    projectItems: itemsResult.data || [],
  };
}

// ─── Save Project (Create / Edit) ──────────────────────────

export async function saveOhdProject({ isEdit, projectId, header, items, extras }) {
  const supabase = getSupabaseAdmin();
  const editMode = isEdit === true;
  const existingId = toIntOrNull(projectId);

  if (editMode && existingId === null) {
    throw new Error("A valid project id is required for edit saves");
  }

  const h = {
    quote_number: hasValue(header.quote_number) ? String(header.quote_number).trim() : "",
    project_name: hasValue(header.project_name) ? String(header.project_name).trim() : "",
    project_address: hasValue(header.project_address) ? String(header.project_address).trim() : "",
    request_link: hasValue(header.request_link) ? String(header.request_link).trim() : "",
    status_id: toIntOrNull(header.status_id),
    trip_id: toIntOrNull(header.trip_id),
    discount: toNumOrNull(header.discount),
    downpayment: toNumOrNull(header.downpayment),
    price_subtotal: toNumOrNull(header.price_subtotal),
    price_overall_total: toNumOrNull(header.price_overall_total),
    // Pricing constants (use project values if set, otherwise null)
    header_seal: toNumOrNull(header.header_seal),
    rev_and_seal: toNumOrNull(header.rev_and_seal),
    multiplier: toIntOrNull(header.multiplier),
    Date: header.date || null,
  };

  if (!h.status_id || !h.trip_id) {
    throw new Error("Status and Trip Rate are required");
  }

  // Validate status transition if editing
  if (editMode && existingId) {
    const { data: existingProject } = await supabase
      .from("ohd_t_projects")
      .select("status_id")
      .eq("proj_id", existingId)
      .maybeSingle();
    
    if (existingProject?.status_id) {
      const oldStatus = Number(existingProject.status_id);
      const newStatus = Number(h.status_id);
      
      if (oldStatus !== newStatus && !canTransitionTo(oldStatus, newStatus)) {
        const oldWorkflow = getWorkflowForStatus(oldStatus);
        const newWorkflow = getWorkflowForStatus(newStatus);
        throw new Error(
          `Invalid status transition: Cannot change from "${oldWorkflow?.name || oldStatus}" to "${newWorkflow?.name || newStatus}". ` +
          `Allowed transitions: ${oldWorkflow?.allowedTransitions.map(id => getWorkflowForStatus(id)?.name).join(", ") || "None"}`
        );
      }
    }
  }

  const now = new Date().toISOString();
  let currentProjId = existingId;

  if (editMode) {
    const { error } = await supabase
      .from("ohd_t_projects")
      .update({ ...h, updated_at: now })
      .eq("proj_id", currentProjId);
    if (error) throw new Error("Error saving project: " + error.message);

    // Delete existing items and extras, re-insert
    const { error: eItems } = await supabase.from("ohd_t_project_items").delete().eq("proj_id", currentProjId);
    if (eItems) throw new Error("Error clearing items: " + eItems.message);

    const { error: eExtras } = await supabase.from("ohd_m_project_extras").delete().eq("proj_id", currentProjId);
    if (eExtras) throw new Error("Error clearing extras: " + eExtras.message);
  } else {
    const { data: inserted, error } = await supabase
      .from("ohd_t_projects")
      .insert({ ...h, created_at: now, updated_at: now })
      .select("proj_id")
      .single();
    if (error || !inserted?.proj_id) throw new Error("Error saving project: " + (error?.message || "Unknown error"));
    currentProjId = inserted.proj_id;
  }

  // Insert items
  const itemRows = (Array.isArray(items) ? items : [])
    .map((row) => {
      const qty = toIntOrNull(row.quantity);
      const width = toNumOrNull(row.width);
      const height = toNumOrNull(row.height);
      const colorId = toIntOrNull(row.color_id);
      const paneStyleId = toIntOrNull(row.pane_style_id);
      const colorOpacity = toIntOrNull(row.color_opacity);
      const insTypeId = toIntOrNull(row.ins_type_id);
      const model = row.model || null;
      const openerId = toIntOrNull(row.opener_id);
      const windowsTypeId = toIntOrNull(row.windows_type_id);
      const trackId = toIntOrNull(row.track_id);
      const dimensionPrice = toNumOrNull(row.dimension_price);
      const paneStylePrice = toNumOrNull(row.pane_style_price);
      const insulationPrice = toNumOrNull(row.insulation_price);
      const windowsPrice = toNumOrNull(row.windows_price);
      const itemTotal = toNumOrNull(row.item_total);
      const openerQty = toIntOrNull(row.opener_quantity);
      const windowsQty = toIntOrNull(row.windows_quantity);
      if (qty === null && width === null && height === null) return null;
      return {
        proj_id: currentProjId,
        quantity: qty,
        width,
        height,
        color_id: colorId,
        pane_style_id: paneStyleId,
        color_opacity: colorOpacity,
        ins_type_id: insTypeId,
        model: model,
        opener_id: openerId,
        windows_type_id: windowsTypeId,
        track_id: trackId,
        dimension_price: dimensionPrice,
        pane_style_price: paneStylePrice,
        insulation_price: insulationPrice,
        windows_price: windowsPrice,
        item_total: itemTotal,
        opener_quantity: openerQty,
        windows_quantity: windowsQty,
      };
    })
    .filter(Boolean);

  if (itemRows.length > 0) {
    const { error } = await supabase.from("ohd_t_project_items").insert(itemRows);
    if (error) throw new Error("Error saving items: " + error.message);
  }

  // Check if status changed for auto-snapshot
  let statusChanged = false;
  let oldStatusId = null;
  if (editMode && existingId) {
    const { data: existingProject } = await supabase
      .from("ohd_t_projects")
      .select("status_id")
      .eq("proj_id", existingId)
      .maybeSingle();
    
    if (existingProject?.status_id) {
      oldStatusId = Number(existingProject.status_id);
      const newStatusId = Number(h.status_id);
      statusChanged = oldStatusId !== newStatusId;
    }
  }

  // Create snapshot after successful save
  const calcResultsForSnapshot = items.map((item, idx) => {
    // Recalculate to get latest prices for snapshot
    const qty = Number(item.quantity) || 0;
    const w = Number(item.width) || 0;
    const h = Number(item.height) || 0;
    const sqft = w * h;
    
    const doorConfigs = Array.isArray(setup.doorConfigurations) ? setup.doorConfigurations : [];
    const selectedConfig = item.ins_type_id
      ? doorConfigs.find((t) => String(t.ins_type_id) === String(item.ins_type_id))
      : null;
    const insPricePerSqft = selectedConfig ? Number(selectedConfig.price_persqft) || 0 : 0;
    
    const trackOpts = Array.isArray(setup.trackOptions) ? setup.trackOptions : [];
    const selectedTrack = item.track_id
      ? trackOpts.find((t) => String(t.track_id) === String(item.track_id))
      : null;
    const trackPrice = selectedTrack ? Number(selectedTrack.track_price) || 0 : 0;
    
    const openerList = Array.isArray(setup.openers) ? setup.openers : [];
    const selectedOpener = item.opener_id
      ? openerList.find((o) => String(o.opener_id) === String(item.opener_id))
      : null;
    const openerPrice = selectedOpener ? Number(selectedOpener.opener_price) || 0 : 0;
    const openerQty = Number(item.opener_quantity) || 0;
    
    const winTypes = Array.isArray(setup.windowTypes) ? setup.windowTypes : [];
    const selectedWin = item.windows_type_id
      ? winTypes.find((w) => String(w.windows_type_id) === String(item.windows_type_id))
      : null;
    const winPrice = selectedWin ? Number(selectedWin.windows_price) || 0 : 0;
    const winQty = Number(item.windows_quantity) || 0;
    
    // Use project-level pricing constants (from header) for snapshot calculations
    const getProjectConstant = (fieldName, setupConstantName) => {
      const projectValue = header[fieldName];
      if (projectValue !== undefined && projectValue !== null && String(projectValue).trim() !== "") {
        return Number(projectValue) || 0;
      }
      // Fallback to setup defaults if project value not set
      const pricingConstants = Array.isArray(setup.pricingConstants) ? setup.pricingConstants : [];
      const c = pricingConstants.find(p => p.constant_name === setupConstantName);
      return c ? Number(c.constant_value) || 0 : 0;
    };
    const headerSeal = getProjectConstant("header_seal", "Header Seal");
    const revAndSeal = getProjectConstant("rev_and_seal", "Rev Seal");
    const multiplier = getProjectConstant("multiplier", "Multiplier") || 1;
    
    const raw = (
      (((w * h) * insPricePerSqft) * qty) +
      (w * headerSeal) +
      ((revAndSeal * 2) * h)
    ) / multiplier;
    const dimensionPrice = Math.round(raw / 5) * 5;
    // Pane style price: color_opacity (%) * dimension_price
    const colorOpacityPct = (Number(item.color_opacity) || 0) / 100;
    const paneStylePrice = colorOpacityPct * dimensionPrice;
    // Insulation price: ((sqft * track_price) / multiplier) rounded to nearest 5, then * qty
    const insulationPrice = Math.round(((sqft * trackPrice) / multiplier) / 5) * 5 * qty;
    // Windows price: (windows_price / multiplier) * windows_quantity
    const windowsPrice = (winPrice / multiplier) * winQty;
    const openerTotal = openerQty * openerPrice;
    const itemTotal = dimensionPrice + paneStylePrice + insulationPrice + windowsPrice + openerTotal;
    
    return {
      dimension_price: dimensionPrice,
      pane_style_price: paneStylePrice,
      insulation_price: insulationPrice,
      windows_price: windowsPrice,
      item_total: itemTotal,
    };
  });

  try {
    // Determine snapshot label based on status
    const newWorkflow = getWorkflowForStatus(Number(h.status_id));
    const snapshotLabel = statusChanged && newWorkflow 
      ? newWorkflow.snapshot.label 
      : (editMode ? "Updated Project" : "Initial Quote");
    
    await createProjectSnapshot({
      projId: currentProjId,
      project: header,
      items: items.map((item, idx) => ({ ...item, ...calcResultsForSnapshot[idx] })),
      extras: extras,
      setup,
      quoteResult: { itemResults: calcResultsForSnapshot },
      createdBy: header.created_by,
      snapshotLabel,
      statusChanged,
    });
  } catch (snapshotError) {
    console.error("Snapshot creation failed:", snapshotError);
    // Don't fail the save if snapshot fails
  }

  // Insert extras
  const extraRows = (Array.isArray(extras) ? extras : [])
    .map((row) => {
      const name = hasValue(row.name) ? String(row.name).trim() : "";
      const qty = toIntOrNull(row.quantity);
      const price = toNumOrNull(row.unit_price);
      if (!name && qty === null && price === null) return null;
      return { proj_id: currentProjId, name, quantity: qty, unit_price: price };
    })
    .filter(Boolean);

  if (extraRows.length > 0) {
    const { error } = await supabase.from("ohd_m_project_extras").insert(extraRows);
    if (error) throw new Error("Error saving extras: " + error.message);
  }

  return { projId: currentProjId };
}

// ─── Create Project Snapshot ─────────────────────────────────

export async function createProjectSnapshot({ projId, project, items, extras, setup, quoteResult, createdBy, snapshotLabel, statusChanged }) {
  const supabase = getSupabaseAdmin();
  const id = toIntOrNull(projId);
  if (id === null) throw new Error("projId is required");

  // Get pricing constants from PROJECT (not setup) for historical accuracy
  const getProjectConstant = (fieldName, setupConstantName) => {
    const projectValue = project[fieldName];
    if (projectValue !== undefined && projectValue !== null && String(projectValue).trim() !== "") {
      return Number(projectValue) || 0;
    }
    // Fallback to setup defaults if project value not set
    const pricingConstants = Array.isArray(setup.pricingConstants) ? setup.pricingConstants : [];
    const c = pricingConstants.find(p => p.constant_name === setupConstantName);
    return c ? Number(c.constant_value) || 0 : 0;
  };

  const headerSeal = getProjectConstant("header_seal", "Header Seal");
  const revAndSeal = getProjectConstant("rev_and_seal", "Rev Seal");
  const multiplier = getProjectConstant("multiplier", "Multiplier") || 1;

  // Load lookup data for names
  const [colorsResult, paneStylesResult, insulationResult, openersResult, windowTypesResult, trackResult, tripResult] = await Promise.all([
    supabase.from("ohd_s_colors").select("color_id, color_name"),
    supabase.from("ohd_s_pane_style").select("pane_style_id, style_name"),
    supabase.from("ohd_s_insulation_type").select("ins_type_id, type_name"),
    supabase.from("ohd_s_openers").select("opener_id, opener_name, opener_price"),
    supabase.from("ohd_s_windows_type").select("windows_type_id, windows_type, windows_glass_category"),
    supabase.from("ohd_s_track_options").select("track_id, track_name, track_price"),
    supabase.from("ohd_s_trip_rates").select("trip_id, label, rate").eq("trip_id", project.tripId).maybeSingle(),
  ]);

  const colorMap = (colorsResult.data || []).reduce((m, c) => { m.set(String(c.color_id), c.color_name); return m; }, new Map());
  const paneStyleMap = (paneStylesResult.data || []).reduce((m, p) => { m.set(String(p.pane_style_id), p.style_name); return m; }, new Map());
  const insTypeMap = (insulationResult.data || []).reduce((m, i) => { m.set(String(i.ins_type_id), i.type_name); return m; }, new Map());
  const openerMap = (openersResult.data || []).reduce((m, o) => { m.set(String(o.opener_id), o.opener_name); return m; }, new Map());
  const windowTypeMap = (windowTypesResult.data || []).reduce((m, w) => { m.set(String(w.windows_type_id), w); return m; }, new Map());
  const trackMap = (trackResult.data || []).reduce((m, t) => { m.set(String(t.track_id), t.track_name); return m; }, new Map());

  const tripLabel = tripResult.data?.label || "";
  const tripRate = tripResult.data?.rate || 0;

  // Create main snapshot
  const calcResults = quoteResult?.itemResults || [];
  const snapshotItems = (items || []).map((item, idx) => {
    const calc = calcResults[idx] || {};
    const openerQty = Number(item.opener_quantity) || 0;
    const openerPrice = openerQty > 0 && item.opener_id 
      ? (openersResult.data || []).find(o => String(o.opener_id) === String(item.opener_id))?.opener_price || 0 
      : 0;
    const openerCost = openerQty * openerPrice;

    return {
      proj_id: id,
      item_id: item.item_id || null,
      quote_number: project.quote_number,
      project_name: project.projectName,
      project_address: project.projectAddress,
      trip_label: tripLabel,
      trip_rate: tripRate,
      quantity: Number(item.quantity) || 0,
      width: Number(item.width) || 0,
      height: Number(item.height) || 0,
      color_opacity: Number(item.color_opacity) || 0,
      color_id: Number(item.color_id) || null,
      color_name: colorMap.get(String(item.color_id)) || null,
      pane_style_id: Number(item.pane_style_id) || null,
      pane_style_name: paneStyleMap.get(String(item.pane_style_id)) || null,
      ins_type_id: Number(item.ins_type_id) || null,
      type_name: insTypeMap.get(String(item.ins_type_id)) || null,
      model: item.model || null,
      opener_id: Number(item.opener_id) || null,
      opener_name: openerMap.get(String(item.opener_id)) || null,
      opener_price: openerPrice,
      opener_quantity: openerQty,
      windows_type_id: Number(item.windows_type_id) || null,
      windows_type: windowTypeMap.get(String(item.windows_type_id))?.windows_type || null,
      windows_glass_category: windowTypeMap.get(String(item.windows_type_id))?.windows_glass_category || null,
      windows_price: windowTypeMap.get(String(item.windows_type_id))?.windows_price || 0,
      windows_quantity: Number(item.windows_quantity) || 0,
      estprice_dimension: calc.dimension_price || 0,
      estprice_pane_style_door: calc.pane_style_price || 0,
      estprice_insulation: calc.insulation_price || 0,
      estprice_windows: calc.windows_price || 0,
      discount: Number(project.discountPercent) || 0,
      downpayment: Number(project.depositPercent) || 0,
      item_total: calc.item_total || 0,
      project_price_subtotal: quoteResult?.pricing?.subtotal || 0,
      project_price_overall_total: quoteResult?.pricing?.projectTotal || 0,
      snapshot_created_by: createdBy || null,
      snapshot_version: statusChanged ? "1.0" : "1.0",
      snapshot_label: snapshotLabel || "Project Snapshot",
      header_seal: headerSeal,
      rev_and_seal: revAndSeal,
      multiplier: multiplier,
      dimension_price: calc.dimension_price || 0,
      pane_style_price: calc.pane_style_price || 0,
      insulation_price: calc.insulation_price || 0,
      windows_price: calc.windows_price || 0,
    };
  });

  // Delete existing snapshots for this project
  await supabase.from("ohd_t_project_snapshot").delete().eq("proj_id", id);

  // Insert new snapshots
  if (snapshotItems.length > 0) {
    const { error } = await supabase.from("ohd_t_project_snapshot").insert(snapshotItems);
    if (error) throw new Error("Error creating snapshot: " + error.message);
  }

  // Create extra snapshots if extras exist
  if (extras && extras.length > 0) {
    const extraSnapshots = extras
      .filter(e => hasValue(e.description) || Number(e.qty) > 0 || Number(e.unitPrice) > 0)
      .map((e, idx) => ({
        project_snapshot_id: id,
        extra_name: e.description || `Extra ${idx + 1}`,
        quantity: Number(e.qty) || 0,
        unit_price: Number(e.unitPrice) || 0,
        total_price: (Number(e.qty) || 0) * (Number(e.unitPrice) || 0),
      }));

    // Delete existing extra snapshots
    await supabase.from("ohd_t_project_extra_snapshot").delete().eq("project_snapshot_id", id);

    // Insert new extra snapshots
    if (extraSnapshots.length > 0) {
      const { error } = await supabase.from("ohd_t_project_extra_snapshot").insert(extraSnapshots);
      if (error) throw new Error("Error creating extra snapshot: " + error.message);
    }
  }

  return { success: true, snapshotCount: snapshotItems.length };
}
