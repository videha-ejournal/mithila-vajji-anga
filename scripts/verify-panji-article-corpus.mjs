import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const useDist = process.argv.includes('--dist');
const inventoryPath = 'app/generated/panji-article-inventory.json';
const root = useDist ? 'dist/client' : 'public';
const corpusRoot = join(root, 'research-articles', 'decoding-panji');
const sitemapPath = join(root, 'sitemap.xml');
const expected = { 1: 20, 2: 38, 3: 32, 4: 87, 5: 40, 6: 30 };
const expectedTotal = Object.values(expected).reduce((a, b) => a + b, 0);

if (!existsSync(inventoryPath)) throw new Error(`Missing ${inventoryPath}.`);
if (!existsSync(corpusRoot)) throw new Error(`Missing ${corpusRoot}.`);
const records = JSON.parse(readFileSync(inventoryPath, 'utf8'));
if (!Array.isArray(records) || records.length !== expectedTotal) {
  throw new Error(`Decoding Panji must contain exactly ${expectedTotal} formal chapter records; found ${Array.isArray(records) ? records.length : 'invalid inventory'}.`);
}

const countsByVolume = {};
const chapterSets = {};
const stableIds = new Set();
const canonicals = new Set();
const routes = new Set();
const forbiddenPlaceholders = /\b(?:TODO|TBD|LOREM IPSUM|PLACEHOLDER)\b/i;

for (const record of records) {
  for (const field of ['stable_id', 'volume', 'chapter', 'title', 'language', 'route', 'canonical', 'source_file', 'source_book', 'source_volume', 'source_html', 'source_pdf', 'source_pages', 'source_locator', 'source_repository', 'source_commit', 'kind']) {
    if (record[field] === undefined || record[field] === null || record[field] === '') throw new Error(`Missing ${field}: ${JSON.stringify(record)}`);
  }
  if (record.kind !== 'chapter') throw new Error(`Non-chapter Panji HTML record is forbidden: ${record.stable_id} (${record.kind})`);
  if (record.language !== 'en') throw new Error(`Decoding Panji record is not English: ${record.stable_id}`);
  if (!Number.isInteger(record.volume) || !expected[record.volume]) throw new Error(`Invalid volume: ${record.stable_id}`);
  if (!Number.isInteger(record.chapter) || record.chapter < 1 || record.chapter > expected[record.volume]) throw new Error(`Invalid chapter number: ${record.stable_id}`);
  const wantedRoute = `research-articles/decoding-panji/volume-${record.volume}/chapter-${String(record.chapter).padStart(2, '0')}`;
  if (record.route !== wantedRoute) throw new Error(`Chapter route mismatch: ${record.stable_id} => ${record.route}; expected ${wantedRoute}`);
  if (record.stable_id !== `panji-v${record.volume}-ch${String(record.chapter).padStart(2, '0')}`) throw new Error(`Stable ID is not chapter-derived: ${record.stable_id}`);
  if (!/^[0-9a-f]{40}$/i.test(record.source_commit)) throw new Error(`Invalid source commit: ${record.stable_id}`);
  if (record.source_repository !== 'videha-ejournal/videha-ejournal') throw new Error(`Unexpected source repository: ${record.stable_id}`);
  if (!record.source_html.includes(`/blob/${record.source_commit}/`)) throw new Error(`Source object is not commit-pinned: ${record.stable_id}`);
  if (!record.source_pdf.includes(`/${record.source_commit}/`)) throw new Error(`Source PDF is not commit-pinned: ${record.stable_id}`);
  if (record.article_pdf !== null) throw new Error(`Article-level PDF must remain null: ${record.stable_id}`);
  if (forbiddenPlaceholders.test(record.title) || forbiddenPlaceholders.test(record.source_locator)) throw new Error(`Placeholder text in record: ${record.stable_id}`);
  if (stableIds.has(record.stable_id) || canonicals.has(record.canonical) || routes.has(record.route)) throw new Error(`Duplicate Decoding Panji identity: ${record.stable_id}`);
  stableIds.add(record.stable_id); canonicals.add(record.canonical); routes.add(record.route);
  countsByVolume[record.volume] = (countsByVolume[record.volume] ?? 0) + 1;
  chapterSets[record.volume] ??= new Set();
  if (chapterSets[record.volume].has(record.chapter)) throw new Error(`Duplicate Volume ${record.volume} Chapter ${record.chapter}`);
  chapterSets[record.volume].add(record.chapter);

  const filePath = join(root, record.route, 'index.html');
  if (!existsSync(filePath)) throw new Error(`Missing Decoding Panji chapter HTML: ${filePath}`);
  if (statSync(filePath).size < 1200) throw new Error(`Chapter HTML is unexpectedly small: ${filePath}`);
  const page = readFileSync(filePath, 'utf8');
  for (const required of [
    '<!doctype html>',
    '<meta name="citation_title"',
    '<meta name="citation_author" content="Gajendra Thakur">',
    '<meta name="citation_public_url"',
    '<meta name="citation_language" content="en">',
    '"@type": "Chapter"',
    '"@type": "Book"',
    `data-panji-article-id="${record.stable_id}"`,
    `data-panji-chapter="${record.chapter}"`,
    `<link rel="canonical" href="${record.canonical}">`,
    record.source_pdf,
    'Source-derived chapter text',
  ]) if (!page.includes(required)) throw new Error(`Missing required chapter marker in ${filePath}: ${required}`);
  for (const forbidden of ['citation_journal_title', 'citation_issn', 'citation_pdf_url', 'citation_doi']) {
    if (page.includes(forbidden)) throw new Error(`Book-derived chapter incorrectly emits ${forbidden}: ${filePath}`);
  }
  if (!page.includes('</html>')) throw new Error(`Malformed HTML: ${filePath}`);
  const sourceBodyMatch = page.match(/<pre>([\s\S]*?)<\/pre>/);
  if (!sourceBodyMatch || sourceBodyMatch[1].trim().length < 400) throw new Error(`Missing/substantial source-derived chapter body: ${filePath}`);
  // Placeholder guards apply to generator-controlled markup, metadata and navigation.
  // The preserved source body may legitimately discuss a “placeholder” as a scholarly term.
  const generatedMarkup = page.replace(/<pre>[\s\S]*?<\/pre>/, '<pre></pre>');
  if (forbiddenPlaceholders.test(generatedMarkup)) throw new Error(`Placeholder text in generated chapter markup: ${filePath}`);
}

for (const [volumeText, count] of Object.entries(expected)) {
  const volume = Number(volumeText);
  if (countsByVolume[volume] !== count) throw new Error(`Volume ${volume}: expected ${count} chapter pages, found ${countsByVolume[volume] ?? 0}.`);
  for (let chapter = 1; chapter <= count; chapter += 1) if (!chapterSets[volume].has(chapter)) throw new Error(`Volume ${volume} is missing formal Chapter ${chapter}.`);
}

const indexPath = join(corpusRoot, 'index.html');
const manifestPath = join(corpusRoot, 'manifest.json');
const publicInventoryPath = join(corpusRoot, 'inventory.json');
for (const requiredPath of [indexPath, manifestPath, publicInventoryPath]) if (!existsSync(requiredPath)) throw new Error(`Missing Decoding Panji corpus file: ${requiredPath}`);
const indexHtml = readFileSync(indexPath, 'utf8');
for (const record of records) if (!indexHtml.includes(record.canonical)) throw new Error(`Corpus index omits chapter link: ${record.canonical}`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.articleCount !== records.length) throw new Error(`Manifest count ${manifest.articleCount} does not match chapter inventory ${records.length}.`);
if (!/^[0-9a-f]{40}$/i.test(manifest.sourceCommit ?? '')) throw new Error('Manifest source commit is missing or invalid.');
const publicInventory = JSON.parse(readFileSync(publicInventoryPath, 'utf8'));
if (!Array.isArray(publicInventory) || publicInventory.length !== records.length) throw new Error('Public Decoding Panji inventory is incomplete.');

const countHtml = (directory) => readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
  const full = join(directory, entry.name);
  if (entry.isDirectory()) return total + countHtml(full);
  return total + (entry.isFile() && entry.name === 'index.html' ? 1 : 0);
}, 0);
const htmlCount = countHtml(corpusRoot);
if (htmlCount !== records.length + 1) throw new Error(`Expected ${records.length + 1} Decoding Panji HTML files including corpus index; found ${htmlCount}.`);

if (useDist) {
  for (const homepage of [join(root, 'index.html'), join(root, 'en', 'index.html')]) {
    if (!existsSync(homepage)) throw new Error(`Missing homepage for Panji verification: ${homepage}`);
    const page = readFileSync(homepage, 'utf8');
    if (!page.includes('data-decoding-panji-directory="true"')) throw new Error(`Decoding Panji directory marker missing from ${homepage}`);
    if (!page.includes(`data-panji-article-count="${records.length}"`)) throw new Error(`Decoding Panji count marker mismatch in ${homepage}`);
    for (const record of records) if (!page.includes(`href="${record.canonical}"`)) throw new Error(`Homepage omits Decoding Panji chapter ${record.canonical}: ${homepage}`);
  }
  if (!existsSync(sitemapPath)) throw new Error('Sitemap is missing in dist verification.');
  const sitemap = readFileSync(sitemapPath, 'utf8');
  for (const record of records) if (!sitemap.includes(`<loc>${record.canonical}</loc>`)) throw new Error(`Sitemap omits ${record.canonical}`);
}

console.log(`Decoding Panji chapter corpus PASS (${useDist ? 'dist' : 'public'})`, { total: records.length, countsByVolume });
