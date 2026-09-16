import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CORE_INVENTORY = path.join(ROOT, 'app', 'generated', 'research-article-inventory.json');
const PANJI_INVENTORY = path.join(ROOT, 'app', 'generated', 'panji-article-inventory.json');
const REPORT = path.join(ROOT, 'public', 'research-articles', 'decoding-panji', 'duplicate-audit.json');
const PUBLIC_ROOT = path.join(ROOT, 'public');

for (const required of [CORE_INVENTORY, PANJI_INVENTORY]) {
  if (!existsSync(required)) throw new Error(`Duplicate control cannot run: missing ${path.relative(ROOT, required)}.`);
}

const core = JSON.parse(readFileSync(CORE_INVENTORY, 'utf8'));
const panji = JSON.parse(readFileSync(PANJI_INVENTORY, 'utf8'));
if (!Array.isArray(core) || core.length !== 522) throw new Error(`Duplicate control expected the verified 522-record core corpus, found ${Array.isArray(core) ? core.length : 'invalid inventory'}.`);
if (!Array.isArray(panji) || panji.length < 1) throw new Error('Duplicate control found no Decoding Panji records.');

const normalizeTitle = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/^[\s]*(?:chapter|article|section)\s+\d+[\s:—–.-]*/i, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const normalizeBody = (value) => String(value ?? '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .normalize('NFKC')
  .replace(/\s+/g, ' ')
  .trim();

function extractBody(record, kind) {
  const file = path.join(PUBLIC_ROOT, record.route, 'index.html');
  if (!existsSync(file)) throw new Error(`Duplicate control cannot read ${file}.`);
  const html = readFileSync(file, 'utf8');
  const className = kind === 'panji' ? 'source-text' : 'article-text';
  const match = html.match(new RegExp(`<div class="${className}">([\\s\\S]*?)<\\/div>`));
  if (!match) throw new Error(`Duplicate control cannot isolate article text in ${path.relative(ROOT, file)}.`);
  return normalizeBody(match[1]);
}

const digest = (text) => createHash('sha256').update(text).digest('hex');
const bodyFingerprint = (text) => {
  const words = text.split(' ').filter(Boolean);
  if (words.length <= 1800) return digest(words.join(' '));
  return digest([...words.slice(0, 900), ...words.slice(-900)].join(' '));
};

const coreRows = core.map((record) => {
  const body = extractBody(record, 'core');
  return {
    corpus: record.series === 'history' ? 'history' : `parallel-philosophy-${record.language}`,
    id: `${record.series}:${record.volume}:${record.chapter}:${record.language}`,
    title: record.title,
    titleKey: normalizeTitle(record.title),
    canonical: record.canonical,
    bodyHash: digest(body),
    bodyFingerprint: bodyFingerprint(body),
    bodyWords: body.split(' ').filter(Boolean).length,
  };
});

const panjiRows = panji.map((record) => {
  const body = extractBody(record, 'panji');
  return {
    corpus: 'decoding-panji',
    id: record.stable_id,
    title: record.title,
    titleKey: normalizeTitle(record.title),
    canonical: record.canonical,
    volume: record.volume,
    bodyHash: digest(body),
    bodyFingerprint: bodyFingerprint(body),
    bodyWords: body.split(' ').filter(Boolean).length,
  };
});

const duplicates = [];
const seenPanjiBody = new Map();
for (const row of panjiRows) {
  const prior = seenPanjiBody.get(row.bodyHash);
  if (prior) duplicates.push({ reason: 'identical-full-text-within-panji', canonicalA: prior.canonical, canonicalB: row.canonical, titleA: prior.title, titleB: row.title });
  else seenPanjiBody.set(row.bodyHash, row);
}

const coreBody = new Map(coreRows.map((row) => [row.bodyHash, row]));
for (const row of panjiRows) {
  const match = coreBody.get(row.bodyHash);
  if (match) duplicates.push({ reason: 'identical-full-text-cross-corpus', canonicalA: match.canonical, canonicalB: row.canonical, titleA: match.title, titleB: row.title });
}

const coreByTitle = new Map();
for (const row of coreRows) {
  if (!row.titleKey || row.titleKey.length < 12) continue;
  const list = coreByTitle.get(row.titleKey) ?? [];
  list.push(row);
  coreByTitle.set(row.titleKey, list);
}
const panjiByTitle = new Map();
for (const row of panjiRows) {
  if (!row.titleKey || row.titleKey.length < 12) continue;
  const list = panjiByTitle.get(row.titleKey) ?? [];
  list.push(row);
  panjiByTitle.set(row.titleKey, list);
}

for (const row of panjiRows) {
  const sameTitleCore = coreByTitle.get(row.titleKey) ?? [];
  for (const match of sameTitleCore) {
    if (row.bodyFingerprint === match.bodyFingerprint) {
      duplicates.push({ reason: 'same-title-and-matching-content-fingerprint-cross-corpus', canonicalA: match.canonical, canonicalB: row.canonical, titleA: match.title, titleB: row.title });
    }
  }
}
for (const [titleKey, rows] of panjiByTitle) {
  if (rows.length < 2) continue;
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      if (rows[i].bodyFingerprint === rows[j].bodyFingerprint) {
        duplicates.push({ reason: 'same-title-and-matching-content-fingerprint-within-panji', canonicalA: rows[i].canonical, canonicalB: rows[j].canonical, titleA: rows[i].title, titleB: rows[j].title, titleKey });
      }
    }
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  compared: {
    coreArticles: coreRows.length,
    decodingPanjiArticles: panjiRows.length,
    coreCorpora: [...new Set(coreRows.map((row) => row.corpus))],
    decodingPanjiVolumes: [...new Set(panjiRows.map((row) => row.volume))].sort((a, b) => a - b),
  },
  methods: [
    'exact normalized full-text SHA-256 across all Panji records',
    'exact normalized full-text SHA-256 against the verified 522 core corpus',
    'normalized-title equality plus first/last-content fingerprint comparison for expanded/reformatted duplicates',
  ],
  duplicateCount: duplicates.length,
  duplicates,
  policy: 'fail-closed: a detected duplicate must be reconciled to one canonical record with preserved provenance before publication',
};
writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (duplicates.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  throw new Error(`Decoding Panji duplicate control found ${duplicates.length} duplicate candidate(s); publication is blocked until canonical/provenance reconciliation is completed.`);
}

console.log('Decoding Panji duplicate control PASS', report.compared);
