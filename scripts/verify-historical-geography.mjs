import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RELEASES_ROOT = join(ROOT, 'dist/client/data/releases');
const DATA_INDEX = join(ROOT, 'dist/client/data/index.html');
const REQUIRED_EVIDENCE_FIELDS = ['sourceCitation', 'sourceUrl'];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const fail = (message) => { throw new Error(`Historical-geography verification failed: ${message}`); };

if (!existsSync(RELEASES_ROOT)) fail('release directory is missing');
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
  if (geo.metadata?.schemaVersion !== 2) fail(`${release} places.geojson lacks historical-geography metadata schema v2`);
  if (geo.metadata?.release !== release) fail(`${release} GeoJSON release metadata does not match its directory`);
  if (!String(geo.metadata?.historicalGeometryPolicy ?? '').includes('do not imply timeless historical borders')) fail(`${release} policy does not preserve the modern-orientation safeguard`);
  if (manifest.schemaVersion !== 1 || manifest.release !== release) fail(`${release} manifest schema/release metadata is invalid`);
  if (!Array.isArray(manifest.features) || manifest.features.length !== geo.features.length) fail(`${release} manifest feature count does not match GeoJSON`);

  let releaseModernPoints = 0;
  let releaseUnasserted = 0;
  let releaseVerified = 0;
  let releaseBoundaries = 0;

  const manifestById = new Map(manifest.features.map((item) => [String(item.id), item]));
  for (const feature of geo.features) {
    checkedFeatures += 1;
    const properties = feature.properties ?? {};
    const geometryType = feature.geometry?.type ?? null;
    const id = String(feature.id ?? '');
    if (!id) fail(`${release} contains a place feature without an id`);
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
      if (properties.historicalGeometryStatus !== 'verified' || !evidence || REQUIRED_EVIDENCE_FIELDS.some((field) => !evidence[field])) {
        fail(`${release}:${id} historical geometry lacks verified evidence`);
      }
      if (geometryType !== 'Point' && properties.historicalBoundaryAsserted !== true) {
        fail(`${release}:${id} non-point historical geometry is not explicitly marked as a boundary assertion`);
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
if (!dataHtml.includes('Modern orientation/reference points unless verified historical-geometry evidence is explicit')) fail('research data page does not explain the coordinate distinction');
if (!dataHtml.includes('historical-geography.json')) fail('research data page does not expose the historical-geography manifest');

console.log(`Historical geography verified: ${checkedFeatures} place features; ${modernPoints} modern orientation points; ${verifiedHistorical} verified historical geometries; ${historicalBoundaries} historical boundary features.`);
