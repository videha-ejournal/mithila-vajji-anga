import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist/client');
const AUTHORITY_PATH = path.join(ROOT, 'public/data/videha-isbn-authority.json');
const BINDINGS_PATH = path.join(ROOT, 'data/isbn-source-bindings.json');
const FORBIDDEN_SOURCE_COLUMN = 'Name of Publishing Agency/Publisher';
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const mustExist = (file) => {
  if (!existsSync(file)) throw new Error(`Required ISBN integration output missing: ${file}`);
};
const assert = (condition, message) => {
  if (!condition) throw new Error(`ISBN/DH integration verification failed: ${message}`);
};

for (const file of [AUTHORITY_PATH, BINDINGS_PATH]) mustExist(file);
const authority = readJson(AUTHORITY_PATH);
const bindings = readJson(BINDINGS_PATH);
assert(authority.recordCount === 293, `canonical recordCount must be 293; found ${authority.recordCount}`);
assert(authority.uniqueIsbnCount === 293, `canonical uniqueIsbnCount must be 293; found ${authority.uniqueIsbnCount}`);
assert(authority.records?.length === 293, `canonical records length must be 293; found ${authority.records?.length ?? 0}`);
assert((authority.excludedSourceColumns ?? []).includes(FORBIDDEN_SOURCE_COLUMN), 'publisher source column is not explicitly excluded');
assert(authority.records.every((record) => !Object.hasOwn(record, 'publisher') && !Object.hasOwn(record, 'publishingAgency')), 'publisher-derived field leaked into canonical authority records');
const authorityByIsbn = new Map(authority.records.map((record) => [record.isbn, record]));
assert(authorityByIsbn.has('978-93-5943-857-3'), 'Atmatattvaviveka ISBN missing from canonical authority');

const atmatattvavivekaBinding = (bindings.sourceBindings ?? []).find(
  (binding) => binding.sourcePdfPath === 'GAJENDRA_THAKUR_SAMAGRA_Atmatattvaviveka.pdf',
);
assert(atmatattvavivekaBinding?.isbn === '978-93-5943-857-3', 'Atmatattvaviveka source PDF must bind to ISBN 978-93-5943-857-3');
for (const binding of bindings.sourceBindings ?? []) {
  assert(authorityByIsbn.has(binding.isbn), `source binding references ISBN outside canonical authority: ${binding.isbn}`);
}

const requiredOutputs = [
  'isbn/index.html',
  'data/videha-isbn-authority.json',
  'data/videha-isbn-authority.csv',
  'data/citations/isbn-authority.csl.json',
  'data/citations/isbn-authority.bib',
  'data/citations/isbn-authority.ris',
  'source-library/catalog.json',
  'source-library/index.html',
  'data/provenance-graph.jsonld',
  'citations/index.html',
  'sitemap.xml',
];
for (const relative of requiredOutputs) mustExist(path.join(OUT, relative));

const publishedAuthority = readJson(path.join(OUT, 'data/videha-isbn-authority.json'));
assert(publishedAuthority.recordCount === 293 && publishedAuthority.records?.length === 293, 'published canonical authority must contain exactly 293 records');
assert(publishedAuthority.records.every((record) => !Object.hasOwn(record, 'publisher') && !Object.hasOwn(record, 'publishingAgency')), 'publisher-derived field leaked into published canonical authority');

const catalog = readJson(path.join(OUT, 'source-library/catalog.json'));
assert(catalog.isbnAuthority?.recordCount === 293, 'source-library catalogue does not expose canonical ISBN authority count');
assert(catalog.isbnAuthority?.excludedSourceColumns?.includes(FORBIDDEN_SOURCE_COLUMN), 'source-library catalogue lost publisher-column exclusion rule');
const catalogByFilename = new Map((catalog.items ?? []).map((item) => [item.filename, item]));
for (const binding of bindings.sourceBindings ?? []) {
  const item = catalogByFilename.get(binding.sourcePdfPath);
  assert(item, `bound source PDF missing from source catalogue: ${binding.sourcePdfPath}`);
  assert(item.isbn13 === binding.isbn, `source-PDF ISBN mismatch for ${binding.sourcePdfPath}: expected ${binding.isbn}, got ${item.isbn13 ?? 'none'}`);
  assert(item.isbnMatchMethod === 'explicit-fail-closed-source-binding', `source-PDF binding method drifted for ${binding.sourcePdfPath}`);
}
assert(catalogByFilename.get('GAJENDRA_THAKUR_SAMAGRA_Atmatattvaviveka.pdf')?.isbn13 === '978-93-5943-857-3', 'Atmatattvaviveka source catalogue ISBN drifted');

const sourceIndex = readFileSync(path.join(OUT, 'source-library/index.html'), 'utf8');
assert(sourceIndex.includes('/isbn/'), 'source-library page does not link to ISBN registry');
assert(sourceIndex.includes('ISBN authority:'), 'source-library page does not state ISBN authority policy');
assert(sourceIndex.includes('978-93-5943-857-3'), 'source-library page omits Atmatattvaviveka authoritative ISBN');

const isbnPage = readFileSync(path.join(OUT, 'isbn/index.html'), 'utf8');
assert(isbnPage.includes('293 unique allotted ISBNs'), 'ISBN route does not expose validated authority count');
assert(isbnPage.includes('978-93-5943-857-3'), 'ISBN route omits Atmatattvaviveka authoritative ISBN');
assert(!isbnPage.includes('"publisher"'), 'ISBN route JSON-LD contains a publisher field');

const authorityCsl = readJson(path.join(OUT, 'data/citations/isbn-authority.csl.json'));
assert(authorityCsl.length === 293, `ISBN CSL export must contain 293 records; found ${authorityCsl.length}`);
assert(authorityCsl.every((record) => authorityByIsbn.has(record.ISBN)), 'ISBN CSL export contains ISBN outside canonical authority');
assert(authorityCsl.every((record) => !Object.hasOwn(record, 'publisher')), 'publisher field leaked into ISBN CSL export');
const authorityBib = readFileSync(path.join(OUT, 'data/citations/isbn-authority.bib'), 'utf8');
const authorityRis = readFileSync(path.join(OUT, 'data/citations/isbn-authority.ris'), 'utf8');
assert(!/\npublisher\s*=/i.test(`\n${authorityBib}`), 'publisher field leaked into ISBN BibTeX export');
assert(!authorityRis.includes('\nPB  - '), 'publisher field leaked into ISBN RIS export');

const allCsl = readJson(path.join(OUT, 'data/citations/all-records.csl.json'));
assert(allCsl.every((record) => !Object.hasOwn(record, 'publisher')), 'publisher field remains in bulk permanent-record CSL export');
const allBib = readFileSync(path.join(OUT, 'data/citations/all-records.bib'), 'utf8');
const allRis = readFileSync(path.join(OUT, 'data/citations/all-records.ris'), 'utf8');
assert(!/\npublisher\s*=/i.test(`\n${allBib}`), 'publisher field remains in bulk permanent-record BibTeX export');
assert(!allRis.includes('\nPB  - '), 'publisher field remains in bulk permanent-record RIS export');

for (const item of (catalog.items ?? []).filter((entry) => entry.isbn13)) {
  const manifestPath = path.join(OUT, 'iiif', item.id, 'manifest.json');
  mustExist(manifestPath);
  const manifest = readJson(manifestPath);
  assert(JSON.stringify(manifest.metadata ?? []).includes(item.isbn13), `IIIF manifest omits bound ISBN for ${item.filename}`);
}

const provenanceText = readFileSync(path.join(OUT, 'data/provenance-graph.jsonld'), 'utf8');
for (const item of (catalog.items ?? []).filter((entry) => entry.isbn13)) {
  assert(provenanceText.includes(`isbn:${item.isbn13}`), `PROV-O graph omits bound ISBN for ${item.filename}`);
}

const atmaCsl = allCsl.find((record) => record.id === 'thakur2026_text_atmatattvaviveka');
assert(atmaCsl?.ISBN === '978-93-5943-857-3', 'Atmatattvaviveka permanent-record CSL citation lacks authoritative ISBN');

const sitemap = readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
assert(sitemap.includes('/mithila-vajji-anga/isbn/'), 'sitemap omits ISBN registry route');
const report = readJson(path.join(OUT, 'data/digital-humanities-extensions-report.json'));
assert(report.isbnAuthority?.authoritativeRecords === 293, 'DH extension report omits canonical ISBN authority count');
assert(report.isbnAuthority?.publisherSourceColumnUsed === false, 'DH extension report does not preserve publisher-column exclusion');
assert(report.isbnAuthority?.atmatattvavivekaIsbn === '978-93-5943-857-3', 'DH extension report lost Atmatattvaviveka ISBN');

console.log({
  canonicalIsbnRecords: authority.recordCount,
  explicitSourcePdfBindings: bindings.sourceBindings?.length ?? 0,
  atmatattvavivekaIsbn: '978-93-5943-857-3',
  publisherSourceColumnUsed: false,
  iiifAndProvenanceEnriched: true,
  citationExportsEnriched: true,
  failClosed: true,
});
