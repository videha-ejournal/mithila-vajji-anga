import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

const SOURCE_REPO = 'videha-ejournal/videha-ejournal';
const SOURCE_BRANCH = 'main';
const SOURCE_DIR = '.source-books';
const OUT_ROOT = 'public/research-articles';
const INVENTORY = 'app/generated/research-article-inventory.json';
const SOURCE_MANIFEST = `${OUT_ROOT}/source-manifest.json`;
const EXPECTED_TOTAL = 522;
const SOURCE_FILES = [
  'HISTORY_MITHILA_ANGA_VAJJI.pdf',
  'History_Mithila_Vajji_Anga_Volume_II_merge.pdf',
  'GAJENDRA_THAKUR_PARALLEL_PHILOSOPHY.pdf',
  'Samanantar_Darshan_Volume_II_merge.pdf',
];

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Videha-MVA-Research-Article-Builder',
  ...(process.env.GITHUB_API_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}` } : {}),
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status ?? 'unknown'}`);
  }
}

function has(command, args = ['--version']) {
  return spawnSync(command, args, { stdio: 'ignore' }).status === 0;
}

function ensureExtractionTools() {
  const tesseractReady = has('tesseract') && (() => {
    const result = spawnSync('tesseract', ['--list-langs'], { encoding: 'utf8' });
    return result.status === 0 && /(^|\n)Devanagari(\n|$)/.test(result.stdout ?? '');
  })();
  if (has('pdftotext') && has('pdftoppm') && tesseractReady) return;

  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('Research article generation needs pdftotext, pdftoppm, Tesseract and the Devanagari language data.');
  }

  console.log('Installing source-extraction dependencies on the GitHub Actions runner…');
  run('sudo', ['apt-get', 'update', '-qq']);
  run('sudo', ['apt-get', 'install', '-y', '-qq', 'poppler-utils', 'tesseract-ocr', 'tesseract-ocr-script-deva']);
  if (!has('pdftotext') || !has('pdftoppm')) throw new Error('Poppler tools are still unavailable after installation.');
  const langs = spawnSync('tesseract', ['--list-langs'], { encoding: 'utf8' });
  if (langs.status !== 0 || !/(^|\n)Devanagari(\n|$)/.test(langs.stdout ?? '')) {
    throw new Error('Tesseract Devanagari language data is unavailable after installation.');
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function encodePath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

async function resolveSourceCommit() {
  if (process.env.VIDEHA_SOURCE_COMMIT) return process.env.VIDEHA_SOURCE_COMMIT.trim();
  const branch = await fetchJson(`https://api.github.com/repos/${SOURCE_REPO}/branches/${SOURCE_BRANCH}`);
  const sha = branch?.commit?.sha;
  if (!/^[0-9a-f]{40}$/i.test(sha ?? '')) throw new Error('Could not resolve the Videha source repository commit.');
  return sha;
}

async function downloadFile(commit, filename) {
  mkdirSync(SOURCE_DIR, { recursive: true });
  const target = path.join(SOURCE_DIR, filename);
  if (existsSync(target)) return;
  const url = `https://raw.githubusercontent.com/${SOURCE_REPO}/${commit}/${encodePath(filename)}`;
  console.log(`Fetching source book: ${filename}`);
  const response = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
  if (!response.ok || !response.body) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const temporary = `${target}.part`;
  rmSync(temporary, { force: true });
  const { createWriteStream } = await import('node:fs');
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  renameSync(temporary, target);
}

function patchGeneratedOutput(commit) {
  const mainGithub = `https://github.com/${SOURCE_REPO}/blob/main/`;
  const pinnedGithub = `https://github.com/${SOURCE_REPO}/blob/${commit}/`;
  const mainRaw = `https://raw.githubusercontent.com/${SOURCE_REPO}/main/`;
  const pinnedRaw = `https://raw.githubusercontent.com/${SOURCE_REPO}/${commit}/`;

  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf8'));
  if (!Array.isArray(inventory) || inventory.length !== EXPECTED_TOTAL) {
    throw new Error(`Expected ${EXPECTED_TOTAL} generated article records, found ${Array.isArray(inventory) ? inventory.length : 'invalid inventory'}.`);
  }

  for (const record of inventory) {
    if (typeof record.source_html === 'string') record.source_html = record.source_html.replace(mainGithub, pinnedGithub);
    if (typeof record.source_pdf === 'string') record.source_pdf = record.source_pdf.replace(mainRaw, pinnedRaw);
    record.source_repository = SOURCE_REPO;
    record.source_commit = commit;
    record.article_pdf = null;
  }
  writeFileSync(INVENTORY, `${JSON.stringify(inventory, null, 2)}\n`);

  const htmlFiles = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name === 'index.html') htmlFiles.push(full);
    }
  };
  walk(OUT_ROOT);
  if (htmlFiles.length !== EXPECTED_TOTAL + 1) {
    throw new Error(`Expected ${EXPECTED_TOTAL + 1} article/index HTML files, found ${htmlFiles.length}.`);
  }

  for (const file of htmlFiles) {
    if (file === path.join(OUT_ROOT, 'index.html')) continue;
    let text = readFileSync(file, 'utf8');
    text = text
      .replaceAll(mainGithub, pinnedGithub)
      .replaceAll(mainRaw, pinnedRaw)
      .replace(/^\s*<meta name="citation_pdf_url"[^>]*>\s*\n?/m, '');
    writeFileSync(file, text);
  }

  const counts = inventory.reduce((acc, record) => {
    const key = record.series === 'history' ? 'history-en' : `parallel-philosophy-${record.language}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    author: 'Gajendra Thakur',
    archive: 'Videha Digital Research Archive: Mithila, Vajji & Anga',
    archiveDoi: '10.5281/zenodo.22754977',
    sourceRepository: SOURCE_REPO,
    sourceBranch: SOURCE_BRANCH,
    sourceCommit: commit,
    articleCount: inventory.length,
    counts,
    sourceFiles: SOURCE_FILES,
    note: 'The source-book PDF is provenance for each HTML article edition. It is not declared as citation_pdf_url because it is not an article-level PDF.',
  };
  writeFileSync(SOURCE_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function main() {
  ensureExtractionTools();
  const commit = await resolveSourceCommit();
  mkdirSync(SOURCE_DIR, { recursive: true });

  const refFile = path.join(SOURCE_DIR, 'source-ref.json');
  let cachedCommit = null;
  try { cachedCommit = JSON.parse(readFileSync(refFile, 'utf8')).sourceCommit ?? null; } catch {}
  if (cachedCommit && cachedCommit !== commit) {
    for (const filename of SOURCE_FILES) rmSync(path.join(SOURCE_DIR, filename), { force: true });
    rmSync('.article-ocr-v1', { recursive: true, force: true });
  }

  for (const filename of SOURCE_FILES) await downloadFile(commit, filename);
  writeFileSync(refFile, `${JSON.stringify({ sourceRepository: SOURCE_REPO, sourceCommit: commit, sourceFiles: SOURCE_FILES }, null, 2)}\n`);

  run('python3', ['scripts/build-research-article-corpus.py']);
  patchGeneratedOutput(commit);
  console.log(`Materialized ${EXPECTED_TOTAL} scholarly article pages from source commit ${commit}.`);
}

await main();
