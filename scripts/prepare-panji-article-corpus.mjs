import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

const SOURCE_REPO = 'videha-ejournal/videha-ejournal';
const SOURCE_BRANCH = 'main';
const SOURCE_DIR = '.source-books';
const OUT_ROOT = 'public/research-articles/decoding-panji';
const INVENTORY = 'app/generated/panji-article-inventory.json';
const PUBLIC_INVENTORY = `${OUT_ROOT}/inventory.json`;
const MANIFEST = `${OUT_ROOT}/manifest.json`;
const SOURCE_FILES = Array.from({ length: 6 }, (_, index) => `DECODING_PANJI_${index + 1}.pdf`);

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Videha-MVA-Decoding-Panji-Builder',
  ...(process.env.GITHUB_API_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}` } : {}),
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status ?? 'unknown'}`);
  }
}

function commandExists(command) {
  return spawnSync('bash', ['-lc', `command -v ${command}`], { stdio: 'ignore' }).status === 0;
}

function ensureExtractionTools() {
  if (commandExists('pdftotext')) return;
  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('Decoding Panji article generation needs pdftotext (Poppler).');
  }
  console.log('Installing Poppler for Decoding Panji source extraction…');
  run('sudo', ['apt-get', 'update', '-qq']);
  run('sudo', ['apt-get', 'install', '-y', '-qq', 'poppler-utils']);
  if (!commandExists('pdftotext')) throw new Error('pdftotext is unavailable after Poppler installation.');
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
  console.log(`Fetching Decoding Panji source book: ${filename}`);
  const response = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
  if (!response.ok || !response.body) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const temporary = `${target}.part`;
  rmSync(temporary, { force: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  renameSync(temporary, target);
}

function walkHtml(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(full));
    else if (entry.isFile() && entry.name === 'index.html') files.push(full);
  }
  return files;
}

function patchGeneratedOutput(commit) {
  const mainGithub = `https://github.com/${SOURCE_REPO}/blob/main/`;
  const pinnedGithub = `https://github.com/${SOURCE_REPO}/blob/${commit}/`;
  const mainRaw = `https://raw.githubusercontent.com/${SOURCE_REPO}/main/`;
  const pinnedRaw = `https://raw.githubusercontent.com/${SOURCE_REPO}/${commit}/`;

  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf8'));
  if (!Array.isArray(inventory) || inventory.length < 1) {
    throw new Error('Decoding Panji generator produced no article inventory.');
  }

  for (const record of inventory) {
    if (typeof record.source_html === 'string') record.source_html = record.source_html.replace(mainGithub, pinnedGithub);
    if (typeof record.source_pdf === 'string') record.source_pdf = record.source_pdf.replace(mainRaw, pinnedRaw);
    record.source_repository = SOURCE_REPO;
    record.source_commit = commit;
    record.article_pdf = null;
  }
  const serialized = `${JSON.stringify(inventory, null, 2)}\n`;
  writeFileSync(INVENTORY, serialized);
  writeFileSync(PUBLIC_INVENTORY, serialized);

  const htmlFiles = walkHtml(OUT_ROOT);
  if (htmlFiles.length !== inventory.length + 1) {
    throw new Error(`Expected ${inventory.length + 1} Decoding Panji HTML index files, found ${htmlFiles.length}.`);
  }
  for (const file of htmlFiles) {
    let text = readFileSync(file, 'utf8');
    text = text.replaceAll(mainGithub, pinnedGithub).replaceAll(mainRaw, pinnedRaw);
    writeFileSync(file, text);
  }

  const countsByVolume = {};
  const countsByKind = {};
  for (const record of inventory) {
    countsByVolume[String(record.volume)] = (countsByVolume[String(record.volume)] ?? 0) + 1;
    countsByKind[record.kind] = (countsByKind[record.kind] ?? 0) + 1;
  }
  for (let volume = 1; volume <= 6; volume += 1) {
    if (!countsByVolume[String(volume)]) throw new Error(`Volume ${volume} produced no Decoding Panji articles.`);
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    author: 'Gajendra Thakur',
    archive: 'Videha Digital Research Archive: Mithila, Vajji & Anga',
    corpus: 'Decoding the Panji of Mithila — Volumes I–VI',
    language: 'en',
    sourceRepository: SOURCE_REPO,
    sourceBranch: SOURCE_BRANCH,
    sourceCommit: commit,
    sourceFiles: SOURCE_FILES,
    articleCount: inventory.length,
    countsByVolume,
    countsByKind,
    inventoryUrl: 'https://videha-ejournal.github.io/mithila-vajji-anga/research-articles/decoding-panji/inventory.json',
    note: 'Book-derived scholarly HTML records. Volume I uses substantial source sections and annexural material; Volumes II–VI preserve formal chapters and substantive appendices. Thin structural fragments are merged rather than published as artificial records.',
  };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('Decoding Panji source-pinned corpus:', { articleCount: inventory.length, countsByVolume, countsByKind, sourceCommit: commit });
}

async function main() {
  ensureExtractionTools();
  const commit = await resolveSourceCommit();
  mkdirSync(SOURCE_DIR, { recursive: true });

  const refFile = path.join(SOURCE_DIR, 'panji-source-ref.json');
  let cachedCommit = null;
  try { cachedCommit = JSON.parse(readFileSync(refFile, 'utf8')).sourceCommit ?? null; } catch {}
  if (cachedCommit && cachedCommit !== commit) {
    for (const filename of SOURCE_FILES) rmSync(path.join(SOURCE_DIR, filename), { force: true });
  }

  for (const filename of SOURCE_FILES) await downloadFile(commit, filename);
  writeFileSync(refFile, `${JSON.stringify({ sourceRepository: SOURCE_REPO, sourceCommit: commit, sourceFiles: SOURCE_FILES }, null, 2)}\n`);

  run('python3', ['scripts/run-panji-article-corpus.py']);
  patchGeneratedOutput(commit);
}

await main();
