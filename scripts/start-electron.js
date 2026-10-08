// Launches Electron for local development. VS Code's integrated terminal sets
// ELECTRON_RUN_AS_NODE=1, which makes Electron behave like plain Node and
// fail to open a window, so drop it before spawning.
const { spawn } = require('child_process');
const electron = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = process.argv.length > 2 ? process.argv.slice(2) : ['.'];
const child = spawn(electron, args, { stdio: 'inherit', env });
child.on('close', (code) => process.exit(code ?? 0));
