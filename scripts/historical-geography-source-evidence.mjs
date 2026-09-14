import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const CONFIG_PATH = join(ROOT, 'data/historical-geography-evidence.json');
const PROVENANCE_PATH = join(ROOT, 'data/record-source-provenance.json');
const SOURCE_CATALOG_PATH = join(ROOT, 'dist/client/source-library/catalog.json');
const OUTPUT_PATH = join(ROOT, 'dist/client/data/historical-geography-evidence.json');
const DATA_INDEX = join(ROOT, 'dist/client/data/index.html');
const REQUIRE_EXTERNAL = process.env.REQUIRE_EXTERNAL_SOURCE_LIBRARY === '1';
const REQUIRED_VERIFIED_FIELDS = ['pageLocator', 'sourceCitation', 'sourceUrl', 'geometryScope'];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fail = (message) => { throw new Error(`Historical-geography source-evidence verification failed: ${message}`); };

for (const path of [CONFIG_PATH, PROVENANCE_PATH, SOURCE_CATALOG_PATH]) {
  if (!existsSync(path)) fail(`required file is missing: ${path}`);
}

const config = readJson(CONFIG_PATH);
const provenance = readJson(PROVENANCE_PATH);
const sourceCatalog = readJson(SOURCE_CATALOG_PATH);

if (config.schemaVersion !== 1) fail(`unsupported evidence registry schema: ${config.schemaVersion ?? 'none'}`);
if (!Array.isArray(config.candidates) || config.candidates.length === 0) fail('candidate registry is empty');
if (!Array.isArray(provenance.rules)) fail('record-source provenance rules are missing');

const ids = new Set();
const sourceItems = new Map((sourceCatalog.items ?? []).map((item) => [item.filename, item]));
const resolvedCandidates = [];

for (const candidate of config.candidates) {
  if (!candidate.id || ids.has(candidate.id)) fail(`candidate id is missing or duplicated: ${candidate.id ?? 'none'}`);
  ids.add(candidate.id);
  if (candidate.candidateRole !== 'historical-geography-source-candidate') fail(`${candidate.id} has an invalid candidateRole`);
  if (candidate.sourceWorkIdentityStatus !== 'verified') fail(`${candidate.id} source-work identity must be verified before registration`);

  const rule = provenance.rules.find((item) =>
    item.recordType === candidate.recordType
    && item.recordIdPrefix === candidate.recordIdPrefix
    && item.sourcePdfPath === candidate.sourcePdfPath
  );
  if (!rule || rule.evidenceStatus !== 'verified') {
    fail(`${candidate.id} does not match a verified record-source provenance rule`);
  }

  if (candidate.geometryEvidenceStatus === 'verified') {
    if (candidate.usableForHistoricalGeometry !== true) fail(`${candidate.id} is verified but not marked usable`);
    for (const field of REQUIRED_VERIFIED_FIELDS) {
      if (!candidate[field]) fail(`${candidate.id} verified geometry evidence is missing ${field}`);
    }
    let citedUrl;
    try { citedUrl = new URL(candidate.sourceUrl); } catch { fail(`${candidate.id} has an invalid sourceUrl`); }
    if (!['https:', 'http:'].includes(citedUrl.protocol)) fail(`${candidate.id} sourceUrl must use HTTP(S)`);
  } else if (candidate.geometryEvidenceStatus === 'unverified') {
    if (candidate.usableForHistoricalGeometry !== false) fail(`${candidate.id} unverified evidence must be unusable for historical geometry`);
    for (const field of REQUIRED_VERIFIED_FIELDS) {
      if (candidate[field] !== null) fail(`${candidate.id} unverified evidence must keep ${field} null`);
    }
  } else {
    fail(`${candidate.id} has unsupported geometryEvidenceStatus ${candidate.geometryEvidenceStatus ?? 'none'}`);
  }

  const source = sourceItems.get(candidate.sourcePdfPath);
  if (!source) {
    if (REQUIRE_EXTERNAL) fail(`${candidate.id} source PDF is absent from the commit-pinned source library`);
    resolvedCandidates.push({
      ...candidate,
      sourceResolutionStatus: 'unavailable-in-local-build',
      sourceObject: null,
    });
    continue;
  }
  if (source.sourceType !== 'external-github') fail(`${candidate.id} must resolve to the external Videha source repository`);
  if (!source.sourceCommit || !source.gitBlobSha || !source.sourceSha256 || !source.url) {
    fail(`${candidate.id} resolved source object lacks commit/blob/SHA-256 provenance`);
  }

  resolvedCandidates.push({
    ...candidate,
    sourceResolutionStatus: 'verified-exact-object',
    sourceObject: {
      repository: source.repository ?? null,
      branch: source.branch ?? null,
      sourceCommit: source.sourceCommit,
      sourceCommitDate: source.sourceCommitDate ?? null,
      gitBlobSha: source.gitBlobSha,
      sha256: source.sourceSha256,
      pinnedPdfUrl: source.url,
      pinnedGithubUrl: source.githubUrl ?? null,
      currentPublishedUrl: source.currentPublishedUrl ?? null,
    },
  });
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: config.policy,
  requiredForUsableHistoricalGeometry: config.requiredForUsableHistoricalGeometry,
  candidateCount: resolvedCandidates.length,
  verifiedGeometryEvidenceCount: resolvedCandidates.filter((item) => item.geometryEvidenceStatus === 'verified').length,
  usableGeometryEvidenceCount: resolvedCandidates.filter((item) => item.usableForHistoricalGeometry === true).length,
  candidates: resolvedCandidates,
};
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (!existsSync(DATA_INDEX)) fail('research data index is missing');
let html = readFileSync(DATA_INDEX, 'utf8');
const marker = '<tr><td>Metadata</td>';
const row = '<tr><td>Historical geography source evidence</td><td>Candidate source works, exact source-object provenance and page-level geometry-evidence status</td><td><a href="/mithila-vajji-anga/data/historical-geography-evidence.json">historical-geography-evidence.json</a></td></tr>';
if (!html.includes('historical-geography-evidence.json')) {
  if (!html.includes(marker)) fail('could not locate the research-data table insertion point');
  html = html.replace(marker, `${row}${marker}`);
  writeFileSync(DATA_INDEX, html);
}

console.log(`Historical geography source evidence: ${payload.candidateCount} candidates resolved; ${payload.verifiedGeometryEvidenceCount} have verified page-level geometry evidence; ${payload.usableGeometryEvidenceCount} are usable for historical geometry.`);
