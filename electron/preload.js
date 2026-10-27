const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),
  setThemeSource: (theme) => ipcRenderer.invoke('set-theme-source', theme),
  focusWindow: () => ipcRenderer.invoke('focus-window'),
  refocusPage: () => ipcRenderer.invoke('refocus-page'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  // Returns an unsubscribe function.
  onUpdateState: (cb) => {
    const listener = (_, state) => cb(state);
    ipcRenderer.on('update-state', listener);
    return () => ipcRenderer.removeListener('update-state', listener);
  },
  openFileCopy: (name, data) => ipcRenderer.invoke('open-file-copy', name, data),
});
