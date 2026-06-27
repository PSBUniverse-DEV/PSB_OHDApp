/**
 * OHD Projects — Client helpers (formatters, mappers, constants).
 */

export function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function toPercentLabel(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "--";
  const pct = n > 1 ? n : n * 100;
  return `${Math.round(pct * 100) / 100}%`;
}

export function ohdStatusToneClass(statusName) {
  const s = String(statusName ?? "").trim().toLowerCase();
  if (s.includes("draft")) return "ohd-status-draft";
  if (s.includes("complete") || s.includes("completed")) return "ohd-status-complete";
  if (s.includes("cancel")) return "ohd-status-cancelled";
  if (s.includes("progress") || s.includes("active")) return "ohd-status-active";
  if (s.includes("pending") || s.includes("await")) return "ohd-status-pending";
  return "ohd-status-default";
}

function resolveRelated(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value && typeof value === "object" ? value : null;
}

export function getStatusName(p, statuses) {
  const rel = resolveRelated(p.ohd_s_statuses);
  if (rel?.name) return rel.name;
  const match = statuses.find((s) => String(s.status_id) === String(p.status_id));
  return match?.name || "Draft";
}

export function getTripLabel(p) {
  const rel = resolveRelated(p.ohd_s_trip_rates);
  return rel?.label || "--";
}

export function readProjectTotal(p) {
  const t = Number(p?.price_overall_total ?? p?.price_subtotal);
  return Number.isFinite(t) ? t : null;
}

export function enrichProjectRow(p, statuses) {
  const statusName = getStatusName(p, statuses);
  const total = readProjectTotal(p);
  return {
    ...p,
    _statusName: statusName,
    _tripLabel: getTripLabel(p),
    _totalLabel: total === null ? "--" : formatCurrency(total),
    _totalRaw: total ?? 0,
    _subtotalLabel: formatCurrency(p.price_subtotal),
    _downpaymentLabel: toPercentLabel(p.downpayment),
    _dateLabel: p.created_at
      ? new Date(p.created_at).toLocaleDateString("en-US", {
          year: "numeric", month: "2-digit", day: "2-digit",
        })
      : "--",
    _updatedAtLabel: p.updated_at
      ? new Date(p.updated_at).toLocaleString()
      : "--",
  };
}