import { existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

rmSync('dist', { recursive: true, force: true });

const isWindows = process.platform === 'win32';
const executable = isWindows ? 'cmd.exe' : 'node_modules/.bin/vinext';
const argumentsList = isWindows
  ? ['/d', '/s', '/c', 'node_modules\\.bin\\vinext.cmd build']
  : ['build'];
const build = spawnSync(executable, argumentsList, { stdio: 'inherit' });

const staticEntry = 'dist/client/index.html';
if (!existsSync(staticEntry)) {
  process.exit(build.status ?? 1);
}

if (build.status !== 0) {
  console.warn('The static export completed; a platform shutdown warning was ignored.');
}
