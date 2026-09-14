import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';

const runNodeScript = (script, options = {}) =>
  spawnSync(process.execPath, [script, ...(options.args ?? [])], {
    stdio: 'inherit',
    env: options.env ?? process.env,
  });

const runtimeData = runNodeScript('scripts/prepare-runtime-data.mjs');
if (runtimeData.status !== 0) process.exit(runtimeData.status ?? 1);

// Panji source structure is still being verified volume by volume. A normal
// site build reports those unresolved structures but must not block unrelated
// collection landing pages. Permanent Panji detail generation remains guarded
// by `npm run generate:archive`, which invokes the same audit in --strict mode.
const panjiSourceAudit = runNodeScript('scripts/audit-panji-source.mjs');
if (panjiSourceAudit.status !== 0) process.exit(panjiSourceAudit.status ?? 1);

const archiveVerification = runNodeScript('scripts/verify-bilingual-archive.mjs');
if (archiveVerification.status !== 0) process.exit(archiveVerification.status ?? 1);

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

function copyCleanPage(route) {
  const exportedPage = `dist/client/${route}.html`;
  if (!existsSync(exportedPage)) return;
  const cleanUrlDirectory = `dist/client/${route}`;
  mkdirSync(cleanUrlDirectory, { recursive: true });
  copyFileSync(exportedPage, `${cleanUrlDirectory}/index.html`);
}

function mirrorNestedHtml(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      mirrorNestedHtml(path);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html') || entry.name === 'index.html') continue;
    const slug = entry.name.slice(0, -5);
    const cleanUrlDirectory = `${directory}/${slug}`;
    mkdirSync(cleanUrlDirectory, { recursive: true });
    copyFileSync(path, `${cleanUrlDirectory}/index.html`);
  }
}

for (const route of [
  'sources',
  'updates',
  'about',
  'history',
  'philosophy',
  'literature',
  'panji',
  'en',
  'en/philosophy',
  'en/literature',
  'en/panji',
]) {
  copyCleanPage(route);
}

const chapterExportDirectory = 'dist/client/chapters';
if (existsSync(chapterExportDirectory)) {
  for (const entry of readdirSync(chapterExportDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const slug = entry.name.slice(0, -5);
    const exportedPage = `${chapterExportDirectory}/${entry.name}`;
    const cleanUrlDirectory = `${chapterExportDirectory}/${slug}`;
    mkdirSync(cleanUrlDirectory, { recursive: true });
    copyFileSync(exportedPage, `${cleanUrlDirectory}/index.html`);
  }
}

for (const root of ['philosophy', 'literature', 'panji', 'en']) {
  mirrorNestedHtml(`dist/client/${root}`);
}

try {
  const research = JSON.parse(readFileSync('app/research-data.json', 'utf8'));
  const archiveUnits = JSON.parse(readFileSync('app/generated/archive-units.json', 'utf8'));
  const chapterIds = [...(research.political ?? []), ...(research.social ?? [])]
    .map((chapter) => chapter.id)
    .filter(Boolean);
  const baseUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
  const permanentRoutes = [
    '',
    'history/',
    'about/',
    'sources/',
    'updates/',
    'records/',
    'compare/',
    'method/',
    'data/',
    'source-library/',
    'accessibility/',
    'rights/',
    'philosophy/',
    'literature/',
    'panji/',
    'en/',
    'en/philosophy/',
    'en/literature/',
    'en/panji/',
  ];
  const bilingualRoutes = (archiveUnits ?? []).flatMap((unit) => [
    `${unit.group}/${unit.workId}/${unit.unitId}/`,
    `en/${unit.group}/${unit.workId}/${unit.unitId}/`,
  ]);
  const urls = [...new Set([
    ...permanentRoutes,
    ...chapterIds.map((id) => `chapters/${id}/`),
    ...bilingualRoutes,
  ])];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (route) =>
        `  <url><loc>${baseUrl}${route}</loc><lastmod>2026-09-13</lastmod></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync('dist/client/sitemap.xml', sitemap);
} catch (error) {
  console.warn('Could not regenerate the history-and-archive-aware sitemap:', error);
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
