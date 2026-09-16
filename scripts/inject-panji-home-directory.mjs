import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const panjiInventoryPath = 'app/generated/panji-article-inventory.json';
const coreInventoryPath = 'app/generated/research-article-inventory.json';
const homepages = [
  { path: 'dist/client/index.html', locale: 'mai' },
  { path: 'dist/client/en/index.html', locale: 'en' },
];
const anchorPattern = /<div[^>]*id="decoding-panji-directory-anchor"[^>]*><\/div>/;
const roman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
const devanagari = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const toDev = (value) => String(value).split('').map((char) => (/\d/.test(char) ? devanagari[Number(char)] : char)).join('');

if (!existsSync(panjiInventoryPath)) throw new Error(`Missing ${panjiInventoryPath}.`);
if (!existsSync(coreInventoryPath)) throw new Error(`Missing ${coreInventoryPath}.`);
const panji = JSON.parse(readFileSync(panjiInventoryPath, 'utf8'));
const core = JSON.parse(readFileSync(coreInventoryPath, 'utf8'));
if (!Array.isArray(panji) || panji.length < 1) throw new Error('Decoding Panji inventory is empty.');
if (!Array.isArray(core) || core.length !== 522) throw new Error('The verified 522-record core inventory is unavailable.');

function render(locale) {
  const isMai = locale === 'mai';
  const copy = isMai
    ? {
        eyebrow: 'DECODING PANJI · पूर्ण लाइव विद्वत्-कड़ी-सूची',
        title: 'Decoding Panji खण्ड I–VI',
        intro: `छओ खण्डक स्रोत-सत्यापित विद्वत् HTML पन्नाक पूर्ण सूची। खण्ड I केँ केवल औपचारिक अध्याय-संख्यामे सीमित नहि कएल गेल अछि; ओकर स्वतंत्र शोध-खंड आ उपयोगी अनुबन्ध/परिशिष्ट सेहो स्रोतक वास्तविक संरचना अनुसार समाहित अछि। छोट कृत्रिम पन्ना बनाओल नहि गेल अछि।`,
        total: 'कुल लाइव पन्ना',
        volume: 'खण्ड',
        articles: 'विद्वत् पन्ना',
        source: 'मूल स्रोत PDF',
        open: 'सभ कड़ी देखू',
        jump: 'खण्ड पर जाउ',
      }
    : {
        eyebrow: 'DECODING PANJI · COMPLETE LIVE SCHOLARLY DIRECTORY',
        title: 'Decoding Panji — Volumes I–VI',
        intro: `Complete source-verified directory of the six-volume scholarly HTML corpus. Volume I is not forced into a chapter-only count: its independent research sections and substantive annexural/appendix material are retained where the source supports them, while thin structural fragments are merged rather than inflated into artificial pages.`,
        total: 'live pages',
        volume: 'Volume',
        articles: 'scholarly pages',
        source: 'Source PDF',
        open: 'Show all links',
        jump: 'Jump to volume',
      };

  const groups = Array.from({ length: 6 }, (_, index) => {
    const volume = index + 1;
    return [volume, panji.filter((record) => record.volume === volume)];
  });

  const volumeCards = groups.map(([volume, records]) => {
    if (records.length === 0) throw new Error(`No Decoding Panji records for Volume ${volume}.`);
    const source = records[0].source_html;
    const linkItems = records.map((record, index) => {
      const number = isMai ? toDev(index + 1) : index + 1;
      const kind = record.kind === 'appendix' ? (isMai ? 'परिशिष्ट' : 'Appendix') : record.kind === 'chapter' ? (isMai ? 'अध्याय' : 'Chapter') : (isMai ? 'शोध-खंड' : 'Research section');
      return `<a class="panji-directory-link" href="${esc(record.canonical)}"><span class="panji-directory-number">${number}</span><span><strong>${esc(record.title)}</strong><small>${kind} · PDF pp. ${esc(record.source_pages)}</small></span></a>`;
    }).join('');
    const count = isMai ? toDev(records.length) : records.length;
    return `<details class="panji-directory-volume" id="decoding-panji-volume-${volume}"${volume === 1 ? ' open' : ''}>
      <summary><span><strong>${copy.volume} ${roman[volume]}</strong><small>${count} ${copy.articles}</small></span><span class="panji-directory-summary-action">${copy.open}</span></summary>
      <div class="panji-directory-volume-tools"><a href="${esc(source)}">${copy.source} · ${copy.volume} ${roman[volume]}</a></div>
      <div class="panji-directory-grid">${linkItems}</div>
    </details>`;
  }).join('');

  const jumpLinks = groups.map(([volume, records]) => `<a href="#decoding-panji-volume-${volume}">${copy.volume} ${roman[volume]} · ${isMai ? toDev(records.length) : records.length}</a>`).join('');
  const total = isMai ? toDev(panji.length) : panji.length;

  return `<section class="panji-live-directory" id="decoding-panji-live-directory" data-decoding-panji-directory="true" data-panji-article-count="${panji.length}" lang="${locale}" aria-labelledby="decoding-panji-directory-title">
<style>
.panji-live-directory{width:min(1480px,calc(100% - 2rem));margin:1.5rem auto 2.75rem;padding:clamp(1rem,2.5vw,2rem);border:1px solid #cbb88b;border-radius:18px;background:linear-gradient(180deg,#fffdf7 0%,#f4eee0 100%);box-shadow:0 16px 40px #101a2d14}.panji-directory-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:start}.panji-directory-eyebrow{margin:0 0 .35rem;color:#8a4b0f;font-size:.74rem;font-weight:900;letter-spacing:.1em}.panji-directory-head h2{margin:0;color:#13233a;font:800 clamp(1.8rem,3vw,2.8rem) Georgia,serif;line-height:1.12}.panji-directory-intro{max-width:88ch;margin:.7rem 0 0;color:#465048}.panji-directory-badge{display:grid;justify-items:center;min-width:120px;padding:.8rem 1rem;border:1px solid #b78a39;border-radius:14px;background:#fff;color:#13233a}.panji-directory-badge strong{font:800 1.7rem Georgia,serif}.panji-directory-badge span{font-size:.73rem;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.panji-directory-jump{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;margin:1rem 0 1.2rem}.panji-directory-jump strong{font-size:.75rem;color:#5c635f;text-transform:uppercase;letter-spacing:.06em}.panji-directory-jump a,.panji-directory-volume-tools a{display:inline-flex;min-height:36px;align-items:center;padding:.4rem .7rem;border:1px solid #cdbd9d;border-radius:999px;background:#fff;color:#5f3b12;font-size:.78rem;font-weight:850;text-decoration:none}.panji-directory-volumes{display:grid;gap:.8rem}.panji-directory-volume{border:1px solid #d8d0bd;border-radius:14px;background:#fff;overflow:hidden}.panji-directory-volume summary{cursor:pointer;display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:1rem 1.1rem;background:linear-gradient(90deg,#fff9ea,#f7f2e7);color:#13233a}.panji-directory-volume summary>span:first-child{display:grid;gap:.15rem}.panji-directory-volume summary strong{font:800 1.18rem Georgia,serif}.panji-directory-volume summary small{color:#59635d;font-weight:750}.panji-directory-summary-action{font-size:.75rem;font-weight:850;color:#7a4a13}.panji-directory-volume-tools{padding:.75rem 1rem 0}.panji-directory-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:.5rem;padding:1rem}.panji-directory-link{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.65rem;align-items:start;min-height:62px;padding:.65rem;border:1px solid #d9ddd7;border-radius:9px;background:#fbfcfa;color:#25322c;text-decoration:none}.panji-directory-link:hover{border-color:#aa7925;background:#fff8e8}.panji-directory-number{display:grid;place-items:center;min-width:30px;height:30px;border-radius:999px;background:#1d5b43;color:#fff;font-size:.72rem;font-weight:900}.panji-directory-link span:last-child{display:grid;gap:.18rem}.panji-directory-link strong{font-size:.82rem;line-height:1.28}.panji-directory-link small{color:#647069;font-size:.7rem;line-height:1.25}@media(max-width:760px){.panji-live-directory{width:min(100% - 1rem,1480px);padding:.8rem;border-radius:12px}.panji-directory-head{grid-template-columns:1fr}.panji-directory-badge{justify-self:start;grid-auto-flow:column;gap:.45rem;align-items:baseline;min-width:0}.panji-directory-grid{grid-template-columns:1fr;padding:.75rem}}
</style>
<header class="panji-directory-head"><div><p class="panji-directory-eyebrow">${copy.eyebrow}</p><h2 id="decoding-panji-directory-title">${copy.title}</h2><p class="panji-directory-intro">${copy.intro}</p></div><div class="panji-directory-badge" aria-label="${copy.total}: ${panji.length}"><strong>${total}</strong><span>${copy.total}</span></div></header>
<nav class="panji-directory-jump" aria-label="${copy.jump}"><strong>${copy.jump}</strong>${jumpLinks}</nav>
<div class="panji-directory-volumes">${volumeCards}</div>
</section>`;
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
  for (const record of panji) {
    if (!page.includes(`href="${record.canonical}"`)) throw new Error(`Decoding Panji link missing from ${homepage.path}: ${record.canonical}`);
  }
  for (const record of core) {
    if (!page.includes(`href="${record.canonical}"`)) throw new Error(`Verified 522-core link missing from ${homepage.path}: ${record.canonical}`);
  }
}

const extractPanjiLinks = (page) => new Set([...page.matchAll(/href="(https:\/\/videha-ejournal\.github\.io\/mithila-vajji-anga\/research-articles\/decoding-panji\/volume-[^"]+)"/g)].map((match) => match[1]));
const rootLinks = extractPanjiLinks(readFileSync(homepages[0].path, 'utf8'));
const englishLinks = extractPanjiLinks(readFileSync(homepages[1].path, 'utf8'));
if (rootLinks.size !== panji.length || englishLinks.size !== panji.length) {
  throw new Error(`Homepage Panji link-set size mismatch: root=${rootLinks.size}, en=${englishLinks.size}, inventory=${panji.length}`);
}
for (const link of rootLinks) if (!englishLinks.has(link)) throw new Error(`English homepage is missing Panji link present on Maithili homepage: ${link}`);
for (const link of englishLinks) if (!rootLinks.has(link)) throw new Error(`Maithili homepage is missing Panji link present on English homepage: ${link}`);

console.log(`Injected complete Decoding Panji directory into both bilingual homepages: ${panji.length} links on each page; verified all 522 core links remain present.`);
