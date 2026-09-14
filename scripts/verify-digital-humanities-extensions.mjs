import { existsSync, readFileSync, statSync } from 'node:fs';

const OUT = 'dist/client';
const fail = (message) => { throw new Error(`Digital-humanities extension verification failed: ${message}`); };
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const requireFile = (file) => { if (!existsSync(file)) fail(`missing ${file}`); };

for (const file of [
  `${OUT}/data/digital-humanities-extensions-report.json`,
  `${OUT}/data/historical-boundaries.geojson`,
  `${OUT}/assets/historical-boundaries.js`,
  `${OUT}/assets/historical-boundaries.css`,
  `${OUT}/iiif/collection.json`,
  `${OUT}/iiif/index.html`,
  `${OUT}/data/provenance-graph.jsonld`,
  `${OUT}/data/provenance-edges.csv`,
  `${OUT}/provenance/index.html`,
  `${OUT}/data/citations/all-records.csl.json`,
  `${OUT}/data/citations/all-records.bib`,
  `${OUT}/data/citations/all-records.ris`,
  `${OUT}/data/citations/historical-geography.csl.json`,
  `${OUT}/citations/index.html`,
]) requireFile(file);

const records = readJson(`${OUT}/records-index.json`);
const catalog = readJson(`${OUT}/source-library/catalog.json`);
const boundaries = readJson(`${OUT}/data/historical-boundaries.geojson`);
const iiif = readJson(`${OUT}/iiif/collection.json`);
const provenance = readJson(`${OUT}/data/provenance-graph.jsonld`);
const recordCsl = readJson(`${OUT}/data/citations/all-records.csl.json`);
const geometryCsl = readJson(`${OUT}/data/citations/historical-geography.csl.json`);
const report = readJson(`${OUT}/data/digital-humanities-extensions-report.json`);

if (iiif['@context'] !== 'http://iiif.io/api/presentation/3/context.json' || iiif.type !== 'Collection') fail('IIIF collection is not Presentation API 3');
if (!Array.isArray(iiif.items) || iiif.items.length !== catalog.items.length) fail('IIIF manifest count does not match source PDF catalogue');
for (const ref of iiif.items) {
  const match = ref.id.match(/\/iiif\/([^/]+)\/manifest\.json$/);
  if (!match) fail(`invalid IIIF manifest id ${ref.id}`);
  const file = `${OUT}/iiif/${match[1]}/manifest.json`;
  requireFile(file);
  const manifest = readJson(file);
  if (manifest.type !== 'Manifest' || !Array.isArray(manifest.items) || manifest.items.length < 1) fail(`invalid manifest ${file}`);
  if (!Array.isArray(manifest.rendering) || manifest.rendering[0]?.format !== 'application/pdf') fail(`manifest does not render source PDF: ${file}`);
  if (!JSON.stringify(manifest).includes('page canvases')) fail(`manifest does not preserve page-evidence limitation: ${file}`);
}

if (!provenance['@context']?.prov?.includes('w3.org/ns/prov') || !Array.isArray(provenance['@graph'])) fail('PROV-O JSON-LD graph is invalid');
if (provenance['@graph'].length < records.length + catalog.items.length) fail('provenance graph omits record or source entities');
if (recordCsl.length !== records.length) fail('bulk CSL record count mismatch');
if (geometryCsl.length !== boundaries.features.length) fail('historical-geography citation count mismatch');

for (const feature of boundaries.features) {
  const evidence = feature.properties?.historicalGeometryEvidence;
  if (!evidence?.sourceCitation || !evidence?.sourceUrl || evidence.notExactFrontier !== true) fail(`boundary ${feature.id} lost evidence/uncertainty qualification`);
}

for (const htmlFile of [`${OUT}/index.html`, `${OUT}/en/index.html`]) {
  const html = readFileSync(htmlFile, 'utf8');
  if (!html.includes('/assets/historical-boundaries.css') || !html.includes('/assets/historical-boundaries.js')) fail(`historical map overlay is missing from ${htmlFile}`);
}
const overlayJs = readFileSync(`${OUT}/assets/historical-boundaries.js`, 'utf8');
if (!overlayJs.includes('Approximate research envelopes') || !overlayJs.includes('not exact ancient frontiers')) fail('historical overlay uncertainty wording is missing');
if (!overlayJs.includes("lang==='mai'")) fail('historical overlay is not mirror-language aware');

const sitemap = readFileSync(`${OUT}/sitemap.xml`, 'utf8');
for (const route of ['iiif/', 'provenance/', 'citations/']) if (!sitemap.includes(`/mithila-vajji-anga/${route}`)) fail(`sitemap missing ${route}`);
const sourceIndex = readFileSync(`${OUT}/source-library/index.html`, 'utf8');
for (const marker of ['/iiif/', '/provenance/', '/citations/']) if (!sourceIndex.includes(marker)) fail(`source-library does not expose ${marker}`);

const splitReportPath = 'app/generated/split-specialist-data-report.json';
requireFile(splitReportPath);
const split = readJson(splitReportPath);
if (split.totalChunks < 5) fail('specialist data did not split into multiple chunks');
if (split.largestGeneratedChunkBytes > split.maxTargetChunkBytes + 10_000) fail('specialist source chunk budget exceeded');

if (report.iiif?.manifests !== catalog.items.length || report.citations?.permanentRecords !== records.length) fail('extension report counts mismatch');
if (report.historicalMapOverlay?.sourceFeatures !== boundaries.features.length) fail('extension report boundary count mismatch');
if (statSync(`${OUT}/data/provenance-graph.jsonld`).size < 10_000) fail('provenance graph unexpectedly small');

console.log({
  iiifManifests: iiif.items.length,
  provenanceEntities: provenance['@graph'].length,
  bulkCitations: recordCsl.length,
  historicalBoundaryCitations: geometryCsl.length,
  specialistSourceChunks: split.totalChunks,
  largestSpecialistSourceChunkBytes: split.largestGeneratedChunkBytes,
  mirrorMapOverlay: true,
  failClosed: true,
});
