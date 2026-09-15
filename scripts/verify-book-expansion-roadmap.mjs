import { existsSync, readFileSync } from 'node:fs';

const INVENTORY = 'dist/client/source-library/article-expansion-inventory.json';
const ROADMAP_HTML = 'dist/client/source-library/article-expansion-roadmap.html';
const ROADMAP_TSV = 'dist/client/source-library/article-expansion-roadmap.tsv';
const SOURCE_LIBRARY_INDEX = 'dist/client/source-library/index.html';
const EXPECTED_CORE_ARTICLES = 522;

function requireFile(file) {
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
  return readFileSync(file, 'utf8');
}

const inventory = JSON.parse(requireFile(INVENTORY));
const html = requireFile(ROADMAP_HTML);
const tsv = requireFile(ROADMAP_TSV);
const sourceIndex = requireFile(SOURCE_LIBRARY_INDEX);
const items = Array.isArray(inventory.items) ? inventory.items : [];
const errors = [];

if (!items.length) errors.push('Expansion inventory has no source items.');
if (inventory.certifiedCoreArticleCount !== EXPECTED_CORE_ARTICLES) {
  errors.push(`Certified core must remain ${EXPECTED_CORE_ARTICLES}; found ${inventory.certifiedCoreArticleCount}.`);
}

const sourceCountMarker = `data-source-count="${items.length}"`;
if (!html.includes(sourceCountMarker)) errors.push(`Roadmap HTML lacks ${sourceCountMarker}.`);
if (!html.includes(`<strong>${EXPECTED_CORE_ARTICLES} scholarly article editions</strong>`)) {
  errors.push(`Roadmap HTML does not explicitly freeze the certified core at ${EXPECTED_CORE_ARTICLES}.`);
}
if (!html.includes('Inventory / roadmap only.')) errors.push('Roadmap HTML lacks the non-publication warning.');
if (!html.includes('No source is split mechanically by page count.')) errors.push('Roadmap HTML lacks the mechanical-splitting prohibition.');
if (!html.includes('article-expansion-inventory.json')) errors.push('Roadmap HTML lacks the machine-readable inventory link.');
if (!html.includes('article-expansion-roadmap.tsv')) errors.push('Roadmap HTML lacks the TSV link.');

const renderedRows = (html.match(/data-source-row="true"/g) ?? []).length;
if (renderedRows !== items.length) errors.push(`Roadmap HTML row count mismatch: ${renderedRows} vs ${items.length}.`);

for (const item of items) {
  if (!html.includes(`<code>${String(item.filename).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')}</code>`)) {
    errors.push(`Roadmap HTML is missing source filename: ${item.filename}`);
  }
  if (!html.includes(item.pinnedSourceUrl)) errors.push(`Roadmap HTML lacks pinned source URL for ${item.filename}`);
}

const lines = tsv.trimEnd().split('\n');
if (lines.length !== items.length + 1) errors.push(`TSV row count mismatch: ${lines.length - 1} vs ${items.length}.`);
const header = lines[0]?.split('\t') ?? [];
for (const required of ['status','filename','confirmed_units','published_articles','duplicate_of','publication_rule','pinned_source_url','git_blob_sha']) {
  if (!header.includes(required)) errors.push(`TSV header is missing ${required}.`);
}
const filenameIndex = header.indexOf('filename');
const statusIndex = header.indexOf('status');
const articleIndex = header.indexOf('published_articles');
if (filenameIndex >= 0) {
  const rows = lines.slice(1).map((line) => line.split('\t'));
  const filenames = new Set(rows.map((row) => row[filenameIndex]));
  if (filenames.size !== items.length) errors.push(`TSV does not contain ${items.length} unique source filenames.`);
  for (const item of items) if (!filenames.has(item.filename)) errors.push(`TSV is missing ${item.filename}.`);
  if (statusIndex >= 0 && articleIndex >= 0) {
    for (const row of rows) {
      if (row[statusIndex] !== 'published-core' && row[articleIndex]) {
        errors.push(`TSV gives a published article count to non-core source ${row[filenameIndex]}.`);
      }
    }
  }
}

if (!sourceIndex.includes('article-expansion-roadmap.html')) errors.push('Source PDF Library does not link the expansion roadmap.');
if (!sourceIndex.includes('article-expansion-inventory.json')) errors.push('Source PDF Library does not link the expansion inventory.');

if (errors.length) {
  console.error(`Book expansion roadmap verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Book expansion roadmap verified: ${items.length} source rows, ${EXPECTED_CORE_ARTICLES} certified core articles, HTML + TSV + source-library links consistent.`);
