import { existsSync, readFileSync } from 'node:fs';

const SOURCE_CATALOG = 'dist/client/source-library/catalog.json';
const INVENTORY = 'dist/client/source-library/article-expansion-inventory.json';
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
]);

function load(file) {
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const catalog = load(SOURCE_CATALOG);
const inventory = load(INVENTORY);
const errors = [];
const sourceItems = (catalog.items ?? []).filter((item) => item.sourceType === 'external-github');
const items = inventory.items ?? [];
const sourceRepository = (catalog.sourceRepositories ?? [])[0] ?? null;

if (items.length !== sourceItems.length) {
  errors.push(`Inventory/source count mismatch: ${items.length} vs ${sourceItems.length}`);
}
if (inventory.sourcePdfCount !== items.length) {
  errors.push(`sourcePdfCount mismatch: ${inventory.sourcePdfCount} vs ${items.length}`);
}
if (inventory.sourceCommit !== sourceRepository?.sourceCommit) {
  errors.push(`Source commit mismatch: ${inventory.sourceCommit} vs ${sourceRepository?.sourceCommit}`);
}
if (inventory.sourceCatalogCount !== sourceRepository?.sourceCatalogCount) {
  errors.push(`Source catalogue count mismatch: ${inventory.sourceCatalogCount} vs ${sourceRepository?.sourceCatalogCount}`);
}

const sourceByFilename = new Map(sourceItems.map((item) => [item.filename, item]));
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
  if (item.sourceCommit !== source.sourceCommit || item.gitBlobSha !== source.gitBlobSha) {
    errors.push(`Pinned source identity mismatch: ${item.filename}`);
  }
  if (item.pinnedSourceUrl !== source.url || item.pinnedGithubUrl !== source.githubUrl) {
    errors.push(`Pinned source URL mismatch: ${item.filename}`);
  }
  if ('citationPdfUrl' in item || 'citation_pdf_url' in item) {
    errors.push(`Book-level inventory must not manufacture article PDF metadata: ${item.filename}`);
  }

  if (item.status !== 'published-core' && item.articleCount != null) {
    errors.push(`Non-core source must not claim published article count: ${item.filename}`);
  }
  if (item.status === 'structure-audited' && !(Number(item.confirmedUnitCount) > 0)) {
    errors.push(`Structurally audited source has no confirmed units: ${item.filename}`);
  }
  if (item.status === 'needs-structure-audit' && item.confirmedUnitCount != null) {
    errors.push(`Unaudited source must not claim confirmed units: ${item.filename}`);
  }
}

for (const source of sourceItems) {
  if (!seen.has(source.filename)) errors.push(`Source PDF missing from expansion inventory: ${source.filename}`);
}

const core = items.filter((item) => item.status === 'published-core');
const coreFiles = new Set(core.map((item) => item.filename));
if (core.length !== EXPECTED_CORE_FILES.size) {
  errors.push(`Expected ${EXPECTED_CORE_FILES.size} core source files, found ${core.length}`);
}
for (const filename of EXPECTED_CORE_FILES) {
  if (!coreFiles.has(filename)) errors.push(`Certified core source missing: ${filename}`);
}
for (const filename of coreFiles) {
  if (!EXPECTED_CORE_FILES.has(filename)) errors.push(`Unexpected source marked published-core: ${filename}`);
}
const articleCount = core.reduce((sum, item) => sum + Number(item.articleCount ?? 0), 0);
if (articleCount !== EXPECTED_CORE_ARTICLES || inventory.certifiedCoreArticleCount !== EXPECTED_CORE_ARTICLES) {
  errors.push(`Certified core article count must remain ${EXPECTED_CORE_ARTICLES}; found ${articleCount}/${inventory.certifiedCoreArticleCount}`);
}

const panji = items.filter((item) => /^DECODING_PANJI_[1-6]\.pdf$/i.test(item.filename));
if (panji.length !== 6) errors.push(`Expected all 6 DECODING PANJI PDFs in source inventory; found ${panji.length}`);
for (const item of panji) {
  if (!['structure-audited', 'needs-structure-audit'].includes(item.status)) {
    errors.push(`Panji source has unsafe publication status: ${item.filename} → ${item.status}`);
  }
}

if (errors.length) {
  console.error(`Book expansion inventory verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const status = inventory.countsByStatus ?? {};
console.log(`Book expansion inventory verified: ${items.length} source PDFs; ${articleCount} certified core articles; ${status['structure-audited'] ?? 0} structurally audited book(s); ${status['needs-structure-audit'] ?? 0} awaiting structural audit; ${status['book-only-support'] ?? 0} support-only.`);
