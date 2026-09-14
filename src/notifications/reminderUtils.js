import { ONE_DAY_MS, NOTIFICATION_DELAY_UNIT } from '../constants';

const ONE_MINUTE_MS = 60 * 1000;

// In test mode (NOTIFICATION_DELAY_UNIT === 'minutes') 1 day = 1 minute.
function unitMs() {
  return NOTIFICATION_DELAY_UNIT === 'minutes' ? ONE_MINUTE_MS : ONE_DAY_MS;
}

// Days remaining until reminder is due. Negative = overdue. null = no reminder set.
export function calcDaysRemaining(reminder) {
  if (!reminder || !reminder.set_at || !reminder.days) return null;
  const dueMs = new Date(reminder.set_at).getTime() + reminder.days * unitMs();
  const remaining = dueMs - Date.now();
  return Math.ceil(remaining / unitMs());
}

// True when reminder exists and its due date has passed (days remaining <= 0).
export function isReminderDue(reminder) {
  const r = calcDaysRemaining(reminder);
  return r !== null && r <= 0;
}
