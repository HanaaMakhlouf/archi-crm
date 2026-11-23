import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { calcDaysRemaining } from '../notifications/reminderUtils';
import {
  TABLE_ROW_REMINDERS,
  ONLINE_INFO_SECTION_KEY, ONLINE_INFO_ROW_LABEL, OLD_ONLINE_INFO_SECTION_KEYS,
  RENAMED_CONDITION_ROWS,
} from '../constants';

const CONDITIONS_SECTION_KEY = 'licensing.conditions.rows';

// Row reminders (תזכורת) for the whole office: loading them, setting,
// clearing and delaying one, and clearing a section. Changes show at once and
// are then re-read from the database. Viewers can't change anything.
export function useReminders() {
  const { officeId, isViewer } = useAuth();
  const [reminders, setReminders] = useState([]);

  const fetchReminders = useCallback(async () => {
    const { data, error } = await supabase.from(TABLE_ROW_REMINDERS).select('*');
    if (!error) setReminders(data || []);
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  // Reminders set on שלח בקשת מידע / האם עבר תנאים מקדמיים (replaced by one
  // בקשת מידע לזמין row) move onto that row, keeping their due date. Per client
  // the one due first moves; the rest are dropped. Runs once per session.
  const movedOldRemindersRef = useRef(false);
  useEffect(() => {
    if (isViewer || movedOldRemindersRef.current) return;
    const old = reminders.filter(r =>
      OLD_ONLINE_INFO_SECTION_KEYS.includes(r.section_key) && !String(r.id).startsWith('opt_'));
    if (!old.length) return;
    movedOldRemindersRef.current = true;
    (async () => {
      const dueOrder = (r) => calcDaysRemaining(r) ?? Infinity;
      for (const clientId of new Set(old.map(r => r.client_id))) {
        const [first, ...rest] = old.filter(r => r.client_id === clientId).sort((a, b) => dueOrder(a) - dueOrder(b));
        const alreadyThere = reminders.some(r =>
          r.client_id === clientId && r.section_key === ONLINE_INFO_SECTION_KEY && r.row_label === ONLINE_INFO_ROW_LABEL);
        const toDelete = alreadyThere ? [first, ...rest] : rest;
        if (!alreadyThere) {
          const { error } = await supabase.from(TABLE_ROW_REMINDERS)
            .update({ section_key: ONLINE_INFO_SECTION_KEY, row_label: ONLINE_INFO_ROW_LABEL })
            .eq('id', first.id);
          if (error) { console.error('Move reminder error:', error.message); continue; }
        }
        if (toDelete.length) {
          await supabase.from(TABLE_ROW_REMINDERS).delete().in('id', toDelete.map(r => r.id));
        }
      }
      fetchReminders();
    })();
  }, [reminders, isViewer, fetchReminders]);

  // Reminders on a renamed תנאים row (e.g. עירייה → 145 ד עירייה) follow the
  // row's new name, since reminders are keyed by it. Runs once per session.
  const renamedRemindersRef = useRef(false);
  useEffect(() => {
    if (isViewer || renamedRemindersRef.current) return;
    const old = reminders.filter(r => r.section_key === CONDITIONS_SECTION_KEY
      && RENAMED_CONDITION_ROWS[r.row_label] && !String(r.id).startsWith('opt_'));
    if (!old.length) return;
    renamedRemindersRef.current = true;
    (async () => {
      for (const r of old) {
        const label = RENAMED_CONDITION_ROWS[r.row_label];
        const taken = reminders.some(x => x.client_id === r.client_id && x.section_key === CONDITIONS_SECTION_KEY && x.row_label === label);
        const { error } = taken
          ? await supabase.from(TABLE_ROW_REMINDERS).delete().eq('id', r.id)
          : await supabase.from(TABLE_ROW_REMINDERS).update({ row_label: label }).eq('id', r.id);
        if (error) console.error('Rename reminder error:', error.message);
      }
      fetchReminders();
    })();
  }, [reminders, isViewer, fetchReminders]);

  // Set or clear a reminder for a specific row.
  // days === null → delete the reminder; days > 0 → upsert it.
  // Optimistic update first so Inbox reflects the change immediately.
  const handleReminderChange = useCallback(async (clientId, sectionKey, rowLabel, days) => {
    if (isViewer) return;
    if (days === null) {
      // Remove optimistically — notification disappears from Inbox at once.
      setReminders(prev => prev.filter(r =>
        !(r.client_id === clientId && r.section_key === sectionKey && r.row_label === rowLabel)
      ));
      await supabase.from(TABLE_ROW_REMINDERS)
        .delete()
        .eq('client_id', clientId)
        .eq('section_key', sectionKey)
        .eq('row_label', rowLabel);
    } else {
      const setAt = new Date().toISOString();
      // Update optimistically — countdown badge and future notification reflect new value.
      setReminders(prev => {
        const filtered = prev.filter(r =>
          !(r.client_id === clientId && r.section_key === sectionKey && r.row_label === rowLabel)
        );
        return [...filtered, { id: `opt_${Date.now()}`, client_id: clientId, section_key: sectionKey, row_label: rowLabel, days, set_at: setAt }];
      });
      await supabase.from(TABLE_ROW_REMINDERS)
        .upsert(
          { client_id: clientId, section_key: sectionKey, row_label: rowLabel, days, set_at: setAt, office_id: officeId },
          { onConflict: 'client_id,section_key,row_label' }
        );
    }
    // Sync with real DB id (replaces optimistic placeholder).
    fetchReminders();
  }, [fetchReminders, officeId, isViewer]);

  // Delete all reminders for a section (GrayOut reset).
  // sectionKey ending with '*' → prefix match (clears all sub-sections).
  const handleClearReminders = useCallback(async (clientId, sectionKey) => {
    if (isViewer) return;
    // Optimistic: remove from state immediately so Inbox clears at once.
    if (sectionKey.endsWith('*')) {
      const prefix = sectionKey.slice(0, -1);
      setReminders(prev => prev.filter(r => !(r.client_id === clientId && r.section_key.startsWith(prefix))));
    } else {
      setReminders(prev => prev.filter(r => !(r.client_id === clientId && r.section_key === sectionKey)));
    }
    let q = supabase.from(TABLE_ROW_REMINDERS).delete().eq('client_id', clientId);
    if (sectionKey.endsWith('*')) {
      q = q.like('section_key', sectionKey.slice(0, -1) + '%');
    } else {
      q = q.eq('section_key', sectionKey);
    }
    await q;
    fetchReminders();
  }, [fetchReminders, isViewer]);

  // Update an existing reminder by its DB id (used from InboxView delay/dismiss).
  const handleUpdateReminder = useCallback(async (reminderId, newDays) => {
    if (isViewer) return;
    if (newDays === null) {
      // Optimistic: remove immediately so Inbox clears at once.
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      await supabase.from(TABLE_ROW_REMINDERS).delete().eq('id', reminderId);
    } else {
      const setAt = new Date().toISOString();
      // Optimistic: reset set_at so it's no longer "due" until new delay expires.
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, days: newDays, set_at: setAt } : r));
      await supabase.from(TABLE_ROW_REMINDERS)
        .update({ days: newDays, set_at: setAt })
        .eq('id', reminderId);
    }
    fetchReminders();
  }, [fetchReminders, isViewer]);

  return {
    reminders, fetchReminders, handleReminderChange, handleClearReminders, handleUpdateReminder,
  };
}
