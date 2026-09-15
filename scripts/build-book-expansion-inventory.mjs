import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SOURCE_CATALOG = 'dist/client/source-library/catalog.json';
const PANJI_INVENTORY = 'app/generated/panji-inventory.json';
const OUTPUT = 'dist/client/source-library/article-expansion-inventory.json';

const CORE = new Map([
  ['HISTORY_MITHILA_ANGA_VAJJI.pdf', { family: 'history', articleCount: 28, note: 'History Volume I' }],
  ['History_Mithila_Vajji_Anga_Volume_II_merge.pdf', { family: 'history', articleCount: 150, note: 'History Volume II' }],
  ['GAJENDRA_THAKUR_PARALLEL_PHILOSOPHY.pdf', { family: 'parallel-philosophy', articleCount: 144, note: 'Parallel Philosophy Volume I: 72 Maithili + 72 English' }],
  ['Samanantar_Darshan_Volume_II_merge.pdf', { family: 'parallel-philosophy', articleCount: 200, note: 'Parallel Philosophy Volume II: 100 Maithili + 100 English' }],
]);

const STATUS = new Set([
  'published-core',
  'structure-audited',
  'needs-structure-audit',
  'book-only-support',
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function queueGroup(item) {
  const filename = String(item.filename ?? '');
  if (/^DECODING_PANJI_[1-6]\.pdf$/i.test(filename)) return 'panji';
  if (/SAMAGRA|GADYA_PADYA_BHARTI|37_(?:MAITHILI_)?CHILDREN/i.test(filename)) return 'samagra-and-collected-works';
  if (item.translationOf || item.translatedAs) return 'translation-pairs';
  if (/HISTORY|MITHILA.*(?:VAJJI|ANGA)|(?:VAJJI|ANGA).*MITHILA/i.test(filename)) return 'mithila-vajji-anga-history';
  return 'remaining-books';
}

function operationalPriority(group, status) {
  if (status === 'published-core') return 0;
  if (group === 'panji') return 1;
  if (group === 'samagra-and-collected-works') return 2;
  if (group === 'translation-pairs') return 3;
  if (group === 'mithila-vajji-anga-history') return 4;
  if (status === 'book-only-support') return 9;
  return 5;
}

if (!existsSync(SOURCE_CATALOG)) {
  throw new Error(`Missing ${SOURCE_CATALOG}. Run scripts/source-library.mjs after the static export first.`);
}

const catalog = readJson(SOURCE_CATALOG);
const panji = existsSync(PANJI_INVENTORY) ? readJson(PANJI_INVENTORY) : [];
const panjiByWork = new Map();
for (const unit of Array.isArray(panji) ? panji : []) {
  if (!unit?.workId) continue;
  const list = panjiByWork.get(unit.workId) ?? [];
  list.push(unit);
  panjiByWork.set(unit.workId, list);
}

const sourceRepository = (catalog.sourceRepositories ?? [])[0] ?? null;
const sourceCommit = sourceRepository?.sourceCommit ?? null;
const sourceItems = (catalog.items ?? []).filter((item) => item.sourceType === 'external-github');

const items = sourceItems.map((item) => {
  const filename = item.filename;
  const core = CORE.get(filename);
  const panjiMatch = /^DECODING_PANJI_([1-6])\.pdf$/i.exec(filename);
  const panjiWorkId = panjiMatch ? `panji-${Number(panjiMatch[1])}` : null;
  const verifiedPanjiUnits = panjiWorkId ? (panjiByWork.get(panjiWorkId) ?? []) : [];
  const supportOnly = item.sourceRole !== 'book-or-research-document' || item.workFamilyRole === 'teaching-resource';

  let status = 'needs-structure-audit';
  let segmentation = null;
  let articleCount = null;
  let confirmedUnitCount = null;

  if (core) {
    status = 'published-core';
    articleCount = core.articleCount;
    confirmedUnitCount = core.articleCount;
    segmentation = {
      basis: 'Verified source chapter headings and source page boundaries',
      note: core.note,
    };
  } else if (panjiWorkId && verifiedPanjiUnits.length > 0) {
    status = 'structure-audited';
    confirmedUnitCount = verifiedPanjiUnits.length;
    segmentation = {
      basis: 'Source Chapter-N markers plus source-verified chapter titles',
      workId: panjiWorkId,
      note: 'Confirmed units are structural candidates only; no article publication is implied.',
    };
  } else if (supportOnly) {
    status = 'book-only-support';
    segmentation = {
      basis: 'Catalogued as a repository-support or teaching resource',
      note: 'Retained for provenance and relationships; not automatically promoted to an article corpus.',
    };
  }

  if (!STATUS.has(status)) throw new Error(`Unexpected expansion status for ${filename}: ${status}`);

  const group = queueGroup(item);
  return {
    id: item.id,
    filename,
    title: item.title,
    language: item.language ?? null,
    languageCode: item.languageCode ?? null,
    sourceRepository: item.repository,
    sourceCommit: item.sourceCommit,
    gitBlobSha: item.gitBlobSha,
    sourceSha256: item.sourceSha256 ?? null,
    pinnedSourceUrl: item.url,
    pinnedGithubUrl: item.githubUrl,
    currentPublishedUrl: item.currentPublishedUrl ?? null,
    sourceRole: item.sourceRole,
    editionNote: item.editionNote ?? null,
    seriesTitle: item.seriesTitle ?? null,
    seriesPart: item.seriesPart ?? null,
    workFamilyId: item.workFamilyId ?? null,
    workFamilyTitle: item.workFamilyTitle ?? null,
    workFamilyRole: item.workFamilyRole ?? null,
    translationOf: item.translationOf ?? null,
    translationOfTitle: item.translationOfTitle ?? null,
    translatedAs: item.translatedAs ?? null,
    translatedAsTitle: item.translatedAsTitle ?? null,
    status,
    queueGroup: group,
    operationalPriority: operationalPriority(group, status),
    confirmedUnitCount,
    articleCount,
    segmentation,
    publicationRule: status === 'published-core'
      ? 'Already represented in the certified 522-article core.'
      : 'Do not publish article pages until structural boundaries and titles are source-verified; never split mechanically by page count.',
  };
}).sort((a, b) => a.operationalPriority - b.operationalPriority || a.title.localeCompare(b.title));

const countsByStatus = Object.fromEntries(
  [...STATUS].map((status) => [status, items.filter((item) => item.status === status).length]),
);
const queueGroups = [...new Set(items.map((item) => item.queueGroup))].map((group) => ({
  group,
  count: items.filter((item) => item.queueGroup === group).length,
}));
const coreArticleCount = items.reduce((sum, item) => sum + (item.articleCount ?? 0), 0);

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: 'Conservative scholarly-article expansion queue for the Videha Digital Research Archive. This inventory records source books before article generation and forbids mechanical PDF splitting.',
  sourceCatalog: SOURCE_CATALOG,
  sourceRepository: sourceRepository?.repository ?? null,
  sourceCommit,
  sourceCatalogVersion: sourceRepository?.sourceCatalogVersion ?? null,
  sourceCatalogCount: sourceRepository?.sourceCatalogCount ?? null,
  sourcePdfCount: items.length,
  certifiedCoreArticleCount: coreArticleCount,
  rules: [
    'The existing 522 scholarly article pages remain a frozen certified core until their production gate passes.',
    'A source book is not an article. Non-core PDFs receive no articleCount until genuine source structure is verified.',
    'No article citation_pdf_url may point to a whole source book; article-specific PDFs may be exposed only when separately generated and verified.',
    'Chapter or article units must follow attested headings, tables of contents, manuscript structure, or another documented source boundary; page-count splitting is forbidden.',
    'OCR is a transcription method, not a segmentation method. OCR-derived units require the same structural verification as searchable-text PDFs.',
  ],
  countsByStatus,
  queueGroups,
  items,
};

mkdirSync(path.dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Book expansion inventory: ${items.length} source PDFs; ${coreArticleCount} certified core articles; ${countsByStatus['structure-audited']} structurally audited source book(s); ${countsByStatus['needs-structure-audit']} awaiting source-structure audit.`);
