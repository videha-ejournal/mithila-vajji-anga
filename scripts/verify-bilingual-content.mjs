import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist/client');
const BASE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const research = JSON.parse(readFileSync(path.join(ROOT, 'app/research-data.json'), 'utf8'));
const chapterIds = [...research.political, ...research.social].map((chapter) => chapter.id);
const assert = (condition, message) => { if (!condition) throw new Error(`Bilingual content verification failed: ${message}`); };
function routeFile(route) {
  const rel = route.replace(/^\/+|\/+$/g, '');
  const candidates = route === '/' ? [path.join(OUT, 'index.html')] : [path.join(OUT, rel, 'index.html'), path.join(OUT, `${rel}.html`)];
  const file = candidates.find(existsSync);
  if (!file) throw new Error(`Missing route ${route}; checked ${candidates.join(', ')}`);
  return file;
}
function html(route) { return readFileSync(routeFile(route), 'utf8'); }
function languagePair(maiRoute, enRoute) {
  const mai = html(maiRoute); const en = html(enRoute);
  assert(mai.includes('<html lang="mai"'), `${maiRoute} does not declare lang=mai`);
  assert(en.includes('<html lang="en"'), `${enRoute} does not declare lang=en`);
  assert(mai.includes(`hreflang="en"`) && mai.includes(`${BASE}${enRoute}`), `${maiRoute} lacks English alternate`);
  assert(en.includes(`hreflang="mai"`) && en.includes(`${BASE}${maiRoute}`), `${enRoute} lacks Maithili alternate`);
  assert(mai.includes(`rel="canonical" href="${BASE}${maiRoute}"`), `${maiRoute} canonical drifted`);
  assert(en.includes(`rel="canonical" href="${BASE}${enRoute}"`), `${enRoute} canonical drifted`);
  return { mai, en };
}

assert(chapterIds.length === 178, `expected 178 history chapters, found ${chapterIds.length}`);
const root = languagePair('/', '/en/');
for (const marker of ['मिथिला, वज्जि आ अंगक अन्वेषण करू','एक अभिलेखागारक चारि शोध-दुआरि','पूरा विदेह अभिलेखागार खोजू']) assert(root.mai.includes(marker), `Maithili homepage missing marker: ${marker}`);
for (const marker of ['Explore Mithila, Vajji and Anga','Four doors into one archive','Find a person, place, text, chapter, or idea']) assert(root.en.includes(marker), `English homepage missing marker: ${marker}`);
for (const phrase of ['>Explore Mithila, Vajji and Anga<','>Four doors into one archive<','>Find a person, place, text, chapter, or idea<']) assert(!root.mai.includes(phrase), `prominent English UI leaked into Maithili homepage: ${phrase}`);
assert(root.mai.includes('मैथिली संस्करण'), 'Maithili homepage lacks source-language integrity notice');

const history = languagePair('/history/', '/en/history/');
assert(history.mai.includes('दू इतिहास, एक जुड़ल क्षेत्रीय अभिलेखागार'), 'Maithili History index is not localized');
assert(history.en.includes('Two histories, one connected regional archive'), 'English History index missing English heading');
assert(history.mai.includes('मशीनी अनुवादकेँ प्रामाणिक पाठक रूपमे प्रकाशित नहि कएल जाइत अछि'), 'Maithili History source-language policy missing');

let maiChapters = 0; let enChapters = 0;
for (const id of chapterIds) {
  const pair = languagePair(`/chapters/${id}/`, `/en/chapters/${id}/`);
  assert(pair.mai.includes('स्रोत-भाषा सूचना'), `Maithili chapter ${id} lacks source-language notice`);
  assert(pair.mai.includes('lang="en"'), `Maithili chapter ${id} does not mark English source text`);
  assert(pair.en.includes('Detailed chapter description'), `English chapter ${id} lacks English interface`);
  maiChapters += 1; enChapters += 1;
}
assert(maiChapters === 178 && enChapters === 178, 'History mirror count is incomplete');

for (const [maiRoute, enRoute, maiMarker, enMarker] of [
  ['/sources/','/en/sources/','शोध-कालक्रम लेल स्थायी स्रोत-अभिलेख','Stable records for the research chronology'],
  ['/updates/','/en/updates/','की पूरा भेल, की बदलल, आ आगाँ की बाँकी अछि','What is complete, what changed, and what comes next'],
  ['/about/','/en/about/','मिथिला–वज्जि–अंग लेल विदेह डिजिटल शोध अभिलेखागार','Videha Digital Research Archive for Mithila, Vajji & Anga'],
  ['/isbn/','/en/isbn/','विदेह ISBN प्रामाणिक सूची','Videha ISBN Authority Registry'],
  ['/philosophy/','/en/philosophy/','द्विभाषी संरचना','Bilingual architecture'],
  ['/literature/','/en/literature/','द्विभाषी संरचना','Bilingual architecture'],
  ['/panji/','/en/panji/','द्विभाषी संरचना','Bilingual architecture'],
]) {
  const pair = languagePair(maiRoute, enRoute);
  assert(pair.mai.includes(maiMarker), `${maiRoute} missing Maithili marker`);
  assert(pair.en.includes(enMarker), `${enRoute} missing English marker`);
}

const generatedMaiHome = readFileSync(path.join(ROOT, 'app/home-maithili.tsx'), 'utf8');
assert(generatedMaiHome.includes('_x_tr_sl=mai'), 'Maithili homepage translation helper does not declare Maithili source language');
assert(!generatedMaiHome.includes('_x_tr_sl=en'), 'Maithili homepage still declares English as translation source');
assert(generatedMaiHome.includes("'mai-IN'"), 'Maithili Listen control does not request a Maithili speech language');

const packageJson = readFileSync(path.join(ROOT, 'package.json'), 'utf8');
assert(!packageJson.includes('generate-history-maithili.py'), 'machine History translation generator must not be part of authoritative build');
const panjiInventoryPath = path.join(ROOT, 'app/generated/panji-inventory.json');
if (existsSync(panjiInventoryPath)) {
  const panji = JSON.parse(readFileSync(panjiInventoryPath, 'utf8'));
  const size = Array.isArray(panji) ? panji.length : Object.keys(panji ?? {}).length;
  assert(size === 0, `Panji detail inventory must remain fail-closed while 105 source issues are unresolved; found ${size} generated entries`);
}

const matrix = readFileSync(path.join(ROOT, 'ACCESSIBILITY-MANUAL-MATRIX.md'), 'utf8');
assert(matrix.includes('PENDING HUMAN / DEVICE TESTING'), 'manual accessibility matrix must remain explicitly Pending');
assert(!/\|\s*Passed\s*\|/i.test(matrix), 'manual accessibility matrix contains an unsupported Passed certification');
const releaseReport = JSON.parse(readFileSync(path.join(OUT, 'data/release-integrity-report.json'), 'utf8'));
assert(String(releaseReport.manualAccessibilityCertification).includes('pending'), 'release metadata overclaims manual accessibility certification');
const bilingualReport = JSON.parse(readFileSync(path.join(OUT, 'data/bilingual-content-report.json'), 'utf8'));
assert(bilingualReport.historyChapterPairs === 178, 'bilingual report lost 178 History pairs');
assert(bilingualReport.manualAccessibilityCertification === 'pending-human-device-testing', 'bilingual report overclaims manual accessibility');

const sitemap = readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
assert(sitemap.includes('xmlns:xhtml='), 'sitemap lacks xhtml alternate namespace');
for (const route of ['/history/','/en/history/','/chapters/political-1/','/en/chapters/political-1/','/chapters/social-150/','/en/chapters/social-150/','/about/','/en/about/','/isbn/','/en/isbn/']) assert(sitemap.includes(`${BASE}${route}`), `sitemap omits ${route}`);

console.log({ rootMaithiliInterface: 'verified', englishMirror: 'verified', historyChapterPairs: 178, referencePairs: 7, sourceLanguageMarking: 'verified', machineHistoryTranslationPublished: false, panjiDetailPublication: 'fail-closed', manualAccessibilityCertification: 'pending-human-device-testing', failClosed: true });
