import {
  DOC_STATUS_PRESENT, DOC_STATUS_NOT_REQUIRED,
} from './info';

// ── CONFIRMATION PHASE (Phase 4) ──
export const DEFAULT_CONFIRMATION_ROWS = ['התארגנות'];
export const isConfirmationRowDone = (row) => [DOC_STATUS_PRESENT, DOC_STATUS_NOT_REQUIRED].includes(row.status);
