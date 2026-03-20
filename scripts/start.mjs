import { spawn } from 'node:child_process';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const host = '0.0.0.0';

const isWindows = process.platform === 'win32';
const viteBin = isWindows
  ? new URL('../node_modules/.bin/vite.cmd', import.meta.url).pathname
  : new URL('../node_modules/.bin/vite', import.meta.url).pathname;

const child = spawn(
  viteBin,
  ['preview', '--host', host, '--port', String(port)],
  { stdio: 'inherit' }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

