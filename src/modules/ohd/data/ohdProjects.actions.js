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

function toUserDisplayName(u) {
  if (!u || typeof u !== "object") return "";
  const c = [u.full_name, u.display_name, u.username, u.user_name, u.name, u.email];
  const found = c.find(hasValue);
  return hasValue(found) ? String(found).trim() : "";
}

// ─── Load Projects ─────────────────────────────────────────

export async function loadOhdProjects() {
  const supabase = getSupabaseAdmin();

  const [projectsResult, statusesResult] = await Promise.all([
    supabase
      .from("ohd_t_projects")
      .select(
        "proj_id, quote_number, project_name, project_address, request_link, " +
        "status_id, trip_id, discount, downpayment, price_subtotal, price_overall_total, " +
        "created_at, updated_at, created_by, updated_by, " +
        "ohd_s_statuses(name), ohd_s_trip_rates(label,rate)"
      )
      .order("updated_at", { ascending: false }),
    supabase.from("ohd_s_statuses").select("status_id, name").order("status_id"),
  ]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (statusesResult.error) throw new Error(statusesResult.error.message);

  const projects = projectsResult.data || [];

  // Resolve user display names
  const userIds = Array.from(
    new Set(
      projects
        .flatMap((p) => [toIntOrNull(p.created_by), toIntOrNull(p.updated_by)])
        .filter((v) => v !== null)
    )
  );

  let userById = new Map();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("psb_s_user")
      .select("*")
      .in("user_id", userIds);
    userById = (users || []).reduce((m, u) => {
      m.set(String(u.user_id), u);
      return m;
    }, new Map());
  }

  const enriched = projects.map((p) => {
    const createdUser = userById.get(String(toIntOrNull(p.created_by)));
    const updatedUser = userById.get(String(toIntOrNull(p.updated_by)));
    return {
      ...p,
      created_by_name: toUserDisplayName(createdUser) || (p.created_by ? `User #${p.created_by}` : "--"),
      updated_by_name: toUserDisplayName(updatedUser) || (p.updated_by ? `User #${p.updated_by}` : "--"),
    };
  });

  return { projects: enriched, statuses: statusesResult.data || [] };
}

// ─── Delete Project ────────────────────────────────────────

export async function deleteOhdProject(projId) {
  const id = toIntOrNull(projId);
  if (id === null) throw new Error("projId is required");

  const supabase = getSupabaseAdmin();

  // Delete child records first, then the project itself
  const { error: e1 } = await supabase.from("ohd_m_project_extras").delete().eq("proj_id", id);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase.from("ohd_t_project_snapshot").delete().eq("proj_id", id);
  if (e2) throw new Error(e2.message);

  const { error: e3 } = await supabase.from("ohd_t_projects").delete().eq("proj_id", id);
  if (e3) throw new Error(e3.message);

  return { success: true };
}