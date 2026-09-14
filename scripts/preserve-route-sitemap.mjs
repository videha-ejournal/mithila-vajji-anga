import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const sitemapPath = 'dist/client/sitemap.xml';
const researchPath = 'app/research-data.json';
const archiveUnitsPath = 'app/generated/archive-units.json';
const baseUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const lastModified = '2026-09-13';

if (!existsSync(sitemapPath)) {
  throw new Error('Cannot preserve archive routes: dist/client/sitemap.xml is missing.');
}

const research = JSON.parse(readFileSync(researchPath, 'utf8'));
const archiveUnits = existsSync(archiveUnitsPath)
  ? JSON.parse(readFileSync(archiveUnitsPath, 'utf8'))
  : [];

const historyIds = [...(research.political ?? []), ...(research.social ?? [])]
  .map((chapter) => chapter?.id)
  .filter(Boolean);

if (historyIds.length !== 178) {
  throw new Error(`Expected 178 History chapter IDs, found ${historyIds.length}.`);
}

const permanentRoutes = [
  'history/',
  'philosophy/',
  'literature/',
  'panji/',
  'en/',
  'en/philosophy/',
  'en/literature/',
  'en/panji/',
  ...historyIds.map((id) => `chapters/${id}/`),
];

const verifiedDetailRoutes = (archiveUnits ?? []).flatMap((unit) => [
  `${unit.group}/${unit.workId}/${unit.unitId}/`,
  `en/${unit.group}/${unit.workId}/${unit.unitId}/`,
]);

const urls = [...new Set([...permanentRoutes, ...verifiedDetailRoutes])]
  .map((route) => `${baseUrl}${route}`);

let sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('</urlset>')) {
  throw new Error('Cannot preserve archive routes: sitemap.xml has no closing </urlset>.');
}

let added = 0;
for (const url of urls) {
  if (sitemap.includes(`<loc>${url}</loc>`)) continue;
  sitemap = sitemap.replace(
    '</urlset>',
    `  <url><loc>${url}</loc><lastmod>${lastModified}</lastmod><changefreq>monthly</changefreq></url>\n</urlset>`,
  );
  added += 1;
}

writeFileSync(sitemapPath, sitemap);

for (const required of [
  `${baseUrl}chapters/political-1/`,
  `${baseUrl}chapters/social-150/`,
  `${baseUrl}en/`,
  `${baseUrl}en/philosophy/`,
  `${baseUrl}en/literature/`,
  `${baseUrl}en/panji/`,
]) {
  if (!sitemap.includes(`<loc>${required}</loc>`)) {
    throw new Error(`Required archive URL is still missing from sitemap: ${required}`);
  }
}

console.log(`Preserved ${historyIds.length} History chapters and bilingual collection routes in sitemap; added ${added} missing URL(s).`);
