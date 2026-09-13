import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SITE = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const sourceRoot = 'public/books';
const outputRoot = 'dist/client/source-library';
const sitemapPath = 'dist/client/sitemap.xml';

const walk = (directory) =>
  existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      })
    : [];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll(String.fromCharCode(34), '&quot;');

const titleFromFilename = (filename) =>
  path.basename(filename, path.extname(filename))
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim();

const encodePath = (value) => value.split('/').map(encodeURIComponent).join('/');
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

const pdfs = walk(sourceRoot).filter((file) => file.toLowerCase().endsWith('.pdf'));
const books = pdfs.map((file) => {
  const relative = path.relative(sourceRoot, file).replaceAll(path.sep, '/');
  const bytes = statSync(file).size;
  return {
    id: relative.replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title: titleFromFilename(relative),
    filename: relative,
    mediaType: 'application/pdf',
    bytes,
    sha256: sha256(file),
    url: `${SITE}books/${encodePath(relative)}`,
  };
});

mkdirSync(outputRoot, { recursive: true });
const catalog = {
  name: 'Videha Digital Research Archive · Source PDF Library',
  description: 'Machine-readable catalogue of source PDFs published with the Videha Digital Research Archive.',
  generatedAt: new Date().toISOString(),
  archive: SITE,
  count: books.length,
  books,
};
writeFileSync(path.join(outputRoot, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
writeFileSync(
  path.join(outputRoot, 'SHA256SUMS.txt'),
  books.map((book) => `${book.sha256}  ${book.filename}`).join('\n') + (books.length ? '\n' : ''),
);

const rows = books.length
  ? books.map((book) => `
      <article class="book">
        <h2><a href="${escapeHtml(book.url)}">${escapeHtml(book.title)}</a></h2>
        <p><code>${escapeHtml(book.filename)}</code></p>
        <dl><dt>Format</dt><dd>PDF</dd><dt>Size</dt><dd>${(book.bytes / 1024 / 1024).toFixed(2)} MB</dd><dt>SHA-256</dt><dd><code>${book.sha256}</code></dd></dl>
      </article>`).join('')
  : `<section class="empty"><h2>PDF source-library infrastructure is ready</h2><p>No repository PDFs are indexed in this build yet. Add PDFs under <code>public/books/</code>; the next verified build will publish stable PDF URLs, a JSON catalogue and SHA-256 checksums automatically.</p></section>`;

const itemList = books.map((book, index) => ({
  '@type': 'ListItem',
  position: index + 1,
  item: {
    '@type': 'DigitalDocument',
    name: book.title,
    encodingFormat: 'application/pdf',
    contentUrl: book.url,
    identifier: `sha256:${book.sha256}`,
  },
}));

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Videha Digital Research Archive · Source PDF Library',
  url: `${SITE}source-library/`,
  isPartOf: { '@type': 'WebSite', name: 'Videha Digital Research Archive', url: SITE },
  mainEntity: { '@type': 'ItemList', numberOfItems: books.length, itemListElement: itemList },
};

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Source PDF Library | Videha Digital Research Archive</title>
<meta name="description" content="Source PDF library and machine-readable PDF catalogue for the Videha Digital Research Archive.">
<link rel="canonical" href="${SITE}source-library/">
<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>
<style>
body{margin:0;background:#fbfaf6;color:#172437;font:17px/1.65 Georgia,"Times New Roman",serif}main{max-width:1000px;margin:auto;padding:3rem 1.2rem 4rem}h1{font-size:clamp(2.2rem,6vw,4.6rem);line-height:1;color:#0d2742;margin:.4rem 0 1rem}.kicker{font:800 .78rem/1.4 system-ui,sans-serif;letter-spacing:.16em;color:#8c3d24}.subtitle{font-size:1.25rem;font-weight:700;color:#8c3d24}.meta{padding:1rem 0 2rem;border-bottom:1px solid #cbc5b9}.tools{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.2rem 0}.tools a{font:700 .9rem system-ui,sans-serif;color:#174c7d;text-decoration:none;border:1px solid #b8c0c8;border-radius:999px;padding:.5rem .75rem;background:white}.book{padding:1.3rem 0;border-bottom:1px solid #ddd7ca}.book h2{margin:.1rem 0}.book dl{display:grid;grid-template-columns:max-content 1fr;gap:.3rem .8rem}.book dt{font-weight:700}.book dd{margin:0;overflow-wrap:anywhere}code{font:13px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;background:#f1eee7;padding:.1rem .3rem;border-radius:4px}.empty{margin:2rem 0;padding:1.4rem;border:1px solid #d3ccc0;background:white;border-radius:10px}a{color:#174c7d}a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}
</style></head><body><main>
<p class="kicker">VIDEHA DIGITAL RESEARCH ARCHIVE</p><h1>Source PDF Library</h1>
<p class="subtitle">Primary and foundational book objects for the Digital Humanities Research Environment for Mithila, Vajji &amp; Anga</p>
<div class="meta"><p><strong>${books.length}</strong> repository PDF${books.length === 1 ? '' : 's'} indexed. Each indexed file has a stable archive URL, file size and SHA-256 checksum.</p>
<div class="tools"><a href="./catalog.json">Machine-readable catalogue (JSON)</a><a href="./SHA256SUMS.txt">SHA-256 checksums</a><a href="${SITE}about/">About the archive</a><a href="${SITE}records/">Permanent records</a></div></div>
${rows}
<footer><p><a href="${SITE}">← Videha Digital Research Archive</a></p><p>© Gajendra Thakur, Editor, Videha Maithili eJournal · ISSN 2229-547X</p></footer>
</main></body></html>`;
writeFileSync(path.join(outputRoot, 'index.html'), html);

if (existsSync(sitemapPath)) {
  let sitemap = readFileSync(sitemapPath, 'utf8');
  const urls = [`${SITE}about/`, `${SITE}source-library/`];
  for (const url of urls) {
    if (!sitemap.includes(`<loc>${url}</loc>`)) {
      sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>2026-09-13</lastmod></url>\n</urlset>`);
    }
  }
  writeFileSync(sitemapPath, sitemap);
}

console.log(`Source PDF library: ${books.length} PDF${books.length === 1 ? '' : 's'} indexed.`);
