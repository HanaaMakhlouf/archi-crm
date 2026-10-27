const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

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

// ── Updates ──
// New versions are published as GitHub releases (npm run electron:publish).
// The installed app checks on start and every few hours, downloads a newer
// version in the background, and tells the page, which offers "עדכון עכשיו".
// Only the packaged app updates; the dev app just reports its version.
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
let updateState = { status: 'idle', version: null, percent: null };

function setUpdateState(next) {
  updateState = { ...updateState, ...next };
  mainWindow?.webContents.send('update-state', updateState);
}

function setupAutoUpdates() {
  if (isDev) return;
  const { autoUpdater } = require('electron-updater');
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // closing the app also installs a downloaded update

  autoUpdater.on('checking-for-update', () => {
    if (updateState.status !== 'ready') setUpdateState({ status: 'checking' });
  });
  autoUpdater.on('update-available', (info) => setUpdateState({ status: 'downloading', version: info.version, percent: 0 }));
  autoUpdater.on('update-not-available', () => {
    if (updateState.status !== 'ready') setUpdateState({ status: 'latest' });
  });
  autoUpdater.on('download-progress', (p) => setUpdateState({ status: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', (info) => setUpdateState({ status: 'ready', version: info.version, percent: 100 }));
  autoUpdater.on('error', (err) => {
    console.error('Update error:', err?.message || err);
    // No network, GitHub down, etc. — say so only if nothing is waiting to install.
    if (updateState.status !== 'ready') setUpdateState({ status: 'error' });
  });

  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  check();
  setInterval(check, UPDATE_CHECK_INTERVAL_MS);

  ipcMain.handle('check-for-updates', check);
  ipcMain.handle('install-update', () => {
    if (updateState.status === 'ready') autoUpdater.quitAndInstall(true, true); // silent, then reopen
  });
}

ipcMain.handle('get-app-info', () => ({ version: app.getVersion(), canUpdate: !isDev, update: updateState }));

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── Client folders on the office server ──
// Every PC maps the server share to a drive letter, but not the same way:
// on one PC W: is \\Server\d\WORK (folders at W:\WORK1\work\...), on another
// it's \\Server\d\WORK\WORK1 (the same folders at W:\work\...). A drive path
// saved on one PC is therefore wrong on the next, so folders are saved as
// their UNC path (\\Server\d\WORK\WORK1\work\...), which is the same everywhere.

// Drive letter → UNC root of this PC's mapped network drives, e.g. { W: '\\Server\d\WORK' }.
function readDriveMappings() {
  if (process.platform !== 'win32') return Promise.resolve({});
  return new Promise((resolve) => {
    execFile('net', ['use'], { windowsHide: true, timeout: 5000 }, (err, stdout) => {
      const map = {};
      if (!err) {
        for (const m of String(stdout).matchAll(/^\S*\s+([A-Z]:)\s+(\\\\.+?)(?:\s{2,}|\s*$)/gim)) {
          map[m[1].toUpperCase()] = m[2].trim();
        }
      }
      resolve(map);
    });
  });
}

let driveMappings = null;
async function getDriveMappings() {
  if (!driveMappings) driveMappings = await readDriveMappings();
  return driveMappings;
}

function toUnc(p, mappings) {
  const m = /^([a-zA-Z]:)(?:[\\/]|$)(.*)$/.exec(p || '');
  const root = m && mappings[m[1].toUpperCase()];
  return root ? path.win32.join(root, m[2]) : p;
}

const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const subdirsOf = (p) => {
  try { return fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => path.join(p, d.name)); }
  catch { return []; }
};

// Looks for a saved folder that isn't at its saved path: its share may sit one
// level higher or lower on this PC (see above), it may use a drive letter this
// PC doesn't have, or it may have moved one level down on the server.
function findFolder(p, mappings) {
  const { root } = path.win32.parse(p);
  const segs = p.slice(root.length).split(/[\\/]/).filter(Boolean);
  const roots = [...new Set([root, ...Object.keys(mappings).map(d => d + '\\'), ...Object.values(mappings)])].filter(isDir);

  for (const base of roots) {
    // Drop up to 2 leading folders (the share is mapped deeper here), keeping
    // at least 2 so a bare client name can't match some other folder.
    for (let drop = 0; drop <= 2 && segs.length - drop >= 2; drop++) {
      const rest = segs.slice(drop);
      const direct = path.join(base, ...rest);
      if (isDir(direct)) return direct;
      // …or one folder deeper (the share is mapped higher here, or the folders moved down).
      for (const sub of subdirsOf(base)) {
        const candidate = path.join(sub, ...rest);
        if (isDir(candidate)) return candidate;
      }
    }
  }
  return null;
}

ipcMain.handle('pick-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  if (r.canceled) return null;
  return toUnc(r.filePaths[0], await getDriveMappings());
});

// Returns { path } — the folder opened, as a UNC path whenever it's on the
// server; when it differs from p the caller saves it so every PC finds it — or { error }.
ipcMain.handle('open-folder', async (_, p) => {
  let mappings = await getDriveMappings();
  let target = isDir(p) ? p : findFolder(p, mappings);
  if (!target) {
    // A drive may have been mapped since the app started.
    driveMappings = null;
    mappings = await getDriveMappings();
    target = findFolder(p, mappings);
  }
  if (!target) return { error: 'not_found' };
  const err = await shell.openPath(target);
  return err ? { error: err } : { path: toUnc(target, mappings) };
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

// After a native alert()/confirm() closes, Electron on Windows can leave the
// page's inputs ignoring clicks and typing until the window loses and regains
// focus. The renderer calls this right after each such dialog to do just that.
ipcMain.handle('refocus-page', () => {
  if (!mainWindow) return;
  mainWindow.blur();
  mainWindow.focus();
  mainWindow.webContents.focus();
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
