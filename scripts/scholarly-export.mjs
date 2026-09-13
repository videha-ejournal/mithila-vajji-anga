import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'dist/client');
const SITE_ORIGIN = 'https://videha-ejournal.github.io';
const SITE_PATH = '/mithila-vajji-anga';
const SITE_URL = `${SITE_ORIGIN}${SITE_PATH}`;
const RELEASE = '2026.09';
const UPDATED_ISO = '2026-09-13';
const UPDATED_HUMAN = '13 September 2026';
const AUTHOR = 'Gajendra Thakur';
const PUBLISHER = 'Videha Maithili eJournal';
const ISSN = '2229-547X';
const DATA_LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

if (!existsSync(OUT)) {
  throw new Error('dist/client does not exist. Run the static build before scholarly-export.mjs.');
}

const ensureDir = (path) => mkdirSync(path, { recursive: true });
const write = (relativePath, content) => {
  const path = join(OUT, relativePath);
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf8');
};
const readJson = (relativePath, fallback = {}) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
  } catch (error) {
    console.warn(`Could not read ${relativePath}:`, error instanceof Error ? error.message : error);
    return fallback;
  }
};
const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
const plain = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'record';
const safeId = (value, fallback) => slugify(value || fallback);
const jsonForHtml = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

function extractConstArray(source, name) {
  const marker = `const ${name} = [`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return [];
  const start = source.indexOf('[', markerIndex);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        const literal = source.slice(start, index + 1);
        try {
          return Function(`"use strict"; return (${literal});`)();
        } catch (error) {
          console.warn(`Could not parse ${name} from app/page.tsx:`, error instanceof Error ? error.message : error);
          return [];
        }
      }
    }
  }
  return [];
}

const researchData = readJson('app/research-data.json', { political: [], social: [] });
const deepData = readJson('app/deep-data.json', { philosophyChapters: [], people: [] });
const volumeTwoIdeas = readJson('app/ideas-volume2.json', []);
const libraryData = readJson('app/library-data.json', []);
const learningData = readJson('app/learning-data.json', {});
const pageSource = readFileSync(join(ROOT, 'app/page.tsx'), 'utf8');
const curatedPlaces = extractConstArray(pageSource, 'places');
const chronology = extractConstArray(pageSource, 'chronology');

const normaliseRecord = (record) => ({
  id: safeId(record.id, record.title),
  type: record.type,
  title: plain(record.title),
  subtitle: plain(record.subtitle),
  summary: plain(record.summary),
  status: plain(record.status),
  source: plain(record.source),
  evidence: plain(record.evidence),
  period: plain(record.period),
  region: plain(record.region),
  country: plain(record.country),
  pages: plain(record.pages),
  number: record.number ?? null,
  volume: plain(record.volume),
  collection: plain(record.collection),
  sections: Array.isArray(record.sections) ? record.sections.map(plain).filter(Boolean) : [],
  purvapaksha: plain(record.purvapaksha),
  uttarapaksha: plain(record.uttarapaksha),
  synthesis: plain(record.synthesis),
  links: plain(record.links),
});

const histories = [...(researchData.political ?? []), ...(researchData.social ?? [])].map((item) =>
  normaliseRecord({
    ...item,
    type: 'history',
    subtitle: `${item.collection ?? 'History'} · ${item.volume ?? ''} · Chapter ${item.number ?? ''}`,
    source: `${item.collection ?? 'History'} · ${item.volume ?? ''} · chapter ${item.number ?? ''}`,
    evidence: item.status === 'Planned' ? 'Approved plan entry' : 'Supplied research manuscript',
  }),
);
const volumeOne = (deepData.philosophyChapters ?? []).map((item) =>
  normaliseRecord({
    ...item,
    type: 'idea',
    subtitle: `Parallel Philosophy · Volume I · Chapter ${item.number ?? ''}`,
    status: 'Available',
    volume: 'Volume I',
    source: `Gajendra Thakur’s Parallel Philosophy · Volume I · Chapter ${item.number ?? ''}`,
    evidence: 'Supplied bilingual philosophy chapter',
  }),
);
const volumeTwoRaw = Array.isArray(volumeTwoIdeas) ? volumeTwoIdeas : volumeTwoIdeas.ideas ?? [];
const volumeTwo = volumeTwoRaw.map((item) =>
  normaliseRecord({
    ...item,
    type: 'idea',
    subtitle: `Parallel Philosophy · Volume II · Chapter ${item.number ?? ''}`,
    volume: 'Volume II',
    evidence: item.status === 'Planned' ? 'Approved plan entry' : 'Supplied philosophy chapter',
  }),
);
const people = (deepData.people ?? []).map((item) =>
  normaliseRecord({
    ...item,
    type: 'person',
    title: item.name,
    subtitle: `${item.field ?? ''}${item.era ? ` · ${item.era}` : ''}`,
    summary: item.description,
    status: 'Indexed',
    evidence: 'Indexed from the supplied research corpus',
  }),
);
const textsRaw = Array.isArray(libraryData) ? libraryData : libraryData.works ?? [];
const texts = textsRaw.map((item) =>
  normaliseRecord({
    ...item,
    type: 'text',
    subtitle: `${item.shelf ?? 'Videha Library'} · ${item.sequence ?? ''}`,
    summary: item.description,
    status: 'Available',
    source: item.creator ?? AUTHOR,
    evidence: 'Videha library record',
    sections: item.structure ?? [],
  }),
);
const places = curatedPlaces.map((item) =>
  normaliseRecord({
    ...item,
    type: 'place',
    title: item.name,
    subtitle: `${item.country ?? ''}${item.region ? ` · ${item.region}` : ''}`,
    summary: item.text,
    status: 'Curated',
    source: item.links,
    evidence: 'Curated orientation and heritage record',
  }),
);
const chronologyRecords = chronology.map((item, index) =>
  normaliseRecord({
    id: `${String(index + 1).padStart(3, '0')}-${slugify(item.title)}`,
    type: 'chronology',
    title: item.title,
    subtitle: `${item.date ?? ''}${item.region ? ` · ${item.region}` : ''}`,
    summary: item.text,
    status: 'Cited anchor',
    source: item.evidence,
    evidence: item.evidence,
    period: item.date,
    region: item.region,
    number: item.year,
  }),
);

const records = [...histories, ...volumeOne, ...volumeTwo, ...people, ...texts, ...places, ...chronologyRecords]
  .map((record) => ({
    ...record,
    url: `${SITE_URL}/records/${record.type}/${record.id}/`,
  }))
  .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));

const recordTypes = [
  ['history', 'Histories'],
  ['idea', 'Ideas & debates'],
  ['person', 'People'],
  ['place', 'Places'],
  ['text', 'Texts & collections'],
  ['chronology', 'Chronology'],
];

const recordByKey = new Map(records.map((record) => [`${record.type}:${record.id}`, record]));

const evidenceBadges = (record) => {
  const sourceText = `${record.summary} ${record.evidence} ${record.source}`.toLowerCase();
  const badges = [];
  if (record.status) badges.push(record.status);
  if (record.evidence) badges.push(record.evidence);
  if (/debated|disputed|uncertain|caution|qualified|not automatically|must be distinguished|traditional identification/.test(sourceText)) {
    badges.push('Contested / qualified');
  }
  if (/\bc\.|circa|approx|about a century|range|horizon/.test(sourceText)) badges.push('Approximate / periodized');
  return [...new Set(badges)].slice(0, 4);
};

const citationText = (record) =>
  `${AUTHOR}. “${record.title}.” Mithila–Vajji–Anga: Videha Historical Research. ${PUBLISHER}, 2026. Updated ${UPDATED_HUMAN}. ${record.url}`;
const citationKey = (record) => `thakur2026_${slugify(record.title).replaceAll('-', '_').slice(0, 48)}`;
const bibtex = (record) => `@online{${citationKey(record)},\n  author = {Thakur, Gajendra},\n  title = {${record.title.replaceAll('{', '').replaceAll('}', '')}},\n  year = {2026},\n  publisher = {${PUBLISHER}},\n  url = {${record.url}},\n  note = {ISSN ${ISSN}; updated ${UPDATED_HUMAN}}\n}\n`;
const ris = (record) => `TY  - ELEC\nAU  - Thakur, Gajendra\nTI  - ${record.title}\nT2  - Mithila–Vajji–Anga: Videha Historical Research\nPB  - ${PUBLISHER}\nPY  - 2026\nSN  - ${ISSN}\nUR  - ${record.url}\nY2  - ${UPDATED_ISO}\nER  - \n`;
const csl = (record) => ({
  id: citationKey(record),
  type: record.type === 'text' ? 'book' : 'webpage',
  title: record.title,
  author: [{ family: 'Thakur', given: 'Gajendra' }],
  container-title: 'Mithila–Vajji–Anga: Videha Historical Research',
  publisher: PUBLISHER,
  issued: { 'date-parts': [[2026]] },
  URL: record.url,
  ISSN,
  language: 'en',
  note: `Updated ${UPDATED_HUMAN}`,
});

const scholarlyCss = `
:root{--ink:#152238;--paper:#fbfaf6;--navy:#0d2742;--saffron:#b45d1a;--line:#d8d4ca;--muted:#5d6773;--green:#266445;--max:1120px;color-scheme:light}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:#174c7d}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #e39b45;outline-offset:3px}.sitebar{background:var(--navy);color:white}.sitebar>div{max-width:var(--max);margin:auto;padding:.8rem 1.2rem;display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}.sitebar a{color:white;text-decoration:none}.sitebar nav{display:flex;gap:.85rem;flex-wrap:wrap}.wrap{max-width:var(--max);margin:auto;padding:2rem 1.2rem 5rem}.eyebrow{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:var(--saffron)}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;line-height:1.17}h1{font-size:clamp(2.1rem,6vw,4.7rem);margin:.3rem 0 1rem;max-width:18ch}h2{font-size:clamp(1.5rem,3vw,2.4rem)}.lead{font:1.18rem/1.7 Georgia,"Times New Roman",serif;max-width:78ch}.badges{display:flex;gap:.45rem;flex-wrap:wrap;margin:1rem 0 2rem}.badge{border:1px solid var(--line);background:white;border-radius:999px;padding:.3rem .65rem;font-size:.78rem;font-weight:700}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.8rem;margin:1.5rem 0}.meta div{background:white;border:1px solid var(--line);padding:1rem}.meta dt{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.meta dd{margin:.3rem 0 0;font-weight:700}.card{background:white;border:1px solid var(--line);border-radius:14px;padding:1.2rem 1.35rem;margin:1.2rem 0}.card.warning{border-left:5px solid var(--saffron)}.card.good{border-left:5px solid var(--green)}.sections{columns:2;column-gap:2rem}.sections li{break-inside:avoid;margin:0 0 .45rem}.actions{display:flex;gap:.6rem;flex-wrap:wrap;margin:1.2rem 0}.actions a,.actions button{appearance:none;border:1px solid var(--navy);background:var(--navy);color:white;border-radius:8px;padding:.65rem .85rem;text-decoration:none;font:inherit;cursor:pointer}.actions a.secondary,.actions button.secondary{background:white;color:var(--navy)}.directory-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem}.directory-grid a{display:block;background:white;border:1px solid var(--line);border-radius:12px;padding:1rem;text-decoration:none}.directory-grid strong{display:block;font:700 1.25rem Georgia,serif;color:var(--ink)}.search-panel{background:white;border:1px solid var(--line);border-radius:14px;padding:1rem;margin:1.3rem 0}.search-row{display:grid;grid-template-columns:1fr auto;gap:.6rem}.search-row input,.search-row select,.compare-controls select{width:100%;padding:.7rem;border:1px solid #9ca4ad;border-radius:8px;background:white;font:inherit}.result-list{display:grid;gap:.55rem;margin-top:1rem}.result-list a{display:grid;gap:.15rem;padding:.75rem;border:1px solid var(--line);border-radius:9px;text-decoration:none;background:#fff}.result-list span{font-size:.75rem;text-transform:uppercase;color:var(--muted)}.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.compare-panel{background:white;border:1px solid var(--line);border-radius:12px;padding:1rem}.compare-controls{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.6rem;margin:1rem 0}.download-table{width:100%;border-collapse:collapse}.download-table th,.download-table td{text-align:left;padding:.65rem;border-bottom:1px solid var(--line)}footer{border-top:1px solid var(--line);padding:1.5rem 1.2rem;color:var(--muted)}footer>div{max-width:var(--max);margin:auto}.machine-note{font-size:.9rem;background:#fff6df;border:1px solid #e4c67a;padding:.7rem;border-radius:8px;margin-top:1rem}@media(max-width:760px){.sections{columns:1}.compare-grid,.compare-controls,.search-row{grid-template-columns:1fr}.sitebar>div{align-items:flex-start}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;
write('assets/scholarly.css', scholarlyCss);

const scholarlyJs = `
(() => {
  const base='${SITE_PATH}';
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(base+'/sw.js',{scope:base+'/'}).catch(()=>{}));}
  document.addEventListener('click',async(event)=>{
    const copy=event.target.closest('[data-copy-citation]');
    if(copy){const text=copy.getAttribute('data-copy-citation')||'';try{await navigator.clipboard.writeText(text);copy.textContent='Citation copied';setTimeout(()=>copy.textContent='Copy citation',1600);}catch{window.prompt('Copy citation',text);}}
    const share=event.target.closest('[data-share-url]');
    if(share){try{await navigator.clipboard.writeText(location.href);share.textContent='Link copied';setTimeout(()=>share.textContent='Copy shareable link',1600);}catch{window.prompt('Copy link',location.href);}}
  });
})();
`;
write('assets/scholarly.js', scholarlyJs);

function shell({ title, description, canonical, body, jsonLd, extraHead = '' }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:site_name" content="Mithila–Vajji–Anga"><meta name="twitter:card" content="summary"><meta name="citation_author" content="${AUTHOR}"><meta name="citation_journal_title" content="${PUBLISHER}"><meta name="citation_issn" content="${ISSN}"><meta name="citation_publication_date" content="2026"><meta name="citation_online_date" content="${UPDATED_ISO}"><link rel="manifest" href="${SITE_PATH}/manifest.webmanifest"><link rel="stylesheet" href="${SITE_PATH}/assets/scholarly.css">${extraHead}${jsonLd ? `<script type="application/ld+json">${jsonForHtml(jsonLd)}</script>` : ''}</head><body><div class="sitebar"><div><a href="${SITE_PATH}/"><strong>𑒧 Mithila–Vajji–Anga</strong></a><nav aria-label="Scholarly navigation"><a href="${SITE_PATH}/records/">Records</a><a href="${SITE_PATH}/compare/">Compare</a><a href="${SITE_PATH}/method/">Method</a><a href="${SITE_PATH}/data/">Data</a><a href="${SITE_PATH}/accessibility/">Accessibility</a></nav></div></div><main class="wrap">${body}</main><footer><div>© ${AUTHOR}, Editor, ${PUBLISHER} · ISSN ${ISSN}<p class="machine-note"><strong>Translation notice:</strong> machine-generated translations are convenience copies only. The source-controlled Videha text remains authoritative for citation.</p></div></footer><script src="${SITE_PATH}/assets/scholarly.js" defer></script></body></html>`;
}

function recordJsonLd(record) {
  const shared = {
    '@context': 'https://schema.org',
    name: record.title,
    url: record.url,
    author: { '@type': 'Person', name: AUTHOR },
    publisher: { '@type': 'Organization', name: PUBLISHER },
    dateModified: UPDATED_ISO,
    inLanguage: 'en',
    license: DATA_LICENSE,
  };
  if (record.type === 'person') return { ...shared, '@type': 'Person', description: record.summary };
  if (record.type === 'place') return { ...shared, '@type': 'Place', description: record.summary };
  if (record.type === 'text') return { ...shared, '@type': 'Book', description: record.summary };
  return { ...shared, '@type': 'ScholarlyArticle', headline: record.title, description: record.summary };
}

function recordPage(record) {
  const badges = evidenceBadges(record);
  const śrotriya = /śrotriya|srotriya/i.test(`${record.title} ${record.summary} ${record.sections.join(' ')}`);
  const sections = record.sections.length
    ? `<section class="card"><h2>Section index</h2><ol class="sections">${record.sections.map((section) => `<li>${escapeHtml(section)}</li>`).join('')}</ol></section>`
    : '';
  const debate = record.purvapaksha || record.uttarapaksha || record.synthesis
    ? `<section class="card"><h2>Structured debate</h2>${record.purvapaksha ? `<h3>Pūrvapakṣa</h3><p>${escapeHtml(record.purvapaksha)}</p>` : ''}${record.uttarapaksha ? `<h3>Uttarapakṣa</h3><p>${escapeHtml(record.uttarapaksha)}</p>` : ''}${record.synthesis ? `<h3>Parallel conclusion</h3><p>${escapeHtml(record.synthesis)}</p>` : ''}</section>`
    : '';
  const safeguard = śrotriya
    ? `<section class="card warning"><h2>Chronological safeguard</h2><p>Śrotriya/Srotriya is not treated here as a timeless medieval Maithil Brahmin sub-caste. In this archive the classification is dated to its later historical emergence, around 1800 CE, unless a source-controlled record demonstrates otherwise.</p></section>`
    : '';
  const citation = citationText(record);
  const body = `<p class="eyebrow">PERMANENT ${escapeHtml(record.type.toUpperCase())} RECORD · RELEASE ${RELEASE}</p><h1>${escapeHtml(record.title)}</h1>${record.subtitle ? `<p class="lead">${escapeHtml(record.subtitle)}</p>` : ''}<div class="badges">${badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join('')}</div><dl class="meta"><div><dt>Record ID</dt><dd>${escapeHtml(record.id)}</dd></div>${record.period ? `<div><dt>Period</dt><dd>${escapeHtml(record.period)}</dd></div>` : ''}${record.region ? `<div><dt>Region</dt><dd>${escapeHtml(record.region)}</dd></div>` : ''}${record.pages ? `<div><dt>Pages</dt><dd>${escapeHtml(record.pages)}</dd></div>` : ''}<div><dt>Updated</dt><dd>${UPDATED_HUMAN}</dd></div></dl>${record.summary ? `<section class="card"><h2>Research record</h2><p class="lead">${escapeHtml(record.summary)}</p></section>` : ''}${debate}${sections}${safeguard}<section class="card good"><h2>Scholarly apparatus</h2><p><strong>Evidence status:</strong> ${escapeHtml(record.evidence || record.status || 'Editorial record')}.</p>${record.source ? `<p><strong>Source / provenance:</strong> ${escapeHtml(record.source)}</p>` : ''}<p>Historical and interpretive claims should be read with the source register, chapter bibliography, uncertainty labels, and the archive’s method statement. Where interpretations compete, the record preserves qualification rather than converting inference into certainty.</p><div class="actions"><a href="${SITE_PATH}/method/" class="secondary">Read method</a><a href="${SITE_PATH}/records/${record.type}/" class="secondary">Browse ${escapeHtml(record.type)} records</a><a href="${SITE_PATH}/compare/?type=${encodeURIComponent(record.type)}&a=${encodeURIComponent(record.id)}" class="secondary">Compare this record</a></div></section><section class="card"><h2>Cite this record</h2><p>${escapeHtml(citation)}</p><div class="actions"><button data-copy-citation="${escapeHtml(citation)}">Copy citation</button><a class="secondary" href="./citation.bib">BibTeX</a><a class="secondary" href="./citation.ris">RIS</a><a class="secondary" href="./citation.csl.json">CSL-JSON</a><button class="secondary" data-share-url>Copy shareable link</button></div></section>`;
  return shell({
    title: `${record.title} | Mithila–Vajji–Anga`,
    description: record.summary.slice(0, 190) || record.subtitle || 'Permanent Videha research record.',
    canonical: record.url,
    body,
    jsonLd: recordJsonLd(record),
  });
}

for (const record of records) {
  const base = `records/${record.type}/${record.id}`;
  write(`${base}/index.html`, recordPage(record));
  write(`${base}/citation.bib`, bibtex(record));
  write(`${base}/citation.ris`, ris(record));
  write(`${base}/citation.csl.json`, `${JSON.stringify(csl(record), null, 2)}\n`);
}

for (const [type, label] of recordTypes) {
  const group = records.filter((record) => record.type === type);
  const body = `<p class="eyebrow">PERMANENT RECORD DIRECTORY</p><h1>${escapeHtml(label)}</h1><p class="lead">${group.length} source-controlled records with stable URLs, citation downloads, evidence labels, and comparison links.</p><div class="result-list">${group.map((record) => `<a href="${SITE_PATH}/records/${record.type}/${record.id}/"><span>${escapeHtml(record.subtitle || record.status)}</span><strong>${escapeHtml(record.title)}</strong></a>`).join('')}</div>`;
  write(`records/${type}/index.html`, shell({ title: `${label} | Mithila–Vajji–Anga`, description: `${group.length} permanent ${label.toLowerCase()} records.`, canonical: `${SITE_URL}/records/${type}/`, body, jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: label, url: `${SITE_URL}/records/${type}/` } }));
}

write('records-index.json', `${JSON.stringify(records, null, 2)}\n`);

const searchJs = `
(() => {
  const base='${SITE_PATH}';
  const input=document.querySelector('#record-search');
  const mode=document.querySelector('#search-mode');
  const type=document.querySelector('#search-type');
  const out=document.querySelector('#record-results');
  const count=document.querySelector('#record-count');
  const aliases={
    'विद्यापति':['vidyapati','vidyāpati'],'वैशाली':['vaishali','vaiśālī'],'मिथिला':['mithila'],'वज्जि':['vajji'],'अंग':['anga','aṅga'],'न्याय':['nyaya','nyāya'],'पञ्जी':['panji','pañjī'],'पंजी':['panji','pañjī'],'जनकपुर':['janakpur'],'दरभंगा':['darbhanga']
  };
  const norm=(v)=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  const esc=(v)=>String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  let records=[];
  const params=new URLSearchParams(location.search);
  input.value=params.get('q')||''; mode.value=params.get('mode')||'variants'; type.value=params.get('type')||'all';
  function expandedQuery(q){const direct=aliases[q.trim()]||[];return [q,...direct].map(norm).filter(Boolean)}
  function render(){
    const q=input.value.trim(); const needles=mode.value==='variants'?expandedQuery(q):[norm(q)];
    const filtered=records.filter(r=>type.value==='all'||r.type===type.value).filter(r=>{
      if(!q)return true;
      const title=norm(r.title); const hay=norm([r.title,r.subtitle,r.summary,r.source,r.region,r.period,(r.sections||[]).join(' ')].join(' '));
      if(mode.value==='exact')return title===norm(q);
      if(mode.value==='broad')return hay.includes(norm(q));
      return needles.some(n=>hay.includes(n));
    }).slice(0,100);
    count.textContent=filtered.length+(filtered.length===100?' shown':' matches');
    out.innerHTML=filtered.map(r=>'<a href="'+base+'/records/'+encodeURIComponent(r.type)+'/'+encodeURIComponent(r.id)+'/"><span>'+esc(r.type)+' · '+esc(r.subtitle||r.status)+'</span><strong>'+esc(r.title)+'</strong><small>'+esc((r.summary||'').slice(0,180))+'</small></a>').join('')||'<p>No matching records.</p>';
    const next=new URLSearchParams(location.search); q?next.set('q',q):next.delete('q'); next.set('mode',mode.value); type.value!=='all'?next.set('type',type.value):next.delete('type'); history.replaceState(null,'',location.pathname+(next.toString()?'?'+next.toString():'')+location.hash);
  }
  fetch(base+'/records-index.json').then(r=>r.json()).then(data=>{records=data;render();});
  [input,mode,type].forEach(el=>el.addEventListener(el===input?'input':'change',render));
})();
`;
write('assets/records-search.js', searchJs);

const recordsBody = `<p class="eyebrow">SCHOLARLY RECORD DIRECTORY</p><h1>Permanent research records</h1><p class="lead">Search stable, citable pages for histories, philosophical debates, people, places, texts, and chronology. Search can ignore diacritics and recognize selected Devanagari variants.</p><div class="directory-grid">${recordTypes.map(([type, label]) => `<a href="${SITE_PATH}/records/${type}/"><strong>${label}</strong><span>${records.filter((record) => record.type === type).length} records</span></a>`).join('')}</div><section class="search-panel" aria-labelledby="record-search-title"><h2 id="record-search-title">Search records</h2><div class="search-row"><input id="record-search" aria-label="Search permanent records" placeholder="Try Vidyāpati, विद्यापति, Vaiśālī, वैशाली, Nyāya…"><select id="search-mode" aria-label="Search mode"><option value="variants">Variant spellings</option><option value="broad">Broad</option><option value="exact">Exact title</option></select></div><div class="search-row" style="margin-top:.6rem"><select id="search-type" aria-label="Record type"><option value="all">All record types</option>${recordTypes.map(([type, label]) => `<option value="${type}">${label}</option>`).join('')}</select><output id="record-count" aria-live="polite"></output></div><div class="result-list" id="record-results"></div></section><div class="actions"><a href="${SITE_PATH}/compare/">Compare two records</a><a class="secondary" href="${SITE_PATH}/data/">Download research data</a></div>`;
write('records/index.html', shell({ title: 'Permanent research records | Mithila–Vajji–Anga', description: 'Search citable permanent research records across the Videha Mithila–Vajji–Anga archive.', canonical: `${SITE_URL}/records/`, body: recordsBody, jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Mithila–Vajji–Anga permanent research records', url: `${SITE_URL}/records/` }, extraHead: `<script src="${SITE_PATH}/assets/records-search.js" defer></script>` }));

const compareJs = `
(() => {
  const base='${SITE_PATH}';
  const type=document.querySelector('#compare-type'), left=document.querySelector('#compare-left'), right=document.querySelector('#compare-right');
  const lout=document.querySelector('#compare-a'), rout=document.querySelector('#compare-b');
  let records=[];
  const esc=(v)=>String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function options(){const group=records.filter(r=>r.type===type.value);left.innerHTML=group.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.title)+'</option>').join('');right.innerHTML=left.innerHTML;const p=new URLSearchParams(location.search);left.value=p.get('a')&&group.some(r=>r.id===p.get('a'))?p.get('a'):group[0]?.id||'';right.value=p.get('b')&&group.some(r=>r.id===p.get('b'))?p.get('b'):group[1]?.id||group[0]?.id||'';render();}
  function card(record){if(!record)return '<p>Select a record.</p>';const debate=(record.purvapaksha||record.uttarapaksha||record.synthesis)?'<h3>Pūrvapakṣa</h3><p>'+esc(record.purvapaksha)+'</p><h3>Uttarapakṣa</h3><p>'+esc(record.uttarapaksha)+'</p><h3>Parallel conclusion</h3><p>'+esc(record.synthesis)+'</p>':'';const sections=(record.sections||[]).length?'<h3>Sections</h3><ol>'+record.sections.slice(0,40).map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>':'';return '<p class="eyebrow">'+esc(record.subtitle||record.status)+'</p><h2>'+esc(record.title)+'</h2><p>'+esc(record.summary)+'</p>'+debate+sections+'<p><a href="'+base+'/records/'+encodeURIComponent(record.type)+'/'+encodeURIComponent(record.id)+'/">Open permanent record</a></p>';}
  function render(){const group=records.filter(r=>r.type===type.value),a=group.find(r=>r.id===left.value),b=group.find(r=>r.id===right.value);lout.innerHTML=card(a);rout.innerHTML=card(b);const p=new URLSearchParams(location.search);p.set('type',type.value);p.set('a',left.value);p.set('b',right.value);history.replaceState(null,'',location.pathname+'?'+p.toString());}
  fetch(base+'/records-index.json').then(r=>r.json()).then(data=>{records=data;const p=new URLSearchParams(location.search);type.value=p.get('type')||'history';options();});
  type.addEventListener('change',options);left.addEventListener('change',render);right.addEventListener('change',render);
})();
`;
write('assets/compare.js', compareJs);
const compareBody = `<p class="eyebrow">SIDE-BY-SIDE RESEARCH</p><h1>Compare two records</h1><p class="lead">Compare chapters, ideas, people, places, texts, or chronology without flattening their source status. Philosophy comparisons preserve Pūrvapakṣa, Uttarapakṣa, and synthesis where supplied.</p><div class="compare-controls"><select id="compare-type" aria-label="Record type">${recordTypes.map(([type, label]) => `<option value="${type}">${label}</option>`).join('')}</select><select id="compare-left" aria-label="First record"></select><select id="compare-right" aria-label="Second record"></select></div><div class="compare-grid"><article class="compare-panel" id="compare-a"></article><article class="compare-panel" id="compare-b"></article></div><div class="actions"><button class="secondary" data-share-url>Copy shareable comparison link</button></div>`;
write('compare/index.html', shell({ title: 'Compare research records | Mithila–Vajji–Anga', description: 'Side-by-side comparison of permanent Mithila–Vajji–Anga research records.', canonical: `${SITE_URL}/compare/`, body: compareBody, jsonLd: { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Mithila–Vajji–Anga record comparison', url: `${SITE_URL}/compare/` }, extraHead: `<script src="${SITE_PATH}/assets/compare.js" defer></script>` }));

const methodBody = `<p class="eyebrow">EDITORIAL METHOD</p><h1>How this archive makes historical claims</h1><p class="lead">The archive separates source, interpretation, inference, chronology, and modern orientation so that a useful interface does not silently convert uncertain evidence into fact.</p><section class="card"><h2>Evidence hierarchy</h2><p>Archaeological strata establish material sequences, not ethnic labels. Texts disclose categories and memories at the time of composition and transmission. Inscriptions provide stronger chronological anchors but remain public acts of power and piety. Gazetteers and administrative records preserve observation together with their institutional classifications. Oral memory and living tradition are preserved as evidence of memory and practice, not automatically as proof of ancient events.</p></section><section class="card"><h2>Standard evidence labels</h2><div class="badges"><span class="badge">Primary / material source</span><span class="badge">Secondary source</span><span class="badge">Editorial interpretation</span><span class="badge">Contested / qualified</span><span class="badge">Approximate date</span><span class="badge">Modern orientation</span><span class="badge">Supplied manuscript</span></div><p>Generated permanent pages add qualification badges when the underlying record explicitly signals debate, uncertainty, caution, or approximate chronology.</p></section><section class="card"><h2>Competing interpretations</h2><p>Where the supplied material contains structured philosophical disagreement, the archive keeps Pūrvapakṣa, Uttarapakṣa, and synthesis separate. For historical records, statements marked debated, disputed, approximate, traditional, or cautionary are preserved with qualification and should be checked against the source register and chapter bibliography.</p></section><section class="card"><h2>Maps and geography</h2><p>Modern coordinates are orientation aids. They do not imply timeless political borders. Historical regions, states, corridors, sites, and remembered geographies are kept analytically distinct. Downloaded GeoJSON therefore carries source and status properties rather than asserting reconstructed frontiers.</p></section><section class="card warning"><h2>Chronological social-classification safeguard</h2><p>Later social classifications are not projected backwards. In particular, Śrotriya/Srotriya is not presented as a fixed Maithil Brahmin sub-caste in the medieval period; the archive treats its distinct sub-caste emergence as a later development around 1800 CE unless source-controlled evidence requires a narrower formulation.</p></section><section class="card"><h2>Translation and scripts</h2><p>Source-controlled supplied Maithili and English readings remain authoritative. Automated translation is an access aid only and is never silently promoted to source text. Variant-script and transliteration search is a discovery layer; it does not replace the spelling preserved by a cited source.</p></section><section class="card"><h2>Versioning and corrections</h2><p>Every permanent record carries the release identifier and date modified. Dataset releases include checksums. Corrections should preserve the reason for change in the archive changelog rather than overwriting historiographical differences without trace.</p></section>`;
write('method/index.html', shell({ title: 'Editorial method | Mithila–Vajji–Anga', description: 'Evidence, uncertainty, map, translation, chronology, and correction policies for the Videha research archive.', canonical: `${SITE_URL}/method/`, body: methodBody, jsonLd: { '@context': 'https://schema.org', '@type': 'DigitalDocument', name: 'Mithila–Vajji–Anga editorial method', url: `${SITE_URL}/method/`, author: { '@type': 'Person', name: AUTHOR }, dateModified: UPDATED_ISO } }));

const accessibilityBody = `<p class="eyebrow">ACCESSIBILITY STATEMENT</p><h1>Accessibility and inclusive research access</h1><p class="lead">The site is designed toward WCAG 2.2 AA and is maintained as a keyboard- and assistive-technology-friendly research environment.</p><section class="card good"><h2>Implemented support</h2><ul><li>Skip link and semantic page landmarks.</li><li>Keyboard-operable tabs, selects, disclosure controls, search, and timeline controls.</li><li>Visible focus indicators and reduced-motion handling.</li><li>Text resizing, contrast modes, readable width, link highlighting, image hiding, larger targets, and reader-view controls on the main research interface.</li><li>Alt text on research images and labels on form controls.</li><li>Responsive layouts intended to reflow without horizontal clipping on narrow screens.</li><li>Read-aloud controls and explicit links to NVDA and the Devanagari↔Braille converter.</li></ul></section><section class="card"><h2>WCAG 2.2 AA audit checklist</h2><p>The continuing audit covers keyboard order, focus visibility, heading hierarchy, alternative text, text and non-text contrast, 200–400% zoom/reflow, language tags, target size, captions/transcripts where media is present, and status-message announcements. The project avoids claiming automated testing alone as conformance.</p></section><section class="card"><h2>Known limits</h2><p>Third-party machine-translation interfaces, external websites, and some reproduced historical images can fall outside the archive’s direct accessibility control. When a supplied image lacks sufficient textual description, the archive should add a transcription or description rather than treating the image itself as the only source.</p></section><section class="card"><h2>Feedback</h2><p>Accessibility corrections can be reported through the Videha community channel. Include the page URL, the control or content affected, browser/assistive technology if known, and the barrier encountered.</p><div class="actions"><a href="https://groups.google.com/g/videha">Videha community group</a><a class="secondary" href="${SITE_PATH}/method/">Editorial method</a></div></section><p><strong>Statement reviewed:</strong> ${UPDATED_HUMAN}</p>`;
write('accessibility/index.html', shell({ title: 'Accessibility statement | Mithila–Vajji–Anga', description: 'WCAG 2.2 AA-oriented accessibility statement and audit checklist for the Videha research portal.', canonical: `${SITE_URL}/accessibility/`, body: accessibilityBody, jsonLd: { '@context': 'https://schema.org', '@type': 'DigitalDocument', name: 'Mithila–Vajji–Anga accessibility statement', dateModified: UPDATED_ISO, url: `${SITE_URL}/accessibility/` } }));

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`;
const csvHeader = ['type', 'id', 'title', 'subtitle', 'status', 'source', 'evidence', 'period', 'region', 'url', 'summary'];
const csv = [csvHeader.join(','), ...records.map((record) => csvHeader.map((key) => csvEscape(record[key])).join(','))].join('\n') + '\n';
const ndjson = records.map((record) => JSON.stringify(record)).join('\n') + '\n';

const learningPlaces = Array.isArray(learningData.places) ? learningData.places : [];
const coordinateOf = (item) => {
  const lat = Number(item.lat ?? item.latitude ?? item.coordinates?.[1]);
  const lon = Number(item.lon ?? item.lng ?? item.long ?? item.longitude ?? item.coordinates?.[0]);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
};
const geoItems = learningPlaces.length ? learningPlaces : curatedPlaces;
const geojson = {
  type: 'FeatureCollection',
  name: 'Mithila–Vajji–Anga sourced place records',
  features: geoItems.map((item, index) => ({
    type: 'Feature',
    id: safeId(item.id, item.name ?? item.label ?? `place-${index + 1}`),
    geometry: coordinateOf(item) ? { type: 'Point', coordinates: coordinateOf(item) } : null,
    properties: {
      name: item.name ?? item.label ?? item.title ?? `Place ${index + 1}`,
      region: item.region ?? '',
      country: item.country ?? '',
      period: item.period ?? '',
      source: item.source ?? item.links ?? '',
      note: item.text ?? item.description ?? item.note ?? '',
      geometryStatus: coordinateOf(item) ? 'source-provided point' : 'no coordinate asserted',
    },
  })),
};

const releaseDir = `data/releases/${RELEASE}`;
const releaseFiles = {
  'records.json': `${JSON.stringify(records, null, 2)}\n`,
  'records.csv': csv,
  'records.ndjson': ndjson,
  'places.geojson': `${JSON.stringify(geojson, null, 2)}\n`,
};
const checksumLines = [];
for (const [name, content] of Object.entries(releaseFiles)) {
  write(`${releaseDir}/${name}`, content);
  checksumLines.push(`${createHash('sha256').update(content).digest('hex')}  ${name}`);
}
const releaseMeta = {
  version: RELEASE,
  title: 'Mithila–Vajji–Anga scholarly dataset',
  modified: UPDATED_ISO,
  author: AUTHOR,
  publisher: PUBLISHER,
  issn: ISSN,
  license: DATA_LICENSE,
  counts: Object.fromEntries(recordTypes.map(([type]) => [type, records.filter((record) => record.type === type).length])),
  notes: ['Original structured records are released under CC BY 4.0 unless a record identifies third-party material.', 'Book-cover and reproduced manuscript images are excluded from the data licence unless separately marked.', 'Machine-generated translations are not part of the source-controlled dataset.'],
};
write(`${releaseDir}/release.json`, `${JSON.stringify(releaseMeta, null, 2)}\n`);
write(`${releaseDir}/SHA256SUMS.txt`, `${checksumLines.join('\n')}\n`);
write(`${releaseDir}/README.txt`, `Mithila–Vajji–Anga scholarly dataset ${RELEASE}\nUpdated ${UPDATED_HUMAN}\nAuthor/editor: ${AUTHOR}\nPublisher: ${PUBLISHER}\nISSN: ${ISSN}\n\nFiles\n- records.json: complete normalized record export\n- records.csv: spreadsheet-friendly flat export\n- records.ndjson: line-oriented JSON for research workflows\n- places.geojson: sourced point data where coordinates are available; null geometry where no coordinate is asserted\n- release.json: release metadata and counts\n- SHA256SUMS.txt: integrity checksums\n\nLicence\nOriginal structured data: CC BY 4.0 unless a record states otherwise. Third-party and reproduced visual material retains its own rights.\n`);

const dataBody = `<p class="eyebrow">RESEARCH DATA · RELEASE ${RELEASE}</p><h1>Download the archive as data</h1><p class="lead">Versioned exports make the site reproducible outside the interface. Each release has a date, data dictionary, licence statement, and SHA-256 checksums.</p><table class="download-table"><thead><tr><th>Format</th><th>Use</th><th>Download</th></tr></thead><tbody><tr><td>JSON</td><td>Complete normalized records</td><td><a href="${SITE_PATH}/${releaseDir}/records.json">records.json</a></td></tr><tr><td>CSV</td><td>Spreadsheet / statistical workflows</td><td><a href="${SITE_PATH}/${releaseDir}/records.csv">records.csv</a></td></tr><tr><td>NDJSON</td><td>Streaming / scripting</td><td><a href="${SITE_PATH}/${releaseDir}/records.ndjson">records.ndjson</a></td></tr><tr><td>GeoJSON</td><td>Mapped place records; null geometry where no coordinate is asserted</td><td><a href="${SITE_PATH}/${releaseDir}/places.geojson">places.geojson</a></td></tr><tr><td>Metadata</td><td>Version, counts, licensing</td><td><a href="${SITE_PATH}/${releaseDir}/release.json">release.json</a></td></tr><tr><td>Checksums</td><td>Integrity verification</td><td><a href="${SITE_PATH}/${releaseDir}/SHA256SUMS.txt">SHA256SUMS.txt</a></td></tr></tbody></table><section class="card"><h2>Data dictionary</h2><p><strong>type</strong> record family; <strong>id</strong> stable identifier; <strong>title/subtitle</strong> display labels; <strong>status/evidence/source</strong> provenance and completion fields; <strong>period/region/country</strong> contextual fields; <strong>sections</strong> supplied structure; <strong>purvapaksha/uttarapaksha/synthesis</strong> debate fields when available; <strong>url</strong> permanent record address.</p></section><section class="card"><h2>Rights</h2><p>Original structured data is released under <a href="${DATA_LICENSE}">Creative Commons Attribution 4.0</a>. Book covers, reproduced manuscript images, quoted third-party material, and linked external editions are excluded unless separately marked. Website source code is licensed separately.</p><div class="actions"><a href="${SITE_PATH}/rights/">Full rights matrix</a><a class="secondary" href="${SITE_PATH}/${releaseDir}/README.txt">Release README</a></div></section>`;
write('data/index.html', shell({ title: 'Research data downloads | Mithila–Vajji–Anga', description: 'Versioned JSON, CSV, NDJSON, and GeoJSON releases for the Videha Mithila–Vajji–Anga research archive.', canonical: `${SITE_URL}/data/`, body: dataBody, jsonLd: { '@context': 'https://schema.org', '@type': 'Dataset', name: 'Mithila–Vajji–Anga scholarly dataset', url: `${SITE_URL}/data/`, creator: { '@type': 'Person', name: AUTHOR }, publisher: { '@type': 'Organization', name: PUBLISHER }, dateModified: UPDATED_ISO, version: RELEASE, license: DATA_LICENSE, distribution: Object.keys(releaseFiles).map((name) => ({ '@type': 'DataDownload', contentUrl: `${SITE_URL}/${releaseDir}/${name}` })) } }));

const rightsBody = `<p class="eyebrow">LICENSING & RIGHTS</p><h1>Rights matrix</h1><p class="lead">The archive separates reusable code and structured research data from reproduced or third-party material whose rights may differ.</p><section class="card"><h2>Website code</h2><p>Repository-authored website code is released under the MIT License. This does not grant rights in research text, photographs, manuscript images, book covers, trademarks, or third-party datasets.</p></section><section class="card"><h2>Original structured research data</h2><p>Original normalized record data generated for this portal is released under Creative Commons Attribution 4.0 (CC BY 4.0), with attribution to Gajendra Thakur / Videha Maithili eJournal and a link to the relevant release or permanent record.</p></section><section class="card"><h2>Original editorial text</h2><p>Unless a page states otherwise, original portal-level explanatory text is available under CC BY 4.0. Longer book/manuscript texts remain governed by the publication or rights statement attached to those works.</p></section><section class="card warning"><h2>Excluded material</h2><p>Book-cover art, reproduced manuscript images, archival images, quotations, map bases, and linked external editions are not automatically relicensed by this portal. Their source rights and attribution remain controlling.</p></section><section class="card"><h2>Machine translation</h2><p>Machine-generated convenience translations are not source-controlled editions and are not licensed as authoritative scholarly text by their mere display through an external translation service.</p></section>`;
write('rights/index.html', shell({ title: 'Rights and licences | Mithila–Vajji–Anga', description: 'Licensing and rights matrix for code, structured data, editorial text, images, and third-party materials.', canonical: `${SITE_URL}/rights/`, body: rightsBody, jsonLd: { '@context': 'https://schema.org', '@type': 'DigitalDocument', name: 'Mithila–Vajji–Anga rights matrix', url: `${SITE_URL}/rights/`, dateModified: UPDATED_ISO } }));

const offlineBody = `<p class="eyebrow">OFFLINE MODE</p><h1>The research portal is temporarily offline</h1><p class="lead">Previously visited pages may still be available from the browser cache. Reconnect to update source records, citations, and release metadata.</p><div class="actions"><a href="${SITE_PATH}/">Try the archive home</a><a class="secondary" href="${SITE_PATH}/records/">Open cached record directory</a></div>`;
write('offline/index.html', shell({ title: 'Offline | Mithila–Vajji–Anga', description: 'Offline fallback for the Videha research portal.', canonical: `${SITE_URL}/offline/`, body: offlineBody }));

const manifest = {
  name: 'Mithila–Vajji–Anga · Videha Historical Research',
  short_name: 'MVA Research',
  id: `${SITE_PATH}/`,
  start_url: `${SITE_PATH}/`,
  scope: `${SITE_PATH}/`,
  display: 'standalone',
  background_color: '#fbfaf6',
  theme_color: '#0d2742',
  description: 'A source-controlled scholarly research portal for Mithila, Vajji and Anga.',
  icons: [{ src: `${SITE_PATH}/favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
};
write('manifest.webmanifest', `${JSON.stringify(manifest, null, 2)}\n`);
const coreCache = [`${SITE_PATH}/`, `${SITE_PATH}/records/`, `${SITE_PATH}/method/`, `${SITE_PATH}/data/`, `${SITE_PATH}/accessibility/`, `${SITE_PATH}/offline/`, `${SITE_PATH}/assets/scholarly.css`, `${SITE_PATH}/assets/scholarly.js`, `${SITE_PATH}/records-index.json`];
write('sw.js', `const CACHE='mva-${RELEASE}';const CORE=${JSON.stringify(coreCache)};self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mva-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return response;}).catch(()=>caches.match('${SITE_PATH}/offline/'))));});\n`);

const sitemapUrls = [
  `${SITE_URL}/`, `${SITE_URL}/sources/`, `${SITE_URL}/updates/`, `${SITE_URL}/records/`, `${SITE_URL}/compare/`, `${SITE_URL}/method/`, `${SITE_URL}/data/`, `${SITE_URL}/accessibility/`, `${SITE_URL}/rights/`,
  ...recordTypes.map(([type]) => `${SITE_URL}/records/${type}/`),
  ...records.map((record) => record.url),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${escapeHtml(url)}</loc><lastmod>${UPDATED_ISO}</lastmod><changefreq>${url.includes('/records/') ? 'monthly' : 'weekly'}</changefreq></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const qualityReport = {
  generatedAt: UPDATED_ISO,
  release: RELEASE,
  recordCount: records.length,
  permanentRecordPages: records.length,
  citationTriples: records.length * 3,
  sitemapUrls: sitemapUrls.length,
  categories: Object.fromEntries(recordTypes.map(([type]) => [type, records.filter((record) => record.type === type).length])),
  checks: {
    uniqueRecordKeys: recordByKey.size === records.length,
    allRecordsHaveTitle: records.every((record) => Boolean(record.title)),
    allRecordsHaveUrl: records.every((record) => Boolean(record.url)),
    allRecordsHaveCitation: records.every((record) => citationText(record).includes(record.url)),
  },
};
write('data/scholarly-export-report.json', `${JSON.stringify(qualityReport, null, 2)}\n`);

console.log(`Scholarly export ${RELEASE}: ${records.length} permanent records, ${sitemapUrls.length} sitemap URLs.`);
