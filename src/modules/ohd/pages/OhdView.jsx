"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "react-bootstrap";
import { Button, Modal, TableZ, toastError, toastSuccess } from "@/shared/components/ui";
import { createFilterConfig, TABLE_FILTER_TYPES } from "@/shared/components/ui/table/filterSchema";
import { deleteOhdProject } from "../data/ohdProjects.actions";
import {
  formatCurrency,
  ohdStatusToneClass,
  enrichProjectRow,
  getStatusName,
  readProjectTotal,
} from "../data/ohdProjects.data";

// ─── Status pill color map ─────────────────────────────────

const STATUS_PILL_STYLES = {
  "ohd-status-draft":     { background: "#f3e8ff", color: "#7c3aed", border: "1px solid #ddd6fe" },
  "ohd-status-complete":  { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
  "ohd-status-cancelled": { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
  "ohd-status-active":    { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
  "ohd-status-pending":   { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" },
  "ohd-status-default":   { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
};

function StatusPill({ name }) {
  const tone = ohdStatusToneClass(name);
  const style = STATUS_PILL_STYLES[tone] || STATUS_PILL_STYLES["ohd-status-default"];
  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
}

// ─── Main View ──────────────────────────────────────────────

export default function OhdView({ projects = [], statuses = [] }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  // Build status filter options
  const statusOptions = useMemo(() => {
    const set = new Set();
    statuses.forEach((s) => { if (s?.name) set.add(s.name); });
    projects.forEach((p) => { const n = getStatusName(p, statuses); if (n) set.add(n); });
    return Array.from(set).map((name) => ({ label: name, value: name }));
  }, [statuses, projects]);

  // Enrich rows for table
  const rows = useMemo(() =>
    projects.map((p) => enrichProjectRow(p, statuses)),
  [projects, statuses]);

  // Completed projects total
  const completedTotal = useMemo(() => {
    return rows.reduce((sum, r) => {
      if (!String(r._statusName).toLowerCase().includes("complete")) return sum;
      return sum + (r._totalRaw || 0);
    }, 0);
  }, [rows]);

  const columns = useMemo(() => [
    {
      key: "project_name",
      label: "Project / Quote",
      sortable: true,
      render: (row) => (
        <div>
          <p className="fw-semibold mb-0">{row.project_name || "(Untitled)"}</p>
          <p className="text-muted small mb-0">#{row.quote_number || row.proj_id || "--"}</p>
        </div>
      ),
    },
    {
      key: "project_address",
      label: "Location",
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-0">{row.project_address || "--"}</p>
          <p className="text-muted small mb-0">Date: {row._dateLabel}</p>
        </div>
      ),
    },
    {
      key: "_statusName",
      label: "Status",
      sortable: true,
      render: (row) => <StatusPill name={row._statusName} />,
    },
    {
      key: "_tripLabel",
      label: "Logistics",
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-0">{row._tripLabel}</p>
          {row.request_link ? (
            <a href={row.request_link} target="_blank" rel="noreferrer" className="small text-primary" onClick={(e) => e.stopPropagation()}>
              Open request link
            </a>
          ) : (
            <p className="text-muted small mb-0">No request link</p>
          )}
        </div>
      ),
    },
    {
      key: "_totalRaw",
      label: "Project Total",
      sortable: true,
      align: "right",
      render: (row) => (
        <div className="text-end">
          <p className="fw-semibold mb-0">{row._totalLabel}</p>
          <p className="text-muted small mb-0">Downpayment: {row._downpaymentLabel}</p>
        </div>
      ),
    },
    {
      key: "updated_by_name",
      label: "Updated by",
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-0">{row.updated_by_name || "--"}</p>
          <p className="text-muted small mb-0">{row._updatedAtLabel}</p>
        </div>
      ),
    },
  ], []);

  const filterConfig = useMemo(() =>
    createFilterConfig([
      { key: "_statusName", type: TABLE_FILTER_TYPES.SELECT, label: "Status", options: statusOptions },
    ]),
  [statusOptions]);

  // ─── Actions ──────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await deleteOhdProject(confirmDelete);
      toastSuccess("Project deleted.", "OHD");
      setConfirmDelete(null);
      router.refresh();
    } catch (err) {
      toastError(err?.message || "Failed to delete project.", "OHD");
    } finally {
      setBusy(false);
    }
  }, [confirmDelete, router]);

  const actions = useMemo(() => [
    {
      key: "delete",
      label: "Delete",
      icon: "trash",
      type: "danger",
      confirm: true,
      confirmMessage: "Delete this project? This cannot be undone.",
      onClick: (row) => setConfirmDelete(row.proj_id),
    },
  ], []);

  // ─── Render ────────────────────────────────────────────────

  return (
    <Container fluid className="px-3 px-lg-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1 fw-bold">Saved Projects</h2>
          <p className="text-muted mb-0">Manage overhead door quote projects.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => router.push("/ohd/new")}>Create Project</Button>
          <Button variant="secondary" onClick={() => router.push("/ohd/setup")}>Setup</Button>
        </div>
      </div>

      <div
        className="mb-3 p-3 border rounded"
        style={{ background: "linear-gradient(135deg, #f8fbff, #edf5ff)" }}
      >
        <p className="text-muted small mb-1">Total Price of Completed Projects</p>
        <p className="fw-bold fs-5 mb-0">{formatCurrency(completedTotal)}</p>
      </div>

      <TableZ
        data={rows}
        columns={columns}
        rowIdKey="proj_id"
        actions={actions}
        filterConfig={filterConfig}
        searchPlaceholder="Search by project, address, status, trip..."
        emptyMessage="No projects found."
        onRowClick={(row) => router.push(`/ohd/${row.proj_id}`)}
      />

      {/* Delete confirmation modal */}
      <Modal show={!!confirmDelete} onHide={() => setConfirmDelete(null)} title="Delete Project">
        <p>Delete this project? This cannot be undone.</p>
        <div className="d-flex gap-2 justify-content-end">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Container>
  );
}