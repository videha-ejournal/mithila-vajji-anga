import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'dist/client');
const RELEASES_ROOT = join(OUT, 'data/releases');
const DATA_INDEX = join(OUT, 'data/index.html');

const POLICY = 'Published place coordinates are modern orientation/reference aids unless a feature explicitly carries verified historical-geometry evidence. They do not imply timeless historical borders. Historical boundary geometry is not asserted without source-controlled evidence.';
const REQUIRED_EVIDENCE_FIELDS = ['sourceCitation', 'sourceUrl'];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (content) => createHash('sha256').update(content).digest('hex');

if (!existsSync(RELEASES_ROOT)) {
  throw new Error('Historical-geography finalization requires the scholarly data release directory.');
}

const releaseDirectories = readdirSync(RELEASES_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (releaseDirectories.length === 0) {
  throw new Error('No scholarly data release was found for historical-geography finalization.');
}

let totalModernPoints = 0;
let totalUnasserted = 0;
let totalVerifiedHistorical = 0;
let totalHistoricalBoundaries = 0;

for (const release of releaseDirectories) {
  const releaseRoot = join(RELEASES_ROOT, release);
  const geojsonPath = join(releaseRoot, 'places.geojson');
  if (!existsSync(geojsonPath)) continue;

  const geojson = readJson(geojsonPath);
  if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error(`Invalid places.geojson FeatureCollection in release ${release}.`);
  }

  let modernPointCount = 0;
  let unassertedGeometryCount = 0;
  let verifiedHistoricalGeometryCount = 0;
  let boundaryFeatureCount = 0;

  for (const feature of geojson.features) {
    feature.properties ??= {};
    const geometryType = feature.geometry?.type ?? null;

    if (geometryType === null) {
      feature.properties.coordinateRole = 'none';
      feature.properties.historicalGeometryStatus = 'not-asserted';
      feature.properties.historicalBoundaryAsserted = false;
      feature.properties.historicalGeometryEvidence = null;
      unassertedGeometryCount += 1;
      continue;
    }

    if (geometryType === 'Point') {
      const existingStatus = feature.properties.historicalGeometryStatus;
      if (existingStatus === 'verified') {
        const evidence = feature.properties.historicalGeometryEvidence;
        if (!evidence || REQUIRED_EVIDENCE_FIELDS.some((field) => !evidence[field])) {
          throw new Error(`Verified historical point ${feature.id ?? feature.properties.name ?? 'unknown'} lacks required evidence.`);
        }
        feature.properties.coordinateRole = feature.properties.coordinateRole || 'verified-historical-location';
        feature.properties.historicalBoundaryAsserted = false;
        verifiedHistoricalGeometryCount += 1;
      } else {
        feature.properties.coordinateRole = 'modern-orientation';
        feature.properties.historicalGeometryStatus = 'not-asserted';
        feature.properties.historicalBoundaryAsserted = false;
        feature.properties.historicalGeometryEvidence = null;
        feature.properties.geometryStatus = 'modern orientation/reference point; historical geometry not asserted';
        modernPointCount += 1;
      }
      continue;
    }

    const evidence = feature.properties.historicalGeometryEvidence;
    const verified = feature.properties.historicalGeometryStatus === 'verified'
      && feature.properties.historicalBoundaryAsserted === true
      && evidence
      && REQUIRED_EVIDENCE_FIELDS.every((field) => Boolean(evidence[field]));
    if (!verified) {
      throw new Error(`Historical ${geometryType} geometry for ${feature.id ?? feature.properties.name ?? 'unknown'} is blocked: verified source-controlled evidence is required.`);
    }
    feature.properties.coordinateRole = feature.properties.coordinateRole || 'verified-historical-geometry';
    verifiedHistoricalGeometryCount += 1;
    boundaryFeatureCount += 1;
  }

  geojson.metadata = {
    schemaVersion: 2,
    release,
    coordinateRoleDefault: 'modern-orientation',
    historicalGeometryPolicy: POLICY,
    modernOrientationPointCount: modernPointCount,
    unassertedGeometryCount,
    verifiedHistoricalGeometryCount,
    boundaryFeatureCount,
  };

  const geojsonContent = `${JSON.stringify(geojson, null, 2)}\n`;
  writeFileSync(geojsonPath, geojsonContent);

  const manifest = {
    schemaVersion: 1,
    release,
    policy: POLICY,
    requiredEvidenceFields: REQUIRED_EVIDENCE_FIELDS,
    counts: {
      features: geojson.features.length,
      modernOrientationPoints: modernPointCount,
      unassertedGeometry: unassertedGeometryCount,
      verifiedHistoricalGeometry: verifiedHistoricalGeometryCount,
      historicalBoundaryFeatures: boundaryFeatureCount,
    },
    features: geojson.features.map((feature) => ({
      id: feature.id ?? null,
      name: feature.properties?.name ?? null,
      geometryType: feature.geometry?.type ?? null,
      coordinateRole: feature.properties?.coordinateRole ?? null,
      historicalGeometryStatus: feature.properties?.historicalGeometryStatus ?? null,
      historicalBoundaryAsserted: feature.properties?.historicalBoundaryAsserted === true,
      historicalGeometryEvidence: feature.properties?.historicalGeometryEvidence ?? null,
    })),
  };
  const manifestContent = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(join(releaseRoot, 'historical-geography.json'), manifestContent);

  const checksumFiles = [
    'records.json',
    'records.csv',
    'records.ndjson',
    'places.geojson',
    'historical-geography.json',
  ];
  const checksumLines = checksumFiles
    .filter((name) => existsSync(join(releaseRoot, name)))
    .map((name) => `${sha256(readFileSync(join(releaseRoot, name)))}  ${name}`);
  writeFileSync(join(releaseRoot, 'SHA256SUMS.txt'), `${checksumLines.join('\n')}\n`);

  totalModernPoints += modernPointCount;
  totalUnasserted += unassertedGeometryCount;
  totalVerifiedHistorical += verifiedHistoricalGeometryCount;
  totalHistoricalBoundaries += boundaryFeatureCount;
}

if (!existsSync(DATA_INDEX)) {
  throw new Error('Research data index is missing after scholarly export.');
}
let dataHtml = readFileSync(DATA_INDEX, 'utf8');
const oldGeoDescription = 'Sourced place points; null geometry where none is asserted';
const newGeoDescription = 'Modern orientation/reference points unless verified historical-geometry evidence is explicit; null geometry where none is asserted';
if (!dataHtml.includes(oldGeoDescription) && !dataHtml.includes(newGeoDescription)) {
  throw new Error('Could not locate the GeoJSON description on the research data page.');
}
dataHtml = dataHtml.replace(oldGeoDescription, newGeoDescription);
const geoRowEnd = '</a></td></tr><tr><td>Metadata</td>';
const manifestRow = '</a></td></tr><tr><td>Historical geography manifest</td><td>Coordinate roles, historical-geometry status, evidence requirements and boundary counts</td><td><a href="/mithila-vajji-anga/data/releases/2026.09/historical-geography.json">historical-geography.json</a></td></tr><tr><td>Metadata</td>';
if (!dataHtml.includes('historical-geography.json')) {
  if (!dataHtml.includes(geoRowEnd)) throw new Error('Could not locate the data-table insertion point for historical geography.');
  dataHtml = dataHtml.replace(geoRowEnd, manifestRow);
}
writeFileSync(DATA_INDEX, dataHtml);

console.log(`Historical geography finalized: ${totalModernPoints} modern orientation points; ${totalUnasserted} null/unasserted geometries; ${totalVerifiedHistorical} verified historical geometries; ${totalHistoricalBoundaries} historical boundary features.`);
