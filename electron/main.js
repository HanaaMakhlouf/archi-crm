const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:3000';

// Force Chromium's native form-control rendering to match the app's own
// light/dark toggle instead of the OS theme — otherwise Windows dark mode
// forces native <input> widgets dark even when the app itself is light.
nativeTheme.themeSource = 'light';

// Windows only shows desktop notifications for an app with an ID; matches build.appId.
if (process.platform === 'win32') app.setAppUserModelId('com.clientmanager.app');

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

// A saved folder whose path no longer exists was usually moved one level down
// on the server (e.g. W:\work\... → W:\WORK1\work\...). Climb to the deepest
// part of the path that still exists and look for the rest under each of its
// subfolders.
function findMovedFolder(p) {
  const rest = [];
  let base = p;
  while (!fs.existsSync(base)) {
    const parent = path.dirname(base);
    if (parent === base) return null; // reached the root (server or drive unreachable)
    rest.unshift(path.basename(base));
    base = parent;
  }
  let subdirs;
  try {
    subdirs = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory());
  } catch {
    return null;
  }
  for (const d of subdirs) {
    const candidate = path.join(base, d.name, ...rest);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Returns { path } — the folder actually opened (differs from p when it was
// found at a new location, so the caller can save it) — or { error }.
ipcMain.handle('open-folder', async (_, p) => {
  const target = fs.existsSync(p) ? p : findMovedFolder(p);
  if (!target) return { error: 'not_found' };
  const err = await shell.openPath(target);
  return err ? { error: err } : { path: target };
});

// Opens a received attachment in its default program (Acrobat, Word, ...),
// where it can be printed. The copy goes to a temp folder; program files are
// refused even if one got past the app's upload check.
const BLOCKED_EXT = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|jar|lnk|reg|hta)$/i;

ipcMain.handle('open-file-copy', async (_, name, data) => {
  const safe = path.basename(String(name || '')).replace(/[<>:"/\\|?*\x00-\x1f]+/g, '_') || 'file';
  if (BLOCKED_EXT.test(safe)) return 'blocked';
  const dir = path.join(app.getPath('temp'), 'client-manager-files');
  await fs.promises.mkdir(dir, { recursive: true });
  const target = path.join(dir, `${Date.now()}-${safe}`);
  await fs.promises.writeFile(target, Buffer.from(data));
  return (await shell.openPath(target)) || null; // '' = opened
});

// Clicking a desktop notification brings the app to the front.
ipcMain.handle('focus-window', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

ipcMain.handle('set-theme-source', (_, theme) => {
  nativeTheme.themeSource = theme === 'dark' ? 'dark' : 'light';
});
