import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist/client');
const AUTHORITY_ROOT = path.join(ROOT, 'data/isbn-authority');
const FORBIDDEN_SOURCE_COLUMN = 'Name of Publishing Agency/Publisher';
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const isbnDigits = (value) => String(value ?? '').replace(/\D/g, '');
const validIsbn13 = (value) => {
  const digits = isbnDigits(value);
  if (digits.length !== 13) return false;
  const total = [...digits.slice(0, 12)].reduce(
    (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return (10 - (total % 10)) % 10 === Number(digits[12]);
};
const mustExist = (file) => {
  if (!existsSync(file)) throw new Error(`Required ISBN authority output missing: ${file}`);
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const indexPath = path.join(AUTHORITY_ROOT, 'index.json');
const bindingsPath = path.join(AUTHORITY_ROOT, 'project-bindings.json');
mustExist(indexPath);
mustExist(bindingsPath);
const index = readJson(indexPath);
assert(index.count === 293, `ISBN authority index count must be 293; found ${index.count}.`);
assert(index.uniqueIsbnCount === 293, `ISBN authority unique count must be 293; found ${index.uniqueIsbnCount}.`);
assert((index.excludedSourceColumns ?? []).includes(FORBIDDEN_SOURCE_COLUMN), 'Forbidden publisher source column must be explicitly excluded.');
assert(!(index.columns ?? []).some((column) => /publishing agency|publisher/i.test(column)), 'Publisher-derived column leaked into ISBN authority schema.');

const records = [];
for (const chunkName of index.chunks ?? []) {
  const chunkPath = path.join(AUTHORITY_ROOT, chunkName);
  mustExist(chunkPath);
  const chunk = readJson(chunkPath);
  assert(JSON.stringify(chunk.columns) === JSON.stringify(index.columns), `ISBN authority column mismatch in ${chunkName}.`);
  for (const row of chunk.rows ?? []) {
    records.push(Object.fromEntries(index.columns.map((column, columnIndex) => [column, row[columnIndex] ?? null])));
  }
}
assert(records.length === 293, `ISBN authority contains ${records.length} records; expected 293.`);
const unique = new Set(records.map((record) => record.isbn13));
assert(unique.size === 293, `ISBN authority contains ${unique.size} unique ISBNs; expected 293.`);
for (const record of records) {
  assert(validIsbn13(record.isbn13), `Invalid ISBN-13 checksum: ${record.isbn13}`);
  assert(!Object.keys(record).some((key) => /publishing agency|publisher/i.test(key)), `Publisher-derived field found on ${record.isbn13}.`);
}
const byIsbn = new Map(records.map((record) => [record.isbn13, record]));
for (const required of [
  '978-93-344-9415-0',
  '978-93-5812-486-6',
  '978-93-6123-729-4',
  '978-93-341-0402-8',
  '978-93-5890-150-4',
]) {
  assert(byIsbn.has(required), `Required authoritative ISBN missing: ${required}`);
}
const aliasesByIsbn = new Map((index.sameWorkAliases ?? []).map((group) => [group.canonicalIsbn13, new Set(group.sameWorkAliases ?? [])]));
assert(aliasesByIsbn.get('978-93-341-0402-8')?.has('Videha Sadeha 28'), 'Gadya Padya Bharti 1 = Videha Sadeha 28 equivalence is missing.');
assert(aliasesByIsbn.get('978-93-5890-150-4')?.has('Videha Sadeha 37'), 'Gadya Padya Bharti 2 = Videha Sadeha 37 equivalence is missing.');

const bindings = readJson(bindingsPath);
for (const binding of bindings.sourceBindings ?? []) {
  assert(byIsbn.has(binding.isbn13), `ISBN project binding references an unknown ISBN: ${binding.isbn13}`);
}

if (existsSync(OUT)) {
  const publicIndexPath = path.join(OUT, 'data/isbn-authority/index.json');
  const publicAllPath = path.join(OUT, 'data/isbn-authority/all.json');
  const publicCsvPath = path.join(OUT, 'data/isbn-authority/all.csv');
  const isbnPagePath = path.join(OUT, 'isbn/index.html');
  const catalogPath = path.join(OUT, 'source-library/catalog.json');
  const sourceIndexPath = path.join(OUT, 'source-library/index.html');
  const cslPath = path.join(OUT, 'data/citations/isbn-authority.csl.json');
  const bibPath = path.join(OUT, 'data/citations/isbn-authority.bib');
  const risPath = path.join(OUT, 'data/citations/isbn-authority.ris');
  for (const file of [publicIndexPath, publicAllPath, publicCsvPath, isbnPagePath, catalogPath, sourceIndexPath, cslPath, bibPath, risPath]) mustExist(file);

  const publicAll = readJson(publicAllPath);
  assert(publicAll.count === 293 && publicAll.records?.length === 293, 'Published ISBN authority must contain exactly 293 records.');
  assert(JSON.stringify(publicAll).toLowerCase().includes('name of publishing agency/publisher') === false, 'Forbidden publisher source column leaked into published ISBN JSON.');
  assert((publicAll.records ?? []).every((record) => !Object.keys(record).some((key) => /publishing agency|publisher/i.test(key))), 'Publisher-derived field leaked into published ISBN records.');

  const catalog = readJson(catalogPath);
  assert(catalog.isbnAuthority?.authoritativeCount === 293, 'Source-library catalogue does not expose the 293-record ISBN authority.');
  assert(catalog.isbnAuthority?.excludedSourceColumns?.includes(FORBIDDEN_SOURCE_COLUMN), 'Source-library catalogue does not retain the publisher-column exclusion rule.');
  const catalogByFilename = new Map((catalog.items ?? []).map((item) => [item.filename, item]));
  let linkedCount = 0;
  for (const item of catalog.items ?? []) {
    if (!item.isbn13) continue;
    linkedCount += 1;
    assert(byIsbn.has(item.isbn13), `Source-library item uses ISBN outside authoritative register: ${item.filename} -> ${item.isbn13}`);
    assert(item.isbnAuthorityVersion === index.version, `Source-library ISBN authority version mismatch: ${item.filename}`);
  }
  assert(linkedCount >= 15, `Expected at least 15 fail-closed source-PDF ISBN bindings; found ${linkedCount}.`);
  for (const binding of bindings.sourceBindings ?? []) {
    const item = catalogByFilename.get(binding.sourcePdfPath);
    assert(item, `Explicit ISBN-bound source PDF missing from source catalogue: ${binding.sourcePdfPath}`);
    assert(item.isbn13 === binding.isbn13, `Authoritative ISBN binding mismatch for ${binding.sourcePdfPath}: ${item.isbn13 ?? 'none'} != ${binding.isbn13}`);
  }

  const sourceIndex = readFileSync(sourceIndexPath, 'utf8');
  assert(sourceIndex.includes('/isbn/'), 'Source PDF Library does not link to the authoritative ISBN register.');
  assert(sourceIndex.includes('ISBN authority:'), 'Source PDF Library does not state its ISBN-authority policy.');
  const isbnPage = readFileSync(isbnPagePath, 'utf8');
  assert(isbnPage.includes('293 unique allotted ISBNs'), 'ISBN register page does not expose the validated count.');
  assert(isbnPage.includes('Gadya Padya Bharti 1 = Videha Sadeha 28'), 'ISBN page omits the volume-28 same-work rule.');
  assert(isbnPage.includes('Gadya Padya Bharti 2 = Videha Sadeha 37'), 'ISBN page omits the volume-37 same-work rule.');

  const authorityCsl = readJson(cslPath);
  assert(authorityCsl.length === 293, `ISBN CSL export contains ${authorityCsl.length} records; expected 293.`);
  assert(authorityCsl.every((record) => byIsbn.has(record.ISBN)), 'ISBN CSL export contains an ISBN outside the authoritative register.');
  assert(!readFileSync(bibPath, 'utf8').toLowerCase().includes('publisher ='), 'ISBN BibTeX export must not use the excluded publisher source column.');
  assert(!readFileSync(risPath, 'utf8').includes('\nPB  - '), 'ISBN RIS export must not use the excluded publisher source column.');

  for (const item of (catalog.items ?? []).filter((entry) => entry.isbn13)) {
    const manifestPath = path.join(OUT, 'iiif', item.id, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = readJson(manifestPath);
    const metadataText = JSON.stringify(manifest.metadata ?? []);
    assert(metadataText.includes(item.isbn13), `IIIF manifest omits authoritative ISBN for ${item.filename}.`);
  }

  const provenancePath = path.join(OUT, 'data/provenance-graph.jsonld');
  if (existsSync(provenancePath)) {
    const provenanceText = readFileSync(provenancePath, 'utf8');
    for (const item of (catalog.items ?? []).filter((entry) => entry.isbn13)) {
      assert(provenanceText.includes(`isbn:${item.isbn13}`), `PROV-O graph omits authoritative ISBN for ${item.filename}.`);
    }
  }

  const sitemapPath = path.join(OUT, 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    assert(readFileSync(sitemapPath, 'utf8').includes(`${'https://videha-ejournal.github.io/mithila-vajji-anga'}/isbn/`), 'Sitemap omits the ISBN register route.');
  }
}

console.log(`ISBN authority verified: ${records.length} unique valid ISBN-13 records; publisher source column excluded; same-work aliases preserved.`);
