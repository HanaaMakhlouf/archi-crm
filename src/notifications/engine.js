import { ONE_DAY_MS, NOTIFICATION_DELAY_UNIT, LABEL_INACTIVE, NOTIF_TYPE_ROW_REMINDER } from '../constants';
import { NOTIFICATION_RULES } from './rules';
import { isReminderDue } from './reminderUtils';

const ONE_MINUTE_MS = 60 * 1000;

// Returns elapsed units for delay comparison (minutes in test mode, days in production).
function elapsedUnits(client) {
  const createdMs = new Date(client.created_at).getTime();
  if (NOTIFICATION_DELAY_UNIT === 'minutes') {
    return Math.floor((Date.now() - createdMs) / ONE_MINUTE_MS);
  }
  return elapsedDays(client);
}

// Always returns whole calendar days elapsed since client.created_at (ignores time-of-day).
function elapsedDays(client) {
  const created = new Date(client.created_at);
  created.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - created) / ONE_DAY_MS);
}

// Returns array of active notification objects for given clients + snooze map.
// snoozedMap: { [notificationId]: ISO timestamp string }
// notificationId = `${client.id}_${rule.type}` — stable, deterministic
export function computeNotifications(clients, snoozedMap) {
  const now = Date.now();
  const notifications = [];

  for (const rule of NOTIFICATION_RULES) {
    for (const client of clients) {
      if (client.label === LABEL_INACTIVE) continue;
      if (!rule.check(client)) continue;
      if (elapsedUnits(client) < rule.delayDays) continue;

      const id = `${client.id}_${rule.type}`;
      const snoozedUntil = snoozedMap[id];
      if (snoozedUntil && new Date(snoozedUntil).getTime() > now) continue;

      notifications.push({
        id,
        client_id: client.id,
        client,
        type: rule.type,
        message: rule.getMessage(client, elapsedDays(client)),
        created_at: client.created_at,
      });
    }
  }

  return notifications.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// Returns notification objects for any row_reminders rows that are now due.
// reminders: array of row_reminders DB rows
// clients: array of client objects (for joining client data onto notification)
export function computeReminderNotifications(clients, reminders) {
  if (!reminders || !reminders.length) return [];
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  return reminders
    .filter(r => {
      const client = clientMap[r.client_id];
      if (!client || client.label === LABEL_INACTIVE) return false;
      return isReminderDue(r);
    })
    .map(r => ({
      id: `reminder_${r.id}`,
      client_id: r.client_id,
      client: clientMap[r.client_id],
      type: NOTIF_TYPE_ROW_REMINDER,
      message: `${r.row_label}`,
      created_at: r.set_at,
      reminderMeta: { reminderId: r.id, sectionKey: r.section_key },
    }));
}
