import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist/client');
const BASE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const RELEASE_DATE = '2026-09-14';
const research = JSON.parse(readFileSync(path.join(ROOT, 'app/research-data.json'), 'utf8'));
const chapterIds = [...research.political, ...research.social].map((chapter) => chapter.id);
if (chapterIds.length !== 178) throw new Error(`Expected 178 History chapters, found ${chapterIds.length}`);

const pairs = [
  ['/', '/en/'],
  ['/history/', '/en/history/'],
  ...chapterIds.map((id) => [`/chapters/${id}/`, `/en/chapters/${id}/`]),
  ['/philosophy/', '/en/philosophy/'],
  ['/literature/', '/en/literature/'],
  ['/panji/', '/en/panji/'],
  ['/sources/', '/en/sources/'],
  ['/updates/', '/en/updates/'],
  ['/about/', '/en/about/'],
  ['/isbn/', '/en/isbn/'],
];

function routeCandidates(route) {
  if (route === '/') return [path.join(OUT, 'index.html')];
  const rel = route.replace(/^\/+|\/+$/g, '');
  return [path.join(OUT, rel, 'index.html'), path.join(OUT, `${rel}.html`)];
}
function routeFile(route) {
  const file = routeCandidates(route).find(existsSync);
  if (!file) throw new Error(`Bilingual route output missing: ${route}; checked ${routeCandidates(route).join(', ')}`);
  return file;
}
function absolute(route) { return `${BASE}${route}`; }
function ensureHead(html) { if (!html.includes('</head>')) throw new Error('Exported HTML is missing </head>'); return html; }
function normalize(html, lang, canonical, maiHref, enHref) {
  html = html.replace(/<html\s+lang=["'][^"']+["']/i, `<html lang="${lang}"`);
  html = html.replaceAll('hrefLang=', 'hreflang=');
  html = html.replace(/<meta\b[^>]*\bname=["']DC\.language["'][^>]*>/gi, '');
  html = html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, '');
  html = html.replace(/<link\b[^>]*\brel=["']alternate["'][^>]*\bhreflang=["'](?:mai|en|x-default)["'][^>]*>/gi, '');
  ensureHead(html);
  const tags = [
    `<meta name="DC.language" content="${lang}"/>`,
    `<link rel="canonical" href="${canonical}"/>`,
    `<link rel="alternate" href="${maiHref}" hreflang="mai"/>`,
    `<link rel="alternate" href="${enHref}" hreflang="en"/>`,
    `<link rel="alternate" href="${maiHref}" hreflang="x-default"/>`,
  ].join('');
  return html.replace('</head>', `${tags}</head>`);
}

for (const [maiRoute, enRoute] of pairs) {
  const maiFile = routeFile(maiRoute);
  const enFile = routeFile(enRoute);
  const maiHtml = normalize(readFileSync(maiFile, 'utf8'), 'mai', absolute(maiRoute), absolute(maiRoute), absolute(enRoute));
  const enHtml = normalize(readFileSync(enFile, 'utf8'), 'en', absolute(enRoute), absolute(maiRoute), absolute(enRoute));
  writeFileSync(maiFile, maiHtml, 'utf8');
  writeFileSync(enFile, enHtml, 'utf8');
}

const sitemapPath = path.join(OUT, 'sitemap.xml');
let sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('xmlns:xhtml=')) {
  sitemap = sitemap.replace(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  );
}
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function upsert(route, maiRoute, enRoute) {
  const loc = absolute(route);
  const pattern = new RegExp(`<url>(?:(?!<\\/url>).)*<loc>${escapeRegex(loc)}<\\/loc>(?:(?!<\\/url>).)*<\\/url>`, 's');
  let match = sitemap.match(pattern);
  if (!match) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${RELEASE_DATE}</lastmod></url>\n</urlset>`);
    match = sitemap.match(pattern);
  }
  if (!match) throw new Error(`Could not create sitemap entry for ${loc}`);
  let block = match[0]
    .replace(/<xhtml:link[^>]+\/>/g, '')
    .replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${RELEASE_DATE}</lastmod>`);
  if (!block.includes('<lastmod>')) block = block.replace('</loc>', `</loc><lastmod>${RELEASE_DATE}</lastmod>`);
  block = block.replace('</url>', `<xhtml:link rel="alternate" hreflang="mai" href="${absolute(maiRoute)}"/><xhtml:link rel="alternate" hreflang="en" href="${absolute(enRoute)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${absolute(maiRoute)}"/></url>`);
  sitemap = sitemap.replace(match[0], block);
}
for (const [maiRoute, enRoute] of pairs) { upsert(maiRoute, maiRoute, enRoute); upsert(enRoute, maiRoute, enRoute); }
writeFileSync(sitemapPath, sitemap, 'utf8');

const report = {
  generatedAt: new Date().toISOString(),
  releaseDate: RELEASE_DATE,
  pairedRoutes: pairs.length * 2,
  routePairs: pairs.length,
  historyChapterPairs: chapterIds.length,
  rootMaithiliInterface: true,
  englishInterface: true,
  sourceLanguagePolicy: 'Verified English catalogue titles/summaries remain explicitly lang=en where no reviewed Maithili text exists; no machine translation is published as reviewed scholarship.',
  homepageGeneration: 'curated-ui-dictionary-from-shared-English-feature-source',
  manualAccessibilityCertification: 'pending-human-device-testing',
  panjiPublicationPolicy: 'fail-closed',
};
writeFileSync(path.join(OUT, 'data/bilingual-content-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(report);
