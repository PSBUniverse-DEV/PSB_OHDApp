/**
 * OHD Project Form — Client helpers (defaults, mappers, formatters).
 */

import { formatCurrency, toPercentLabel } from "./ohdProjects.data";

// ─── Helpers ───────────────────────────────────────────────

/** Round a number to the nearest multiple (e.g. roundToNearest(1296, 5) => 1295) */
function roundToNearest(value, nearest) {
  if (!nearest || nearest <= 0) return value;
  return Math.round(value / nearest) * nearest;
}

// ─── Defaults ──────────────────────────────────────────────

export function emptyDoorItem() {
  return {
    quantity: "",
    width: "",
    height: "",
    color_opacity: "",
    color_id: "",
    pane_style_id: "",
    ins_type_id: "",
    model: "",
    opener_id: "",
    windows_type_id: "",
    opener_quantity: "",
    windows_quantity: "",
    track_id: "",
    header_seal: "",
    rev_seal: "",
    multiplier: "",
    dimension_price: "",
    pane_style_price: "",
    insulation_price: "",
    windows_price: "",
    item_total: "",
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
    color_opacity: i.color_opacity != null ? String(i.color_opacity) : "",
    color_id: i.color_id ? String(i.color_id) : "",
    pane_style_id: i.pane_style_id ? String(i.pane_style_id) : "",
    ins_type_id: i.ins_type_id ? String(i.ins_type_id) : "",
    model: i.model || "",
    opener_id: i.opener_id ? String(i.opener_id) : "",
    windows_type_id: i.windows_type_id ? String(i.windows_type_id) : "",
    opener_quantity: i.opener_quantity != null ? String(i.opener_quantity) : "",
    windows_quantity: i.windows_quantity != null ? String(i.windows_quantity) : "",
    track_id: i.track_id ? String(i.track_id) : "",
    header_seal: i.header_seal != null ? String(i.header_seal) : "",
    rev_seal: i.rev_seal != null ? String(i.rev_seal) : "",
    multiplier: i.multiplier != null ? String(i.multiplier) : "",
    dimension_price: i.dimension_price != null ? String(i.dimension_price) : "",
    pane_style_price: i.pane_style_price != null ? String(i.pane_style_price) : "",
    insulation_price: i.insulation_price != null ? String(i.insulation_price) : "",
    windows_price: i.windows_price != null ? String(i.windows_price) : "",
    item_total: i.item_total != null ? String(i.item_total) : "",
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
  // Calculate per-door pricing
  const items = (project.items || []).filter(
    (i) => Number(i.quantity) > 0 || Number(i.width) > 0 || Number(i.height) > 0,
  );

  const itemResults = items.map((i) => {
    const qty = Number(i.quantity) || 0;
    const w = Number(i.width) || 0;
    const h = Number(i.height) || 0;
    const sqft = w * h;
    const headerSeal = Number(i.header_seal) || 0;
    const revSeal = Number(i.rev_seal) || 0;
    const multiplier = Number(i.multiplier) || 1;

    // Lookup insulation price per sqft
    const insTypes = Array.isArray(setup.insulationTypes) ? setup.insulationTypes : [];
    const selectedIns = i.ins_type_id
      ? insTypes.find((t) => String(t.ins_type_id) === String(i.ins_type_id))
      : null;
    const insPricePerSqft = selectedIns ? Number(selectedIns.price_persqft) || 0 : 0;

    // Lookup track price
    const trackOpts = Array.isArray(setup.trackOptions) ? setup.trackOptions : [];
    const selectedTrack = i.track_id
      ? trackOpts.find((t) => String(t.track_id) === String(i.track_id))
      : null;
    const trackPrice = selectedTrack ? Number(selectedTrack.track_price) || 0 : 0;

    // Lookup opener price
    const openerList = Array.isArray(setup.openers) ? setup.openers : [];
    const selectedOpener = i.opener_id
      ? openerList.find((o) => String(o.opener_id) === String(i.opener_id))
      : null;
    const openerPrice = selectedOpener ? Number(selectedOpener.opener_price) || 0 : 0;
    const openerQty = Number(i.opener_quantity) || 0;

    // Lookup window price
    const winTypes = Array.isArray(setup.windowTypes) ? setup.windowTypes : [];
    const selectedWin = i.windows_type_id
      ? winTypes.find((w) => String(w.windows_type_id) === String(i.windows_type_id))
      : null;
    const winPrice = selectedWin ? Number(selectedWin.windows_price) || 0 : 0;
    const winQty = Number(i.windows_quantity) || 0;

    // Calculations — dimension price per formula in database-table-reference.sql
    const raw = (
      (((w * h) * insPricePerSqft) * qty) +
      (w * headerSeal) +
      ((revSeal * 2) * h)
    ) / multiplier;
    const dimensionPrice = roundToNearest(raw, 5);
    const paneStylePrice = 0; // Placeholder — will be calculated from pane style setup
    const insulationPrice = qty * sqft * insPricePerSqft;
    const windowsPrice = winQty * winPrice;
    const openerTotal = openerQty * openerPrice;
    const itemTotal = dimensionPrice + paneStylePrice + insulationPrice + windowsPrice + openerTotal;

    return {
      quantity: qty,
      dimension_price: dimensionPrice,
      pane_style_price: paneStylePrice,
      insulation_price: insulationPrice,
      windows_price: windowsPrice,
      item_total: itemTotal,
    };
  });

  const subtotal = itemResults.reduce((sum, r) => sum + r.item_total, 0);

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
    itemResults,
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