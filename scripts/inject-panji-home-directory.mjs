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
const PANJI_ART = 'https://videha-ejournal.github.io/mithila-vajji-anga/assets/book-covers/decoding-the-panji.webp';
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
    eyebrow: 'विशेष शोध-द्वार · DECODING PANJI',
    title: 'Decoding Panji · खण्ड I–VI',
    intro: 'छओ खण्डक २४७ स्रोत-सत्यापित औपचारिक अध्याय आब स्थायी HTML पन्ना रूपमे उपलब्ध अछि। प्रत्येक अध्याय अपन canonical URL, स्रोत-सन्दर्भ आ मूल PDF पृष्ठ-सूचनाक संग देल गेल अछि।',
    rule: 'एक औपचारिक पुस्तक-अध्याय = एक HTML पन्ना। भूमिका, भाग-शीर्षक, परिशिष्ट, अनुबन्ध आ आन पुस्तक-उपकरण अलग अध्याय-पन्ना नहि बनैत अछि।',
    total: 'अध्याय-पन्ना', volume: 'खण्ड', chapter: 'अध्याय', source: 'मूल स्रोत PDF', open: 'अध्यायसभ देखू', jump: 'खण्ड चुनू',
    complete: 'सम्पूर्ण २४७-अध्याय सूची खोलू', permanent: 'स्थायी अध्याय-पथ', volumes: 'खण्ड', chapterPath: 'समग्र अध्याय',
  } : {
    eyebrow: 'FEATURED RESEARCH GATEWAY · DECODING PANJI',
    title: 'Decoding Panji · Volumes I–VI',
    intro: 'All 247 source-verified formal chapters across the six volumes are available as permanent HTML pages. Every chapter has its own canonical URL, source citation and source-PDF page locator.',
    rule: 'Governing rule: one formal book chapter equals one HTML page. Front matter, part headings, appendices, annexures and other book apparatus do not create extra chapter pages.',
    total: 'chapter pages', volume: 'Volume', chapter: 'Chapter', source: 'Source PDF', open: 'Show chapters', jump: 'Choose a volume',
    complete: 'Open the complete 247-chapter index', permanent: 'permanent chapter routes', volumes: 'volumes', chapterPath: 'global chapters',
  };
  const groups = Array.from({ length: 6 }, (_, i) => [i + 1, panji.filter((r) => r.volume === i + 1).sort((a,b) => a.chapter - b.chapter)]);
  const display = (value) => isMai ? toDev(value) : value;
  const cards = groups.map(([volume, records]) => {
    const firstGlobal = records[0].global_chapter;
    const lastGlobal = records.at(-1).global_chapter;
    const links = records.map((record) => `<a class="panji-directory-link" href="${esc(record.canonical)}"><span class="panji-directory-number" aria-hidden="true">${display(record.chapter)}</span><span><strong>${copy.chapter} ${display(record.chapter)}: ${esc(record.title)}</strong><small>PDF pp. ${esc(record.source_pages)} · ${copy.chapterPath} ${display(record.global_chapter)}</small></span></a>`).join('');
    return `<details class="panji-directory-volume" id="decoding-panji-volume-${volume}"${volume === 1 ? ' open' : ''}><summary><span class="panji-volume-title"><strong>${copy.volume} ${roman[volume]}</strong><small>${display(records.length)} ${copy.total} · ${display(firstGlobal)}–${display(lastGlobal)}</small></span><span class="panji-volume-open">${copy.open}</span></summary><div class="panji-directory-volume-tools"><a href="${esc(records[0].source_html)}">${copy.source} · ${copy.volume} ${roman[volume]}</a></div><div class="panji-directory-grid">${links}</div></details>`;
  }).join('');
  const jumps = groups.map(([v, records]) => {
    const firstGlobal = records[0].global_chapter;
    const lastGlobal = records.at(-1).global_chapter;
    return `<a href="#decoding-panji-volume-${v}"><strong>${copy.volume} ${roman[v]}</strong><span>${display(records.length)} ${copy.total}</span><small>${display(firstGlobal)}–${display(lastGlobal)}</small></a>`;
  }).join('');
  return `<section class="panji-live-directory" id="decoding-panji-live-directory" data-decoding-panji-directory="true" data-panji-article-count="${panji.length}" lang="${locale}" aria-labelledby="decoding-panji-directory-title"><style>.panji-live-directory{position:relative;width:min(1480px,calc(100% - 2rem));margin:.85rem auto 2.5rem;padding:clamp(1rem,2.6vw,2.25rem);border:1px solid #b99350;border-radius:24px;background:radial-gradient(circle at 95% 0,#f0dfb8 0,transparent 28%),linear-gradient(180deg,#fffdf8 0,#f7f0e2 100%);box-shadow:0 22px 60px rgba(33,44,38,.14);color:#23302a}.panji-live-directory:before{content:"";position:absolute;inset:0 auto 0 0;width:6px;border-radius:24px 0 0 24px;background:linear-gradient(180deg,#8f4b1e,#1d5b43)}.panji-directory-head{display:grid;grid-template-columns:minmax(118px,165px) minmax(0,1fr) minmax(125px,155px);gap:clamp(1rem,2.4vw,2rem);align-items:start}.panji-directory-cover{margin:0}.panji-directory-cover img{display:block;width:100%;height:auto;border:1px solid #cdbb96;border-radius:14px;box-shadow:0 13px 30px rgba(42,39,30,.18)}.panji-directory-copy h2{margin:.15rem 0 .65rem;color:#13233a;font:800 clamp(2rem,3.4vw,3.3rem)/1.08 Georgia,serif;letter-spacing:-.025em}.panji-directory-eyebrow{margin:0;font-size:.76rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#874511}.panji-directory-intro{max-width:82ch;margin:.35rem 0;font-size:clamp(1rem,1.35vw,1.12rem);line-height:1.68}.panji-directory-rule{max-width:88ch;margin:.35rem 0;color:#59655f;font-size:.9rem;line-height:1.6}.panji-directory-primary{display:inline-flex;align-items:center;gap:.45rem;margin-top:.7rem;padding:.72rem 1rem;border-radius:999px;background:#173e31;color:#fff!important;font-weight:850;text-decoration:none;box-shadow:0 8px 20px rgba(23,62,49,.2)}.panji-directory-primary:hover,.panji-directory-primary:focus-visible{background:#102e25;text-decoration:underline}.panji-directory-badge{padding:1rem .8rem;border:1px solid #b78a39;border-radius:16px;background:rgba(255,255,255,.88);text-align:center;box-shadow:0 8px 22px rgba(98,70,28,.1)}.panji-directory-badge strong{display:block;color:#173e31;font:900 clamp(2.2rem,4vw,3.2rem)/1 Georgia,serif}.panji-directory-badge span{display:block;margin-top:.35rem;font-size:.78rem;font-weight:800;color:#5d492b}.panji-directory-metrics{display:flex;flex-wrap:wrap;gap:.5rem;margin:.85rem 0 0}.panji-directory-metrics span{padding:.32rem .58rem;border:1px solid #d5c49f;border-radius:999px;background:#fffaf0;color:#57452b;font-size:.78rem;font-weight:750}.panji-directory-jump{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.55rem;margin:1.35rem 0 1rem}.panji-directory-jump a{display:grid;gap:.12rem;padding:.7rem .75rem;border:1px solid #cdbd9d;border-radius:12px;background:rgba(255,255,255,.9);color:#4f3518;text-decoration:none;box-shadow:0 4px 12px rgba(72,56,31,.06)}.panji-directory-jump a:hover,.panji-directory-jump a:focus-visible{border-color:#8f4b1e;background:#fff}.panji-directory-jump a strong{font-size:.9rem}.panji-directory-jump a span,.panji-directory-jump a small{font-size:.72rem;color:#69726d}.panji-directory-volumes{display:grid;gap:.8rem}.panji-directory-volume{border:1px solid #d5c9b1;border-radius:14px;background:rgba(255,255,255,.94);overflow:hidden}.panji-directory-volume summary{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.1rem;background:linear-gradient(90deg,#fff9ea,#f6efe0);cursor:pointer;list-style-position:inside}.panji-directory-volume summary:hover{background:#fff6df}.panji-volume-title{display:grid;gap:.12rem}.panji-volume-title strong{font:800 1.02rem Georgia,serif;color:#203a31}.panji-volume-title small{color:#69726d}.panji-volume-open{padding:.3rem .55rem;border:1px solid #d8c49e;border-radius:999px;background:#fff;font-size:.73rem;font-weight:800;color:#724218}.panji-directory-volume-tools{padding:.7rem 1rem 0}.panji-directory-volume-tools a{display:inline-flex;padding:.35rem .65rem;border:1px solid #cdbd9d;border-radius:999px;background:#fff;color:#5f3b12;text-decoration:none;font-size:.76rem;font-weight:750}.panji-directory-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:.55rem;padding:1rem}.panji-directory-link{display:grid;grid-template-columns:auto 1fr;gap:.65rem;padding:.72rem;border:1px solid #d9ddd7;border-radius:10px;background:#fbfcfa;color:#25322c;text-decoration:none;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease}.panji-directory-link:hover,.panji-directory-link:focus-visible{transform:translateY(-1px);border-color:#8ea99d;box-shadow:0 6px 16px rgba(29,91,67,.08);background:#fff}.panji-directory-number{display:grid;place-items:center;min-width:33px;height:33px;border-radius:999px;background:#1d5b43;color:#fff;font-weight:900}.panji-directory-link span:last-child{display:grid;gap:.22rem;min-width:0}.panji-directory-link strong{font-size:.82rem;line-height:1.4}.panji-directory-link small{font-size:.7rem;color:#647069}@media(max-width:980px){.panji-directory-head{grid-template-columns:120px minmax(0,1fr)}.panji-directory-badge{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:.6rem;padding:.65rem}.panji-directory-badge strong{font-size:2rem}.panji-directory-badge span{margin:0}.panji-directory-jump{grid-template-columns:repeat(3,1fr)}}@media(max-width:640px){.panji-live-directory{width:min(100% - .8rem,1480px);padding:.9rem;border-radius:18px}.panji-directory-head{grid-template-columns:86px minmax(0,1fr);gap:.8rem}.panji-directory-copy h2{font-size:1.65rem}.panji-directory-eyebrow{font-size:.65rem;letter-spacing:.08em}.panji-directory-intro{font-size:.95rem}.panji-directory-rule{font-size:.82rem}.panji-directory-primary{grid-column:1/-1}.panji-directory-jump{grid-template-columns:repeat(2,1fr)}.panji-directory-grid{grid-template-columns:1fr;padding:.75rem}.panji-volume-open{display:none}}@media(prefers-reduced-motion:reduce){.panji-directory-link{transition:none}.panji-directory-link:hover,.panji-directory-link:focus-visible{transform:none}}</style><header class="panji-directory-head"><figure class="panji-directory-cover"><img src="${PANJI_ART}" alt="Decoding the Panji publication artwork" loading="lazy" decoding="async"></figure><div class="panji-directory-copy"><p class="panji-directory-eyebrow">${copy.eyebrow}</p><h2 id="decoding-panji-directory-title">${copy.title}</h2><p class="panji-directory-intro">${copy.intro}</p><p class="panji-directory-rule">${copy.rule}</p><div class="panji-directory-metrics" aria-label="Decoding Panji corpus summary"><span>${display(6)} ${copy.volumes}</span><span>${display(panji.length)} ${copy.permanent}</span></div><a class="panji-directory-primary" href="${PANJI_PREFIX}">${copy.complete} →</a></div><div class="panji-directory-badge"><strong>${display(panji.length)}</strong><span>${copy.total}</span></div></header><nav class="panji-directory-jump" aria-label="${copy.jump}">${jumps}</nav><div class="panji-directory-volumes">${cards}</div></section>`;
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
