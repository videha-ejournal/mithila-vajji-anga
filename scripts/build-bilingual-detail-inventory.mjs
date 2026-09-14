import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const philosophy = readJson('app/generated/philosophy-inventory.json');
const panji = readJson('app/generated/panji-inventory.json');
const literature = readJson('app/literature-inventory.json');
const archiveUnits = existsSync('app/generated/archive-units.json')
  ? readJson('app/generated/archive-units.json')
  : [];
const maithiliReadings = existsSync('app/generated/archive-maithili.json')
  ? readJson('app/generated/archive-maithili.json')
  : {};

const basePath = '/mithila-vajji-anga';
const publishedKeys = new Set((archiveUnits ?? []).map((record) => record.key));

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function record({ group, workId, number, title, source, titleSource, verificationSources = [] }) {
  const numeric = Number(number);
  if (!Number.isInteger(numeric) || numeric < 1) throw new Error(`Invalid ${group} unit number: ${number}`);
  const sourceTitle = clean(title);
  if (!sourceTitle || /^Chapter\s+\d+$/i.test(sourceTitle)) {
    throw new Error(`Unverified/generic ${group} title refused: ${workId}/${numeric}`);
  }
  const unitId = String(numeric).padStart(3, '0');
  const key = `${group}/${workId}/${unitId}`;
  const sourceEvidence = [clean(source), ...verificationSources.map(clean)].filter(Boolean);
  if (sourceEvidence.length === 0) throw new Error(`Missing source evidence: ${key}`);

  return {
    key,
    group,
    workId,
    number: numeric,
    unitId,
    sourceTitle,
    sourceTitleStatus: 'source-verified',
    titleSource: clean(titleSource) || 'verified source inventory',
    sourceEvidence,
    routes: {
      mai: `${basePath}/${group}/${workId}/${unitId}/`,
      en: `${basePath}/en/${group}/${workId}/${unitId}/`,
    },
    publication: {
      routePayloadPresent: publishedKeys.has(key),
      maithiliReadingPresent: Boolean(clean(maithiliReadings?.[key])),
      englishSourceTitlePresent: true,
      syntheticTitleUsed: false,
    },
  };
}

const records = [
  ...philosophy.map((item) => record({
    group: 'philosophy',
    workId: item.workId,
    number: item.number,
    title: item.title,
    source: item.source,
    titleSource: item.sourceLabel,
  })),
  ...literature.map((item) => record({
    group: 'literature',
    workId: 'parallel-history',
    number: item.number,
    title: item.title,
    source: item.sourceNote,
    titleSource: `verified literature inventory · Tome ${item.tome}`,
    verificationSources: Array.isArray(item.verificationSources) ? item.verificationSources : [],
  })),
  ...panji.map((item) => record({
    group: 'panji',
    workId: item.workId,
    number: item.number,
    title: item.title,
    source: item.source,
    titleSource: item.titleSource,
    verificationSources: item.sourceCorrection
      ? [item.sourceCorrection.source, item.sourceCorrection.sourcePages, item.sourceCorrection.verification]
      : [],
  })),
].sort((a, b) =>
  a.group.localeCompare(b.group) || a.workId.localeCompare(b.workId) || a.number - b.number,
);

const keys = records.map((item) => item.key);
if (new Set(keys).size !== keys.length) throw new Error('Duplicate bilingual detail inventory keys');

const summary = {
  records: records.length,
  philosophy: records.filter((item) => item.group === 'philosophy').length,
  literature: records.filter((item) => item.group === 'literature').length,
  panji: records.filter((item) => item.group === 'panji').length,
  routePayloadPresent: records.filter((item) => item.publication.routePayloadPresent).length,
  maithiliReadingPresent: records.filter((item) => item.publication.maithiliReadingPresent).length,
  syntheticTitles: records.filter((item) => item.publication.syntheticTitleUsed).length,
};

if (summary.philosophy !== 172) {
  throw new Error(`Expected 172 verified Parallel Philosophy units, found ${summary.philosophy}`);
}
if (summary.literature !== 100) {
  throw new Error(`Expected 100 verified Parallel Literature chapters, found ${summary.literature}`);
}
if (summary.panji < 1) {
  throw new Error('Panji detail inventory is empty; refusing to publish a synthetic fallback');
}
if (summary.syntheticTitles !== 0) throw new Error('Synthetic titles are forbidden');

const output = {
  schemaVersion: 1,
  generatedFrom: [
    'app/generated/philosophy-inventory.json',
    'app/literature-inventory.json',
    'app/generated/panji-inventory.json',
  ],
  policy: {
    titlePolicy: 'source-verified-only',
    syntheticTitles: 'forbidden',
    routePairing: 'Maithili root route plus structurally mirrored /en route',
    unpublishedPayloads: 'reported explicitly; never fabricated',
  },
  summary,
  records,
};

mkdirSync('public/data', { recursive: true });
writeFileSync('public/data/bilingual-detail-inventory.json', `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ status: 'bilingual-detail-inventory-built', ...summary }, null, 2));
