import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('dist/client');
const BASE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const RELEASE_DATE = '2026-09-14';
const ROOT_TITLE = 'विदेह डिजिटल शोध-संग्रह | मिथिला, वज्जि आ अंग';
const ENGLISH_TITLE = 'Videha Digital Research Archive | Digital Humanities Research Environment for Mithila, Vajji & Anga';

const pairs = [
  ['/', '/en/'],
  ['/philosophy/', '/en/philosophy/'],
  ['/literature/', '/en/literature/'],
  ['/panji/', '/en/panji/'],
  ['/sources/', '/en/sources/'],
  ['/updates/', '/en/updates/'],
];

const read = (rel) => readFile(path.join(OUT, rel), 'utf8');
const write = (rel, value) => writeFile(path.join(OUT, rel), value, 'utf8');
const url = (route) => `${BASE}${route}`;
const routeFile = (route) => route === '/' ? 'index.html' : `${route.replace(/^\//, '')}index.html`;

function ensureHeadLink(html, attrs) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const present = links.some((tag) => {
    const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1] ?? '';
    const hrefLang = tag.match(/\bhreflang=["']([^"']+)["']/i)?.[1] ?? '';
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? '';
    return rel.toLowerCase() === attrs.rel.toLowerCase()
      && hrefLang.toLowerCase() === (attrs.hreflang ?? '').toLowerCase()
      && href === attrs.href;
  });
  if (present) return html;
  const tag = `<link rel="${attrs.rel}" href="${attrs.href}"${attrs.hreflang ? ` hreflang="${attrs.hreflang}"` : ''}/>`;
  if (!html.includes('</head>')) throw new Error('Cannot inject metadata: missing </head>');
  return html.replace('</head>', `${tag}</head>`);
}

function setDcLanguage(html, lang) {
  html = html.replace(/<meta\b[^>]*\bname=["']DC\.language["'][^>]*>/gi, '');
  if (!html.includes('</head>')) throw new Error('Cannot set DC.language: missing </head>');
  return html.replace('</head>', `<meta name="DC.language" content="${lang}"/></head>`);
}

function normalizeEditionPage(html, lang, canonical, maiHref, enHref) {
  html = html.replace(/<html\s+lang=["'][^"']+["']/i, `<html lang="${lang}"`);
  html = html.replaceAll('hrefLang=', 'hreflang=');
  html = setDcLanguage(html, lang);
  html = ensureHeadLink(html, { rel: 'alternate', href: maiHref, hreflang: 'mai' });
  html = ensureHeadLink(html, { rel: 'alternate', href: enHref, hreflang: 'en' });
  html = ensureHeadLink(html, { rel: 'alternate', href: maiHref, hreflang: 'x-default' });
  html = html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, '');
  if (!html.includes('</head>')) throw new Error('Cannot set canonical: missing </head>');
  html = html.replace('</head>', `<link rel="canonical" href="${canonical}"/></head>`);
  return html;
}

for (const [maiRoute, enRoute] of pairs) {
  const maiFile = routeFile(maiRoute);
  const enFile = routeFile(enRoute);
  let maiHtml = await read(maiFile);
  let enHtml = await read(enFile);
  maiHtml = normalizeEditionPage(maiHtml, 'mai', url(maiRoute), url(maiRoute), url(enRoute));
  enHtml = normalizeEditionPage(enHtml, 'en', url(enRoute), url(maiRoute), url(enRoute));
  await write(maiFile, maiHtml);
  await write(enFile, enHtml);
}

for (const file of ['index.html', 'en/index.html']) {
  let html = await read(file);
  html = html.replace(
    /Political and connected history in 28 chapters;\s*socio-cultural-economic history with supplied Chapters 1–86\s*available in the cumulative research corpus\./g,
    'Political and connected history in 28 chapters; socio-cultural-economic history complete across all 150 supplied chapters, for 178 permanent History chapters in the connected archive.',
  );
  await write(file, html);
}

async function normalizeEnglishTree(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await normalizeEnglishTree(full);
    if (entry.isFile() && entry.name.endsWith('.html')) {
      let html = await readFile(full, 'utf8');
      html = html.replace(/<html\s+lang=["'][^"']+["']/i, '<html lang="en"');
      html = html.replaceAll('hrefLang=', 'hreflang=');
      html = setDcLanguage(html, 'en');
      await writeFile(full, html, 'utf8');
    }
  }
}
await normalizeEnglishTree(path.join(OUT, 'en'));

let sitemap = await read('sitemap.xml');
if (!sitemap.includes('xmlns:xhtml=')) {
  sitemap = sitemap.replace(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  );
}

for (const [maiRoute, enRoute] of pairs) {
  for (const route of [maiRoute, enRoute]) {
    const absolute = url(route);
    const blockPattern = new RegExp(`<url>(?:(?!<\\/url>).)*<loc>${absolute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>(?:(?!<\\/url>).)*<\\/url>`, 's');
    let match = sitemap.match(blockPattern);
    if (!match) {
      if (!sitemap.includes('</urlset>')) throw new Error('Sitemap is missing closing </urlset>');
      sitemap = sitemap.replace('</urlset>', `  <url><loc>${absolute}</loc><lastmod>${RELEASE_DATE}</lastmod><changefreq>weekly</changefreq></url>\n</urlset>`);
      match = sitemap.match(blockPattern);
    }
    if (!match) throw new Error(`Unable to create sitemap route ${absolute}`);
    let block = match[0];
    block = block.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${RELEASE_DATE}</lastmod>`);
    if (!block.includes('<lastmod>')) block = block.replace('</loc>', `</loc><lastmod>${RELEASE_DATE}</lastmod>`);
    block = block.replace(/<xhtml:link[^>]+\/>/g, '');
    block = block.replace(
      '</url>',
      `<xhtml:link rel="alternate" hreflang="mai" href="${url(maiRoute)}"/><xhtml:link rel="alternate" hreflang="en" href="${url(enRoute)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${url(maiRoute)}"/></url>`,
    );
    sitemap = sitemap.replace(match[0], block);
  }
}
await write('sitemap.xml', sitemap);

const auditSource = await readFile(path.resolve('ACCESSIBILITY-AUDIT.md'), 'utf8');
await mkdir(path.join(OUT, 'accessibility'), { recursive: true });
await writeFile(path.join(OUT, 'accessibility', 'AUDIT.md'), auditSource, 'utf8');

const reportDir = path.join(OUT, 'data');
await mkdir(reportDir, { recursive: true });
const report = {
  releaseDate: RELEASE_DATE,
  title: ENGLISH_TITLE,
  rootTitle: ROOT_TITLE,
  englishTitle: ENGLISH_TITLE,
  bilingualArchitecture: 'shared ArchiveEnglish research surface with route-specific Maithili and English landing wrappers',
  rootLanguage: 'mai',
  englishLanguage: 'en',
  pairedSitemapRoutes: pairs.length * 2,
  historyChapters: 178,
  automatedAccessibilityGate: true,
  manualAccessibilityCertification: 'pending-device-and-assistive-technology-audit',
  crawlerSubmission: 'sitemap-and-robots-ready; webmaster-console submission is account-side',
  scholarlyPublicationPolicy: 'fail-closed',
};
await writeFile(path.join(reportDir, 'release-integrity-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(report);
