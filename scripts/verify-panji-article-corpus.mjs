import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const useDist = process.argv.includes('--dist');
const inventoryPath = 'app/generated/panji-article-inventory.json';
const root = useDist ? 'dist/client' : 'public';
const corpusRoot = join(root, 'research-articles', 'decoding-panji');
const sitemapPath = join(root, 'sitemap.xml');

if (!existsSync(inventoryPath)) throw new Error(`Missing ${inventoryPath}.`);
if (!existsSync(corpusRoot)) throw new Error(`Missing ${corpusRoot}.`);

const records = JSON.parse(readFileSync(inventoryPath, 'utf8'));
if (!Array.isArray(records) || records.length < 1) throw new Error('Decoding Panji inventory is empty or invalid.');

const countsByVolume = {};
const stableIds = new Set();
const canonicals = new Set();
const routes = new Set();
const forbiddenPlaceholders = /\b(?:TODO|TBD|LOREM IPSUM|PLACEHOLDER)\b/i;

for (const record of records) {
  for (const field of ['stable_id', 'volume', 'title', 'language', 'route', 'canonical', 'source_file', 'source_book', 'source_volume', 'source_html', 'source_pdf', 'source_pages', 'source_locator', 'source_repository', 'source_commit', 'kind']) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      throw new Error(`Missing ${field}: ${JSON.stringify(record)}`);
    }
  }
  if (record.language !== 'en') throw new Error(`Decoding Panji record is not English: ${record.stable_id}`);
  if (!Number.isInteger(record.volume) || record.volume < 1 || record.volume > 6) throw new Error(`Invalid volume: ${record.stable_id}`);
  if (!/^[0-9a-f]{40}$/i.test(record.source_commit)) throw new Error(`Invalid source commit: ${record.stable_id}`);
  if (record.source_repository !== 'videha-ejournal/videha-ejournal') throw new Error(`Unexpected source repository: ${record.stable_id}`);
  if (!record.source_html.includes(`/blob/${record.source_commit}/`)) throw new Error(`Source HTML is not commit-pinned: ${record.stable_id}`);
  if (!record.source_pdf.includes(`/${record.source_commit}/`)) throw new Error(`Source PDF is not commit-pinned: ${record.stable_id}`);
  if (record.article_pdf !== null) throw new Error(`Article-level PDF must remain null: ${record.stable_id}`);
  if (forbiddenPlaceholders.test(record.title) || forbiddenPlaceholders.test(record.source_locator)) throw new Error(`Placeholder text in record: ${record.stable_id}`);
  if (stableIds.has(record.stable_id)) throw new Error(`Duplicate stable ID: ${record.stable_id}`);
  if (canonicals.has(record.canonical)) throw new Error(`Duplicate canonical: ${record.canonical}`);
  if (routes.has(record.route)) throw new Error(`Duplicate route: ${record.route}`);
  stableIds.add(record.stable_id);
  canonicals.add(record.canonical);
  routes.add(record.route);
  countsByVolume[String(record.volume)] = (countsByVolume[String(record.volume)] ?? 0) + 1;

  const filePath = join(root, record.route, 'index.html');
  if (!existsSync(filePath)) throw new Error(`Missing Decoding Panji article HTML: ${filePath}`);
  if (statSync(filePath).size < 3000) throw new Error(`Article HTML is unexpectedly small: ${filePath}`);
  const page = readFileSync(filePath, 'utf8');
  for (const required of [
    '<!doctype html>',
    '<meta name="citation_title"',
    '<meta name="citation_author" content="Gajendra Thakur">',
    '<meta name="citation_public_url"',
    '<meta name="citation_language" content="en">',
    '"@type": "ScholarlyArticle"',
    `data-panji-article-id="${record.stable_id}"`,
    `<link rel="canonical" href="${record.canonical}">`,
    record.source_pdf,
    'Source-derived article text',
  ]) {
    if (!page.includes(required)) throw new Error(`Missing required marker in ${filePath}: ${required}`);
  }
  for (const forbidden of ['citation_journal_title', 'citation_issn', 'citation_pdf_url', 'citation_doi']) {
    if (page.includes(forbidden)) throw new Error(`Book-derived record incorrectly emits ${forbidden}: ${filePath}`);
  }
  if (forbiddenPlaceholders.test(page)) throw new Error(`Placeholder text in ${filePath}`);
  if (!page.includes('</html>')) throw new Error(`Malformed HTML terminator missing: ${filePath}`);
}

for (let volume = 1; volume <= 6; volume += 1) {
  if (!countsByVolume[String(volume)]) throw new Error(`Volume ${volume} has no published article records.`);
}
if (countsByVolume['1'] < 10) throw new Error(`Volume I must expose its substantial section structure; found only ${countsByVolume['1']} records.`);
if (!records.some((record) => record.kind === 'appendix')) throw new Error('No substantive Panji appendix/annexure record was published.');

const indexPath = join(corpusRoot, 'index.html');
const manifestPath = join(corpusRoot, 'manifest.json');
const publicInventoryPath = join(corpusRoot, 'inventory.json');
for (const requiredPath of [indexPath, manifestPath, publicInventoryPath]) {
  if (!existsSync(requiredPath)) throw new Error(`Missing Decoding Panji corpus file: ${requiredPath}`);
}
const indexHtml = readFileSync(indexPath, 'utf8');
for (const record of records) {
  if (!indexHtml.includes(record.canonical)) throw new Error(`Corpus index omits article link: ${record.canonical}`);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.articleCount !== records.length) throw new Error(`Manifest count ${manifest.articleCount} does not match inventory ${records.length}.`);
if (!/^[0-9a-f]{40}$/i.test(manifest.sourceCommit ?? '')) throw new Error('Manifest source commit is missing or invalid.');
const publicInventory = JSON.parse(readFileSync(publicInventoryPath, 'utf8'));
if (!Array.isArray(publicInventory) || publicInventory.length !== records.length) throw new Error('Public Decoding Panji inventory is incomplete.');

const countHtml = (directory) => readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
  const full = join(directory, entry.name);
  if (entry.isDirectory()) return total + countHtml(full);
  return total + (entry.isFile() && entry.name === 'index.html' ? 1 : 0);
}, 0);
const htmlCount = countHtml(corpusRoot);
if (htmlCount !== records.length + 1) throw new Error(`Expected ${records.length + 1} Decoding Panji HTML files including the corpus index, found ${htmlCount}.`);

if (useDist) {
  for (const homepage of [join(root, 'index.html'), join(root, 'en', 'index.html')]) {
    if (!existsSync(homepage)) throw new Error(`Missing homepage for Panji link verification: ${homepage}`);
    const page = readFileSync(homepage, 'utf8');
    if (!page.includes('data-decoding-panji-directory="true"')) throw new Error(`Decoding Panji directory marker missing from ${homepage}`);
    if (!page.includes(`data-panji-article-count="${records.length}"`)) throw new Error(`Decoding Panji count marker mismatch in ${homepage}`);
    for (const record of records) {
      if (!page.includes(`href="${record.canonical}"`)) throw new Error(`Homepage omits Decoding Panji link ${record.canonical}: ${homepage}`);
    }
  }
  if (!existsSync(sitemapPath)) throw new Error('Sitemap is missing in dist verification.');
  const sitemap = readFileSync(sitemapPath, 'utf8');
  for (const record of records) {
    if (!sitemap.includes(`<loc>${record.canonical}</loc>`)) throw new Error(`Sitemap omits ${record.canonical}`);
  }
}

console.log(`Decoding Panji article corpus PASS (${useDist ? 'dist' : 'public'})`, {
  total: records.length,
  countsByVolume,
  appendices: records.filter((record) => record.kind === 'appendix').length,
});
