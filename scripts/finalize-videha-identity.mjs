import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist', 'client');
const VIDEHA_URL = 'https://www.videha.co.in/';
const MIRROR_URL = 'https://videha-ejournal.github.io/videha/';
const GITHUB_URL = 'https://github.com/videha-ejournal';
const ISSN = '2229-547X';
const JOURNAL = 'Videha — First Maithili Fortnightly eJournal';

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

const identityHtml = `<aside class="videha-publication-identity" data-videha-publication-identity="true" aria-label="Videha publication identity"><strong>Videha</strong><span aria-hidden="true"> · </span><a href="${VIDEHA_URL}">${VIDEHA_URL}</a><span aria-hidden="true"> · </span><span>ISSN ${ISSN}</span><span aria-hidden="true"> · </span><span>GitHub mirror:</span> <a href="${MIRROR_URL}">${MIRROR_URL}</a><span aria-hidden="true"> · </span><span>Digital Research Archives on GitHub:</span> <a href="${GITHUB_URL}">${GITHUB_URL}</a></aside>`;
const identityStyle = `<style data-videha-identity-style>.videha-publication-identity{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.25rem .45rem;padding:.48rem clamp(.8rem,3vw,2rem);border-top:1px solid #ddcfaa;border-bottom:1px solid #ddcfaa;background:#fff8e6;color:#29323c;font:700 .78rem/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center}.videha-publication-identity strong{color:#7b241c}.videha-publication-identity a{color:#174c7d;text-decoration-thickness:1.5px;text-underline-offset:2px;overflow-wrap:anywhere}.videha-publication-identity a:focus-visible{outline:3px solid #e39b45;outline-offset:2px}@media print{.videha-publication-identity{border:0;background:white;color:#222}}</style>`;

function htmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function replaceNamedMeta(html, name, content) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`<meta\\b[^>]*\\bname=["']${escaped}["'][^>]*>`, 'gi'), '');
  if (!html.includes('</head>')) throw new Error(`Cannot add ${name}: missing </head>`);
  return html.replace('</head>', `<meta name="${name}" content="${content.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"/></head>`);
}

function addRelatedLink(html, href) {
  if (html.includes(`rel="related" href="${href}"`) || html.includes(`href="${href}" rel="related"`)) return html;
  if (!html.includes('</head>')) throw new Error('Cannot add related link: missing </head>');
  return html.replace('</head>', `<link rel="related" href="${href}"/></head>`);
}

function isbnContext(relativePath) {
  const rel = relativePath.replaceAll('\\', '/');
  if (/^(?:en\/)?history(?:\/index)?\.html$/.test(rel) || /^(?:en\/)?history\/index\.html$/.test(rel)) {
    return { pageIsbn: '978-93-344-9415-0', parentIsbn: null, parentTitle: 'History of Mithila, Vajji & Anga' };
  }
  if (/^(?:en\/)?literature(?:\/index)?\.html$/.test(rel) || /^(?:en\/)?literature\/index\.html$/.test(rel)) {
    return { pageIsbn: '978-93-5812-486-6', parentIsbn: null, parentTitle: 'A Parallel History of Mithilā & Maithilī Literature' };
  }
  const match = rel.match(/(?:^|\/)(?:philosophy|literature|panji)\/([^/]+)\//);
  if (!match) return { pageIsbn: null, parentIsbn: null, parentTitle: null };
  const parentIsbn = parentIsbnByWork.get(match[1]) ?? null;
  return { pageIsbn: null, parentIsbn, parentTitle: match[1] };
}

const files = htmlFiles(OUT);
let identityInserted = 0;
let pageIsbnCount = 0;
let parentIsbnCount = 0;

for (const file of files) {
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

console.log({
  htmlPages: files.length,
  identityInserted,
  citationIdentityMetadata: files.length,
  workLevelIsbnPages: pageIsbnCount,
  parentWorkIsbnPages: parentIsbnCount,
  issn: ISSN,
  primary: VIDEHA_URL,
  mirror: MIRROR_URL,
  archiveNetwork: GITHUB_URL,
  publisherSourceColumnUsed: false,
});
