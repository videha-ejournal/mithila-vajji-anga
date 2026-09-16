import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const panjiInventoryPath = 'app/generated/panji-article-inventory.json';
const coreInventoryPath = 'app/generated/research-article-inventory.json';
const homepages = [
  { path: 'dist/client/index.html', locale: 'mai' },
  { path: 'dist/client/en/index.html', locale: 'en' },
];
const anchorPattern = /<div[^>]*id="decoding-panji-directory-anchor"[^>]*><\/div>/;
const roman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
const expected = { 1: 20, 2: 38, 3: 32, 4: 87, 5: 40, 6: 30 };
const PANJI_PREFIX = 'https://videha-ejournal.github.io/mithila-vajji-anga/decoding-panji/';
const dev = ['०','१','२','३','४','५','६','७','८','९'];
const esc = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const toDev = (value) => String(value).split('').map((c) => /\d/.test(c) ? dev[Number(c)] : c).join('');

if (!existsSync(panjiInventoryPath) || !existsSync(coreInventoryPath)) throw new Error('Required research inventories are missing.');
const panji = JSON.parse(readFileSync(panjiInventoryPath, 'utf8'));
const core = JSON.parse(readFileSync(coreInventoryPath, 'utf8'));
if (!Array.isArray(panji) || panji.length !== 247) throw new Error(`Expected 247 Decoding Panji chapter records; found ${panji?.length ?? 'invalid'}.`);
if (!Array.isArray(core) || core.length !== 522) throw new Error('The verified 522-record core inventory is unavailable.');
if (panji.some((record) => !record.canonical?.startsWith(PANJI_PREFIX))) throw new Error('Decoding Panji inventory contains a non-canonical route family.');

for (const [volumeText, count] of Object.entries(expected)) {
  const volume = Number(volumeText);
  const records = panji.filter((r) => r.volume === volume);
  if (records.length !== count || records.some((r) => r.kind !== 'chapter')) throw new Error(`Volume ${volume} is not an exact ${count}-chapter corpus.`);
}

function render(locale) {
  const isMai = locale === 'mai';
  const copy = isMai ? {
    eyebrow: 'DECODING PANJI · अध्याय-दर-अध्याय शोध-संग्रह',
    title: 'Decoding Panji खण्ड I–VI',
    intro: 'छओ खण्डक औपचारिक अध्यायसभक स्रोत-सत्यापित HTML संग्रह। नियम स्पष्ट अछि: एक औपचारिक पुस्तक-अध्याय = एक HTML पन्ना। भूमिका, भाग-शीर्षक, परिशिष्ट, अनुबन्ध, समापन-टिप्पणी वा पुस्तकक आन उपकरण अलग अध्याय-पन्ना नहि बनैत अछि।',
    total: 'अध्याय-पन्ना', volume: 'खण्ड', chapter: 'अध्याय', source: 'मूल स्रोत PDF', open: 'अध्यायसभ देखू', jump: 'खण्ड पर जाउ',
  } : {
    eyebrow: 'DECODING PANJI · CHAPTER-BY-CHAPTER RESEARCH CORPUS',
    title: 'Decoding Panji — Volumes I–VI',
    intro: 'Source-verified HTML corpus of the formal chapters in all six books. Governing rule: one formal book chapter equals one HTML page. Front matter, part headings, appendices, annexures, closing notes and other book apparatus do not create extra chapter pages.',
    total: 'chapter pages', volume: 'Volume', chapter: 'Chapter', source: 'Source PDF', open: 'Show chapters', jump: 'Jump to volume',
  };
  const groups = Array.from({ length: 6 }, (_, i) => [i + 1, panji.filter((r) => r.volume === i + 1).sort((a,b) => a.chapter - b.chapter)]);
  const cards = groups.map(([volume, records]) => {
    const links = records.map((record) => `<a class="panji-directory-link" href="${esc(record.canonical)}"><span class="panji-directory-number">${isMai ? toDev(record.chapter) : record.chapter}</span><span><strong>${copy.chapter} ${isMai ? toDev(record.chapter) : record.chapter}: ${esc(record.title)}</strong><small>PDF pp. ${esc(record.source_pages)}</small></span></a>`).join('');
    return `<details class="panji-directory-volume" id="decoding-panji-volume-${volume}"${volume === 1 ? ' open' : ''}><summary><span><strong>${copy.volume} ${roman[volume]}</strong><small>${isMai ? toDev(records.length) : records.length} ${copy.total}</small></span><span>${copy.open}</span></summary><div class="panji-directory-volume-tools"><a href="${esc(records[0].source_html)}">${copy.source} · ${copy.volume} ${roman[volume]}</a></div><div class="panji-directory-grid">${links}</div></details>`;
  }).join('');
  const jumps = groups.map(([v, r]) => `<a href="#decoding-panji-volume-${v}">${copy.volume} ${roman[v]} · ${isMai ? toDev(r.length) : r.length}</a>`).join('');
  return `<section class="panji-live-directory" id="decoding-panji-live-directory" data-decoding-panji-directory="true" data-panji-article-count="${panji.length}" lang="${locale}" aria-labelledby="decoding-panji-directory-title"><style>.panji-live-directory{width:min(1480px,calc(100% - 2rem));margin:1.5rem auto 2.75rem;padding:clamp(1rem,2.5vw,2rem);border:1px solid #cbb88b;border-radius:18px;background:linear-gradient(180deg,#fffdf7,#f4eee0);color:#23302a}.panji-directory-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem}.panji-directory-head h2{margin:.15rem 0;color:#13233a;font:800 clamp(1.8rem,3vw,2.8rem) Georgia,serif}.panji-directory-eyebrow{font-size:.74rem;font-weight:900;letter-spacing:.1em;color:#8a4b0f}.panji-directory-intro{max-width:90ch}.panji-directory-badge{padding:.7rem 1rem;border:1px solid #b78a39;border-radius:12px;background:#fff;text-align:center}.panji-directory-badge strong{display:block;font-size:1.6rem}.panji-directory-jump{display:flex;flex-wrap:wrap;gap:.45rem;margin:1rem 0}.panji-directory-jump a,.panji-directory-volume-tools a{padding:.35rem .65rem;border:1px solid #cdbd9d;border-radius:999px;background:#fff;color:#5f3b12;text-decoration:none}.panji-directory-volumes{display:grid;gap:.8rem}.panji-directory-volume{border:1px solid #d8d0bd;border-radius:14px;background:#fff;overflow:hidden}.panji-directory-volume summary{display:flex;justify-content:space-between;gap:1rem;padding:1rem;background:#fff9ea;cursor:pointer}.panji-directory-volume summary span:first-child{display:grid}.panji-directory-volume-tools{padding:.7rem 1rem 0}.panji-directory-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.5rem;padding:1rem}.panji-directory-link{display:grid;grid-template-columns:auto 1fr;gap:.6rem;padding:.65rem;border:1px solid #d9ddd7;border-radius:9px;background:#fbfcfa;color:#25322c;text-decoration:none}.panji-directory-number{display:grid;place-items:center;min-width:31px;height:31px;border-radius:999px;background:#1d5b43;color:#fff;font-weight:900}.panji-directory-link span:last-child{display:grid;gap:.2rem}.panji-directory-link strong{font-size:.82rem}.panji-directory-link small{font-size:.7rem;color:#647069}@media(max-width:760px){.panji-live-directory{width:min(100% - 1rem,1480px);padding:.8rem}.panji-directory-head{grid-template-columns:1fr}.panji-directory-grid{grid-template-columns:1fr}}</style><header class="panji-directory-head"><div><p class="panji-directory-eyebrow">${copy.eyebrow}</p><h2 id="decoding-panji-directory-title">${copy.title}</h2><p class="panji-directory-intro">${copy.intro}</p></div><div class="panji-directory-badge"><strong>${isMai ? toDev(panji.length) : panji.length}</strong><span>${copy.total}</span></div></header><nav class="panji-directory-jump" aria-label="${copy.jump}">${jumps}</nav><div class="panji-directory-volumes">${cards}</div></section>`;
}

for (const homepage of homepages) {
  if (!existsSync(homepage.path)) throw new Error(`Missing built homepage: ${homepage.path}`);
  let page = readFileSync(homepage.path, 'utf8');
  if (!anchorPattern.test(page)) throw new Error(`Decoding Panji insertion anchor missing from ${homepage.path}`);
  page = page.replace(anchorPattern, render(homepage.locale));
  writeFileSync(homepage.path, page);
}
for (const homepage of homepages) {
  const page = readFileSync(homepage.path, 'utf8');
  if (!page.includes(`data-panji-article-count="${panji.length}"`)) throw new Error(`Panji count marker missing from ${homepage.path}`);
  for (const record of panji) if (!page.includes(`href="${record.canonical}"`)) throw new Error(`Decoding Panji chapter missing from ${homepage.path}: ${record.canonical}`);
  for (const record of core) if (!page.includes(`href="${record.canonical}"`)) throw new Error(`Verified 522-core link missing from ${homepage.path}: ${record.canonical}`);
}
const expectedLinks = new Set(panji.map((record) => record.canonical));
const extractLinks = (page) => new Set(
  [...page.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith(PANJI_PREFIX) && href !== PANJI_PREFIX),
);
const rootLinks = extractLinks(readFileSync(homepages[0].path, 'utf8'));
const enLinks = extractLinks(readFileSync(homepages[1].path, 'utf8'));
if (rootLinks.size !== expectedLinks.size || enLinks.size !== expectedLinks.size) throw new Error(`Bilingual Panji link-set mismatch: root=${rootLinks.size}, en=${enLinks.size}, inventory=${expectedLinks.size}`);
for (const link of expectedLinks) {
  if (!rootLinks.has(link)) throw new Error(`Maithili homepage missing ${link}`);
  if (!enLinks.has(link)) throw new Error(`English homepage missing ${link}`);
}
for (const link of rootLinks) if (!expectedLinks.has(link)) throw new Error(`Maithili homepage exposes an unexpected Panji chapter URL: ${link}`);
for (const link of enLinks) if (!expectedLinks.has(link)) throw new Error(`English homepage exposes an unexpected Panji chapter URL: ${link}`);
console.log(`Injected exact canonical Decoding Panji chapter directory: ${panji.length} links on each homepage; all 522 core links preserved.`);
