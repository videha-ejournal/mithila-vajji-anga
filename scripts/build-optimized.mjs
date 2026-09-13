import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';

const runNodeScript = (script, options = {}) =>
  spawnSync(process.execPath, [script, ...(options.args ?? [])], {
    stdio: 'inherit',
    env: options.env ?? process.env,
  });

const runtimeData = runNodeScript('scripts/prepare-runtime-data.mjs');
if (runtimeData.status !== 0) process.exit(runtimeData.status ?? 1);

const imagePreparation = runNodeScript('scripts/prepare-images.mjs');
if (imagePreparation.status !== 0) process.exit(imagePreparation.status ?? 1);

let imageOptimized = false;
try {
  imageOptimized = JSON.parse(
    readFileSync('public/data/image-optimization-report.json', 'utf8'),
  ).optimized === true;
} catch {}

rmSync('dist', { recursive: true, force: true });

const isWindows = process.platform === 'win32';
const executable = isWindows ? 'cmd.exe' : 'node_modules/.bin/vinext';
const argumentsList = isWindows
  ? ['/d', '/s', '/c', 'node_modules\\.bin\\vinext.cmd build']
  : ['build'];
const build = spawnSync(executable, argumentsList, {
  stdio: 'inherit',
  env: {
    ...process.env,
    MVA_IMAGE_OPTIMIZED: imageOptimized ? '1' : '0',
  },
});

const staticEntry = 'dist/client/index.html';
if (!existsSync(staticEntry)) {
  runNodeScript('scripts/prepare-images.mjs', { args: ['--cleanup'] });
  process.exit(build.status ?? 1);
}

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const prefixedAssets = repository
  ? `dist/client/${repository}/_next`
  : undefined;
if (prefixedAssets && existsSync(prefixedAssets)) {
  rmSync('dist/client/_next', { recursive: true, force: true });
  renameSync(prefixedAssets, 'dist/client/_next');
  rmSync(`dist/client/${repository}`, { recursive: true, force: true });
}

for (const route of ['sources', 'updates', 'about']) {
  const exportedPage = `dist/client/${route}.html`;
  if (existsSync(exportedPage)) {
    const cleanUrlDirectory = `dist/client/${route}`;
    mkdirSync(cleanUrlDirectory, { recursive: true });
    copyFileSync(exportedPage, `${cleanUrlDirectory}/index.html`);
  }
}

runNodeScript('scripts/prepare-images.mjs', { args: ['--cleanup'] });

const scholarly = runNodeScript('scripts/scholarly-export.mjs');
if (scholarly.status !== 0) process.exit(scholarly.status ?? 1);

const sourceLibrary = runNodeScript('scripts/source-library.mjs');
if (sourceLibrary.status !== 0) process.exit(sourceLibrary.status ?? 1);

const translationSourcePairs = runNodeScript('scripts/verify-translation-source-pairs.mjs');
if (translationSourcePairs.status !== 0) process.exit(translationSourcePairs.status ?? 1);

const recordSourceProvenance = runNodeScript('scripts/record-source-provenance.mjs');
if (recordSourceProvenance.status !== 0) process.exit(recordSourceProvenance.status ?? 1);

const performance = runNodeScript('scripts/performance-report.mjs');
if (performance.status !== 0) process.exit(performance.status ?? 1);

if (build.status !== 0) {
  console.warn('The static export completed; a platform shutdown warning was ignored.');
}
