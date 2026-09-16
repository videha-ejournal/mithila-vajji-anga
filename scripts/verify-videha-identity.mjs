import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist', 'client');
const VIDEHA_URL = 'https://www.videha.co.in/';
const MIRROR_URL = 'https://videha-ejournal.github.io/videha/';
const GITHUB_URL = 'https://github.com/videha-ejournal';
const ISSN = '2229-547X';
const PANJI_PARENT_ISBNS = new Set([
  '978-93-5915-894-5',
  '978-93-6012-526-4',
  '978-93-6068-808-0',
  '978-93-6123-509-2',
  '978-93-5933-373-1',
  '978-93-5933-623-7',
]);

const fail = (message) => { throw new Error(`[Videha identity] ${message}`); };

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

if (!existsSync(OUT)) fail('dist/client does not exist');
const files = walk(OUT);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
if (htmlFiles.length < 1) fail('no exported HTML pages found');

let bookDerivedPanjiPages = 0;
for (const file of htmlFiles) {
  const rel = path.relative(OUT, file);
  const normalizedRel = rel.replaceAll('\\', '/');
  const bookDerivedPanji = normalizedRel.startsWith('decoding-panji/');
  const html = readFileSync(file, 'utf8');
  for (const marker of [
    'data-videha-publication-identity="true"',
    VIDEHA_URL,
    MIRROR_URL,
    GITHUB_URL,
    `ISSN ${ISSN}`,
    'name="citation_website_url" content="https://www.videha.co.in/"',
    'name="citation_mirror_url" content="https://videha-ejournal.github.io/videha/"',
    'name="citation_archive_network_url" content="https://github.com/videha-ejournal"',
  ]) {
    if (!html.includes(marker)) fail(`${rel} missing ${marker}`);
  }

  if (bookDerivedPanji) {
    bookDerivedPanjiPages += 1;
    for (const forbidden of [
      'name="citation_journal_title"',
      'name="citation_issn"',
      'name="citation_pdf_url"',
      'name="citation_doi"',
    ]) {
      if (html.includes(forbidden)) fail(`${rel} incorrectly attaches journal/article metadata ${forbidden} to a book-derived Panji record`);
    }
    if (/name=["']DC\.identifier["'][^>]*ISSN/i.test(html)) fail(`${rel} incorrectly attaches ISSN as the Dublin Core identifier`);
    if (/^decoding-panji\/vol-(?:i|ii|iii|iv|v|vi)\/[^/]+\/index\.html$/i.test(normalizedRel)) {
      const parentIsbn = html.match(/name=["']citation_parent_isbn["'][^>]*content=["']([^"']+)["']/i)?.[1]
        ?? html.match(/content=["']([^"']+)["'][^>]*name=["']citation_parent_isbn["']/i)?.[1]
        ?? '';
      if (!PANJI_PARENT_ISBNS.has(parentIsbn)) fail(`${rel} is missing its authoritative Decoding Panji parent-volume ISBN`);
    }
  } else if (!html.includes('name="citation_issn" content="2229-547X"')) {
    fail(`${rel} missing name="citation_issn" content="2229-547X"`);
  }
}
if (bookDerivedPanjiPages !== 248) fail(`Expected 248 book-derived Panji HTML pages (247 chapters + collection index), found ${bookDerivedPanjiPages}`);

const citationFiles = files.filter((file) => /citation\.(?:bib|ris|csl\.json)$/.test(file));
if (citationFiles.length < 1) fail('no generated citation downloads found');
for (const file of citationFiles) {
  const rel = path.relative(OUT, file);
  const text = readFileSync(file, 'utf8');
  for (const marker of [VIDEHA_URL, MIRROR_URL, GITHUB_URL, ISSN]) {
    if (!text.includes(marker)) fail(`${rel} missing publication identity marker ${marker}`);
  }
}

const historyCandidates = [
  path.join(OUT, 'history', 'index.html'),
  path.join(OUT, 'history.html'),
].filter(existsSync);
if (historyCandidates.length < 1) fail('History landing page is missing');
for (const file of historyCandidates) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('name="citation_isbn" content="978-93-344-9415-0"')) {
    fail(`${path.relative(OUT, file)} missing authoritative History work ISBN`);
  }
}

const chapterFiles = htmlFiles.filter((file) => /[\\/]chapters[\\/]/.test(file));
for (const file of chapterFiles) {
  const html = readFileSync(file, 'utf8');
  if (html.includes('name="citation_isbn" content="978-93-344-9415-0"')) {
    fail(`${path.relative(OUT, file)} incorrectly assigns the History work ISBN to an individual chapter`);
  }
}

const atmaFiles = htmlFiles.filter((file) => /[\\/]philosophy[\\/]atmatattvaviveka[\\/]/.test(file));
for (const file of atmaFiles) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('name="citation_parent_isbn" content="978-93-5943-857-3"')) {
    fail(`${path.relative(OUT, file)} missing Ātmatattvaviveka parent-work ISBN`);
  }
}

const isbnExport = path.join(OUT, 'data', 'videha-isbn-authority.json');
if (existsSync(isbnExport)) {
  const authority = JSON.parse(readFileSync(isbnExport, 'utf8'));
  if (!Array.isArray(authority.excludedSourceColumns) ||
      !authority.excludedSourceColumns.includes('Name of Publishing Agency/Publisher')) {
    fail('ISBN authority export no longer records publisher source-column exclusion');
  }
  if (!Array.isArray(authority.records) || authority.records.length !== 293) {
    fail('ISBN authority export must contain exactly 293 records');
  }
  for (const record of authority.records) {
    if (Object.hasOwn(record, 'publisher') ||
        Object.hasOwn(record, 'publishingAgency') ||
        Object.hasOwn(record, 'Name of Publishing Agency/Publisher')) {
      fail(`ISBN authority record ${record.isbn ?? 'unknown'} contains an excluded publisher-source field`);
    }
  }
}

console.log({
  htmlPagesVerified: htmlFiles.length,
  citationFilesVerified: citationFiles.length,
  videhaIdentity: 'verified-on-every-exported-page',
  issn: ISSN,
  bookDerivedPanjiPages,
  bookDerivedPanjiJournalMetadata: false,
  canonicalPanjiParentVolumeIsbn: true,
  historyWorkIsbn: '978-93-344-9415-0',
  historyChapterIsbnPropagation: false,
  atmatattvavivekaParentIsbn: atmaFiles.length ? '978-93-5943-857-3' : 'no-detail-pages-exported',
  publisherSourceColumnUsed: false,
  publisherSourceColumnExclusionAudited: true,
  failClosed: true,
});
