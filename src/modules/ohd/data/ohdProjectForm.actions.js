"use server";

import { getSupabaseAdmin } from "@/core/supabase/admin";

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
  };

  if (!h.status_id || !h.trip_id) {
    throw new Error("Status and Trip Rate are required");
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
      const insTypeId = toIntOrNull(row.ins_type_id);
      const openerId = toIntOrNull(row.opener_id);
      const windowsTypeId = toIntOrNull(row.windows_type_id);
      const trackId = toIntOrNull(row.track_id);
      const headerSeal = toNumOrNull(row.header_seal);
      const mult = toIntOrNull(row.multiplier);
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
        ins_type_id: insTypeId,
        opener_id: openerId,
        windows_type_id: windowsTypeId,
        track_id: trackId,
        header_seal: headerSeal,
        multiplier: mult,
        opener_quantity: openerQty,
        windows_quantity: windowsQty,
      };
    })
    .filter(Boolean);

  if (itemRows.length > 0) {
    const { error } = await supabase.from("ohd_t_project_items").insert(itemRows);
    if (error) throw new Error("Error saving items: " + error.message);
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