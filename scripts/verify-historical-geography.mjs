import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RELEASES_ROOT = join(ROOT, 'dist/client/data/releases');
const DATA_INDEX = join(ROOT, 'dist/client/data/index.html');
const SOURCE_BOUNDARIES = join(ROOT, 'data/historical-boundaries.geojson');
const REQUIRED_EVIDENCE_FIELDS = ['sourceCitation', 'sourceUrl'];
const REQUIRED_BOUNDARY_EVIDENCE_FIELDS = [
  ...REQUIRED_EVIDENCE_FIELDS,
  'geometryScope',
  'periodLabel',
  'precision',
  'method',
];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const fail = (message) => { throw new Error(`Historical-geography verification failed: ${message}`); };

if (!existsSync(RELEASES_ROOT)) fail('release directory is missing');
if (!existsSync(SOURCE_BOUNDARIES)) fail('source-controlled boundary layer is missing');
const sourceBoundaries = readJson(SOURCE_BOUNDARIES);
if (sourceBoundaries.type !== 'FeatureCollection' || !Array.isArray(sourceBoundaries.features) || sourceBoundaries.features.length === 0) {
  fail('historical-boundaries.geojson is not a non-empty FeatureCollection');
}
const sourceBoundaryIds = new Set();
for (const feature of sourceBoundaries.features) {
  const id = String(feature.id ?? '');
  const properties = feature.properties ?? {};
  const evidence = properties.historicalGeometryEvidence;
  if (!id || sourceBoundaryIds.has(id)) fail(`source boundary id is missing or duplicated: ${id || '(blank)'}`);
  sourceBoundaryIds.add(id);
  if (!feature.geometry || feature.geometry.type === 'Point') fail(`${id} is not non-point boundary geometry`);
  if (properties.historicalGeometryStatus !== 'verified' || properties.historicalBoundaryAsserted !== true) fail(`${id} is not verified/boundary-asserted`);
  if (!evidence || REQUIRED_BOUNDARY_EVIDENCE_FIELDS.some((field) => !evidence[field]) || evidence.notExactFrontier !== true) {
    fail(`${id} lacks evidence or explicit uncertainty metadata`);
  }
}

const releases = readdirSync(RELEASES_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (releases.length === 0) fail('no data release is available');

let checkedFeatures = 0;
let modernPoints = 0;
let verifiedHistorical = 0;
let historicalBoundaries = 0;

for (const release of releases) {
  const releaseRoot = join(RELEASES_ROOT, release);
  const geoPath = join(releaseRoot, 'places.geojson');
  if (!existsSync(geoPath)) continue;
  const manifestPath = join(releaseRoot, 'historical-geography.json');
  if (!existsSync(manifestPath)) fail(`${release} is missing historical-geography.json`);

  const geo = readJson(geoPath);
  const manifest = readJson(manifestPath);
  if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) fail(`${release} places.geojson is not a FeatureCollection`);
  if (geo.metadata?.schemaVersion !== 3) fail(`${release} places.geojson lacks historical-geography metadata schema v3`);
  if (geo.metadata?.release !== release) fail(`${release} GeoJSON release metadata does not match its directory`);
  if (!String(geo.metadata?.historicalGeometryPolicy ?? '').includes('They do not imply timeless historical borders')) fail(`${release} policy does not preserve the modern-orientation safeguard`);
  if (geo.metadata?.sourceBoundaryFeatureCount !== sourceBoundaries.features.length) fail(`${release} source-boundary feature count is incorrect`);
  if (manifest.schemaVersion !== 2 || manifest.release !== release) fail(`${release} manifest schema/release metadata is invalid`);
  if (!Array.isArray(manifest.features) || manifest.features.length !== geo.features.length) fail(`${release} manifest feature count does not match GeoJSON`);
  if (!Array.isArray(manifest.requiredBoundaryEvidenceFields) || REQUIRED_BOUNDARY_EVIDENCE_FIELDS.some((field) => !manifest.requiredBoundaryEvidenceFields.includes(field))) {
    fail(`${release} manifest does not publish the boundary evidence requirements`);
  }

  let releaseModernPoints = 0;
  let releaseUnasserted = 0;
  let releaseVerified = 0;
  let releaseBoundaries = 0;
  const releaseIds = new Set();

  const manifestById = new Map(manifest.features.map((item) => [String(item.id), item]));
  for (const feature of geo.features) {
    checkedFeatures += 1;
    const properties = feature.properties ?? {};
    const geometryType = feature.geometry?.type ?? null;
    const id = String(feature.id ?? '');
    if (!id) fail(`${release} contains a place feature without an id`);
    if (releaseIds.has(id)) fail(`${release} contains duplicate feature id ${id}`);
    releaseIds.add(id);
    const manifestFeature = manifestById.get(id);
    if (!manifestFeature) fail(`${release} manifest is missing feature ${id}`);

    if (geometryType === null) {
      if (properties.coordinateRole !== 'none' || properties.historicalGeometryStatus !== 'not-asserted' || properties.historicalBoundaryAsserted !== false) {
        fail(`${release}:${id} null geometry is not explicitly unasserted`);
      }
      releaseUnasserted += 1;
    } else if (geometryType === 'Point' && properties.historicalGeometryStatus !== 'verified') {
      if (properties.coordinateRole !== 'modern-orientation' || properties.historicalGeometryStatus !== 'not-asserted' || properties.historicalBoundaryAsserted !== false || properties.historicalGeometryEvidence !== null) {
        fail(`${release}:${id} orientation point is not safely classified`);
      }
      releaseModernPoints += 1;
      modernPoints += 1;
    } else {
      const evidence = properties.historicalGeometryEvidence;
      const required = geometryType === 'Point' ? REQUIRED_EVIDENCE_FIELDS : REQUIRED_BOUNDARY_EVIDENCE_FIELDS;
      if (properties.historicalGeometryStatus !== 'verified' || !evidence || required.some((field) => !evidence[field])) {
        fail(`${release}:${id} historical geometry lacks verified evidence`);
      }
      if (geometryType !== 'Point') {
        if (properties.historicalBoundaryAsserted !== true) fail(`${release}:${id} non-point historical geometry is not explicitly marked as a boundary assertion`);
        if (evidence.notExactFrontier !== true) fail(`${release}:${id} historical boundary does not explicitly state notExactFrontier=true`);
        if (!sourceBoundaryIds.has(id)) fail(`${release}:${id} historical boundary is not present in the source-controlled boundary layer`);
      }
      releaseVerified += 1;
      verifiedHistorical += 1;
      if (geometryType !== 'Point') {
        releaseBoundaries += 1;
        historicalBoundaries += 1;
      }
    }

    for (const field of ['geometryType', 'coordinateRole', 'historicalGeometryStatus', 'historicalBoundaryAsserted']) {
      const expected = field === 'geometryType' ? geometryType : properties[field];
      if (manifestFeature[field] !== expected) fail(`${release}:${id} manifest field ${field} does not match GeoJSON`);
    }
    if (JSON.stringify(manifestFeature.historicalGeometryEvidence ?? null) !== JSON.stringify(properties.historicalGeometryEvidence ?? null)) {
      fail(`${release}:${id} manifest evidence metadata does not match GeoJSON`);
    }
  }

  for (const id of sourceBoundaryIds) {
    if (!releaseIds.has(id)) fail(`${release} does not contain required source-controlled historical boundary ${id}`);
  }

  const expectedCounts = {
    features: geo.features.length,
    modernOrientationPoints: releaseModernPoints,
    unassertedGeometry: releaseUnasserted,
    verifiedHistoricalGeometry: releaseVerified,
    historicalBoundaryFeatures: releaseBoundaries,
  };
  for (const [field, expected] of Object.entries(expectedCounts)) {
    if (manifest.counts?.[field] !== expected) fail(`${release} manifest count ${field} is ${manifest.counts?.[field]} instead of ${expected}`);
  }
  if (geo.metadata.modernOrientationPointCount !== releaseModernPoints
      || geo.metadata.unassertedGeometryCount !== releaseUnasserted
      || geo.metadata.verifiedHistoricalGeometryCount !== releaseVerified
      || geo.metadata.boundaryFeatureCount !== releaseBoundaries) {
    fail(`${release} GeoJSON summary counts do not match its features`);
  }

  const checksumFiles = ['records.json', 'records.csv', 'records.ndjson', 'places.geojson', 'historical-geography.json'];
  const expectedChecksums = checksumFiles
    .filter((name) => existsSync(join(releaseRoot, name)))
    .map((name) => `${sha256(readFileSync(join(releaseRoot, name)))}  ${name}`)
    .join('\n') + '\n';
  const checksumPath = join(releaseRoot, 'SHA256SUMS.txt');
  if (!existsSync(checksumPath) || readFileSync(checksumPath, 'utf8') !== expectedChecksums) {
    fail(`${release} SHA256SUMS.txt does not match finalized release files`);
  }
}

if (!existsSync(DATA_INDEX)) fail('research data index is missing');
const dataHtml = readFileSync(DATA_INDEX, 'utf8');
if (!dataHtml.includes('qualified source-controlled historical boundary research envelopes')) fail('research data page does not explain the qualified historical-boundary layer');
if (!dataHtml.includes('historical-geography.json')) fail('research data page does not expose the historical-geography manifest');
if (historicalBoundaries < sourceBoundaries.features.length) fail('qualified historical boundaries were not emitted into a release');

console.log(`Historical geography verified: ${checkedFeatures} place features; ${modernPoints} modern orientation points; ${verifiedHistorical} verified historical geometries; ${historicalBoundaries} qualified historical boundary features.`);
