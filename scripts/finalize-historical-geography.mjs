import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'dist/client');
const RELEASES_ROOT = join(OUT, 'data/releases');
const DATA_INDEX = join(OUT, 'data/index.html');
const SOURCE_BOUNDARIES = join(ROOT, 'data/historical-boundaries.geojson');

const POLICY = 'Published place coordinates are modern orientation/reference aids unless a feature explicitly carries verified historical-geometry evidence. They do not imply timeless historical borders. Qualified historical boundary layers are permitted only when source-controlled evidence and uncertainty metadata pass the release gate.';
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
const clone = (value) => JSON.parse(JSON.stringify(value));

if (!existsSync(RELEASES_ROOT)) {
  throw new Error('Historical-geography finalization requires the scholarly data release directory.');
}
if (!existsSync(SOURCE_BOUNDARIES)) {
  throw new Error('Source-controlled historical boundary layer is missing.');
}

const sourceBoundaries = readJson(SOURCE_BOUNDARIES);
if (sourceBoundaries.type !== 'FeatureCollection' || !Array.isArray(sourceBoundaries.features)) {
  throw new Error('data/historical-boundaries.geojson must be a GeoJSON FeatureCollection.');
}
for (const feature of sourceBoundaries.features) {
  const id = String(feature.id ?? '');
  const geometryType = feature.geometry?.type ?? null;
  const properties = feature.properties ?? {};
  const evidence = properties.historicalGeometryEvidence;
  if (!id) throw new Error('A source-controlled historical boundary feature is missing its id.');
  if (!geometryType || geometryType === 'Point') {
    throw new Error(`Historical boundary source ${id} must use non-point geometry.`);
  }
  if (properties.historicalGeometryStatus !== 'verified' || properties.historicalBoundaryAsserted !== true) {
    throw new Error(`Historical boundary source ${id} is not explicitly verified and boundary-asserted.`);
  }
  if (!evidence || REQUIRED_BOUNDARY_EVIDENCE_FIELDS.some((field) => !evidence[field])) {
    throw new Error(`Historical boundary source ${id} lacks required evidence/uncertainty metadata.`);
  }
  if (evidence.notExactFrontier !== true) {
    throw new Error(`Historical boundary source ${id} must explicitly state notExactFrontier=true.`);
  }
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
let publishedRelease = null;

for (const release of releaseDirectories) {
  const releaseRoot = join(RELEASES_ROOT, release);
  const geojsonPath = join(releaseRoot, 'places.geojson');
  if (!existsSync(geojsonPath)) continue;
  publishedRelease = release;

  const geojson = readJson(geojsonPath);
  if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error(`Invalid places.geojson FeatureCollection in release ${release}.`);
  }

  const ids = new Set(geojson.features.map((feature) => String(feature.id ?? '')).filter(Boolean));
  for (const boundary of sourceBoundaries.features) {
    const id = String(boundary.id);
    if (ids.has(id)) {
      throw new Error(`Release ${release} already contains historical boundary id ${id}; source merge would be ambiguous.`);
    }
    geojson.features.push(clone(boundary));
    ids.add(id);
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
      && REQUIRED_BOUNDARY_EVIDENCE_FIELDS.every((field) => Boolean(evidence[field]))
      && evidence.notExactFrontier === true;
    if (!verified) {
      throw new Error(`Historical ${geometryType} geometry for ${feature.id ?? feature.properties.name ?? 'unknown'} is blocked: verified source-controlled evidence plus explicit uncertainty metadata is required.`);
    }
    feature.properties.coordinateRole = feature.properties.coordinateRole || 'verified-historical-geometry';
    feature.properties.geometryStatus = 'source-controlled approximate historical boundary/research envelope; not an exact frontier';
    verifiedHistoricalGeometryCount += 1;
    boundaryFeatureCount += 1;
  }

  geojson.metadata = {
    schemaVersion: 3,
    release,
    coordinateRoleDefault: 'modern-orientation',
    historicalGeometryPolicy: POLICY,
    sourceBoundaryLayer: 'data/historical-boundaries.geojson',
    sourceBoundaryFeatureCount: sourceBoundaries.features.length,
    modernOrientationPointCount: modernPointCount,
    unassertedGeometryCount,
    verifiedHistoricalGeometryCount,
    boundaryFeatureCount,
  };

  const geojsonContent = `${JSON.stringify(geojson, null, 2)}\n`;
  writeFileSync(geojsonPath, geojsonContent);

  const manifest = {
    schemaVersion: 2,
    release,
    policy: POLICY,
    requiredEvidenceFields: REQUIRED_EVIDENCE_FIELDS,
    requiredBoundaryEvidenceFields: REQUIRED_BOUNDARY_EVIDENCE_FIELDS,
    boundaryQualificationRule: 'Non-point historical geometry must explicitly carry notExactFrontier=true. Approximate/reconstructed geometry may be published only as a qualified research aid.',
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
      boundaryNature: feature.properties?.boundaryNature ?? null,
      periodLabel: feature.properties?.periodLabel ?? null,
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

if (!publishedRelease) {
  throw new Error('No places.geojson release was found for historical-geography finalization.');
}
if (!existsSync(DATA_INDEX)) {
  throw new Error('Research data index is missing after scholarly export.');
}
let dataHtml = readFileSync(DATA_INDEX, 'utf8');
const oldGeoDescription = 'Sourced place points; null geometry where none is asserted';
const previousGeoDescription = 'Modern orientation/reference points unless verified historical-geometry evidence is explicit; null geometry where none is asserted';
const newGeoDescription = 'Modern orientation/reference points plus qualified source-controlled historical boundary research envelopes; null geometry where none is asserted';
if (![oldGeoDescription, previousGeoDescription, newGeoDescription].some((text) => dataHtml.includes(text))) {
  throw new Error('Could not locate the GeoJSON description on the research data page.');
}
dataHtml = dataHtml.replace(oldGeoDescription, newGeoDescription).replace(previousGeoDescription, newGeoDescription);
const geoRowEnd = '</a></td></tr><tr><td>Metadata</td>';
const manifestRow = `</a></td></tr><tr><td>Historical geography manifest</td><td>Coordinate roles, qualified historical-boundary status, evidence requirements, uncertainty metadata and boundary counts</td><td><a href="/mithila-vajji-anga/data/releases/${publishedRelease}/historical-geography.json">historical-geography.json</a></td></tr><tr><td>Metadata</td>`;
if (!dataHtml.includes('historical-geography.json')) {
  if (!dataHtml.includes(geoRowEnd)) throw new Error('Could not locate the data-table insertion point for historical geography.');
  dataHtml = dataHtml.replace(geoRowEnd, manifestRow);
}
writeFileSync(DATA_INDEX, dataHtml);

console.log(`Historical geography finalized: ${totalModernPoints} modern orientation points; ${totalUnasserted} null/unasserted geometries; ${totalVerifiedHistorical} verified historical geometries; ${totalHistoricalBoundaries} qualified historical boundary features.`);
