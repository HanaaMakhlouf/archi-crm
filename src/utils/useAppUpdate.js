import { useEffect, useRef, useState } from 'react';

// The desktop app's version and update state (see setupAutoUpdates in electron/main.js).
// update.status: 'idle' | 'checking' | 'latest' | 'downloading' | 'ready' | 'error'
// Outside the desktop app there's nothing to update: version is null.
export function useAppUpdate() {
  const api = window.electronAPI;
  const [info, setInfo] = useState({ version: null, canUpdate: false, update: { status: 'idle' } });
  const notifiedRef = useRef(null);

  useEffect(() => {
    if (!api?.getAppInfo) return undefined;
    let active = true;
    api.getAppInfo().then(res => { if (active) setInfo(res); });
    const off = api.onUpdateState(update => setInfo(prev => ({ ...prev, update })));
    return () => { active = false; off(); };
  }, [api]);

  // One Windows pop-up per downloaded version.
  const { status, version: newVersion } = info.update;
  useEffect(() => {
    if (status !== 'ready' || notifiedRef.current === newVersion) return;
    notifiedRef.current = newVersion;
    if (!('Notification' in window) || Notification.permission === 'denied') return;
    const n = new Notification('גרסה חדשה מוכנה להתקנה', {
      body: `גרסה ${newVersion} הורדה. לחצו על "עדכון עכשיו" בתפריט הצד.`,
      tag: `update_${newVersion}`,
    });
    n.onclick = () => { api?.focusWindow?.(); window.focus(); };
  }, [status, newVersion, api]);

  return {
    ...info,
    check: () => api?.checkForUpdates?.(),
    install: () => api?.installUpdate?.(),
  };
}
