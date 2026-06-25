"use server";

import { getSupabaseAdmin } from "@/core/supabase/admin";

// ─── Setup Table Mapping ───────────────────────────────────

const SETUP_TABLES = {
  statuses:        { table: "ohd_s_statuses",        pk: "status_id" },
  colors:          { table: "ohd_s_colors",          pk: "color_id" },
  paneStyles:      { table: "ohd_s_pane_style",      pk: "pane_style_id" },
  insulationTypes: { table: "ohd_s_insulation_type", pk: "ins_type_id" },
  openers:         { table: "ohd_s_openers",         pk: "opener_id" },
  tripRates:       { table: "ohd_s_trip_rates",      pk: "trip_id" },
  windowTypes:     { table: "ohd_s_windows_type",    pk: "windows_type_id" },
};

function resolveTable(tableKey) {
  const entry = SETUP_TABLES[tableKey];
  if (!entry) throw new Error(`Unknown setup table: "${tableKey}"`);
  return entry;
}

// ─── Load All Setup Data ───────────────────────────────────

export async function loadOhdSetup() {
  const supabase = getSupabaseAdmin();

  const queries = {
    statuses:        supabase.from("ohd_s_statuses").select("*").order("status_id"),
    colors:          supabase.from("ohd_s_colors").select("*").order("color_id"),
    paneStyles:      supabase.from("ohd_s_pane_style").select("*").order("pane_style_id"),
    insulationTypes: supabase.from("ohd_s_insulation_type").select("*").order("ins_type_id"),
    openers:         supabase.from("ohd_s_openers").select("*").order("opener_id"),
    tripRates:       supabase.from("ohd_s_trip_rates").select("*").order("trip_id"),
    windowTypes:     supabase.from("ohd_s_windows_type").select("*").order("windows_type_id"),
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

// ─── CRUD ──────────────────────────────────────────────────

function toIntOrNull(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export async function createSetupRow(tableKey, row) {
  const { table, pk } = resolveTable(tableKey);
  if (!row || typeof row !== "object") throw new Error("Row data is required.");

  const supabase = getSupabaseAdmin();
  const payload = { ...row };
  delete payload[pk];

  const { data, error } = await supabase.from(table).insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSetupRow(tableKey, id, updates) {
  const { table, pk } = resolveTable(tableKey);
  const rowId = toIntOrNull(id);
  if (rowId === null) throw new Error(`Invalid ${pk}.`);

  const supabase = getSupabaseAdmin();
  const payload = { ...updates };
  delete payload[pk];

  const { data, error } = await supabase.from(table).update(payload).eq(pk, rowId).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSetupRow(tableKey, id) {
  const { table, pk } = resolveTable(tableKey);
  const rowId = toIntOrNull(id);
  if (rowId === null) throw new Error(`Invalid ${pk}.`);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(table).delete().eq(pk, rowId);
  if (error) throw new Error(error.message);
  return { success: true };
}