"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTable, faPalette, faDoorOpen, faLayerGroup, faGear, faTruck, faWindowMaximize,
  faRulerCombined, faPlus, faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { Form } from "react-bootstrap";
import { Button, Modal, TableZ, toastError, toastSuccess } from "@/shared/components/ui";
import { createSetupRow, updateSetupRow, deleteSetupRow } from "../data/ohdSetup.actions";
import { TABLE_DEFS, buildSidebarList } from "../data/ohdSetup.data";
import "./setup/setup-workspace.css";

// ─── Sidebar Icons ─────────────────────────────────────────

const SIDEBAR_ICONS = {
  statuses:        faTable,
  colors:          faPalette,
  paneStyles:      faDoorOpen,
  insulationTypes: faLayerGroup,
  openers:         faGear,
  tripRates:       faTruck,
  windowTypes:     faWindowMaximize,
  trackOptions:    faRulerCombined,
};

// ─── Sidebar ────────────────────────────────────────────────

function Sidebar({ tables, activeKey, onSelect }) {
  const [filter, setFilter] = useState("");
  const filtered = filter
    ? tables.filter((t) => t.label.toLowerCase().includes(filter.toLowerCase()))
    : tables;

  return (
    <div className="ohd-setup-sidebar">
      <div className="ohd-setup-sidebar__header">
        <span className="ohd-setup-sidebar__title">Tables</span>
        <span className="ohd-setup-sidebar__count">{tables.length}</span>
      </div>
      <div className="ohd-setup-sidebar__search">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="ohd-setup-sidebar__search-icon" />
        <input
          type="text"
          className="ohd-setup-sidebar__search-input"
          placeholder="Search tables..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <nav className="ohd-setup-sidebar__nav">
        {filtered.map((t) => (
          <button
            key={t.key}
            className={`ohd-setup-sidebar__item ${activeKey === t.key ? "ohd-setup-sidebar__item--active" : ""}`}
            onClick={() => onSelect(t.key)}
            title={t.label}
          >
            <FontAwesomeIcon icon={SIDEBAR_ICONS[t.key] || faTable} className="ohd-setup-sidebar__item-icon" />
            <span className="ohd-setup-sidebar__item-label">{t.label}</span>
            <span className="ohd-setup-sidebar__item-badge">{t.count ?? ""}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="ohd-setup-sidebar__empty">No tables match</div>
        )}
      </nav>
    </div>
  );
}

// ─── Toolbar ────────────────────────────────────────────────

function Toolbar({ tableName, recordCount, searchValue, onSearchChange, onAdd, addLabel }) {
  return (
    <div className="ohd-setup-toolbar">
      <div className="ohd-setup-toolbar__left">
        <h1 className="ohd-setup-toolbar__title">{tableName}</h1>
        <span className="ohd-setup-toolbar__count">{recordCount} record{recordCount !== 1 ? "s" : ""}</span>
      </div>
      <div className="ohd-setup-toolbar__right">
        <div className="ohd-setup-toolbar__search">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="ohd-setup-toolbar__search-icon" />
          <input
            type="text"
            className="ohd-setup-toolbar__search-input"
            placeholder={`Filter ${tableName.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="success" onClick={onAdd}>
          <FontAwesomeIcon icon={faPlus} />
          <span>{addLabel}</span>
        </Button>
      </div>
    </div>
  );
}

// ─── Form Modal ─────────────────────────────────────────────

function FormModal({ show, mode, tableName, fields, draft, busy, onDraftChange, onSave, onClose }) {
  if (!show) return null;

  const title = mode === "add" ? `Add ${tableName}` : `Edit ${tableName}`;

  return (
    <Modal show={show} onHide={onClose} title={title}>
      <div className="ohd-setup-form-modal">
        {fields?.map((f) => (
          <Form.Group key={f.key} className="ohd-setup-form-modal__field">
            <Form.Label className="ohd-setup-form-modal__label">
              {f.label}{f.required ? <span className="ohd-setup-form-modal__required">*</span> : ""}
            </Form.Label>
            <Form.Control
              type={f.type || "text"}
              step={f.step || undefined}
              size="sm"
              value={draft[f.key] ?? ""}
              onChange={(e) => onDraftChange(f.key, e.target.value)}
              placeholder={f.label}
              className="ohd-setup-form-modal__input"
            />
          </Form.Group>
        ))}
        <div className="ohd-setup-form-modal__actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={onSave}>
            {mode === "add" ? "Add" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main View ──────────────────────────────────────────────

export default function OhdSetupView({ setup = {} }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("statuses");
  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [modalRow, setModalRow] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const tableDef = useMemo(() => TABLE_DEFS.find((t) => t.key === activeTab), [activeTab]);

  const rows = useMemo(() => {
    const data = setup[activeTab];
    return Array.isArray(data) ? data : [];
  }, [setup, activeTab]);

  const filteredRows = useMemo(() => {
    if (!searchValue.trim()) return rows;
    const q = searchValue.toLowerCase();
    return rows.filter((row) =>
      tableDef?.columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, searchValue, tableDef]);

  const sidebarTables = useMemo(() => buildSidebarList(setup), [setup]);

  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    setSearchValue("");
  }, []);

  // ─── Modal ────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setDraft({});
    setModalRow(null);
    setModalMode("add");
  }, []);

  const openEdit = useCallback((row) => {
    const initial = {};
    tableDef.fields.forEach((f) => { initial[f.key] = row[f.key] ?? ""; });
    setDraft(initial);
    setModalRow(row);
    setModalMode("edit");
  }, [tableDef]);

  const closeModal = useCallback(() => {
    setModalMode(null);
    setModalRow(null);
    setDraft({});
  }, []);

  const handleDraftChange = (field, value) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!tableDef) return;

    for (const f of tableDef.fields) {
      if (f.required && !String(draft[f.key] ?? "").trim()) {
        toastError(`${f.label} is required.`, "Validation");
        return;
      }
    }

    setBusy(true);
    try {
      const payload = {};
      tableDef.fields.forEach((f) => {
        const val = draft[f.key];
        if (f.type === "number") {
          payload[f.key] = val === "" || val == null ? null : Number(val);
        } else {
          payload[f.key] = String(val ?? "").trim() || null;
        }
      });

      if (modalMode === "add") {
        await createSetupRow(activeTab, payload);
        toastSuccess("Row added.", tableDef.label);
      } else {
        const rowId = modalRow[tableDef.pk];
        await updateSetupRow(activeTab, rowId, payload);
        toastSuccess("Row updated.", tableDef.label);
      }

      closeModal();
      router.refresh();
    } catch (err) {
      toastError(err?.message || "Error saving.", tableDef.label);
    } finally {
      setBusy(false);
    }
  }, [tableDef, draft, modalMode, modalRow, activeTab, closeModal, router]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete || !tableDef) return;
    setBusy(true);
    try {
      const rowId = confirmDelete[tableDef.pk];
      await deleteSetupRow(activeTab, rowId);
      toastSuccess("Row deleted.", tableDef.label);
      setConfirmDelete(null);
      router.refresh();
    } catch (err) {
      toastError(err?.message || "Error deleting.", tableDef.label);
    } finally {
      setBusy(false);
    }
  }, [confirmDelete, tableDef, activeTab, router]);

  // ─── Render ────────────────────────────────────────────────

  const actions = useMemo(() => [
    {
      key: "edit",
      label: "Edit",
      icon: "pen",
      type: "primary",
      onClick: (row) => openEdit(row),
    },
    {
      key: "delete",
      label: "Delete",
      icon: "trash",
      type: "danger",
      onClick: (row) => setConfirmDelete(row),
    },
  ], [openEdit]);

  const singularName = tableDef?.label?.replace(/s$/, "") || "Item";

  return (
    <div className="ohd-setup-workspace-root">
      <div className="ohd-setup-workspace">
        <aside className="ohd-setup-workspace__sidebar">
          <Sidebar
            tables={sidebarTables}
            activeKey={activeTab}
            onSelect={handleTabChange}
          />
        </aside>
        <div className="ohd-setup-workspace__main">
          <div className="ohd-setup-workspace__toolbar">
            <Toolbar
              tableName={tableDef?.label || ""}
              recordCount={rows.length}
              searchValue={searchValue}
              onSearchChange={(v) => setSearchValue(v)}
              onAdd={openAdd}
              addLabel={`Add ${singularName}`}
            />
          </div>
          <div className="ohd-setup-workspace__content">
            {tableDef && (
              <div className="ohd-setup-grid-wrap">
                <TableZ
                  data={filteredRows}
                  columns={tableDef.columns}
                  rowIdKey={tableDef.pk}
                  actions={actions}
                  hideSearch
                  emptyMessage={`No ${tableDef.label.toLowerCase()} found.`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <FormModal
        show={!!modalMode}
        mode={modalMode}
        tableName={singularName}
        fields={tableDef?.fields || []}
        draft={draft}
        busy={busy}
        onDraftChange={handleDraftChange}
        onSave={handleSave}
        onClose={closeModal}
      />

      <Modal show={!!confirmDelete} onHide={() => setConfirmDelete(null)} title="Confirm Delete">
        <p className="ohd-setup-delete-msg">Delete this row? This cannot be undone.</p>
        <div className="ohd-setup-delete-actions">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}