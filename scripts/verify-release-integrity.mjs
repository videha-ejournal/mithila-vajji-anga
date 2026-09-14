import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('dist/client');
const BASE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const TITLE = 'Videha Digital Research Archive | Digital Humanities Research Environment for Mithila, Vajji & Anga';
const RELEASE_DATE = '2026-09-14';
const languages = ['as','bn','brx','doi','en','gu','hi','kn','ks','gom','mai','ml','mni-Mtei','mr','ne','or','pa','sa','sat','sd','ta','te','ur','zh-CN','yue','fa','iw','bo','si','es','fr','de','pt','it','ru','ar','ja','ko','id','th','tr'];
const pairs = [
  ['/', '/en/'],
  ['/philosophy/', '/en/philosophy/'],
  ['/literature/', '/en/literature/'],
  ['/panji/', '/en/panji/'],
  ['/sources/', '/en/sources/'],
  ['/updates/', '/en/updates/'],
];

const readOut = (rel) => readFile(path.join(OUT, rel), 'utf8');
const readSource = (rel) => readFile(path.resolve(rel), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const decode = (value) => value.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');
const htmlForRoute = (route) => route === '/' ? 'index.html' : `${route.replace(/^\//, '')}index.html`;

function titleOf(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decode(match[1].trim()) : '';
}
function htmlLang(html) {
  return html.match(/<html[^>]*\blang=["']([^"']+)["']/i)?.[1] ?? '';
}
function linkTags(html, rel) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((tag) => new RegExp(`\\brel=["']${rel}["']`, 'i').test(tag));
}
function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1] ?? '';
}
function hasAlternate(html, lang, href) {
  return linkTags(html, 'alternate').some((tag) => attr(tag, 'hreflang').toLowerCase() === lang.toLowerCase() && attr(tag, 'href') === href);
}
function canonical(html) {
  const tag = linkTags(html, 'canonical')[0];
  return tag ? attr(tag, 'href') : '';
}
function stylesheetHrefs(html) {
  return linkTags(html, 'stylesheet').map((tag) => attr(tag, 'href')).sort();
}
function countTag(html, tag) {
  return (html.match(new RegExp(`<${tag}\\b`, 'gi')) ?? []).length;
}
function optionValues(html) {
  return [...html.matchAll(/<option\b[^>]*\bvalue=["']([^"']+)["']/gi)].map((m) => m[1]);
}

const root = await readOut('index.html');
const english = await readOut('en/index.html');
assert(titleOf(root) === TITLE, 'Root title mismatch');
assert(titleOf(english) === TITLE, 'English title mismatch');
assert(htmlLang(root) === 'mai', `Root lang must be mai, found ${htmlLang(root)}`);
assert(htmlLang(english) === 'en', `English lang must be en, found ${htmlLang(english)}`);
assert(canonical(root) === `${BASE}/`, 'Root canonical mismatch');
assert(canonical(english) === `${BASE}/en/`, 'English canonical mismatch');
for (const html of [root, english]) {
  assert(hasAlternate(html, 'mai', `${BASE}/`), 'Missing mai hreflang on a landing page');
  assert(hasAlternate(html, 'en', `${BASE}/en/`), 'Missing en hreflang on a landing page');
  assert(hasAlternate(html, 'x-default', `${BASE}/`), 'Missing x-default hreflang on a landing page');
  assert(!html.includes('Chapters 1–86'), 'Stale History completion text remains');
  assert(html.includes('178 permanent History chapters'), 'Current 178-chapter completion statement missing');
  assert(html.includes('Listen') && html.includes('Stop') && html.includes('Assistive Tech'), 'Listen/Stop/Assistive Tech controls missing');
  assert(html.includes('मैथिली') && html.includes('English'), 'Edition switch labels missing');
  const values = new Set(optionValues(html));
  assert(languages.every((code) => values.has(code)), `Translation language contract failed; found ${values.size} options`);
  const favicon = linkTags(html, 'icon').map((tag) => attr(tag, 'href'));
  assert(favicon.includes(`${BASE}/favicon.svg`), 'Absolute archive favicon missing');
}
assert(JSON.stringify(stylesheetHrefs(root)) === JSON.stringify(stylesheetHrefs(english)), 'Root and English stylesheet bundles diverged');
for (const [maiRoute, enRoute] of pairs) {
  const maiHtml = await readOut(htmlForRoute(maiRoute));
  const enHtml = await readOut(htmlForRoute(enRoute));
  assert(htmlLang(maiHtml) === 'mai', `Maithili-side route ${maiRoute} does not declare mai`);
  assert(htmlLang(enHtml) === 'en', `English-side route ${enRoute} does not declare en`);
  assert(canonical(maiHtml) === `${BASE}${maiRoute}`, `Canonical mismatch for ${maiRoute}`);
  assert(canonical(enHtml) === `${BASE}${enRoute}`, `Canonical mismatch for ${enRoute}`);
  for (const html of [maiHtml, enHtml]) {
    assert(hasAlternate(html, 'mai', `${BASE}${maiRoute}`), `Missing mai alternate for ${maiRoute}`);
    assert(hasAlternate(html, 'en', `${BASE}${enRoute}`), `Missing en alternate for ${enRoute}`);
    assert(hasAlternate(html, 'x-default', `${BASE}${maiRoute}`), `Missing x-default alternate for ${maiRoute}`);
  }
}
for (const tag of ['section','article','button','a']) {
  assert(countTag(root, tag) === countTag(english, tag), `Mirror parity failed for <${tag}> count`);
}

const enSource = await readSource('app/en/page.tsx');
assert(enSource.includes("import Home from '../page';") && enSource.includes('export default Home;'), '/en/ must render the shared Home component');
const layoutSource = await readSource('app/layout.tsx');
assert(layoutSource.includes('<html lang="mai"'), 'Root layout source must declare mai');
assert(layoutSource.includes("'DC.language': 'mai'"), 'Root Dublin Core language must be mai');
assert(layoutSource.includes(RELEASE_DATE), 'Root release metadata date is stale');
assert(enSource.includes("'DC.language': 'en'"), 'English Dublin Core language must be en');

const css = await readSource('app/globals.css');
assert(css.includes(':focus-visible'), 'Visible focus rule missing');
assert(css.includes('prefers-reduced-motion'), 'Reduced-motion media query missing');
assert(css.includes('min-height: 44px') && css.includes('min-width: 44px'), '44px large-target accessibility rule missing');
const accessibilityAudit = await readSource('ACCESSIBILITY-AUDIT.md');
assert(accessibilityAudit.includes('Manual certification status: PENDING'), 'Manual accessibility status must remain explicit and non-certified until device testing is recorded');

const robots = await readOut('robots.txt');
assert(robots.includes(`${BASE}/sitemap.xml`), 'robots.txt sitemap declaration missing');
const sitemap = await readOut('sitemap.xml');
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'Sitemap hreflang namespace missing');
for (const [maiRoute, enRoute] of pairs) {
  for (const route of [maiRoute, enRoute]) {
    const absolute = `${BASE}${route}`;
    const block = sitemap.match(new RegExp(`<url>(?:(?!<\\/url>).)*<loc>${absolute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>(?:(?!<\\/url>).)*<\\/url>`, 's'))?.[0] ?? '';
    assert(block, `Sitemap missing ${absolute}`);
    assert(block.includes(`<lastmod>${RELEASE_DATE}</lastmod>`), `Sitemap lastmod stale for ${absolute}`);
    assert(block.includes(`hreflang="mai" href="${BASE}${maiRoute}"`), `Sitemap mai alternate missing for ${absolute}`);
    assert(block.includes(`hreflang="en" href="${BASE}${enRoute}"`), `Sitemap en alternate missing for ${absolute}`);
  }
}

async function countHistoryIndexFiles(dir) {
  let count = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += await countHistoryIndexFiles(full);
    else if (entry.isFile() && entry.name === 'index.html') count += 1;
  }
  return count;
}
assert(await countHistoryIndexFiles(path.join(OUT, 'chapters')) === 178, 'History permanent-page count is not 178');

const packageJson = JSON.parse(await readSource('package.json'));
const archiveCommand = packageJson.scripts?.['generate:archive'] ?? '';
assert(archiveCommand.includes('--require-complete'), 'Classical Philosophy complete-source gate was removed');
assert(archiveCommand.includes('audit-panji-source.mjs --strict'), 'Strict Panji gate was removed');
assert(archiveCommand.includes('apply-reviewed-maithili.mjs'), 'Editorial Maithili review gate was removed');
assert(archiveCommand.includes('verify-bilingual-archive.mjs'), 'Bilingual archive verifier was removed');

const classical = JSON.parse(await readSource('app/classical-philosophy-inventory.json'));
for (const key of ['bhamati','atmatattvaviveka','nyayakusumanjali','tattvacintamani']) {
  const work = classical.works?.[key];
  assert(work, `Missing classical Philosophy work ${key}`);
  if (work.status === 'pending') {
    assert(work.maithiliSourceReady === false, `${key} pending work incorrectly marked Maithili-ready`);
    assert(Array.isArray(work.units) && work.units.length === 0, `${key} pending work has synthetic units`);
  }
}
const review = JSON.parse(await readSource('app/maithili-research-review.json'));
for (const [key, value] of Object.entries(review)) {
  assert(value && typeof value === 'object' && value.status === 'editorially-reviewed' && value.sourceChecked === true, `Unreviewed Maithili registry entry ${key}`);
}
const units = JSON.parse(await readSource('app/generated/archive-units.json'));
if (Array.isArray(units) && units.length === 0) {
  for (const collection of ['literature','panji','philosophy']) {
    const dir = path.join(OUT, collection);
    const count = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).length;
    assert(count === 0, `${collection} detail directories exist while verified archive-units inventory is empty`);
  }
}

const report = JSON.parse(await readOut('data/release-integrity-report.json'));
assert(report.releaseDate === RELEASE_DATE && report.historyChapters === 178 && report.scholarlyPublicationPolicy === 'fail-closed', 'Release integrity report mismatch');
console.log({
  releaseDate: RELEASE_DATE,
  historyPages: 178,
  translationLanguages: languages.length,
  mirrorCounts: Object.fromEntries(['section','article','button','a'].map((tag) => [tag, countTag(root, tag)])),
  stylesheetBundles: stylesheetHrefs(root),
  manualAccessibilityCertification: report.manualAccessibilityCertification,
  failClosed: true,
});
