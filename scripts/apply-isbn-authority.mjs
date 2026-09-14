import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist/client');
const SITE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const AUTHORITY_PATH = path.join(ROOT, 'public/data/videha-isbn-authority.json');
const BINDINGS_PATH = path.join(ROOT, 'data/isbn-source-bindings.json');
const SOURCE_CATALOG_PATH = path.join(OUT, 'source-library/catalog.json');
const RECORDS_PATH = path.join(OUT, 'records-index.json');
const PROVENANCE_RULES_PATH = path.join(ROOT, 'data/record-source-provenance.json');
const FORBIDDEN_SOURCE_COLUMN = 'Name of Publishing Agency/Publisher';

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const escapeBib = (value = '') => String(value).replaceAll('{', '').replaceAll('}', '');
const isbnDigits = (value) => String(value ?? '').replace(/\D/g, '');
const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const citationId = (record) => `thakur2026_${record.type}_${record.id}`.replace(/[^a-zA-Z0-9_:-]/g, '_');

if (!existsSync(AUTHORITY_PATH)) throw new Error(`Canonical ISBN export missing: ${AUTHORITY_PATH}`);
if (!existsSync(BINDINGS_PATH)) throw new Error(`ISBN source bindings missing: ${BINDINGS_PATH}`);
if (!existsSync(SOURCE_CATALOG_PATH)) throw new Error(`Source-library catalogue missing: ${SOURCE_CATALOG_PATH}`);

const authority = readJson(AUTHORITY_PATH);
const bindings = readJson(BINDINGS_PATH);
if (authority.recordCount !== 293 || authority.uniqueIsbnCount !== 293 || authority.records?.length !== 293) {
  throw new Error('Canonical ISBN authority must contain exactly 293 unique records.');
}
if (!(authority.excludedSourceColumns ?? []).includes(FORBIDDEN_SOURCE_COLUMN)) {
  throw new Error(`Canonical ISBN authority must exclude ${FORBIDDEN_SOURCE_COLUMN}.`);
}
const authorityByIsbn = new Map(authority.records.map((record) => [record.isbn, record]));
for (const record of authority.records) {
  if (Object.hasOwn(record, 'publisher') || Object.hasOwn(record, 'publishingAgency')) {
    throw new Error(`Forbidden publisher-derived field present in canonical ISBN record: ${record.isbn}`);
  }
}

const bindingByPath = new Map();
for (const binding of bindings.sourceBindings ?? []) {
  if (!authorityByIsbn.has(binding.isbn)) {
    throw new Error(`Source binding references ISBN outside canonical authority: ${binding.isbn}`);
  }
  if (bindingByPath.has(binding.sourcePdfPath)) {
    throw new Error(`Duplicate ISBN source binding: ${binding.sourcePdfPath}`);
  }
  bindingByPath.set(binding.sourcePdfPath, binding);
}

const cleanOldIsbn = (sourceItem) => {
  const item = { ...sourceItem };
  for (const key of ['isbn', 'isbn10', 'isbn13', 'ISBN', 'ISBN10', 'ISBN13']) delete item[key];
  return item;
};
const catalog = readJson(SOURCE_CATALOG_PATH);
const enrichedItems = (catalog.items ?? []).map((sourceItem) => {
  const item = cleanOldIsbn(sourceItem);
  const binding = bindingByPath.get(item.filename);
  if (!binding) return item;
  const record = authorityByIsbn.get(binding.isbn);
  return {
    ...item,
    isbn13: binding.isbn,
    isbnAuthorityTitle: record.bookTitle,
    isbnScope: binding.scope,
    isbnRelation: binding.relation,
    isbnMatchMethod: 'explicit-fail-closed-source-binding',
    isbnAuthorityId: 'VIDEHA-ISBN-AUTHORITY-293-2026-09-14',
  };
});
const itemById = new Map(enrichedItems.map((item) => [item.id, item]));
const sourceByFilename = new Map(enrichedItems.map((item) => [item.filename, item]));
for (const binding of bindings.sourceBindings ?? []) {
  if (!sourceByFilename.has(binding.sourcePdfPath)) {
    throw new Error(`Explicit ISBN-bound source PDF missing from built source library: ${binding.sourcePdfPath}`);
  }
}
const linkedItems = enrichedItems.filter((item) => item.isbn13);

catalog.items = enrichedItems;
catalog.books = (catalog.books ?? []).map((item) => itemById.get(item.id) ?? cleanOldIsbn(item));
catalog.supportDocuments = (catalog.supportDocuments ?? []).map((item) => itemById.get(item.id) ?? cleanOldIsbn(item));
catalog.isbnAuthority = {
  identifier: 'VIDEHA-ISBN-AUTHORITY-293-2026-09-14',
  recordCount: authority.recordCount,
  uniqueIsbnCount: authority.uniqueIsbnCount,
  linkedSourcePdfCount: linkedItems.length,
  authorityUrl: `${SITE}/isbn/`,
  dataUrl: `${SITE}/data/videha-isbn-authority.json`,
  excludedSourceColumns: authority.excludedSourceColumns,
  bindingPolicy: bindings.policy,
};
writeFileSync(SOURCE_CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

const sourceIndexPath = path.join(OUT, 'source-library/index.html');
if (existsSync(sourceIndexPath)) {
  let html = readFileSync(sourceIndexPath, 'utf8');
  if (!html.includes(`${SITE}/isbn/`) && html.includes('<div class="tools">')) {
    html = html.replace('<div class="tools">', `<div class="tools"><a href="${SITE}/isbn/">Authoritative ISBN registry (293)</a>`);
  }
  if (!html.includes('isbn-authority-summary')) {
    html = html.replace(
      '<div class="tools">',
      `<p id="isbn-authority-summary"><strong>ISBN authority:</strong> 293 unique allotted ISBNs are canonical for this archive; ${linkedItems.length} source PDFs have explicit fail-closed bindings. Older conflicting ISBN metadata is overridden. The publishing-agency/publisher source column is excluded.</p><div class="tools">`,
    );
  }
  for (const item of linkedItems) {
    const marker = `<p><code>${escapeHtml(item.filename)}</code></p>`;
    if (html.includes(marker) && !html.includes(`data-isbn-source="${escapeHtml(item.id)}"`)) {
      html = html.replace(
        marker,
        `${marker}<p data-isbn-source="${escapeHtml(item.id)}"><strong>ISBN:</strong> <code>${escapeHtml(item.isbn13)}</code> · ${escapeHtml(item.isbnScope)} · <a href="${SITE}/isbn/">authoritative registry</a></p>`,
      );
    }
  }
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (whole, encoded) => {
    try {
      const jsonLd = JSON.parse(encoded);
      const sourceByUrl = new Map(linkedItems.map((item) => [item.url, item]));
      for (const listItem of jsonLd.mainEntity?.itemListElement ?? []) {
        const sourceItem = sourceByUrl.get(listItem.item?.contentUrl);
        if (sourceItem) listItem.item.isbn = sourceItem.isbn13;
      }
      return `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>`;
    } catch {
      return whole;
    }
  });
  writeFileSync(sourceIndexPath, html, 'utf8');
}

for (const item of linkedItems) {
  const manifestPath = path.join(OUT, 'iiif', item.id, 'manifest.json');
  if (!existsSync(manifestPath)) continue;
  const manifest = readJson(manifestPath);
  manifest.metadata = (manifest.metadata ?? []).filter((entry) => {
    const label = Object.values(entry.label ?? {}).flat().join(' ').toLowerCase();
    return label !== 'isbn' && label !== 'isbn scope';
  });
  manifest.metadata.push(
    { label: { en: ['ISBN'] }, value: { none: [item.isbn13] } },
    { label: { en: ['ISBN scope'] }, value: { en: [item.isbnScope] } },
  );
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

const provenancePath = path.join(OUT, 'data/provenance-graph.jsonld');
if (existsSync(provenancePath)) {
  const provenance = readJson(provenancePath);
  const sourceByUrl = new Map(linkedItems.map((item) => [item.url, item]));
  for (const entity of provenance['@graph'] ?? []) {
    const sourceItem = sourceByUrl.get(entity['schema:url']);
    if (!sourceItem) continue;
    entity['schema:isbn'] = sourceItem.isbn13;
    const identifiers = Array.isArray(entity['schema:identifier']) ? entity['schema:identifier'] : [];
    entity['schema:identifier'] = identifiers
      .filter((identifier) => !String(identifier).startsWith('isbn:'))
      .concat(`isbn:${sourceItem.isbn13}`);
  }
  writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`, 'utf8');
}

const authorityCsl = authority.records.map((record) => ({
  id: `videha-isbn-${isbnDigits(record.isbn)}`,
  type: 'book',
  title: record.bookTitle,
  author: record.authorEditor ? [{ literal: record.authorEditor }] : undefined,
  ISBN: record.isbn,
  issued: record.year ? { 'date-parts': [[Number(record.year)]] } : undefined,
  language: record.language ?? undefined,
  edition: record.edition ?? undefined,
  note: `Videha ISBN Authority Registry · ${record.status ?? 'Allotted'}${record.administrator ? ` · administrator ${record.administrator}` : ''}`,
}));
const citationsRoot = path.join(OUT, 'data/citations');
writeFileSync(path.join(citationsRoot, 'isbn-authority.csl.json'), `${JSON.stringify(authorityCsl, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(citationsRoot, 'isbn-authority.bib'),
  authority.records.map((record) => `@book{videha_isbn_${isbnDigits(record.isbn)},\n  author = {{${escapeBib(record.authorEditor ?? '')}}},\n  title = {${escapeBib(record.bookTitle)}},\n  isbn = {${record.isbn}},\n  year = {${record.year ?? ''}},${record.language ? `\n  language = {${escapeBib(record.language)}},` : ''}${record.edition ? `\n  edition = {${escapeBib(record.edition)}},` : ''}\n  note = {Videha ISBN Authority Registry; ${escapeBib(record.status ?? 'Allotted')}}\n}`).join('\n\n') + '\n',
  'utf8',
);
writeFileSync(
  path.join(citationsRoot, 'isbn-authority.ris'),
  authority.records.map((record) => `TY  - BOOK\n${record.authorEditor ? `AU  - ${record.authorEditor}\n` : ''}TI  - ${record.bookTitle}\n${record.year ? `PY  - ${record.year}\n` : ''}SN  - ${record.isbn}\n${record.language ? `LA  - ${record.language}\n` : ''}${record.edition ? `ET  - ${record.edition}\n` : ''}N1  - Videha ISBN Authority Registry; ${record.status ?? 'Allotted'}\nER  - `).join('\n\n') + '\n',
  'utf8',
);

const records = existsSync(RECORDS_PATH) ? readJson(RECORDS_PATH) : [];
const provenanceRules = existsSync(PROVENANCE_RULES_PATH) ? readJson(PROVENANCE_RULES_PATH) : { exact: [], rules: [] };
const mappingFor = (record) => (provenanceRules.exact ?? []).find(
  (entry) => entry.recordType === record.type && entry.recordId === record.id,
) ?? (provenanceRules.rules ?? []).find(
  (entry) => entry.recordType === record.type && record.id.startsWith(entry.recordIdPrefix ?? ''),
) ?? null;
const sourceForRecord = (record) => {
  const mapping = mappingFor(record);
  return mapping ? sourceByFilename.get(mapping.sourcePdfPath) ?? null : null;
};

const cslPath = path.join(citationsRoot, 'all-records.csl.json');
if (existsSync(cslPath) && records.length) {
  const cslRecords = readJson(cslPath);
  const cslById = new Map(cslRecords.map((citation) => [citation.id, citation]));
  for (const citation of cslRecords) delete citation.publisher;
  for (const record of records) {
    const sourceItem = sourceForRecord(record);
    const citation = cslById.get(citationId(record));
    if (!sourceItem?.isbn13 || !citation) continue;
    const exactBookIsbn = record.type === 'text' && ['edition', 'work'].includes(sourceItem.isbnScope);
    delete citation.ISBN;
    if (exactBookIsbn) citation.ISBN = sourceItem.isbn13;
    const baseNote = String(citation.note ?? '').replace(/ · Source publication ISBN .*$/, '');
    citation.note = `${baseNote} · Source publication ISBN ${sourceItem.isbn13} (${sourceItem.isbnScope})`;
  }
  writeFileSync(cslPath, `${JSON.stringify(cslRecords, null, 2)}\n`, 'utf8');
}

const bibPath = path.join(citationsRoot, 'all-records.bib');
if (existsSync(bibPath) && records.length) {
  const blocks = readFileSync(bibPath, 'utf8').trimEnd().split(/\n\n+/);
  if (blocks.length === records.length) {
    const rewritten = blocks.map((block, index) => {
      const record = records[index];
      const sourceItem = sourceForRecord(record);
      let next = block.replace(/\n  publisher = \{[^}]*\},?/g, '');
      if (!sourceItem?.isbn13) return next;
      next = next.replace(/\n  isbn = \{[^}]+\},?/g, '');
      if (record.type === 'text' && ['edition', 'work'].includes(sourceItem.isbnScope)) {
        next = next.replace(/\n  note = /, `\n  isbn = {${sourceItem.isbn13}},\n  note = `);
      }
      return next.replace(/note = \{([^}]*)\}/, (_match, note) => `note = {${note}; source publication ISBN ${sourceItem.isbn13} (${sourceItem.isbnScope})}`);
    });
    writeFileSync(bibPath, `${rewritten.join('\n\n')}\n`, 'utf8');
  }
}

const risPath = path.join(citationsRoot, 'all-records.ris');
if (existsSync(risPath) && records.length) {
  const blocks = readFileSync(risPath, 'utf8').trimEnd().split(/\n\n+/);
  if (blocks.length === records.length) {
    const rewritten = blocks.map((block, index) => {
      const record = records[index];
      const sourceItem = sourceForRecord(record);
      let next = block.replace(/\nPB  - [^\n]+/g, '');
      if (!sourceItem?.isbn13) return next;
      next = next.replace(/\nSN  - 978-[^\n]+/g, '');
      if (record.type === 'text' && ['edition', 'work'].includes(sourceItem.isbnScope)) {
        next = next.replace(/\nUR  - /, `\nSN  - ${sourceItem.isbn13}\nUR  - `);
      }
      return next.replace(/\nER  - /, `\nN1  - Source publication ISBN ${sourceItem.isbn13} (${sourceItem.isbnScope})\nER  - `);
    });
    writeFileSync(risPath, `${rewritten.join('\n\n')}\n`, 'utf8');
  }
}

const citationsIndexPath = path.join(OUT, 'citations/index.html');
if (existsSync(citationsIndexPath)) {
  let html = readFileSync(citationsIndexPath, 'utf8');
  if (!html.includes('isbn-authority.csl.json')) {
    html = html.replace('</main>', `<h2>Authoritative 293 allotted ISBN publications</h2><p><a href="${SITE}/data/citations/isbn-authority.csl.json">CSL-JSON</a> · <a href="${SITE}/data/citations/isbn-authority.bib">BibTeX</a> · <a href="${SITE}/data/citations/isbn-authority.ris">RIS</a> · <a href="${SITE}/isbn/">Browse ISBN registry</a></p></main>`);
    writeFileSync(citationsIndexPath, html, 'utf8');
  }
}

const sitemapPath = path.join(OUT, 'sitemap.xml');
if (existsSync(sitemapPath)) {
  let sitemap = readFileSync(sitemapPath, 'utf8');
  const isbnUrl = `${SITE}/isbn/`;
  if (!sitemap.includes(`<loc>${isbnUrl}</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${isbnUrl}</loc><lastmod>2026-09-14</lastmod></url>\n</urlset>`);
    writeFileSync(sitemapPath, sitemap, 'utf8');
  }
}

const extensionReportPath = path.join(OUT, 'data/digital-humanities-extensions-report.json');
if (existsSync(extensionReportPath)) {
  const report = readJson(extensionReportPath);
  report.isbnAuthority = {
    identifier: 'VIDEHA-ISBN-AUTHORITY-293-2026-09-14',
    authoritativeRecords: 293,
    linkedSourcePdfs: linkedItems.length,
    publisherSourceColumnUsed: false,
    atmatattvavivekaIsbn: '978-93-5943-857-3',
  };
  report.checksums = {
    ...(report.checksums ?? {}),
    provenanceGraph: sha256(readFileSync(provenancePath)),
    citationCsl: sha256(readFileSync(cslPath)),
    isbnAuthority: sha256(readFileSync(path.join(OUT, 'data/videha-isbn-authority.json'))),
  };
  writeFileSync(extensionReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(`Canonical ISBN authority applied to DH outputs: 293 records; ${linkedItems.length} explicit source-PDF bindings; publisher source column excluded.`);
