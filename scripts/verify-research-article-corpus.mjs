import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const inventoryPath = 'app/generated/research-article-inventory.json';
const publicRoot = 'public';
const expected = {
  historyV1: 28,
  historyV2: 150,
  philosophyV1Mai: 72,
  philosophyV1En: 72,
  philosophyV2Mai: 100,
  philosophyV2En: 100,
  total: 522,
};

if (!existsSync(inventoryPath)) throw new Error(`Missing ${inventoryPath}.`);
const records = JSON.parse(readFileSync(inventoryPath, 'utf8'));
if (!Array.isArray(records)) throw new Error('Research article inventory must be an array.');
if (records.length !== expected.total) throw new Error(`Expected ${expected.total} article records, found ${records.length}.`);

const count = (fn) => records.filter(fn).length;
const checks = {
  historyV1: count((r) => r.series === 'history' && r.volume === 1),
  historyV2: count((r) => r.series === 'history' && r.volume === 2),
  philosophyV1Mai: count((r) => r.series === 'philosophy' && r.volume === 1 && r.language === 'mai'),
  philosophyV1En: count((r) => r.series === 'philosophy' && r.volume === 1 && r.language === 'en'),
  philosophyV2Mai: count((r) => r.series === 'philosophy' && r.volume === 2 && r.language === 'mai'),
  philosophyV2En: count((r) => r.series === 'philosophy' && r.volume === 2 && r.language === 'en'),
};
for (const [key, value] of Object.entries(checks)) {
  if (value !== expected[key]) throw new Error(`${key}: expected ${expected[key]}, found ${value}.`);
}

const canonicals = new Set();
const routes = new Set();
const pairKeys = new Set();
let ocrCount = 0;
for (const record of records) {
  for (const field of ['series','volume','chapter','title','language','route','canonical','source_pdf','source_html','source_book']) {
    if (record[field] === undefined || record[field] === null || record[field] === '') throw new Error(`Missing ${field} in ${JSON.stringify(record)}`);
  }
  if (record.language === 'hi') throw new Error(`Hindi was incorrectly asserted for ${record.route}; the source books are Maithili–English.`);
  if (canonicals.has(record.canonical)) throw new Error(`Duplicate canonical: ${record.canonical}`);
  if (routes.has(record.route)) throw new Error(`Duplicate route: ${record.route}`);
  canonicals.add(record.canonical);
  routes.add(record.route);

  const path = join(publicRoot, record.route, 'index.html');
  if (!existsSync(path)) throw new Error(`Missing article HTML: ${path}`);
  if (statSync(path).size < 2500) throw new Error(`Article HTML is unexpectedly small: ${path}`);
  const html = readFileSync(path, 'utf8');
  for (const required of [
    '<meta name="citation_author" content="Gajendra Thakur">',
    '<meta name="citation_title"',
    '<meta name="citation_publication_date" content="2026/09/15">',
    '<meta name="citation_journal_title"',
    '<meta name="citation_issn" content="2229-547X">',
    '<meta name="citation_public_url"',
    '<meta name="citation_language"',
    '<meta name="citation_pdf_url"',
    '"@type": "ScholarlyArticle"',
    '10.5281/zenodo.22754977',
    'this DOI identifies the repository/archive record, not this individual article',
    '<h2 id="article-text-heading">Full chapter text</h2>',
  ]) {
    if (!html.includes(required)) throw new Error(`Missing required scholarly marker in ${path}: ${required}`);
  }
  if (html.includes('citation_doi')) throw new Error(`Archive DOI must not be emitted as an article DOI: ${path}`);
  if (!html.includes(`<link rel="canonical" href="${record.canonical}">`)) throw new Error(`Canonical mismatch: ${path}`);
  if (!html.includes(record.source_pdf)) throw new Error(`Source PDF link missing: ${path}`);

  if (record.series === 'philosophy') {
    const key = `${record.volume}:${record.chapter}`;
    pairKeys.add(key);
    const mai = records.find((r) => r.series === 'philosophy' && r.volume === record.volume && r.chapter === record.chapter && r.language === 'mai');
    const en = records.find((r) => r.series === 'philosophy' && r.volume === record.volume && r.chapter === record.chapter && r.language === 'en');
    if (!mai || !en) throw new Error(`Missing bilingual philosophy pair ${key}.`);
    if (!html.includes(`hreflang="mai" href="${mai.canonical}"`) || !html.includes(`hreflang="en" href="${en.canonical}"`)) {
      throw new Error(`Reciprocal hreflang missing for ${path}`);
    }
  }

  if (record.ocr) {
    ocrCount += 1;
    if (!(record.series === 'philosophy' && record.volume === 1 && record.language === 'mai')) {
      throw new Error(`OCR provenance appeared outside Philosophy Volume I Maithili: ${path}`);
    }
    for (const corrupt of ['दर्मन की अजि', 'प्रश्न, संर्य आ प्रिाण']) {
      if (html.includes(corrupt)) throw new Error(`Known corrupt legacy text-layer form leaked into OCR article: ${path}`);
    }
  }
}

if (pairKeys.size !== 172) throw new Error(`Expected 172 bilingual philosophy chapter pairs, found ${pairKeys.size}.`);
if (ocrCount !== 72) throw new Error(`Expected OCR provenance on exactly 72 Philosophy Volume I Maithili articles, found ${ocrCount}.`);
if (!existsSync('public/research-articles/index.html')) throw new Error('Research article master index is missing.');
const index = readFileSync('public/research-articles/index.html', 'utf8');
if (!index.includes('522 full-text chapter article editions')) throw new Error('Research article index does not certify the 522-page corpus.');

console.log('Research article corpus PASS', { ...checks, bilingualPairs: pairKeys.size, ocrVolume1Maithili: ocrCount, total: records.length });
