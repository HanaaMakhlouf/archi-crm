// ── PLANNING STATUSES ──
export const STATUS_NOT_STARTED = 'not_started';
export const STATUS_IN_PROGRESS = 'in_progress';
export const STATUS_READY = 'ready';
export const STATUS_AGREED = 'agreed';

// Simple 2-state for construction / electricity / water
export const STATUS_NOT_READY = 'not_ready';
export const STATUS_READY_SIMPLE = 'ready';


// ── PLANNING DATA (single JSONB column on clients) ──
// All planning state lives under client.planning_data. Shape:
// {
//   client_requirements: string,
//   notes: string,
//   architecture_required: boolean,          // אדריכלות part toggle (default true)
//   tables: {
//     // אדריכלות
//     offer:          { status, notes },
//     visualization:  { status, notes },
//     work_plan:      { status, notes },     // was the free-text work_plan_notes
//     disciplines: {
//       water:        { status, notes },
//       electricity:  { status, notes },
//       construction: { status, notes },     // legacy, no longer shown
//     },
//     architecture_extra: [{ id, label, status, notes }],
//     // קונסטרוקציה
//     construction: {
//       survey:    { status, notes },        // מדידה בשטח (מבנים קיימים)
//       placement: { status, notes },        // העמדה
//       work_plans: { status, notes },       // תוכניות עבודה (adds 'schematic' = סכימתי)
//       extra:     [{ id, label, status, notes }],
//     },
//   },
// }
export const FIELD_PLANNING_DATA = 'planning_data';
