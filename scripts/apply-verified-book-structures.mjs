import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const INVENTORY_PATH = 'dist/client/source-library/article-expansion-inventory.json';
const LITERATURE_PATH = 'app/literature-inventory.json';
const PARALLEL_HISTORY = 'VIDEHA_Parallel_History.pdf';
const EXPECTED_LITERATURE_UNITS = 100;

function load(path) {
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function summarize(items, field) {
  return [...new Set(items.map((item) => item[field]).filter(Boolean))]
    .map((value) => ({
      [field === 'queueGroup' ? 'group' : 'kind']: value,
      count: items.filter((item) => item[field] === value).length,
    }));
}

const expansion = load(INVENTORY_PATH);
const literature = load(LITERATURE_PATH);
if (!Array.isArray(literature) || literature.length !== EXPECTED_LITERATURE_UNITS) {
  throw new Error(`Parallel History source inventory must contain exactly ${EXPECTED_LITERATURE_UNITS} records; found ${Array.isArray(literature) ? literature.length : 'non-array'}`);
}

const seen = new Set();
for (const record of literature) {
  const number = Number(record?.number);
  const title = clean(record?.title);
  const sourceNote = clean(record?.sourceNote);
  const verificationSources = Array.isArray(record?.verificationSources)
    ? record.verificationSources.map(clean).filter(Boolean)
    : [];
  if (!Number.isInteger(number) || number < 1 || number > EXPECTED_LITERATURE_UNITS || seen.has(number)) {
    throw new Error(`Invalid or duplicate Parallel History unit number: ${number}`);
  }
  seen.add(number);
  if (!title || /^Chapter\s+\d+$/i.test(title)) {
    throw new Error(`Synthetic/generic Parallel History title refused at unit ${number}`);
  }
  if (!sourceNote.includes(PARALLEL_HISTORY)) {
    throw new Error(`Parallel History unit ${number} does not identify ${PARALLEL_HISTORY} in sourceNote`);
  }
  if (verificationSources.length < 1) {
    throw new Error(`Parallel History unit ${number} lacks independent verification source(s)`);
  }
}
if ([...seen].sort((a, b) => a - b).some((number, index) => number !== index + 1)) {
  throw new Error('Parallel History inventory must cover units 1–100 contiguously');
}

const items = expansion.items ?? [];
const source = items.find((item) => item.filename === PARALLEL_HISTORY);
if (!source) throw new Error(`Expansion inventory does not contain ${PARALLEL_HISTORY}`);
if (source.status === 'published-core') throw new Error(`${PARALLEL_HISTORY} must not be part of the frozen 522 core`);
if (source.status === 'duplicate-source-copy') throw new Error(`${PARALLEL_HISTORY} unexpectedly resolves to a duplicate source copy`);
if (source.articleCount != null) throw new Error(`${PARALLEL_HISTORY} must not claim published articles before article generation`);

source.status = 'structure-audited';
source.documentKind = 'verified-structured-book';
source.queueGroup = 'parallel-history';
source.operationalPriority = 2;
source.confirmedUnitCount = EXPECTED_LITERATURE_UNITS;
source.segmentation = {
  basis: 'Complete source-verified Chapters 1–100 inventory',
  inventory: LITERATURE_PATH,
  confirmedUnitCount: EXPECTED_LITERATURE_UNITS,
  titlePolicy: 'source-verified-only',
  note: 'Structural promotion only. Full scholarly article publication still requires source-text extraction, per-unit provenance and article-level verification.',
};
source.publicationRule = 'Eligible for the next family-specific extraction/segmentation pass. Do not mark as published until 100 full-text article editions pass article-level verification.';

const statuses = [
  'published-core',
  'structure-audited',
  'needs-structure-audit',
  'book-only-support',
  'duplicate-source-copy',
];
expansion.countsByStatus = Object.fromEntries(
  statuses.map((status) => [status, items.filter((item) => item.status === status).length]),
);
expansion.queueGroups = summarize(items, 'queueGroup');
expansion.documentKinds = summarize(items, 'documentKind');
expansion.structuredInventorySources = [
  ...(Array.isArray(expansion.structuredInventorySources) ? expansion.structuredInventorySources : []),
  {
    filename: PARALLEL_HISTORY,
    inventory: LITERATURE_PATH,
    confirmedUnitCount: EXPECTED_LITERATURE_UNITS,
    publicationStatus: 'structure-audited-not-yet-published',
  },
];

writeFileSync(INVENTORY_PATH, `${JSON.stringify(expansion, null, 2)}\n`);
console.log(`Promoted ${PARALLEL_HISTORY} to structure-audited with ${EXPECTED_LITERATURE_UNITS} source-verified units; article publication remains gated.`);
