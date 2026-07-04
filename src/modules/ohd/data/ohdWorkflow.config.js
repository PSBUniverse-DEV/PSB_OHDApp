/**
 * OHD Project Status Workflow Configuration
 * 
 * This file defines the complete workflow behavior for each project status,
 * including editing permissions, available actions, and snapshot strategy.
 */

export const STATUS_WORKFLOW = {
  // ─── Status Definitions ──────────────────────────────────

  AWAITING_DEALER_RESPONSE: {
    id: 1,
    name: "Awaiting Dealer Response",
    description: "Initial quote created and sent to dealer, waiting for response",
    isTerminal: false,
    isEditable: true,
    
    // Transition rules
    allowedTransitions: [2, 6, 7], // → Under Review, On Hold, Cancelled
    
    // Editing permissions
    editing: {
      projectInfo: true,
      doorItems: true,
      additionals: true,
      pricingConstants: true,
      discount: true,
      deposit: true,
    },
    
    // Available actions
    actions: [
      { id: "save_draft", label: "Save Draft", variant: "secondary", show: true },
      { id: "update_project", label: "Update Project", variant: "primary", show: true },
      { id: "send_reminder", label: "Send Reminder", variant: "info", show: true },
      { id: "put_on_hold", label: "Put On Hold", variant: "warning", show: true },
      { id: "cancel", label: "Cancel Project", variant: "danger", show: true },
      { id: "print_quote", label: "Print Quote", variant: "secondary", show: true },
      { id: "export_pdf", label: "Export PDF", variant: "secondary", show: true },
    ],
    
    // Snapshot strategy
    snapshot: {
      autoOnEnter: true,
      autoOnExit: false,
      manualAllowed: true,
      label: "Initial Quote",
    },
    
    // UI behavior
    ui: {
      badge: { text: "DRAFT", color: "#6c757d", show: true },
      watermark: null,
      recalculatePricing: true,
      lockPricingConstants: false,
    },
  },

  UNDER_REVIEW: {
    id: 2,
    name: "Under Review",
    description: "Dealer has responded, project is being reviewed internally",
    isTerminal: false,
    isEditable: true,
    
    // Transition rules
    allowedTransitions: [3, 4, 1, 6, 7], // → Approved, In Progress, Awaiting Dealer Response, On Hold, Cancelled
    
    // Editing permissions
    editing: {
      projectInfo: true,
      doorItems: true,
      additionals: true,
      pricingConstants: false, // LOCKED during review
      discount: true,
      deposit: true,
    },
    
    // Available actions
    actions: [
      { id: "save_draft", label: "Save Draft", variant: "secondary", show: true },
      { id: "approve", label: "Approve", variant: "success", show: true },
      { id: "return_for_revision", label: "Return for Revision", variant: "warning", show: true },
      { id: "put_on_hold", label: "Put On Hold", variant: "warning", show: true },
      { id: "cancel", label: "Cancel Project", variant: "danger", show: true },
      { id: "view_snapshots", label: "View Snapshots", variant: "info", show: true },
      { id: "print_quote", label: "Print Quote", variant: "secondary", show: true },
      { id: "export_pdf", label: "Export PDF", variant: "secondary", show: true },
    ],
    
    // Snapshot strategy
    snapshot: {
      autoOnEnter: true,
      autoOnExit: false,
      manualAllowed: true,
      label: "Review Version",
    },
    
    // UI behavior
    ui: {
      badge: { text: "REVIEW", color: "#ffc107", show: true },
      watermark: null,
      recalculatePricing: true,
      lockPricingConstants: true,
    },
  },

  IN_PROGRESS: {
    id: 3,
    name: "In Progress",
    description: "Project approved and work has begun",
    isTerminal: false,
    isEditable: false,
    
    // Transition rules
    allowedTransitions: [5, 6, 7], // → Completed, On Hold, Cancelled
    
    // Editing permissions
    editing: {
      projectInfo: false,
      doorItems: false,
      additionals: false,
      pricingConstants: false,
      discount: false,
      deposit: false,
    },
    
    // Available actions
    actions: [
      { id: "view_snapshots", label: "View Snapshots", variant: "info", show: true },
      { id: "print_quote", label: "Print Quote", variant: "secondary", show: true },
      { id: "export_pdf", label: "Export PDF", variant: "secondary", show: true },
      { id: "create_change_order", label: "Create Change Order", variant: "warning", show: true },
      { id: "put_on_hold", label: "Put On Hold", variant: "warning", show: true },
      { id: "complete", label: "Complete Project", variant: "success", show: true },
      { id: "cancel", label: "Cancel Project", variant: "danger", show: true },
    ],
    
    // Snapshot strategy
    snapshot: {
      autoOnEnter: true,
      autoOnExit: false,
      manualAllowed: false,
      label: "Baseline (In Progress)",
    },
    
    // UI behavior
    ui: {
      badge: { text: "IN PROGRESS", color: "#0d6efd", show: true },
      watermark: "APPROVED QUOTE - BASELINE",
      recalculatePricing: false,
      lockPricingConstants: true,
    },
  },

  APPROVED: {
    id: 4,
    name: "Approved",
    description: "Quote reviewed and approved, ready to begin work",
    isTerminal: false,
    isEditable: false,
    
    // Transition rules
    allowedTransitions: [3, 1, 7], // → In Progress, Awaiting Dealer Response, Cancelled
    
    // Editing permissions
    editing: {
      projectInfo: false,
      doorItems: false,
      additionals: false,
      pricingConstants: false,
      discount: false,
      deposit: false,
    },
    
    // Available actions
    actions: [
      { id: "view_snapshots", label: "View Snapshots", variant: "info", show: true },
      { id: "print_quote", label: "Print Quote", variant: "secondary", show: true },
      { id: "export_pdf", label: "Export PDF", variant: "secondary", show: true },
      { id: "start_project", label: "Start Project", variant: "success", show: true },
      { id: "revoke_approval", label: "Revoke Approval", variant: "warning", show: true },
      { id: "cancel", label: "Cancel Project", variant: "danger", show: true },
    ],
    
    // Snapshot strategy
    snapshot: {
      autoOnEnter: true,
      autoOnExit: false,
      manualAllowed: false,
      label: "Approved Quote",
    },
    
    // UI behavior
    ui: {
      badge: { text: "APPROVED", color: "#198754", show: true },
      watermark: "APPROVED",
      recalculatePricing: false,
      lockPricingConstants: true,
    },
  },

  COMPLETED: {
    id: 5,
    name: "Completed",
    description: "Project work has been completed successfully",
    isTerminal: true,
    isEditable: false,
    
    // Transition rules
    allowedTransitions: [], // No transitions (terminal)
    
    // Editing permissions
    editing: {
      projectInfo: false,
      doorItems: false,
      additionals: false,
      pricingConstants: false,
      discount: false,
      deposit: false,
    },
    
    // Available actions
    actions: [
      { id: "view_snapshots", label: "View Snapshots", variant: "info", show: true },
      { id: "print_quote", label: "Print Quote", variant: "secondary", show: true },
      { id: "export_pdf", label: "Export PDF", variant: "secondary", show: true },
      { id: "duplicate_quote", label: "Duplicate Quote", variant: "primary", show: true },
    ],
    
    // Snapshot strategy
    snapshot: {
      autoOnEnter: true,
      autoOnExit: false,
      manualAllowed: false,
      label: "Completed Project",
    },
    
    // UI behavior
    ui: {
      badge: { text: "COMPLETED", color: "#198754", show: true },
      watermark: "COMPLETED",
      recalculatePricing: false,
      lockPricingConstants: true,
    },
  },

  ON_HOLD: {
    id: 6,
    name: "On Hold",
    description: "Project temporarily paused",
    isTerminal: false,
    isEditable: false,
    
    // Transition rules
    allowedTransitions: [3, 1, 7], // → In Progress, Awaiting Dealer Response, Cancelled
    
    // Editing permissions
    editing: {
      projectInfo: false,
      doorItems: false,
      additionals: false,
      pricingConstants: false,
      discount: false,
      deposit: false,
    },
    
    // Available actions
    actions: [
      { id: "view_snapshots", label: "View Snapshots", variant: "info", show: true },
      { id: "print_quote", label: "Print Quote", variant: "secondary", show: true },
      { id: "export_pdf", label: "Export PDF", variant: "secondary", show: true },
      { id: "resume", label: "Resume", variant: "success", show: true },
      { id: "cancel", label: "Cancel Project", variant: "danger", show: true },
    ],
    
    // Snapshot strategy
    snapshot: {
      autoOnEnter: true,
      autoOnExit: false,
      manualAllowed: false,
      label: "On Hold",
    },
    
    // UI behavior
    ui: {
      badge: { text: "ON HOLD", color: "#ffc107", show: true },
      watermark: "ON HOLD",
      recalculatePricing: false,
      lockPricingConstants: true,
    },
  },

  CANCELLED: {
    id: 7,
    name: "Cancelled",
    description: "Project permanently cancelled",
    isTerminal: true,
    isEditable: false,
    
    // Transition rules
    allowedTransitions: [], // No transitions (terminal)
    
    // Editing permissions
    editing: {
      projectInfo: false,
      doorItems: false,
      additionals: false,
      pricingConstants: false,
      discount: false,
      deposit: false,
    },
    
    // Available actions
    actions: [
      { id: "view_snapshots", label: "View Snapshots", variant: "info", show: true },
      { id: "print_quote", label: "Print Quote", variant: "secondary", show: true },
      { id: "export_pdf", label: "Export PDF", variant: "secondary", show: true },
      { id: "duplicate_quote", label: "Duplicate Quote", variant: "primary", show: true },
    ],
    
    // Snapshot strategy
    snapshot: {
      autoOnEnter: true,
      autoOnExit: false,
      manualAllowed: false,
      label: "Cancelled",
    },
    
    // UI behavior
    ui: {
      badge: { text: "CANCELLED", color: "#dc3545", show: true },
      watermark: "CANCELLED",
      recalculatePricing: false,
      lockPricingConstants: true,
    },
  },
};

/**
 * Get workflow configuration for a given status ID
 */
export function getWorkflowForStatus(statusId) {
  const statusMap = {
    1: STATUS_WORKFLOW.AWAITING_DEALER_RESPONSE,
    2: STATUS_WORKFLOW.UNDER_REVIEW,
    3: STATUS_WORKFLOW.IN_PROGRESS,
    4: STATUS_WORKFLOW.APPROVED,
    5: STATUS_WORKFLOW.COMPLETED,
    6: STATUS_WORKFLOW.ON_HOLD,
    7: STATUS_WORKFLOW.CANCELLED,
  };
  
  return statusMap[statusId] || null;
}

/**
 * Check if a status transition is allowed
 */
export function canTransitionTo(currentStatusId, targetStatusId) {
  const workflow = getWorkflowForStatus(currentStatusId);
  if (!workflow) return false;
  
  return workflow.allowedTransitions.includes(targetStatusId);
}

/**
 * Get all available status transitions for a given status
 */
export function getAvailableTransitions(statusId) {
  const workflow = getWorkflowForStatus(statusId);
  if (!workflow) return [];
  
  return workflow.allowedTransitions.map(id => {
    const targetWorkflow = getWorkflowForStatus(id);
    return {
      id: targetWorkflow.id,
      name: targetWorkflow.name,
      isTerminal: targetWorkflow.isTerminal,
    };
  });
}