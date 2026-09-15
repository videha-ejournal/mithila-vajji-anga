import { existsSync, readFileSync } from 'node:fs';

const SOURCE_CATALOG = 'dist/client/source-library/catalog.json';
const INVENTORY = 'dist/client/source-library/article-expansion-inventory.json';
const LITERATURE_INVENTORY = 'app/literature-inventory.json';
const PARALLEL_HISTORY = 'VIDEHA_Parallel_History.pdf';
const EXPECTED_PARALLEL_HISTORY_UNITS = 100;
const EXPECTED_CORE_ARTICLES = 522;
const EXPECTED_CORE_FILES = new Set([
  'HISTORY_MITHILA_ANGA_VAJJI.pdf',
  'History_Mithila_Vajji_Anga_Volume_II_merge.pdf',
  'GAJENDRA_THAKUR_PARALLEL_PHILOSOPHY.pdf',
  'Samanantar_Darshan_Volume_II_merge.pdf',
]);
const ALLOWED_STATUS = new Set([
  'published-core',
  'structure-audited',
  'needs-structure-audit',
  'book-only-support',
  'duplicate-source-copy',
]);
const NON_ARTICLE_RESOURCE_RE = /(?:^|[_-])(?:QUIZ|UPSC)(?:[_-]|\.|$)|THESAURUS|AI[_-]?VIDEO|TEACHING/i;

function load(file) {
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const catalog = load(SOURCE_CATALOG);
const inventory = load(INVENTORY);
const literature = load(LITERATURE_INVENTORY);
const errors = [];
const sourceItems = (catalog.items ?? []).filter((item) => item.sourceType === 'external-github');
const items = inventory.items ?? [];
const sourceRepository = (catalog.sourceRepositories ?? [])[0] ?? null;

if (inventory.schemaVersion < 2) errors.push(`Expansion inventory schema must be v2 or newer; found ${inventory.schemaVersion ?? 'none'}`);
if (items.length !== sourceItems.length) errors.push(`Inventory/source count mismatch: ${items.length} vs ${sourceItems.length}`);
if (inventory.sourcePdfCount !== items.length) errors.push(`sourcePdfCount mismatch: ${inventory.sourcePdfCount} vs ${items.length}`);
if (inventory.sourceCommit !== sourceRepository?.sourceCommit) errors.push(`Source commit mismatch: ${inventory.sourceCommit} vs ${sourceRepository?.sourceCommit}`);
if (inventory.sourceCatalogCount !== sourceRepository?.sourceCatalogCount) errors.push(`Source catalogue count mismatch: ${inventory.sourceCatalogCount} vs ${sourceRepository?.sourceCatalogCount}`);

const sourceByFilename = new Map(sourceItems.map((item) => [item.filename, item]));
const itemByFilename = new Map(items.map((item) => [item.filename, item]));
const seen = new Set();
for (const item of items) {
  if (!item.filename || seen.has(item.filename)) errors.push(`Missing or duplicate filename: ${item.filename}`);
  seen.add(item.filename);
  if (!ALLOWED_STATUS.has(item.status)) errors.push(`Invalid status for ${item.filename}: ${item.status}`);

  const source = sourceByFilename.get(item.filename);
  if (!source) {
    errors.push(`Inventory item absent from source catalogue: ${item.filename}`);
    continue;
  }
  if (item.sourceCommit !== source.sourceCommit || item.gitBlobSha !== source.gitBlobSha) errors.push(`Pinned source identity mismatch: ${item.filename}`);
  if (item.pinnedSourceUrl !== source.url || item.pinnedGithubUrl !== source.githubUrl) errors.push(`Pinned source URL mismatch: ${item.filename}`);
  if ('citationPdfUrl' in item || 'citation_pdf_url' in item) errors.push(`Book-level inventory must not manufacture article PDF metadata: ${item.filename}`);

  if (item.status !== 'published-core' && item.articleCount != null) errors.push(`Non-core source must not claim published article count: ${item.filename}`);
  if (item.status === 'structure-audited' && !(Number(item.confirmedUnitCount) > 0)) errors.push(`Structurally audited source has no confirmed units: ${item.filename}`);
  if (['needs-structure-audit', 'book-only-support', 'duplicate-source-copy'].includes(item.status) && item.confirmedUnitCount != null) errors.push(`${item.status} source must not claim confirmed units: ${item.filename}`);
  if (item.status === 'duplicate-source-copy' && !item.duplicateOf) errors.push(`Duplicate source copy has no duplicateOf target: ${item.filename}`);
  if (item.status !== 'duplicate-source-copy' && item.duplicateOf) errors.push(`Non-duplicate source unexpectedly has duplicateOf: ${item.filename}`);
  if (NON_ARTICLE_RESOURCE_RE.test(item.filename) && !['book-only-support', 'duplicate-source-copy'].includes(item.status)) errors.push(`Learning/reference resource is unsafe for automatic article segmentation: ${item.filename} → ${item.status}`);
  if (source.workFamilyRole === 'teaching-resource' && !['book-only-support', 'duplicate-source-copy'].includes(item.status)) errors.push(`Teaching resource is unsafe for automatic article segmentation: ${item.filename} → ${item.status}`);
}
for (const source of sourceItems) if (!seen.has(source.filename)) errors.push(`Source PDF missing from expansion inventory: ${source.filename}`);

const core = items.filter((item) => item.status === 'published-core');
const coreFiles = new Set(core.map((item) => item.filename));
if (core.length !== EXPECTED_CORE_FILES.size) errors.push(`Expected ${EXPECTED_CORE_FILES.size} core source files, found ${core.length}`);
for (const filename of EXPECTED_CORE_FILES) if (!coreFiles.has(filename)) errors.push(`Certified core source missing: ${filename}`);
for (const filename of coreFiles) if (!EXPECTED_CORE_FILES.has(filename)) errors.push(`Unexpected source marked published-core: ${filename}`);
const articleCount = core.reduce((sum, item) => sum + Number(item.articleCount ?? 0), 0);
if (articleCount !== EXPECTED_CORE_ARTICLES || inventory.certifiedCoreArticleCount !== EXPECTED_CORE_ARTICLES) errors.push(`Certified core article count must remain ${EXPECTED_CORE_ARTICLES}; found ${articleCount}/${inventory.certifiedCoreArticleCount}`);

const panji = items.filter((item) => /^DECODING_PANJI_[1-6]\.pdf$/i.test(item.filename));
if (panji.length !== 6) errors.push(`Expected all 6 DECODING PANJI PDFs in source inventory; found ${panji.length}`);
for (const item of panji) if (!['structure-audited', 'needs-structure-audit'].includes(item.status)) errors.push(`Panji source has unsafe publication status: ${item.filename} → ${item.status}`);

// Parallel History is the first post-core source with a complete committed
// chapter inventory. It must be structurally promoted, but it must not yet
// claim published article pages.
const parallelHistory = itemByFilename.get(PARALLEL_HISTORY);
if (!parallelHistory) {
  errors.push(`Missing structured source: ${PARALLEL_HISTORY}`);
} else {
  if (parallelHistory.status !== 'structure-audited') errors.push(`${PARALLEL_HISTORY} must be structure-audited; found ${parallelHistory.status}`);
  if (parallelHistory.confirmedUnitCount !== EXPECTED_PARALLEL_HISTORY_UNITS) errors.push(`${PARALLEL_HISTORY} must expose ${EXPECTED_PARALLEL_HISTORY_UNITS} confirmed structural units; found ${parallelHistory.confirmedUnitCount}`);
  if (parallelHistory.articleCount != null) errors.push(`${PARALLEL_HISTORY} must not claim published articleCount before full-text article generation`);
  if (parallelHistory.segmentation?.inventory !== LITERATURE_INVENTORY) errors.push(`${PARALLEL_HISTORY} must cite ${LITERATURE_INVENTORY} as its structural inventory`);
}
if (!Array.isArray(literature) || literature.length !== EXPECTED_PARALLEL_HISTORY_UNITS) errors.push(`Parallel History inventory must contain ${EXPECTED_PARALLEL_HISTORY_UNITS} records`);
else {
  const numbers = literature.map((record) => Number(record?.number)).sort((a, b) => a - b);
  if (numbers.some((number, index) => number !== index + 1)) errors.push('Parallel History inventory must cover chapters 1–100 contiguously');
  for (const record of literature) {
    const number = Number(record?.number);
    const title = String(record?.title ?? '').trim();
    const sourceNote = String(record?.sourceNote ?? '');
    if (!title || /^Chapter\s+\d+$/i.test(title)) errors.push(`Parallel History chapter ${number} has a generic/synthetic title`);
    if (!sourceNote.includes(PARALLEL_HISTORY)) errors.push(`Parallel History chapter ${number} does not identify the source PDF`);
  }
}

// Independently recompute exact duplicate groups from source SHA-256 values.
const bySha = new Map();
for (const source of sourceItems) {
  if (!source.sourceSha256) continue;
  const group = bySha.get(source.sourceSha256) ?? [];
  group.push(source.filename);
  bySha.set(source.sourceSha256, group);
}
let expectedDuplicateGroups = 0;
let expectedDuplicateCopies = 0;
for (const [sha256, filenames] of bySha) {
  if (filenames.length < 2) continue;
  expectedDuplicateGroups += 1;
  expectedDuplicateCopies += filenames.length - 1;
  const groupItems = filenames.map((filename) => itemByFilename.get(filename)).filter(Boolean);
  const canonicalItems = groupItems.filter((item) => item.status !== 'duplicate-source-copy');
  const duplicateItems = groupItems.filter((item) => item.status === 'duplicate-source-copy');
  if (canonicalItems.length !== 1) {
    errors.push(`SHA-256 duplicate group must have exactly one canonical source (${sha256}); found ${canonicalItems.length}: ${filenames.join(', ')}`);
    continue;
  }
  const canonical = canonicalItems[0];
  if (duplicateItems.length !== filenames.length - 1) errors.push(`SHA-256 duplicate group has wrong suppressed-copy count (${sha256}): expected ${filenames.length - 1}, found ${duplicateItems.length}`);
  for (const duplicate of duplicateItems) {
    if (duplicate.duplicateOf !== canonical.filename) errors.push(`Duplicate target mismatch: ${duplicate.filename} should point to ${canonical.filename}, found ${duplicate.duplicateOf}`);
    if (duplicate.sourceSha256 !== canonical.sourceSha256) errors.push(`Duplicate SHA-256 mismatch: ${duplicate.filename} vs ${canonical.filename}`);
  }
}
if (inventory.duplicateGroupCount !== expectedDuplicateGroups) errors.push(`duplicateGroupCount mismatch: expected ${expectedDuplicateGroups}, found ${inventory.duplicateGroupCount}`);
const actualDuplicateCopies = items.filter((item) => item.status === 'duplicate-source-copy').length;
if (actualDuplicateCopies !== expectedDuplicateCopies) errors.push(`Suppressed duplicate-copy count mismatch: expected ${expectedDuplicateCopies}, found ${actualDuplicateCopies}`);

if (errors.length) {
  console.error(`Book expansion inventory verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const status = inventory.countsByStatus ?? {};
console.log(`Book expansion inventory verified: ${items.length} source PDFs; ${articleCount} certified core articles; ${status['structure-audited'] ?? 0} structurally audited book(s); ${status['needs-structure-audit'] ?? 0} awaiting structural audit; ${status['book-only-support'] ?? 0} support-only; ${status['duplicate-source-copy'] ?? 0} duplicate copy/copies suppressed across ${expectedDuplicateGroups} byte-identical group(s); ${PARALLEL_HISTORY}=${EXPECTED_PARALLEL_HISTORY_UNITS} verified structural units.`);
