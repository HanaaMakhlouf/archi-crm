const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),
  setThemeSource: (theme) => ipcRenderer.invoke('set-theme-source', theme),
  focusWindow: () => ipcRenderer.invoke('focus-window'),
  openFileCopy: (name, data) => ipcRenderer.invoke('open-file-copy', name, data),
});
