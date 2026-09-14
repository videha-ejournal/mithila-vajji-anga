import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('dist/client');
const BASE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const RELEASE_DATE = '2026-09-14';
const languages = ['as','bn','brx','doi','en','gu','hi','kn','ks','gom','mai','ml','mni-Mtei','mr','ne','or','pa','sa','sat','sd','ta','te','ur','zh-CN','yue','fa','iw','bo','si','es','fr','de','pt','it','ru','ar','ja','ko','id','th','tr'];
const pairs = [['/','/en/'],['/history/','/en/history/'],['/philosophy/','/en/philosophy/'],['/literature/','/en/literature/'],['/panji/','/en/panji/'],['/sources/','/en/sources/'],['/updates/','/en/updates/'],['/about/','/en/about/'],['/isbn/','/en/isbn/']];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const readSource = (rel) => readFile(path.resolve(rel), 'utf8');
function routeFile(route) {
  if (route === '/') return path.join(OUT, 'index.html');
  const rel = route.replace(/^\/+|\/+$/g, '');
  const file = [path.join(OUT, rel, 'index.html'), path.join(OUT, `${rel}.html`)].find(existsSync);
  if (!file) throw new Error(`Missing exported route: ${route}`);
  return file;
}
const readRoute = (route) => readFile(routeFile(route), 'utf8');
function langOf(html) { return html.match(/<html[^>]*\blang=["']([^"']+)["']/i)?.[1] ?? ''; }
function tags(html, rel) { return [...html.matchAll(/<link\b[^>]*>/gi)].map((m)=>m[0]).filter((tag)=>new RegExp(`\\brel=["']${rel}["']`,'i').test(tag)); }
function attr(tag, name) { return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`,'i'))?.[1] ?? ''; }
function canonical(html) { const tag=tags(html,'canonical')[0]; return tag?attr(tag,'href'):''; }
function hasAlt(html, code, href) { return tags(html,'alternate').some((tag)=>attr(tag,'hreflang').toLowerCase()===code.toLowerCase()&&attr(tag,'href')===href); }
function styles(html) { return tags(html,'stylesheet').map((tag)=>attr(tag,'href')).sort((a,b)=>a.localeCompare(b)); }
function optionValues(html) { return [...html.matchAll(/<option\b[^>]*\bvalue=["']([^"']+)["']/gi)].map((m)=>m[1]); }
async function countIndexFiles(dir) { let count=0; for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name); if(entry.isDirectory()) count+=await countIndexFiles(full); else if(entry.isFile()&&entry.name==='index.html') count+=1;} return count; }

const root=await readRoute('/');
const english=await readRoute('/en/');
assert(root.includes('विदेह डिजिटल शोध अभिलेखागार'),'Root Maithili identity missing');
assert(english.includes('Videha Digital Research Archive'),'English archive identity missing');
assert(langOf(root)==='mai','Root lang must be mai');
assert(langOf(english)==='en','English lang must be en');
assert(canonical(root)===`${BASE}/`,'Root canonical mismatch');
assert(canonical(english)===`${BASE}/en/`,'English canonical mismatch');
for(const [document,route] of [[root,'/'],[english,'/en/']]){
  assert(hasAlt(document,'mai',`${BASE}/`),`Missing mai alternate on ${route}`);
  assert(hasAlt(document,'en',`${BASE}/en/`),`Missing en alternate on ${route}`);
  assert(hasAlt(document,'x-default',`${BASE}/`),`Missing x-default alternate on ${route}`);
  assert(!document.includes('Chapters 1–86'),'Stale History completion text remains');
  const values=new Set(optionValues(document));
  assert(languages.every((code)=>values.has(code)),`Translation language contract failed on ${route}`);
  assert(tags(document,'icon').some((tag)=>attr(tag,'href')===`${BASE}/favicon.svg`),`Favicon missing on ${route}`);
}
assert(root.includes('सहायक तकनीक')&&root.includes('सुनू'),'Maithili assistive controls missing');
assert(english.includes('Assistive Tech')&&english.includes('Listen'),'English assistive controls missing');
assert(JSON.stringify(styles(root))===JSON.stringify(styles(english)),'Root and English stylesheet bundles diverged');

for(const [maiRoute,enRoute] of pairs){
  const mai=await readRoute(maiRoute); const en=await readRoute(enRoute);
  assert(langOf(mai)==='mai',`${maiRoute} must declare mai`); assert(langOf(en)==='en',`${enRoute} must declare en`);
  assert(canonical(mai)===`${BASE}${maiRoute}`,`Canonical mismatch for ${maiRoute}`); assert(canonical(en)===`${BASE}${enRoute}`,`Canonical mismatch for ${enRoute}`);
  for(const document of [mai,en]){assert(hasAlt(document,'mai',`${BASE}${maiRoute}`),`Missing mai alternate for ${maiRoute}`);assert(hasAlt(document,'en',`${BASE}${enRoute}`),`Missing en alternate for ${enRoute}`);assert(hasAlt(document,'x-default',`${BASE}${maiRoute}`),`Missing x-default alternate for ${maiRoute}`);}
}

assert(await countIndexFiles(path.join(OUT,'chapters'))===178,'Maithili History page count is not 178');
assert(await countIndexFiles(path.join(OUT,'en/chapters'))===178,'English History page count is not 178');
const robots=await readFile(path.join(OUT,'robots.txt'),'utf8');
assert(robots.includes(`${BASE}/sitemap.xml`),'robots.txt sitemap declaration missing');
const sitemap=await readFile(path.join(OUT,'sitemap.xml'),'utf8');
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'),'Sitemap hreflang namespace missing');
for(const [maiRoute,enRoute] of pairs){assert(sitemap.includes(`${BASE}${maiRoute}`),`Sitemap missing ${maiRoute}`);assert(sitemap.includes(`${BASE}${enRoute}`),`Sitemap missing ${enRoute}`);}

const rootSource=await readSource('app/page.tsx');
const enSource=await readSource('app/en/page.tsx');
assert(rootSource.includes("import MaithiliHome from './home-maithili';"),'Root must use generated Maithili feature source');
assert(enSource.includes("import Home from '../archive-english';")&&enSource.includes('export default Home;'),'/en/ must use English feature source');
const layout=await readSource('app/layout.tsx');
assert(layout.includes('<html lang="mai"'),'Root layout must declare mai'); assert(layout.includes(RELEASE_DATE),'Release metadata date is stale');
const css=await readSource('app/globals.css');
assert(css.includes(':focus-visible')&&css.includes('prefers-reduced-motion'),'Accessibility CSS safeguards missing');
assert(css.includes('min-height: 44px')&&css.includes('min-width: 44px'),'44px target rule missing');
const audit=await readSource('ACCESSIBILITY-AUDIT.md');
assert(audit.includes('Manual certification status: PENDING'),'Manual accessibility status must remain Pending');
const matrix=await readSource('ACCESSIBILITY-MANUAL-MATRIX.md');
assert(matrix.includes('PENDING HUMAN / DEVICE TESTING')&&!/\|\s*Passed\s*\|/i.test(matrix),'Manual accessibility matrix overclaims certification');

const packageJson=JSON.parse(await readSource('package.json'));
const archiveCommand=packageJson.scripts?.['generate:archive']??'';
assert(archiveCommand.includes('--require-complete'),'Classical Philosophy complete-source gate removed');
assert(archiveCommand.includes('audit-panji-source.mjs --strict'),'Strict Panji gate removed');
assert(archiveCommand.includes('apply-reviewed-maithili.mjs'),'Editorial Maithili gate removed');
assert(archiveCommand.includes('verify-bilingual-archive.mjs'),'Bilingual archive verifier removed');
assert(!packageJson.scripts?.build?.includes('generate-history-maithili.py'),'Machine History translation must not enter authoritative build');

const classical=JSON.parse(await readSource('app/classical-philosophy-inventory.json'));
for(const key of ['bhamati','atmatattvaviveka','nyayakusumanjali','tattvacintamani']){const work=classical.works?.[key];assert(work,`Missing classical Philosophy work ${key}`);if(work.status==='pending'){assert(work.maithiliSourceReady===false,`${key} pending work incorrectly Maithili-ready`);assert(Array.isArray(work.units)&&work.units.length===0,`${key} pending work has synthetic units`);}}
const review=JSON.parse(await readSource('app/maithili-research-review.json'));
for(const [key,value] of Object.entries(review)) assert(value&&typeof value==='object'&&value.status==='editorially-reviewed'&&value.sourceChecked===true,`Unreviewed Maithili registry entry ${key}`);
const report=JSON.parse(await readFile(path.join(OUT,'data/release-integrity-report.json'),'utf8'));
assert(report.releaseDate===RELEASE_DATE&&report.historyChapters===178&&report.scholarlyPublicationPolicy==='fail-closed','Release integrity report mismatch');
console.log({releaseDate:RELEASE_DATE,historyPagesMai:178,historyPagesEn:178,translationLanguages:languages.length,manualAccessibilityCertification:report.manualAccessibilityCertification,failClosed:true});
