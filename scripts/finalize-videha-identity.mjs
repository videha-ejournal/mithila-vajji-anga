import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist', 'client');
const VIDEHA_URL = 'https://www.videha.co.in/';
const MIRROR_URL = 'https://videha-ejournal.github.io/videha/';
const GITHUB_URL = 'https://github.com/videha-ejournal';
const ARCHIVE_URL = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const ISSN = '2229-547X';
const JOURNAL = 'Videha — First Maithili Fortnightly eJournal';
const IDENTITY_TEXT = `Videha — ${VIDEHA_URL} · ISSN ${ISSN} · GitHub mirror: ${MIRROR_URL} · Digital Research Archives on GitHub: ${GITHUB_URL}`;

if (!existsSync(OUT)) throw new Error('dist/client does not exist. Build the static site first.');

const parentIsbnByWork = new Map([
  ['panji-1', '978-93-5915-894-5'],
  ['panji-2', '978-93-6012-526-4'],
  ['panji-3', '978-93-6068-808-0'],
  ['panji-4', '978-93-6123-509-2'],
  ['panji-5', '978-93-5933-373-1'],
  ['panji-6', '978-93-5933-623-7'],
  ['parallel-philosophy-1', '978-93-344-9610-9'],
  ['parallel-philosophy-2', '978-93-344-9610-9'],
  ['parallel-history', '978-93-5812-486-6'],
  ['atmatattvaviveka', '978-93-5943-857-3'],
  ['bhamati', '978-93-5943-682-1'],
  ['nyayakusumanjali', '978-93-344-6450-4'],
  ['tattvacintamani', '978-93-6123-729-4'],
]);
const panjiRomanToWork = new Map([
  ['i', 'panji-1'],
  ['ii', 'panji-2'],
  ['iii', 'panji-3'],
  ['iv', 'panji-4'],
  ['v', 'panji-5'],
  ['vi', 'panji-6'],
]);

const identityHtml = `<aside class="videha-publication-identity" data-videha-publication-identity="true" aria-label="Videha publication identity"><strong>Videha</strong><span aria-hidden="true"> · </span><a href="${VIDEHA_URL}">${VIDEHA_URL}</a><span aria-hidden="true"> · </span><span>ISSN ${ISSN}</span><span aria-hidden="true"> · </span><span>GitHub mirror:</span> <a href="${MIRROR_URL}">${MIRROR_URL}</a><span aria-hidden="true"> · </span><span>Digital Research Archives on GitHub:</span> <a href="${GITHUB_URL}">${GITHUB_URL}</a></aside>`;
const identityStyle = `<style data-videha-identity-style>.videha-publication-identity{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.25rem .45rem;padding:.48rem clamp(.8rem,3vw,2rem);border-top:1px solid #ddcfaa;border-bottom:1px solid #ddcfaa;background:#fff8e6;color:#29323c;font:700 .78rem/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center}.videha-publication-identity strong{color:#7b241c}.videha-publication-identity a{color:#174c7d;text-decoration-thickness:1.5px;text-underline-offset:2px;overflow-wrap:anywhere}.videha-publication-identity a:focus-visible{outline:3px solid #e39b45;outline-offset:2px}@media print{.videha-publication-identity{border:0;background:white;color:#222}}</style>`;

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function isbnFromExtent(extent) {
  const match = String(extent ?? '').match(/ISBN\s+([0-9-]{13,17})/i);
  return match ? match[1] : null;
}

function normalizeTitle(value) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function citationKey(record) {
  const slug = String(record.title ?? record.id ?? 'record')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'record';
  return `thakur2026_${slug}`;
}

function citationText(record) {
  const isbn = record.isbn ? ` ISBN ${record.isbn}.` : '';
  return `Gajendra Thakur. “${record.title}.” Videha Digital Research Archive: Mithila–Vajji–Anga. ${IDENTITY_TEXT}.${isbn} ${record.url}`;
}

function bibtex(record) {
  const type = record.type === 'text' && record.isbn ? 'book' : 'online';
  const isbn = record.isbn ? `  isbn = {${record.isbn}},\n` : '';
  return `@${type}{${citationKey(record)},\n  author = {Thakur, Gajendra},\n  title = {${String(record.title ?? '').replaceAll('{', '').replaceAll('}', '')}},\n  year = {2026},\n  publisher = {${JOURNAL}},\n${isbn}  url = {${record.url}},\n  note = {${IDENTITY_TEXT}}\n}\n`;
}

function ris(record) {
  const isbn = record.isbn ? `SN  - ${record.isbn}\n` : '';
  return `TY  - ${record.type === 'text' && record.isbn ? 'BOOK' : 'ELEC'}\nAU  - Thakur, Gajendra\nTI  - ${record.title}\nT2  - Videha Digital Research Archive: Mithila–Vajji–Anga\nPB  - ${JOURNAL}\nPY  - 2026\nSN  - ${ISSN}\n${isbn}UR  - ${record.url}\nN1  - ${IDENTITY_TEXT}\nER  - \n`;
}

function csl(record) {
  return {
    id: citationKey(record),
    type: record.type === 'text' ? 'book' : 'webpage',
    title: record.title,
    author: [{ family: 'Thakur', given: 'Gajendra' }],
    'container-title': 'Videha Digital Research Archive: Mithila–Vajji–Anga',
    publisher: JOURNAL,
    issued: { 'date-parts': [[2026]] },
    URL: record.url,
    ISSN,
    ...(record.isbn ? { ISBN: record.isbn } : {}),
    note: IDENTITY_TEXT,
  };
}

function replaceNamedMeta(html, name, content) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`<meta\\b[^>]*\\bname=["']${escaped}["'][^>]*>`, 'gi'), '');
  if (!html.includes('</head>')) throw new Error(`Cannot add ${name}: missing </head>`);
  return html.replace('</head>', `<meta name="${name}" content="${String(content).replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"/></head>`);
}

function addRelatedLink(html, href) {
  if (html.includes(`rel="related" href="${href}"`) || html.includes(`href="${href}" rel="related"`)) return html;
  if (!html.includes('</head>')) throw new Error('Cannot add related link: missing </head>');
  return html.replace('</head>', `<link rel="related" href="${href}"/></head>`);
}

const libraryPath = path.join(ROOT, 'app', 'library-data.json');
const library = JSON.parse(readFileSync(libraryPath, 'utf8'));
const libraryIsbnByTitle = new Map(
  library
    .map((work) => [normalizeTitle(work.title), isbnFromExtent(work.extent)])
    .filter(([, isbn]) => Boolean(isbn)),
);

const recordsPath = path.join(OUT, 'records-index.json');
const records = existsSync(recordsPath) ? JSON.parse(readFileSync(recordsPath, 'utf8')) : [];
const recordIsbnByHtmlPath = new Map();
let citationRecordsUpdated = 0;
let isbnCitationRecords = 0;

for (const record of records) {
  if (record.type === 'text') {
    const isbn = libraryIsbnByTitle.get(normalizeTitle(record.title)) ?? null;
    if (isbn) {
      record.isbn = isbn;
      recordIsbnByHtmlPath.set(`records/text/${record.id}/index.html`, isbn);
      isbnCitationRecords += 1;
    }
  }

  const base = path.join(OUT, 'records', record.type, record.id);
  if (!existsSync(base)) continue;
  writeFileSync(path.join(base, 'citation.bib'), bibtex(record), 'utf8');
  writeFileSync(path.join(base, 'citation.ris'), ris(record), 'utf8');
  writeFileSync(path.join(base, 'citation.csl.json'), `${JSON.stringify(csl(record), null, 2)}\n`, 'utf8');

  const page = path.join(base, 'index.html');
  if (existsSync(page)) {
    let html = readFileSync(page, 'utf8');
    const citation = citationText(record);
    html = html.replace(
      /(<section class="card"><h2>Cite this record<\/h2><p>)[\s\S]*?(<\/p><div class="actions">)/,
      `$1${escapeHtml(citation)}$2`,
    );
    writeFileSync(page, html, 'utf8');
  }
  citationRecordsUpdated += 1;
}
if (records.length) writeFileSync(recordsPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

function isbnContext(relativePath) {
  const rel = relativePath.replaceAll('\\', '/');
  const recordIsbn = recordIsbnByHtmlPath.get(rel);
  if (recordIsbn) return { pageIsbn: recordIsbn, parentIsbn: null, parentTitle: null };
  if (/^(?:en\/)?history(?:\/index)?\.html$/.test(rel) || /^(?:en\/)?history\/index\.html$/.test(rel)) {
    return { pageIsbn: '978-93-344-9415-0', parentIsbn: null, parentTitle: 'History of Mithila, Vajji & Anga' };
  }
  if (/^(?:en\/)?literature(?:\/index)?\.html$/.test(rel) || /^(?:en\/)?literature\/index\.html$/.test(rel)) {
    return { pageIsbn: '978-93-5812-486-6', parentIsbn: null, parentTitle: 'A Parallel History of Mithilā & Maithilī Literature' };
  }
  const canonicalPanji = rel.match(/^decoding-panji\/vol-(i|ii|iii|iv|v|vi)\/[^/]+\/index\.html$/i);
  if (canonicalPanji) {
    const workId = panjiRomanToWork.get(canonicalPanji[1].toLowerCase());
    const parentIsbn = parentIsbnByWork.get(workId) ?? null;
    return { pageIsbn: null, parentIsbn, parentTitle: workId };
  }
  const match = rel.match(/(?:^|\/)(?:philosophy|literature|panji)\/([^/]+)\//);
  if (!match) return { pageIsbn: null, parentIsbn: null, parentTitle: null };
  const parentIsbn = parentIsbnByWork.get(match[1]) ?? null;
  return { pageIsbn: null, parentIsbn, parentTitle: match[1] };
}

const allFiles = walk(OUT);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
let identityInserted = 0;
let pageIsbnCount = 0;
let parentIsbnCount = 0;

for (const file of htmlFiles) {
  const relative = path.relative(OUT, file);
  let html = readFileSync(file, 'utf8');

  html = replaceNamedMeta(html, 'citation_journal_title', JOURNAL);
  html = replaceNamedMeta(html, 'citation_issn', ISSN);
  html = replaceNamedMeta(html, 'citation_website_url', VIDEHA_URL);
  html = replaceNamedMeta(html, 'citation_mirror_url', MIRROR_URL);
  html = replaceNamedMeta(html, 'citation_archive_network_url', GITHUB_URL);
  html = replaceNamedMeta(html, 'DC.publisher', JOURNAL);
  html = replaceNamedMeta(html, 'DC.identifier', `ISSN ${ISSN}`);
  html = replaceNamedMeta(html, 'DC.relation', `${VIDEHA_URL} ; ${MIRROR_URL} ; ${GITHUB_URL}`);
  html = addRelatedLink(html, VIDEHA_URL);
  html = addRelatedLink(html, MIRROR_URL);
  html = addRelatedLink(html, GITHUB_URL);

  const isbn = isbnContext(relative);
  if (isbn.pageIsbn) {
    html = replaceNamedMeta(html, 'citation_isbn', isbn.pageIsbn);
    pageIsbnCount += 1;
  }
  if (isbn.parentIsbn) {
    html = replaceNamedMeta(html, 'citation_parent_isbn', isbn.parentIsbn);
    html = replaceNamedMeta(html, 'citation_parent_title', isbn.parentTitle ?? 'Parent work');
    parentIsbnCount += 1;
  }

  if (!html.includes('data-videha-identity-style')) {
    html = html.replace('</head>', `${identityStyle}</head>`);
  }
  if (!html.includes('data-videha-publication-identity="true"')) {
    if (!html.includes('</body>')) throw new Error(`Cannot add Videha identity to ${relative}: missing </body>`);
    html = html.replace('</body>', `${identityHtml}</body>`);
    identityInserted += 1;
  }

  writeFileSync(file, html, 'utf8');
}

const identityReport = {
  generatedAt: new Date().toISOString(),
  htmlPages: htmlFiles.length,
  identityInserted,
  citationIdentityMetadata: htmlFiles.length,
  citationRecordsUpdated,
  isbnCitationRecords,
  workLevelIsbnPages: pageIsbnCount,
  parentWorkIsbnPages: parentIsbnCount,
  issn: ISSN,
  primary: VIDEHA_URL,
  mirror: MIRROR_URL,
  archiveNetwork: GITHUB_URL,
  currentArchive: ARCHIVE_URL,
  publisherSourceColumnUsed: false,
};
writeFileSync(path.join(OUT, 'data', 'videha-publication-identity-report.json'), `${JSON.stringify(identityReport, null, 2)}\n`, 'utf8');
console.log(identityReport);
