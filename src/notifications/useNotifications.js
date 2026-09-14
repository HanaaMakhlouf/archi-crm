import { useState, useEffect, useMemo, useCallback } from 'react';
import { ONE_DAY_MS, NOTIFICATION_REFRESH_MS, NOTIFICATION_DELAY_UNIT } from '../constants';
import { computeNotifications, computeReminderNotifications } from './engine';

const ONE_MINUTE_MS = 60 * 1000;

const SNOOZE_KEY = 'notification_snoozes';

function loadSnoozedMap() {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}'); }
  catch { return {}; }
}

export function useNotifications(clients, reminders = []) {
  const [snoozedMap, setSnoozedMap] = useState(loadSnoozedMap);
  const [tick, setTick] = useState(0); // increments every 60s to force recompute

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), NOTIFICATION_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const notifications = useMemo(() => {
    const regular = computeNotifications(clients, snoozedMap);
    const reminderNotifs = computeReminderNotifications(clients, reminders);
    return [...regular, ...reminderNotifs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, snoozedMap, reminders, tick]); // tick intentionally forces recompute on timer

  const snoozeNotification = useCallback((id, days) => {
    const unitMs = NOTIFICATION_DELAY_UNIT === 'minutes' ? ONE_MINUTE_MS : ONE_DAY_MS;
    const until = new Date(Date.now() + days * unitMs).toISOString();
    setSnoozedMap(prev => {
      const newMap = { ...prev, [id]: until };
      localStorage.setItem(SNOOZE_KEY, JSON.stringify(newMap));
      return newMap;
    });
  }, []);

  return { notifications, notificationCount: notifications.length, snoozeNotification };
}
