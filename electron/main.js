const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:3000';

// Force Chromium's native form-control rendering to match the app's own
// light/dark toggle instead of the OS theme — otherwise Windows dark mode
// forces native <input> widgets dark even when the app itself is light.
nativeTheme.themeSource = 'light';

// Only one running copy — a second launch just focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;

// The app itself lives at file:// (packaged) or the dev server; anything
// else (signed PDF links, mailto:, websites) opens in the user's browser.
function isAppUrl(url) {
  return isDev ? url.startsWith(DEV_URL) : url.startsWith('file://');
}

function openExternal(url) {
  if (/^(https?|mailto|tel):/i.test(url)) shell.openExternal(url);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, '../buildResources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

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
