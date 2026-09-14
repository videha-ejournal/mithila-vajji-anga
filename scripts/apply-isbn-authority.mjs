import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist/client');
const SITE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const AUTHORITY_ROOT = path.join(ROOT, 'data/isbn-authority');
const INDEX_PATH = path.join(AUTHORITY_ROOT, 'index.json');
const BINDINGS_PATH = path.join(AUTHORITY_ROOT, 'project-bindings.json');
const SOURCE_CATALOG_PATH = path.join(OUT, 'source-library/catalog.json');
const RECORDS_PATH = path.join(OUT, 'records-index.json');
const PROVENANCE_RULES_PATH = path.join(ROOT, 'data/record-source-provenance.json');
const FORBIDDEN_SOURCE_COLUMN = 'Name of Publishing Agency/Publisher';

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const ensureDir = (directory) => mkdirSync(directory, { recursive: true });
const write = (relative, content) => {
  const target = path.join(OUT, relative);
  ensureDir(path.dirname(target));
  writeFileSync(target, content, 'utf8');
};
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const escapeBib = (value = '') => String(value).replaceAll('{', '').replaceAll('}', '');
const csv = (value = '') => `"${String(value ?? '').replaceAll('"', '""')}"`;
const devanagariDigits = new Map(Array.from('०१२३४५६७८९').map((digit, index) => [digit, String(index)]));
const normalizeTitle = (value = '') => String(value)
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[०-९]/g, (digit) => devanagariDigits.get(digit) ?? digit)
  .replace(/&/g, ' and ')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const isbnDigits = (value) => String(value ?? '').replace(/\D/g, '');
const validIsbn13 = (value) => {
  const digits = isbnDigits(value);
  if (digits.length !== 13) return false;
  const total = Array.from(digits.slice(0, 12)).reduce(
    (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return (10 - (total % 10)) % 10 === Number(digits[12]);
};
const citationId = (record) => `thakur2026_${record.type}_${record.id}`.replace(/[^a-zA-Z0-9_:-]/g, '_');

function loadAuthority() {
  if (!existsSync(INDEX_PATH)) throw new Error(`ISBN authority index missing: ${INDEX_PATH}`);
  if (!existsSync(BINDINGS_PATH)) throw new Error(`ISBN project bindings missing: ${BINDINGS_PATH}`);
  const index = readJson(INDEX_PATH);
  if (index.count !== 293 || index.uniqueIsbnCount !== 293) {
    throw new Error(`ISBN authority must contain exactly 293 unique records; index reports ${index.count}/${index.uniqueIsbnCount}.`);
  }
  if (!(index.excludedSourceColumns ?? []).includes(FORBIDDEN_SOURCE_COLUMN)) {
    throw new Error(`ISBN authority must explicitly exclude source column: ${FORBIDDEN_SOURCE_COLUMN}`);
  }
  if ((index.columns ?? []).some((column) => /publishing agency|publisher/i.test(column))) {
    throw new Error('ISBN authority schema contains the forbidden publishing-agency/publisher source column.');
  }

  const records = [];
  for (const chunkName of index.chunks ?? []) {
    const chunkPath = path.join(AUTHORITY_ROOT, chunkName);
    const chunk = readJson(chunkPath);
    if (JSON.stringify(chunk.columns) !== JSON.stringify(index.columns)) {
      throw new Error(`ISBN authority column mismatch in ${chunkName}.`);
    }
    for (const row of chunk.rows ?? []) {
      const record = Object.fromEntries(index.columns.map((column, columnIndex) => [column, row[columnIndex] ?? null]));
      records.push(record);
    }
  }
  if (records.length !== 293) throw new Error(`ISBN authority contains ${records.length} records; expected 293.`);
  const byIsbn = new Map();
  for (const record of records) {
    if (!validIsbn13(record.isbn13)) throw new Error(`Invalid ISBN-13 checksum in authority: ${record.isbn13}`);
    if (byIsbn.has(record.isbn13)) throw new Error(`Duplicate ISBN-13 in authority: ${record.isbn13}`);
    if (Object.keys(record).some((key) => /publishing agency|publisher/i.test(key))) {
      throw new Error(`Forbidden publisher-derived field present in ISBN authority record ${record.isbn13}.`);
    }
    byIsbn.set(record.isbn13, record);
  }

  const titleCandidates = new Map();
  const addTitle = (title, isbn13) => {
    const normalized = normalizeTitle(title);
    if (!normalized) return;
    if (!titleCandidates.has(normalized)) titleCandidates.set(normalized, new Set());
    titleCandidates.get(normalized).add(isbn13);
  };
  for (const record of records) addTitle(record.title, record.isbn13);
  for (const aliasGroup of index.sameWorkAliases ?? []) {
    if (!byIsbn.has(aliasGroup.canonicalIsbn13)) {
      throw new Error(`Same-work alias points to missing authoritative ISBN: ${aliasGroup.canonicalIsbn13}`);
    }
    addTitle(aliasGroup.canonicalTitle, aliasGroup.canonicalIsbn13);
    for (const alias of aliasGroup.sameWorkAliases ?? []) addTitle(alias, aliasGroup.canonicalIsbn13);
  }

  const bindings = readJson(BINDINGS_PATH);
  const bindingByPath = new Map();
  for (const binding of bindings.sourceBindings ?? []) {
    if (!byIsbn.has(binding.isbn13)) {
      throw new Error(`ISBN binding references an ISBN absent from the authoritative register: ${binding.isbn13}`);
    }
    if (bindingByPath.has(binding.sourcePdfPath)) {
      throw new Error(`Duplicate ISBN source binding: ${binding.sourcePdfPath}`);
    }
    bindingByPath.set(binding.sourcePdfPath, binding);
  }
  return { index, records, byIsbn, titleCandidates, bindings, bindingByPath };
}

function resolutionFor(item, authority) {
  const explicit = authority.bindingByPath.get(item.filename);
  if (explicit) {
    return {
      ...authority.byIsbn.get(explicit.isbn13),
      scope: explicit.scope,
      relation: explicit.relation,
      matchMethod: 'explicit-source-binding',
    };
  }
  const possible = new Set();
  for (const title of [item.title, item.alternateTitle, item.seriesTitle]) {
    const matches = authority.titleCandidates.get(normalizeTitle(title));
    if (matches?.size === 1) possible.add(matches.values().next().value);
  }
  if (possible.size !== 1) return null;
  const isbn13 = possible.values().next().value;
  return {
    ...authority.byIsbn.get(isbn13),
    scope: 'work',
    relation: 'exact-title-authority-match',
    matchMethod: 'exact-normalized-title',
  };
}

function cleanOldIsbn(item) {
  const cleaned = { ...item };
  for (const key of ['isbn', 'isbn10', 'isbn13', 'ISBN', 'ISBN10', 'ISBN13']) delete cleaned[key];
  return cleaned;
}

const authority = loadAuthority();
if (!existsSync(SOURCE_CATALOG_PATH)) {
  throw new Error(`Source-library catalogue missing before ISBN merge: ${SOURCE_CATALOG_PATH}`);
}
const catalog = readJson(SOURCE_CATALOG_PATH);
const enrichedItems = (catalog.items ?? []).map((sourceItem) => {
  const item = cleanOldIsbn(sourceItem);
  const resolution = resolutionFor(item, authority);
  if (!resolution) return item;
  return {
    ...item,
    isbn13: resolution.isbn13,
    isbnAuthorityTitle: resolution.title,
    isbnScope: resolution.scope,
    isbnRelation: resolution.relation,
    isbnMatchMethod: resolution.matchMethod,
    isbnAuthorityVersion: authority.index.version,
  };
});
const itemById = new Map(enrichedItems.map((item) => [item.id, item]));
const linkedItems = enrichedItems.filter((item) => item.isbn13);
const explicitPaths = new Set(enrichedItems.map((item) => item.filename));
for (const binding of authority.bindings.sourceBindings ?? []) {
  if (!explicitPaths.has(binding.sourcePdfPath)) {
    throw new Error(`Explicit ISBN binding source PDF is missing from the built source library: ${binding.sourcePdfPath}`);
  }
}

catalog.items = enrichedItems;
catalog.books = (catalog.books ?? []).map((item) => itemById.get(item.id) ?? cleanOldIsbn(item));
catalog.supportDocuments = (catalog.supportDocuments ?? []).map((item) => itemById.get(item.id) ?? cleanOldIsbn(item));
catalog.isbnAuthority = {
  title: authority.index.title,
  version: authority.index.version,
  authorityRule: authority.index.authorityRule,
  authoritativeCount: authority.records.length,
  linkedSourceCount: linkedItems.length,
  source: `${SITE}/data/isbn-authority/index.json`,
  excludedSourceColumns: authority.index.excludedSourceColumns,
};
writeFileSync(SOURCE_CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

const publicAuthority = {
  schemaVersion: authority.index.schemaVersion,
  version: authority.index.version,
  title: authority.index.title,
  authorityRule: authority.index.authorityRule,
  source: authority.index.source,
  count: authority.records.length,
  uniqueIsbnCount: authority.byIsbn.size,
  isbn13ChecksumInvalidCount: 0,
  excludedSourceColumns: authority.index.excludedSourceColumns,
  sameWorkAliases: authority.index.sameWorkAliases,
  columns: authority.index.columns,
  records: authority.records,
};
write('data/isbn-authority/index.json', `${JSON.stringify(authority.index, null, 2)}\n`);
write('data/isbn-authority/project-bindings.json', `${JSON.stringify(authority.bindings, null, 2)}\n`);
write('data/isbn-authority/all.json', `${JSON.stringify(publicAuthority, null, 2)}\n`);
for (const chunkName of authority.index.chunks ?? []) {
  write(`data/isbn-authority/${chunkName}`, readFileSync(path.join(AUTHORITY_ROOT, chunkName), 'utf8'));
}
write(
  'data/isbn-authority/all.csv',
  [
    authority.index.columns.map(csv).join(','),
    ...authority.records.map((record) => authority.index.columns.map((column) => csv(record[column])).join(',')),
  ].join('\n') + '\n',
);

const authorityRows = authority.records.map((record) => `<tr><td><code>${escapeHtml(record.isbn13)}</code></td><td>${escapeHtml(record.title)}</td><td>${escapeHtml(record.authorEditor ?? '')}</td><td>${escapeHtml(record.language ?? '')}</td><td>${escapeHtml(record.edition ?? '')}</td><td>${escapeHtml(record.publicationYear ?? '')}</td><td>${escapeHtml(record.status ?? '')}</td><td>${escapeHtml(record.administrator ?? '')}</td></tr>`).join('');
write('isbn/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authoritative ISBN Register | Videha Digital Research Archive</title><style>body{margin:0;background:#fbfaf6;color:#172437;font:16px/1.55 Georgia,"Times New Roman",serif}main{max-width:1200px;margin:auto;padding:2.5rem 1rem 4rem}h1{color:#0d2742;font-size:clamp(2rem,5vw,4rem);line-height:1}.note{border-left:4px solid #8c3d24;background:#fff;padding:1rem;margin:1rem 0 1.5rem}.tools{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.tools a{font:700 .88rem system-ui,sans-serif;color:#174c7d;text-decoration:none;border:1px solid #b8c0c8;border-radius:999px;padding:.5rem .75rem;background:#fff}.scroll{overflow:auto;border:1px solid #d5d0c8;background:#fff}table{border-collapse:collapse;width:100%;min-width:980px}th,td{padding:.55rem .65rem;border-bottom:1px solid #e2ddd4;text-align:left;vertical-align:top}th{position:sticky;top:0;background:#0d2742;color:#fff;font:700 .82rem system-ui,sans-serif}code{font-size:.85em}a{color:#174c7d}a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}</style></head><body><main><p>VIDEHA DIGITAL RESEARCH ARCHIVE</p><h1>Authoritative allotted ISBN register</h1><div class="note"><p><strong>${authority.records.length} unique allotted ISBNs</strong>, retrieved ${escapeHtml(authority.index.source?.retrievedDate ?? '')}. This register overrides older or conflicting ISBN metadata in this project.</p><p>The source column <strong>${escapeHtml(FORBIDDEN_SOURCE_COLUMN)}</strong> is deliberately excluded and is not used in these data products.</p><p><strong>Same-work rule:</strong> Gadya Padya Bharti 1 = Videha Sadeha 28; Gadya Padya Bharti 2 = Videha Sadeha 37. These are aliases of the same bibliographic works, not duplicate ISBN-bearing works.</p></div><div class="tools"><a href="${SITE}/data/isbn-authority/all.json">JSON</a><a href="${SITE}/data/isbn-authority/all.csv">CSV</a><a href="${SITE}/data/citations/isbn-authority.csl.json">CSL-JSON</a><a href="${SITE}/data/citations/isbn-authority.bib">BibTeX</a><a href="${SITE}/data/citations/isbn-authority.ris">RIS</a><a href="${SITE}/source-library/">Source PDF Library</a></div><div class="scroll"><table><thead><tr><th>ISBN-13</th><th>Title</th><th>Author / editor</th><th>Language</th><th>Edition</th><th>Year</th><th>Status</th><th>Administrator</th></tr></thead><tbody>${authorityRows}</tbody></table></div><footer><p><a href="${SITE}/">← Videha Digital Research Archive</a></p></footer></main></body></html>`);

const sourceIndexPath = path.join(OUT, 'source-library/index.html');
if (existsSync(sourceIndexPath)) {
  let html = readFileSync(sourceIndexPath, 'utf8');
  if (!html.includes(`${SITE}/isbn/`) && html.includes('<div class="tools">')) {
    html = html.replace('<div class="tools">', `<div class="tools"><a href="${SITE}/isbn/">Authoritative ISBN register (293)</a>`);
  }
  if (!html.includes('isbn-authority-summary')) {
    html = html.replace(
      '<div class="tools">',
      `<p id="isbn-authority-summary"><strong>ISBN authority:</strong> ${authority.records.length} allotted ISBNs are authoritative for this archive; ${linkedItems.length} source PDFs have fail-closed ISBN bindings. Older conflicting ISBN metadata is overridden. The publishing-agency/publisher source column is not used.</p><div class="tools">`,
    );
  }
  for (const item of linkedItems) {
    const filenameMarker = `<p><code>${escapeHtml(item.filename)}</code></p>`;
    if (html.includes(filenameMarker) && !html.includes(`data-isbn-source="${escapeHtml(item.id)}"`)) {
      html = html.replace(
        filenameMarker,
        `${filenameMarker}<p data-isbn-source="${escapeHtml(item.id)}"><strong>ISBN:</strong> <code>${escapeHtml(item.isbn13)}</code> · ${escapeHtml(item.isbnScope)} · <a href="${SITE}/isbn/">authoritative register</a></p>`,
      );
    }
  }
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (whole, encoded) => {
    try {
      const jsonLd = JSON.parse(encoded);
      const sourceByUrl = new Map(linkedItems.map((item) => [item.url, item]));
      for (const listItem of jsonLd.mainEntity?.itemListElement ?? []) {
        const item = sourceByUrl.get(listItem.item?.contentUrl);
        if (item) listItem.item.isbn = item.isbn13;
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
    const item = sourceByUrl.get(entity['schema:url']);
    if (!item) continue;
    entity['schema:isbn'] = item.isbn13;
    const identifiers = Array.isArray(entity['schema:identifier']) ? entity['schema:identifier'] : [];
    entity['schema:identifier'] = [...identifiers.filter((identifier) => !String(identifier).startsWith('isbn:')), `isbn:${item.isbn13}`];
  }
  writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`, 'utf8');
}

const authorityCsl = authority.records.map((record) => ({
  id: `videha-isbn-${isbnDigits(record.isbn13)}`,
  type: 'book',
  title: record.title,
  author: record.authorEditor ? [{ literal: record.authorEditor }] : undefined,
  ISBN: record.isbn13,
  issued: record.publicationYear ? { 'date-parts': [[Number(record.publicationYear)]] } : undefined,
  language: record.language ?? undefined,
  edition: record.edition ?? undefined,
  note: `Authoritative allotted ISBN register · ${record.status ?? 'Allotted'}${record.administrator ? ` · administrator ${record.administrator}` : ''}`,
}));
write('data/citations/isbn-authority.csl.json', `${JSON.stringify(authorityCsl, null, 2)}\n`);
write('data/citations/isbn-authority.bib', authority.records.map((record) => `@book{videha_isbn_${isbnDigits(record.isbn13)},\n  author = {{${escapeBib(record.authorEditor ?? '')}}},\n  title = {${escapeBib(record.title)}},\n  isbn = {${record.isbn13}},\n  year = {${record.publicationYear ?? ''}},${record.language ? `\n  language = {${escapeBib(record.language)}},` : ''}${record.edition ? `\n  edition = {${escapeBib(record.edition)}},` : ''}\n  note = {Authoritative allotted ISBN register; ${escapeBib(record.status ?? 'Allotted')}}\n}`).join('\n\n') + '\n');
write('data/citations/isbn-authority.ris', authority.records.map((record) => `TY  - BOOK\n${record.authorEditor ? `AU  - ${record.authorEditor}\n` : ''}TI  - ${record.title}\n${record.publicationYear ? `PY  - ${record.publicationYear}\n` : ''}SN  - ${record.isbn13}\n${record.language ? `LA  - ${record.language}\n` : ''}${record.edition ? `ET  - ${record.edition}\n` : ''}N1  - Authoritative allotted ISBN register; ${record.status ?? 'Allotted'}\nER  - `).join('\n\n') + '\n');

const records = existsSync(RECORDS_PATH) ? readJson(RECORDS_PATH) : [];
const provenanceRules = existsSync(PROVENANCE_RULES_PATH) ? readJson(PROVENANCE_RULES_PATH) : { exact: [], rules: [] };
const sourceByFilename = new Map(enrichedItems.map((item) => [item.filename, item]));
const mappingFor = (record) => (provenanceRules.exact ?? []).find(
  (entry) => entry.recordType === record.type && entry.recordId === record.id,
) ?? (provenanceRules.rules ?? []).find(
  (entry) => entry.recordType === record.type && record.id.startsWith(entry.recordIdPrefix ?? ''),
) ?? null;
const sourceForRecord = (record) => {
  const mapping = mappingFor(record);
  return mapping ? sourceByFilename.get(mapping.sourcePdfPath) ?? null : null;
};
const cslPath = path.join(OUT, 'data/citations/all-records.csl.json');
if (existsSync(cslPath) && records.length) {
  const cslRecords = readJson(cslPath);
  const cslById = new Map(cslRecords.map((record) => [record.id, record]));
  for (const record of records) {
    const source = sourceForRecord(record);
    const citation = cslById.get(citationId(record));
    if (!source?.isbn13 || !citation) continue;
    const exactBookIsbn = record.type === 'text' && ['edition', 'work'].includes(source.isbnScope);
    delete citation.ISBN;
    if (exactBookIsbn) citation.ISBN = source.isbn13;
    const baseNote = String(citation.note ?? '').replace(/ · Source publication ISBN .*$/, '');
    citation.note = `${baseNote} · Source publication ISBN ${source.isbn13} (${source.isbnScope})`;
  }
  writeFileSync(cslPath, `${JSON.stringify(cslRecords, null, 2)}\n`, 'utf8');
}

const bibPath = path.join(OUT, 'data/citations/all-records.bib');
if (existsSync(bibPath) && records.length) {
  const blocks = readFileSync(bibPath, 'utf8').trimEnd().split(/\n\n+/);
  if (blocks.length === records.length) {
    const rewritten = blocks.map((block, index) => {
      const record = records[index];
      const source = sourceForRecord(record);
      if (!source?.isbn13) return block;
      let next = block.replace(/\n  isbn = \{[^}]+\},?/g, '');
      if (record.type === 'text' && ['edition', 'work'].includes(source.isbnScope)) {
        next = next.replace(/\n  note = /, `\n  isbn = {${source.isbn13}},\n  note = `);
      }
      return next.replace(/note = \{([^}]*)\}/, (_match, note) => `note = {${note}; source publication ISBN ${source.isbn13} (${source.isbnScope})}`);
    });
    writeFileSync(bibPath, `${rewritten.join('\n\n')}\n`, 'utf8');
  }
}

const risPath = path.join(OUT, 'data/citations/all-records.ris');
if (existsSync(risPath) && records.length) {
  const blocks = readFileSync(risPath, 'utf8').trimEnd().split(/\n\n+/);
  if (blocks.length === records.length) {
    const rewritten = blocks.map((block, index) => {
      const record = records[index];
      const source = sourceForRecord(record);
      if (!source?.isbn13) return block;
      let next = block.replace(/\nSN  - 978-[^\n]+/g, '');
      if (record.type === 'text' && ['edition', 'work'].includes(source.isbnScope)) {
        next = next.replace(/\nUR  - /, `\nSN  - ${source.isbn13}\nUR  - `);
      }
      return next.replace(/\nER  - /, `\nN1  - Source publication ISBN ${source.isbn13} (${source.isbnScope})\nER  - `);
    });
    writeFileSync(risPath, `${rewritten.join('\n\n')}\n`, 'utf8');
  }
}

const citationsIndexPath = path.join(OUT, 'citations/index.html');
if (existsSync(citationsIndexPath)) {
  let html = readFileSync(citationsIndexPath, 'utf8');
  if (!html.includes('isbn-authority.csl.json')) {
    html = html.replace('</main>', `<h2>Authoritative 293 allotted ISBN publications</h2><p><a href="${SITE}/data/citations/isbn-authority.csl.json">CSL-JSON</a> · <a href="${SITE}/data/citations/isbn-authority.bib">BibTeX</a> · <a href="${SITE}/data/citations/isbn-authority.ris">RIS</a> · <a href="${SITE}/isbn/">Browse ISBN register</a></p></main>`);
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
    version: authority.index.version,
    authoritativeRecords: authority.records.length,
    linkedSourcePdfs: linkedItems.length,
    publisherSourceColumnUsed: false,
  };
  writeFileSync(extensionReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(`ISBN authority applied: ${authority.records.length} authoritative ISBNs; ${linkedItems.length} source PDFs linked; publisher source column excluded.`);
