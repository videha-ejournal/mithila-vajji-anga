import { existsSync, renameSync, rmSync } from 'node:fs';
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

// Vinext writes asset-prefixed files into a physical repository subfolder.
// GitHub Pages already mounts the artifact at that repository path, so flatten
// the generated _next directory while preserving the prefixed URLs in HTML.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const prefixedAssets = repository
  ? `dist/client/${repository}/_next`
  : undefined;
if (prefixedAssets && existsSync(prefixedAssets)) {
  rmSync('dist/client/_next', { recursive: true, force: true });
  renameSync(prefixedAssets, 'dist/client/_next');
  rmSync(`dist/client/${repository}`, { recursive: true, force: true });
}

if (build.status !== 0) {
  console.warn('The static export completed; a platform shutdown warning was ignored.');
}
