/**
 * OHD Project Form — Client helpers (defaults, mappers, formatters).
 */

import { formatCurrency, toPercentLabel } from "./ohdProjects.data";

// ─── Defaults ──────────────────────────────────────────────

export function emptyDoorItem() {
  return {
    quantity: "",
    width: "",
    height: "",
    color_id: "",
    pane_style_id: "",
    ins_type_id: "",
    opener_id: "",
    windows_type_id: "",
    opener_quantity: "",
    windows_quantity: "",
    track_id: "",
  };
}

export function emptyExtra() {
  return { description: "", qty: "", unitPrice: "" };
}

export function createInitialProject() {
  return {
    projId: null,
    quote_number: "",
    statusId: "",
    projectName: "",
    projectAddress: "",
    requestLink: "",
    tripId: "",
    items: [emptyDoorItem()],
    extrasIncluded: false,
    extras: [emptyExtra()],
    discountIncluded: false,
    discountPercent: "",
    depositIncluded: false,
    depositPercent: "",
    discount: "",
    downpayment: "",
    price_subtotal: "",
    price_overall_total: "",
  };
}

// ─── Map DB header + items to form state ───────────────────

export function mapHeaderToProject(header, items) {
  const mappedItems = (items || []).map((i) => ({
    quantity: i.quantity != null ? String(i.quantity) : "",
    width: i.width != null ? String(i.width) : "",
    height: i.height != null ? String(i.height) : "",
    color_id: i.color_id ? String(i.color_id) : "",
    pane_style_id: i.pane_style_id ? String(i.pane_style_id) : "",
    ins_type_id: i.ins_type_id ? String(i.ins_type_id) : "",
    opener_id: i.opener_id ? String(i.opener_id) : "",
    windows_type_id: i.windows_type_id ? String(i.windows_type_id) : "",
    opener_quantity: i.opener_quantity != null ? String(i.opener_quantity) : "",
    windows_quantity: i.windows_quantity != null ? String(i.windows_quantity) : "",
    track_id: i.track_id ? String(i.track_id) : "",
  }));

  const hasDiscount = header.discount != null && Number(header.discount) > 0;
  const rawDeposit = header.downpayment != null ? Number(header.downpayment) : null;
  const depositDisplay = rawDeposit !== null && Number.isFinite(rawDeposit)
    ? (rawDeposit > 1 ? rawDeposit : rawDeposit * 100)
    : "";
  const hasDeposit = rawDeposit !== null && Number.isFinite(rawDeposit) && rawDeposit > 0;

  return {
    projId: header.proj_id,
    quote_number: header.quote_number || "",
    statusId: header.status_id ? String(header.status_id) : "",
    projectName: header.project_name || "",
    projectAddress: header.project_address || "",
    requestLink: header.request_link || "",
    tripId: header.trip_id ? String(header.trip_id) : "",
    items: mappedItems.length > 0 ? mappedItems : [emptyDoorItem()],
    extrasIncluded: false,
    extras: [emptyExtra()],
    discountIncluded: hasDiscount,
    discountPercent: hasDiscount ? String(header.discount) : "",
    depositIncluded: hasDeposit,
    depositPercent: depositDisplay === "" ? "" : String(depositDisplay),
    discount: header.discount || "",
    downpayment: header.downpayment || "",
    price_subtotal: header.price_subtotal || "",
    price_overall_total: header.price_overall_total || "",
  };
}

// ─── Quote Calculation (stub — will evolve) ────────────────

export function calculateOhdQuote(project, setup) {
  // For now, just compute a simple estimate based on dimensions
  const items = (project.items || []).filter(
    (i) => Number(i.quantity) > 0 || Number(i.width) > 0 || Number(i.height) > 0,
  );

  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const w = Number(i.width) || 0;
    const h = Number(i.height) || 0;
    const sqft = w * h;
    // Placeholder price per sqft
    const pricePerSqft = 8.0;
    return sum + qty * sqft * pricePerSqft;
  }, 0);

  // Trip fee
  const tripRates = Array.isArray(setup.tripRates) ? setup.tripRates : [];
  const selectedTrip = project.tripId
    ? tripRates.find((t) => String(t.trip_id) === String(project.tripId))
    : null;
  const tripFee = selectedTrip ? Number(selectedTrip.rate) || 0 : 0;

  // Discount
  const discountPercent = project.discountIncluded ? (Number(project.discountPercent) || 0) / 100 : 0;
  const discountAmount = subtotal * discountPercent;
  const projectTotal = subtotal + tripFee - discountAmount;

  // Deposit
  const depositPercent = project.depositIncluded ? (Number(project.depositPercent) || 0) / 100 : 0;
  const depositAmount = projectTotal * depositPercent;
  const remainingBalance = projectTotal - depositAmount;

  return {
    pricing: {
      subtotal,
      tripFee,
      tripFeeLookup: tripFee,
      discountPercent,
      discountAmount,
      projectTotal,
      depositPercent,
      depositPercentDisplay: depositPercent * 100,
      depositAmount,
      remainingBalance,
    },
  };
}

export { formatCurrency, toPercentLabel };