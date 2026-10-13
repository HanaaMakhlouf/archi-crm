import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { nameFromEmail } from '../utils/format';
import {
  TABLE_NOTIFICATION_MESSAGES, BUCKET_NOTIFICATION_IMAGES,
  MESSAGES_HISTORY_DAYS, NOTIFICATION_REFRESH_MS, ONE_DAY_MS,
} from '../constants';

// Signed picture links last 12h and are renewed after 6h, so a long-open app
// never shows an expired one.
const IMAGE_URL_TTL_S = 12 * 60 * 60;
const IMAGE_URL_RENEW_MS = 6 * 60 * 60 * 1000;

// Windows pop-up for a message that arrived while the app was running.
function showDesktopNotification(message, onClick) {
  if (!('Notification' in window) || Notification.permission === 'denied') return;
  const body = [message.client_name, message.message].filter(Boolean).join(' — ');
  const n = new Notification(`הודעה חדשה מ${nameFromEmail(message.sender_email)}`, { body, tag: `msg_${message.id}` });
  n.onclick = () => {
    window.electronAPI?.focusWindow?.();
    window.focus();
    onClick?.();
  };
}

// Messages managers sent to the signed-in user (newest first), refreshed
// every minute. `onOpen` runs when the user clicks a desktop pop-up.
export function useMessages({ onOpen } = {}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [imageUrls, setImageUrls] = useState({}); // image_path → signed URL
  const signedRef = useRef({});   // image_path → { url, at }
  const seenRef = useRef(null);   // message ids already shown; null until first load
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    const since = new Date(Date.now() - MESSAGES_HISTORY_DAYS * ONE_DAY_MS).toISOString();
    const { data, error } = await supabase
      .from(TABLE_NOTIFICATION_MESSAGES)
      .select('*')
      .eq('recipient_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Messages error:', error.message);
      return;
    }

    if (seenRef.current) {
      data.filter(m => !m.read_at && !seenRef.current.has(m.id))
        .forEach(m => showDesktopNotification(m, () => onOpenRef.current?.()));
    }
    seenRef.current = new Set(data.map(m => m.id));
    setMessages(data);

    const now = Date.now();
    const stale = [...new Set(data.map(m => m.image_path).filter(Boolean))]
      .filter(p => !signedRef.current[p] || now - signedRef.current[p].at > IMAGE_URL_RENEW_MS);
    if (stale.length) {
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET_NOTIFICATION_IMAGES)
        .createSignedUrls(stale, IMAGE_URL_TTL_S);
      if (signError) console.error('Message images error:', signError.message);
      (signed || []).forEach(s => {
        if (s.signedUrl) signedRef.current[s.path] = { url: s.signedUrl, at: now };
      });
      setImageUrls(Object.fromEntries(Object.entries(signedRef.current).map(([p, v]) => [p, v.url])));
    }
  }, [user]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, NOTIFICATION_REFRESH_MS);
    window.addEventListener('focus', fetchMessages);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchMessages);
    };
  }, [fetchMessages]);

  const markRead = useCallback(async (id) => {
    const readAt = new Date().toISOString();
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, read_at: readAt } : m)));
    const { error } = await supabase.from(TABLE_NOTIFICATION_MESSAGES).update({ read_at: readAt }).eq('id', id);
    if (error) console.error('Mark read error:', error.message);
  }, []);

  return {
    messages,
    unreadCount: messages.filter(m => !m.read_at).length,
    imageUrls,
    markRead,
  };
}
