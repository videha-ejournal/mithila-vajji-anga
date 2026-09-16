import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('dist/client');
const PANJI_ROOT = path.join(OUT, 'research-articles', 'decoding-panji');

if (!existsSync(PANJI_ROOT)) throw new Error('Decoding Panji output is missing before book-metadata finalization.');

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function removeNamedMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`\\s*<meta\\b[^>]*\\bname=["']${escaped}["'][^>]*>`, 'gi'), '');
}

const files = walk(PANJI_ROOT);
if (files.length < 2) throw new Error(`Expected a Decoding Panji directory plus article pages, found ${files.length} HTML file(s).`);

let cleaned = 0;
for (const file of files) {
  let html = readFileSync(file, 'utf8');
  for (const name of ['citation_journal_title', 'citation_issn', 'citation_pdf_url', 'citation_doi', 'DC.identifier', 'DC.publisher']) {
    html = removeNamedMeta(html, name);
  }
  if (/name=["']citation_(?:journal_title|issn|pdf_url|doi)["']/i.test(html)) {
    throw new Error(`Unsupported book-derived citation metadata remains in ${path.relative(OUT, file)}.`);
  }
  if (/name=["']DC\.identifier["'][^>]*ISSN/i.test(html) || /name=["']DC\.publisher["'][^>]*First Maithili Fortnightly/i.test(html)) {
    throw new Error(`Unsupported journal bibliographic identity remains in ${path.relative(OUT, file)}.`);
  }
  writeFileSync(file, html, 'utf8');
  cleaned += 1;
}

console.log({
  status: 'decoding-panji-book-metadata-finalized',
  htmlFiles: cleaned,
  journalHighwireMetadataAttached: false,
  articlePdfMetadataAttached: false,
  articleDoiMetadataAttached: false,
  visibleVidehaInstitutionalIdentityPreserved: true,
});
