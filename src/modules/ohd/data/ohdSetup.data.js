/**
 * OHD Setup — Table definitions and helpers.
 *
 * Single source of truth for all setup table schemas.
 */
export const TABLE_DEFS = [
  {
    key: "statuses",
    label: "Statuses",
    pk: "status_id",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "description", label: "Description", sortable: true },
    ],
    fields: [
      { key: "name", label: "Status Name", required: true },
      { key: "description", label: "Description" },
    ],
  },
  {
    key: "colors",
    label: "Colors",
    pk: "color_id",
    columns: [
      { key: "color_name", label: "Color Name", sortable: true },
    ],
    fields: [
      { key: "color_name", label: "Color Name", required: true },
    ],
  },
  {
    key: "doorConfigurations",
    label: "Door Configurations",
    pk: "ins_type_id",
    columns: [
      { key: "display_name", label: "Configuration", sortable: true, render: (row) => `${row.type_name || ""} - ${row.r_value || ""} - ${row.model || ""}` },
      { key: "type_name", label: "Type", sortable: true },
      { key: "r_value", label: "R-Value", sortable: true },
      { key: "model", label: "Model", sortable: true },
      { key: "price_persqft", label: "Price/sqft", sortable: true, render: (row) => `$${Number(row.price_persqft || 0).toFixed(2)}` },
    ],
    fields: [
      { key: "type_name", label: "Type Name", required: true },
      { key: "r_value", label: "R-Value" },
      { key: "model", label: "Model" },
      { key: "construct", label: "Construct" },
      { key: "steel", label: "Steel Gauge" },
      { key: "insulation", label: "Insulation" },
      { key: "price_persqft", label: "Price per sq ft", type: "number", step: "0.01", required: true },
      { key: "premium_color_add_on", label: "Premium Color Add-on", type: "number", step: "0.01" },
      { key: "price_premium_color", label: "Premium Color Price", type: "number", step: "0.01" },
      { key: "wood_grain_color_add_on", label: "Wood Grain Add-on", type: "number", step: "0.01" },
      { key: "price_wood_grain_color", label: "Wood Grain Price", type: "number", step: "0.01" },
    ],
  },
  {
    key: "openers",
    label: "Openers",
    pk: "opener_id",
    columns: [
      { key: "opener_name", label: "Opener Name", sortable: true },
      { key: "opener_price", label: "Price", sortable: true, render: (row) => `$${Number(row.opener_price || 0).toFixed(2)}` },
    ],
    fields: [
      { key: "opener_name", label: "Opener Name", required: true },
      { key: "opener_price", label: "Price", type: "number", step: "0.01", required: true },
    ],
  },
  {
    key: "tripRates",
    label: "Trip Rates",
    pk: "trip_id",
    columns: [
      { key: "label", label: "Label", sortable: true },
      { key: "rate", label: "Rate ($)", sortable: true, render: (row) => `$${Number(row.rate || 0).toFixed(2)}` },
    ],
    fields: [
      { key: "label", label: "Label (e.g. Local, Regional)", required: true },
      { key: "rate", label: "Rate ($)", type: "number", step: "0.01", required: true },
    ],
  },
  {
    key: "trackOptions",
    label: "Track Options",
    pk: "track_id",
    columns: [
      { key: "track_name", label: "Track Name", sortable: true },
      { key: "track_price", label: "Price", sortable: true, render: (row) => `$${Number(row.track_price || 0).toFixed(2)}` },
    ],
    fields: [
      { key: "track_name", label: "Track Name", required: true },
      { key: "track_price", label: "Price", type: "number", step: "0.01", required: true },
    ],
  },
  {
    key: "windowTypes",
    label: "Window Types",
    pk: "windows_type_id",
    columns: [
      { key: "windows_type", label: "Type", sortable: true },
      { key: "windows_glass_category", label: "Glass Category", sortable: true },
      { key: "windows_price", label: "Price", sortable: true, render: (row) => `$${Number(row.windows_price || 0).toFixed(2)}` },
    ],
    fields: [
      { key: "windows_type", label: "Window Type", required: true },
      { key: "windows_glass_category", label: "Glass Category" },
      { key: "windows_price", label: "Price", type: "number", step: "0.01", required: true },
    ],
  },
  {
    key: "pricingConstants",
    label: "Pricing Constants",
    pk: "pricing_constant_id",
    columns: [
      { key: "constant_name", label: "Constant Name", sortable: true },
      { key: "constant_value", label: "Value", sortable: true, render: (row) => `$${Number(row.constant_value || 0).toFixed(2)}` },
      { key: "description", label: "Description", sortable: true },
      { key: "display_order", label: "Order", sortable: true },
    ],
    fields: [
      { key: "constant_name", label: "Constant Name", required: true },
      { key: "constant_value", label: "Value ($)", type: "number", step: "0.01", required: true },
      { key: "description", label: "Description" },
      { key: "display_order", label: "Display Order", type: "number", step: "1" },
    ],
  },
];

/** Sidebar-friendly list: key, label, count (filled by the view). */
export function buildSidebarList(setup) {
  return TABLE_DEFS.map((t) => ({
    key: t.key,
    label: t.label,
    count: Array.isArray(setup[t.key]) ? setup[t.key].length : 0,
  }));
}