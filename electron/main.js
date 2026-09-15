const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');

// Force Chromium's native form-control rendering to match the app's own
// light/dark toggle instead of the OS theme — otherwise Windows dark mode
// forces native <input> widgets dark even when the app itself is light.
nativeTheme.themeSource = 'light';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('pick-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('open-folder', async (_, p) => {
  const err = await shell.openPath(p);
  return err || null; // empty string = success, non-empty = error message
});

ipcMain.handle('set-theme-source', (_, theme) => {
  nativeTheme.themeSource = theme === 'dark' ? 'dark' : 'light';
});
