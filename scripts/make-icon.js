// Renders the app icon (the sidebar's "logo" brand icon on its teal tile) to
// buildResources/icon.png. Run with: npm run electron:icon
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const TILE_FROM = '#2c7a6e'; // same gradient as .brand-logo in src/App.css
const TILE_TO = '#1d5850';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TILE_FROM}"/>
      <stop offset="1" stop-color="${TILE_TO}"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" fill="url(#tile)"/>
  <g transform="translate(4.2 4.2) scale(0.65)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8" cy="8" r="3"/>
    <path d="M2.5 19.5a5.5 5.5 0 0 1 11 0"/>
    <path d="M15.5 19.5v-4M18.5 19.5v-7M21.5 19.5v-10"/>
  </g>
</svg>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: SIZE, height: SIZE, show: false, frame: false, transparent: true,
    useContentSize: true, webPreferences: { offscreen: true },
  });
  const html = `<html><body style="margin:0;background:transparent">${svg}</body></html>`;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise((r) => setTimeout(r, 300));
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE });
  const out = path.join(__dirname, '..', 'buildResources', 'icon.png');
  fs.writeFileSync(out, img.resize({ width: SIZE, height: SIZE }).toPNG());
  console.log('wrote', out, img.getSize());
  app.quit();
});
