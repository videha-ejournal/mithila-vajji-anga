import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const sitemapPath = 'dist/client/sitemap.xml';
const inventoryPath = 'app/generated/research-article-inventory.json';
const baseUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const lastModified = '2026-09-15';

if (!existsSync(sitemapPath)) throw new Error('Cannot add research articles: sitemap.xml is missing.');
if (!existsSync(inventoryPath)) throw new Error('Cannot add research articles: generated inventory is missing.');

const records = JSON.parse(readFileSync(inventoryPath, 'utf8'));
if (!Array.isArray(records) || records.length !== 522) {
  throw new Error(`Expected 522 research article records, found ${Array.isArray(records) ? records.length : 'invalid inventory'}.`);
}

let sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('</urlset>')) throw new Error('sitemap.xml has no closing </urlset>.');
if (!sitemap.includes('xmlns:xhtml=')) {
  sitemap = sitemap.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
}

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const addEntry = (xml) => {
  sitemap = sitemap.replace('</urlset>', `${xml}\n</urlset>`);
};

const indexUrl = `${baseUrl}research-articles/`;
if (!sitemap.includes(`<loc>${indexUrl}</loc>`)) {
  addEntry(`  <url><loc>${indexUrl}</loc><lastmod>${lastModified}</lastmod><changefreq>monthly</changefreq></url>`);
}

let added = 0;
for (const record of records) {
  const url = record.canonical;
  if (!url?.startsWith(indexUrl) || sitemap.includes(`<loc>${url}</loc>`)) continue;
  const alternates = record.series === 'philosophy'
    ? ['mai', 'en', 'x-default']
        .filter((lang) => record.alternates?.[lang])
        .map((lang) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(record.alternates[lang])}"/>`)
        .join('')
    : '';
  addEntry(`  <url><loc>${escapeXml(url)}</loc><lastmod>${lastModified}</lastmod><changefreq>yearly</changefreq>${alternates}</url>`);
  added += 1;
}

writeFileSync(sitemapPath, sitemap);

const researchUrls = (sitemap.match(/<loc>https:\/\/videha-ejournal\.github\.io\/mithila-vajji-anga\/research-articles\//g) ?? []).length;
if (researchUrls !== 523) throw new Error(`Expected 523 research-article sitemap URLs including the index, found ${researchUrls}.`);
for (const required of [
  `${baseUrl}research-articles/history/volume-1/chapter-001/`,
  `${baseUrl}research-articles/history/volume-2/chapter-150/`,
  `${baseUrl}research-articles/parallel-philosophy/volume-1/mai/chapter-001/`,
  `${baseUrl}research-articles/parallel-philosophy/volume-1/en/chapter-072/`,
  `${baseUrl}research-articles/parallel-philosophy/volume-2/mai/chapter-100/`,
  `${baseUrl}research-articles/parallel-philosophy/volume-2/en/chapter-100/`,
]) {
  if (!sitemap.includes(`<loc>${required}</loc>`)) throw new Error(`Required research article URL is missing from sitemap: ${required}`);
}

console.log(`Research article sitemap PASS: 522 articles + index; added ${added} article URL(s).`);
