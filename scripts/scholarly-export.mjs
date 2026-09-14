import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'dist/client');
const SITE_PATH = '/mithila-vajji-anga';
const SITE_URL = `https://videha-ejournal.github.io${SITE_PATH}`;
const RELEASE = '2026.09';
const UPDATED_ISO = '2026-09-13';
const UPDATED_HUMAN = '13 September 2026';
const AUTHOR = 'Gajendra Thakur';
const PUBLISHER = 'Videha Maithili eJournal';
const ISSN = '2229-547X';
const DATA_LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

if (!existsSync(OUT)) throw new Error('dist/client does not exist. Run the static build first.');

const ensureDir = (path) => mkdirSync(path, { recursive: true });
const write = (relativePath, content) => {
  const path = join(OUT, relativePath);
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf8');
};
const readJson = (relativePath, fallback) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
  } catch (error) {
    console.warn(`Could not read ${relativePath}:`, error instanceof Error ? error.message : error);
    return fallback;
  }
};
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const plain = (value = '') => String(value ?? '').replace(/\s+/g, ' ').trim();
const slugify = (value = '') => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'record';
const safeArray = (value) => Array.isArray(value) ? value : [];
const asObject = (value) => value && typeof value === 'object' ? value : {};

const researchData = asObject(readJson('app/research-data.json', {}));
const deepData = asObject(readJson('app/deep-data.json', {}));
const ideasData = readJson('app/ideas-volume2.json', []);
const libraryData = readJson('app/library-data.json', []);
const learningData = asObject(readJson('app/learning-data.json', {}));

const normaliseRecord = (record) => ({
  id: slugify(record.id || record.title || record.name || record.label),
  type: plain(record.type),
  title: plain(record.title || record.name || record.label),
  subtitle: plain(record.subtitle),
  summary: plain(record.summary || record.description || record.text || record.note || record.source),
  status: plain(record.status),
  source: plain(record.source),
  evidence: plain(record.evidence),
  period: plain(record.period || record.date || record.displayDate),
  region: plain(record.region),
  country: plain(record.country),
  pages: plain(record.pages),
  number: record.number ?? record.year ?? null,
  volume: plain(record.volume),
  collection: plain(record.collection),
  sections: safeArray(record.sections || record.structure).map(plain).filter(Boolean),
  purvapaksha: plain(record.purvapaksha),
  uttarapaksha: plain(record.uttarapaksha),
  synthesis: plain(record.synthesis),
});

const histories = [
  ...safeArray(researchData.political),
  ...safeArray(researchData.social),
].map((item) => normaliseRecord({
  ...item,
  type: 'history',
  subtitle: `${item.collection ?? 'History'} · ${item.volume ?? ''} · Chapter ${item.number ?? ''}`,
  source: `${item.collection ?? 'History'} · ${item.volume ?? ''} · chapter ${item.number ?? ''}`,
  evidence: item.status === 'Planned' ? 'Approved plan entry' : 'Supplied research manuscript',
}));

const volumeOneIdeas = safeArray(deepData.philosophyChapters).map((item) => normaliseRecord({
  ...item,
  type: 'idea',
  subtitle: `Parallel Philosophy · Volume I · Chapter ${item.number ?? ''}`,
  status: item.status || 'Available',
  volume: 'Volume I',
  source: item.source || `Gajendra Thakur’s Parallel Philosophy · Volume I · Chapter ${item.number ?? ''}`,
  evidence: 'Supplied bilingual philosophy chapter',
}));
const volumeTwoSource = Array.isArray(ideasData) ? ideasData : safeArray(asObject(ideasData).ideas);
const volumeTwoIdeas = volumeTwoSource.map((item) => normaliseRecord({
  ...item,
  type: 'idea',
  subtitle: `Parallel Philosophy · Volume II · Chapter ${item.number ?? ''}`,
  volume: 'Volume II',
  evidence: item.status === 'Planned' ? 'Approved plan entry' : 'Supplied philosophy chapter',
}));

const people = safeArray(deepData.people).map((item) => normaliseRecord({
  ...item,
  type: 'person',
  title: item.name,
  subtitle: `${item.field ?? ''}${item.era ? ` · ${item.era}` : ''}`,
  summary: item.description,
  status: 'Indexed',
  evidence: 'Indexed from the supplied research corpus',
}));

const librarySource = Array.isArray(libraryData) ? libraryData : safeArray(asObject(libraryData).works);
const texts = librarySource.map((item) => normaliseRecord({
  ...item,
  type: 'text',
  subtitle: `${item.shelf ?? 'Videha Library'} · ${item.sequence ?? ''}`,
  summary: item.description,
  status: 'Available',
  source: item.creator || AUTHOR,
  evidence: 'Videha library record',
}));

const places = safeArray(learningData.places).map((item, index) => normaliseRecord({
  ...item,
  id: item.id || `place-${index + 1}`,
  type: 'place',
  title: item.name || item.label || item.title,
  subtitle: `${item.country ?? ''}${item.region ? ` · ${item.region}` : ''}`,
  summary: item.description || item.text || item.note || item.source,
  status: item.status || 'Curated',
  evidence: item.evidence || 'Source-led place and orientation record',
}));

const chronologyRecords = safeArray(learningData.chronology).map((item, index) => normaliseRecord({
  ...item,
  id: item.id || `chronology-${index + 1}`,
  type: 'chronology',
  title: item.label || item.title,
  subtitle: `${item.displayDate ?? item.date ?? ''}${item.region ? ` · ${item.region}` : ''}`,
  summary: item.description || item.text || item.note || item.source,
  status: 'Cited anchor',
  evidence: item.evidence || 'Cited chronology source record',
  period: item.displayDate || item.date,
}));

const records = [
  ...histories,
  ...volumeOneIdeas,
  ...volumeTwoIdeas,
  ...people,
  ...texts,
  ...places,
  ...chronologyRecords,
].filter((record) => record.title).map((record) => ({
  ...record,
  url: `${SITE_URL}/records/${record.type}/${record.id}/`,
})).sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));

const recordTypes = [
  ['history', 'Histories'],
  ['idea', 'Ideas & debates'],
  ['person', 'People'],
  ['place', 'Places'],
  ['text', 'Texts & collections'],
  ['chronology', 'Chronology'],
];
const recordByKey = new Map(records.map((record) => [`${record.type}:${record.id}`, record]));

const citationText = (record) => `${AUTHOR}. “${record.title}.” Mithila–Vajji–Anga: Videha Historical Research. ${PUBLISHER}, 2026. Updated ${UPDATED_HUMAN}. ${record.url}`;
const citationKey = (record) => `thakur2026_${slugify(record.title).replaceAll('-', '_').slice(0, 48)}`;
const bibtex = (record) => `@online{${citationKey(record)},\n  author = {Thakur, Gajendra},\n  title = {${record.title.replaceAll('{', '').replaceAll('}', '')}},\n  year = {2026},\n  publisher = {${PUBLISHER}},\n  url = {${record.url}},\n  note = {ISSN ${ISSN}; updated ${UPDATED_HUMAN}}\n}\n`;
const ris = (record) => `TY  - ELEC\nAU  - Thakur, Gajendra\nTI  - ${record.title}\nT2  - Mithila–Vajji–Anga: Videha Historical Research\nPB  - ${PUBLISHER}\nPY  - 2026\nSN  - ${ISSN}\nUR  - ${record.url}\nY2  - ${UPDATED_ISO}\nER  - \n`;
const csl = (record) => ({
  id: citationKey(record),
  type: record.type === 'text' ? 'book' : 'webpage',
  title: record.title,
  author: [{ family: 'Thakur', given: 'Gajendra' }],
  'container-title': 'Mithila–Vajji–Anga: Videha Historical Research',
  publisher: PUBLISHER,
  issued: { 'date-parts': [[2026]] },
  URL: record.url,
  ISSN,
  language: 'en',
  note: `Updated ${UPDATED_HUMAN}`,
});

const evidenceBadges = (record) => {
  const text = `${record.summary} ${record.evidence} ${record.source}`.toLowerCase();
  const badges = [record.status, record.evidence].filter(Boolean);
  if (/debated|disputed|uncertain|caution|qualified|traditional identification/.test(text)) badges.push('Contested / qualified');
  if (/\bc\.|circa|approx|range|horizon/.test(text)) badges.push('Approximate / periodized');
  return [...new Set(badges)].slice(0, 4);
};

const css = `
:root{--ink:#152238;--paper:#fbfaf6;--navy:#0d2742;--saffron:#a85216;--line:#d8d4ca;--muted:#5d6773;--green:#266445;--max:1120px;color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:#174c7d}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #e39b45;outline-offset:3px}.sitebar{background:var(--navy);color:white}.sitebar>div{max-width:var(--max);margin:auto;padding:.8rem 1.2rem;display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}.sitebar a{color:white;text-decoration:none}.sitebar nav{display:flex;gap:.8rem;flex-wrap:wrap}.wrap{max-width:var(--max);margin:auto;padding:2rem 1.2rem 5rem}.eyebrow{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:var(--saffron)}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;line-height:1.18}h1{font-size:clamp(2.1rem,6vw,4.6rem);margin:.3rem 0 1rem;max-width:20ch}h2{font-size:clamp(1.5rem,3vw,2.3rem)}.lead{font:1.16rem/1.7 Georgia,"Times New Roman",serif;max-width:78ch}.badges,.actions{display:flex;gap:.5rem;flex-wrap:wrap;margin:1rem 0}.badge{border:1px solid var(--line);background:white;border-radius:999px;padding:.3rem .65rem;font-size:.78rem;font-weight:700}.meta,.directory-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.8rem;margin:1.2rem 0}.meta div,.card,.directory-grid a,.compare-panel{background:white;border:1px solid var(--line);border-radius:12px;padding:1rem}.meta dt{font-size:.75rem;text-transform:uppercase;color:var(--muted)}.meta dd{margin:.25rem 0 0;font-weight:700}.card{margin:1.2rem 0}.card.warning{border-left:5px solid var(--saffron)}.card.good{border-left:5px solid var(--green)}.sections{columns:2}.actions a,.actions button{border:1px solid var(--navy);background:var(--navy);color:white;border-radius:8px;padding:.6rem .8rem;text-decoration:none;font:inherit;cursor:pointer}.actions .secondary{background:white;color:var(--navy)}.directory-grid a{text-decoration:none}.directory-grid strong{display:block;font:700 1.2rem Georgia,serif;color:var(--ink)}.search-panel{background:white;border:1px solid var(--line);border-radius:14px;padding:1rem;margin:1.4rem 0}.search-row,.compare-controls{display:grid;grid-template-columns:1fr auto;gap:.6rem;margin:.5rem 0}.search-row input,.search-row select,.compare-controls select{width:100%;padding:.7rem;border:1px solid #9ca4ad;border-radius:8px;background:white;font:inherit}.result-list{display:grid;gap:.55rem;margin-top:1rem}.result-list a{display:grid;gap:.15rem;padding:.75rem;border:1px solid var(--line);border-radius:9px;text-decoration:none;background:#fff}.result-list span{font-size:.75rem;text-transform:uppercase;color:var(--muted)}.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.download-table{width:100%;border-collapse:collapse}.download-table th,.download-table td{text-align:left;padding:.65rem;border-bottom:1px solid var(--line)}footer{border-top:1px solid var(--line);padding:1.5rem;color:var(--muted)}footer>div{max-width:var(--max);margin:auto}.machine-note{background:#fff6df;border:1px solid #e4c67a;padding:.7rem;border-radius:8px}@media(max-width:760px){.sections{columns:1}.compare-grid,.search-row,.compare-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;
write('assets/scholarly.css', css);

const sharedJs = `
(()=>{const base='${SITE_PATH}';const register=()=>{'serviceWorker'in navigator&&navigator.serviceWorker.register(base+'/sw.js',{scope:base+'/'}).catch(()=>{});};document.readyState==='complete'?register():window.addEventListener('load',register,{once:true});document.addEventListener('click',async e=>{const copy=e.target.closest('[data-copy-citation]');if(copy){const t=copy.getAttribute('data-copy-citation')||'';try{await navigator.clipboard.writeText(t);copy.textContent='Citation copied';setTimeout(()=>copy.textContent='Copy citation',1600);}catch{window.prompt('Copy citation',t);}}const share=e.target.closest('[data-share-url]');if(share){try{await navigator.clipboard.writeText(location.href);share.textContent='Link copied';setTimeout(()=>share.textContent='Copy shareable link',1600);}catch{window.prompt('Copy link',location.href);}}});})();
`;
write('assets/scholarly.js', sharedJs);

function shell({ title, description, canonical, body, jsonLd = null, extraHead = '' }) {
  const schema = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="${SITE_PATH}/assets/scholarly.css">${schema}${extraHead}</head><body><a href="#main" style="position:absolute;left:-9999px;top:auto" onfocus="this.style.left='1rem'" onblur="this.style.left='-9999px'">Skip to main content</a><header class="sitebar"><div><a href="${SITE_PATH}/"><strong>Videha Digital Research Archive</strong></a><nav aria-label="Research navigation"><a href="${SITE_PATH}/records/">Records</a><a href="${SITE_PATH}/compare/">Compare</a><a href="${SITE_PATH}/method/">Method</a><a href="${SITE_PATH}/data/">Data</a><a href="${SITE_PATH}/accessibility/">Accessibility</a><a href="${SITE_PATH}/rights/">Rights</a></nav></div></header><main id="main" class="wrap">${body}</main><footer><div><strong>Gajendra Thakur</strong> · Videha Maithili eJournal · ISSN ${ISSN} · Updated ${UPDATED_HUMAN}<br><a href="${SITE_PATH}/">Project home</a> · <a href="${SITE_PATH}/updates/">Changelog</a> · <a href="https://www.videha.co.in/">Videha</a></div></footer><script src="${SITE_PATH}/assets/scholarly.js" defer></script></body></html>`;
}

for (const record of records) {
  const badges = evidenceBadges(record).map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join('');
  const sections = record.sections.length ? `<section class="card"><h2>Indexed structure</h2><ol class="sections">${record.sections.map((section) => `<li>${escapeHtml(section)}</li>`).join('')}</ol></section>` : '';
  const debate = (record.purvapaksha || record.uttarapaksha || record.synthesis) ? `<section class="card"><h2>Structured debate</h2>${record.purvapaksha ? `<h3>Pūrvapakṣa</h3><p>${escapeHtml(record.purvapaksha)}</p>` : ''}${record.uttarapaksha ? `<h3>Uttarapakṣa</h3><p>${escapeHtml(record.uttarapaksha)}</p>` : ''}${record.synthesis ? `<h3>Parallel conclusion</h3><p>${escapeHtml(record.synthesis)}</p>` : ''}</section>` : '';
  const warning = /debated|disputed|uncertain|caution|qualified|traditional identification/i.test(`${record.summary} ${record.evidence} ${record.source}`) ? `<section class="card warning"><h2>Uncertainty note</h2><p>This record contains a debated, approximate, traditional, or editorially qualified claim. Use the source/evidence fields and the methodology page before treating it as a settled fact.</p></section>` : '';
  const meta = [['Record type', record.type], ['Status', record.status], ['Period / date', record.period], ['Region', record.region], ['Volume', record.volume], ['Source', record.source], ['Evidence basis', record.evidence], ['Release', RELEASE], ['Date modified', UPDATED_HUMAN]].filter(([, value]) => value).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
  const citation = citationText(record);
  const body = `<p class="eyebrow">PERMANENT ${escapeHtml(record.type.toUpperCase())} RECORD</p><h1>${escapeHtml(record.title)}</h1>${record.subtitle ? `<p class="lead">${escapeHtml(record.subtitle)}</p>` : ''}<div class="badges">${badges}</div><dl class="meta">${meta}</dl><section class="card"><h2>Detailed scholarly description</h2><p>${escapeHtml(record.summary || 'This normalized permanent record preserves the project’s supplied source title and editorial status. Consult the source and evidence fields before citation.')}</p></section>${warning}${debate}${sections}<section class="card"><h2>Cite this record</h2><p>${escapeHtml(citation)}</p><div class="actions"><button data-copy-citation="${escapeHtml(citation)}">Copy citation</button><button class="secondary" data-share-url>Copy shareable link</button><a class="secondary" href="${SITE_PATH}/citations/${record.type}/${record.id}.bib">BibTeX</a><a class="secondary" href="${SITE_PATH}/citations/${record.type}/${record.id}.ris">RIS</a><a class="secondary" href="${SITE_PATH}/citations/${record.type}/${record.id}.csl.json">CSL-JSON</a></div></section><p><a href="${SITE_PATH}/records/${record.type}/">← ${escapeHtml(record.type)} records</a></p>`;
  const jsonLd = { '@context': 'https://schema.org', '@type': record.type === 'person' ? 'Person' : record.type === 'place' ? 'Place' : record.type === 'text' ? 'CreativeWork' : 'ScholarlyArticle', '@id': record.url, name: record.title, description: record.summary, url: record.url, author: record.type === 'person' ? undefined : { '@type': 'Person', name: AUTHOR }, publisher: record.type === 'person' ? undefined : { '@type': 'Organization', name: PUBLISHER, identifier: `ISSN ${ISSN}` }, dateModified: UPDATED_ISO, isAccessibleForFree: true, citation: citation };
  write(`records/${record.type}/${record.id}/index.html`, shell({ title: `${record.title} | Mithila–Vajji–Anga`, description: record.summary.slice(0, 220) || record.title, canonical: record.url, body, jsonLd }));
  write(`citations/${record.type}/${record.id}.bib`, bibtex(record));
  write(`citations/${record.type}/${record.id}.ris`, ris(record));
  write(`citations/${record.type}/${record.id}.csl.json`, `${JSON.stringify(csl(record), null, 2)}\n`);
}

for (const [type, label] of recordTypes) {
  const subset = records.filter((record) => record.type === type);
  const body = `<p class="eyebrow">RESEARCH DIRECTORY</p><h1>${escapeHtml(label)}</h1><p class="lead">Permanent, source-status-aware records in the Mithila–Vajji–Anga research corpus.</p><div class="result-list">${subset.map((record) => `<a href="${SITE_PATH}/records/${record.type}/${record.id}/"><span>${escapeHtml(record.subtitle || record.status)}</span><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.summary.slice(0, 180))}</small></a>`).join('')}</div>`;
  write(`records/${type}/index.html`, shell({ title: `${label} | Mithila–Vajji–Anga`, description: `${subset.length} permanent ${label.toLowerCase()} records.`, canonical: `${SITE_URL}/records/${type}/`, body }));
}

write('records-index.json', `${JSON.stringify(records, null, 2)}\n`);

const searchScript = `
(()=>{const input=document.querySelector('#record-search'),mode=document.querySelector('#search-mode'),type=document.querySelector('#search-type'),out=document.querySelector('#record-results'),count=document.querySelector('#record-count');const aliases={'विद्यापति':['vidyapati','vidyāpati'],'वैशाली':['vaishali','vaiśālī'],'मिथिला':['mithila'],'वज्जि':['vajji'],'अंग':['anga','aṅga'],'न्याय':['nyaya','nyāya'],'पञ्जी':['panji','pañjī'],'पंजी':['panji','pañjī'],'जनकपुर':['janakpur'],'दरभंगा':['darbhanga']};const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();const esc=v=>String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));let records=[];const p0=new URLSearchParams(location.search);input.value=p0.get('q')||'';mode.value=p0.get('mode')||'variants';type.value=p0.get('type')||'all';function render(){const q=input.value.trim();const needles=(mode.value==='variants'?[q,...(aliases[q]||[])]:[q]).map(norm).filter(Boolean);const filtered=records.filter(r=>type.value==='all'||r.type===type.value).filter(r=>{if(!q)return true;const title=norm(r.title),hay=norm([r.title,r.subtitle,r.summary,r.source,r.region,r.period,(r.sections||[]).join(' ')].join(' '));if(mode.value==='exact')return title===norm(q);return needles.some(n=>hay.includes(n));}).slice(0,100);count.textContent=filtered.length+(filtered.length===100?' shown':' matches');out.innerHTML=filtered.map(r=>'<a href="${SITE_PATH}/records/'+encodeURIComponent(r.type)+'/'+encodeURIComponent(r.id)+'/"><span>'+esc(r.type)+' · '+esc(r.subtitle||r.status)+'</span><strong>'+esc(r.title)+'</strong><small>'+esc((r.summary||'').slice(0,180))+'</small></a>').join('')||'<p>No matching records.</p>';const p=new URLSearchParams(location.search);q?p.set('q',q):p.delete('q');p.set('mode',mode.value);type.value!=='all'?p.set('type',type.value):p.delete('type');history.replaceState(null,'',location.pathname+(p.toString()?'?'+p.toString():''));}fetch('${SITE_PATH}/records-index.json').then(r=>r.json()).then(data=>{records=data;render();});[input,mode,type].forEach(el=>el.addEventListener(el===input?'input':'change',render));})();
`;
write('assets/records-search.js', searchScript);
const recordsBody = `<p class="eyebrow">SCHOLARLY RECORD DIRECTORY</p><h1>Permanent research records</h1><p class="lead">Search stable, citable pages across histories, philosophical debates, people, places, texts, and chronology. Variant mode ignores diacritics and recognizes selected Devanagari spellings.</p><div class="directory-grid">${recordTypes.map(([type, label]) => `<a href="${SITE_PATH}/records/${type}/"><strong>${label}</strong><span>${records.filter((record) => record.type === type).length} records</span></a>`).join('')}</div><section class="search-panel"><h2>Search records</h2><div class="search-row"><input id="record-search" aria-label="Search permanent records" placeholder="Try Vidyāpati, विद्यापति, Vaiśālī, वैशाली, Nyāya…"><select id="search-mode" aria-label="Search mode"><option value="variants">Variant spellings</option><option value="broad">Broad</option><option value="exact">Exact title</option></select></div><div class="search-row"><select id="search-type" aria-label="Record type"><option value="all">All record types</option>${recordTypes.map(([type, label]) => `<option value="${type}">${label}</option>`).join('')}</select><output id="record-count" aria-live="polite"></output></div><div class="result-list" id="record-results"></div></section><div class="actions"><a href="${SITE_PATH}/compare/">Compare two records</a><a class="secondary" href="${SITE_PATH}/data/">Download research data</a></div>`;
write('records/index.html', shell({ title: 'Permanent research records | Mithila–Vajji–Anga', description: 'Search permanent scholarly records in the Videha Mithila–Vajji–Anga archive.', canonical: `${SITE_URL}/records/`, body: recordsBody, extraHead: `<script src="${SITE_PATH}/assets/records-search.js" defer></script>` }));

const compareScript = `
(()=>{const type=document.querySelector('#compare-type'),left=document.querySelector('#compare-left'),right=document.querySelector('#compare-right'),aout=document.querySelector('#compare-a'),bout=document.querySelector('#compare-b');let records=[];const esc=v=>String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));function card(r){if(!r)return'<p>Select a record.</p>';const debate=(r.purvapaksha||r.uttarapaksha||r.synthesis)?'<h3>Pūrvapakṣa</h3><p>'+esc(r.purvapaksha)+'</p><h3>Uttarapakṣa</h3><p>'+esc(r.uttarapaksha)+'</p><h3>Parallel conclusion</h3><p>'+esc(r.synthesis)+'</p>':'';return'<p class="eyebrow">'+esc(r.subtitle||r.status)+'</p><h2>'+esc(r.title)+'</h2><p>'+esc(r.summary)+'</p>'+debate+'<p><a href="${SITE_PATH}/records/'+encodeURIComponent(r.type)+'/'+encodeURIComponent(r.id)+'/">Open permanent record</a></p>';}function render(){const group=records.filter(r=>r.type===type.value),a=group.find(r=>r.id===left.value),b=group.find(r=>r.id===right.value);aout.innerHTML=card(a);bout.innerHTML=card(b);const p=new URLSearchParams(location.search);p.set('type',type.value);p.set('a',left.value);p.set('b',right.value);history.replaceState(null,'',location.pathname+'?'+p.toString());}function options(){const group=records.filter(r=>r.type===type.value);left.innerHTML=group.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.title)+'</option>').join('');right.innerHTML=left.innerHTML;const p=new URLSearchParams(location.search);left.value=group.some(r=>r.id===p.get('a'))?p.get('a'):group[0]?.id||'';right.value=group.some(r=>r.id===p.get('b'))?p.get('b'):group[1]?.id||group[0]?.id||'';render();}fetch('${SITE_PATH}/records-index.json').then(r=>r.json()).then(data=>{records=data;const p=new URLSearchParams(location.search);type.value=p.get('type')||'history';options();});type.addEventListener('change',options);left.addEventListener('change',render);right.addEventListener('change',render);})();
`;
write('assets/compare.js', compareScript);
const compareBody = `<p class="eyebrow">SIDE-BY-SIDE RESEARCH</p><h1>Compare two records</h1><p class="lead">Compare chapters, ideas, people, places, texts, or chronology while preserving source status. Philosophy comparisons retain Pūrvapakṣa, Uttarapakṣa, and synthesis where supplied.</p><div class="compare-controls"><select id="compare-type">${recordTypes.map(([type, label]) => `<option value="${type}">${label}</option>`).join('')}</select><select id="compare-left"></select><select id="compare-right"></select></div><div class="compare-grid"><article class="compare-panel" id="compare-a"></article><article class="compare-panel" id="compare-b"></article></div><div class="actions"><button class="secondary" data-share-url>Copy shareable comparison link</button></div>`;
write('compare/index.html', shell({ title: 'Compare research records | Mithila–Vajji–Anga', description: 'Side-by-side scholarly record comparison.', canonical: `${SITE_URL}/compare/`, body: compareBody, extraHead: `<script src="${SITE_PATH}/assets/compare.js" defer></script>` }));

const methodBody = `<p class="eyebrow">EDITORIAL METHOD</p><h1>How this archive makes historical claims</h1><p class="lead">The archive separates source, interpretation, inference, chronology, and modern orientation so a useful interface does not convert uncertain evidence into fact.</p><section class="card"><h2>Evidence hierarchy</h2><p>Archaeological strata establish material sequences, not ethnic labels. Texts disclose categories and memories at the time of composition and transmission. Inscriptions provide chronological anchors but remain public acts of power and piety. Administrative records preserve observation together with institutional classifications. Oral memory is evidence of memory and practice, not automatic proof of ancient events.</p></section><section class="card"><h2>Standard evidence labels</h2><div class="badges"><span class="badge">Primary / material source</span><span class="badge">Secondary source</span><span class="badge">Editorial interpretation</span><span class="badge">Contested / qualified</span><span class="badge">Approximate date</span><span class="badge">Modern orientation</span><span class="badge">Supplied manuscript</span></div></section><section class="card"><h2>Competing interpretations</h2><p>Structured philosophical disagreement keeps Pūrvapakṣa, Uttarapakṣa, and synthesis separate. Historical claims marked debated, disputed, approximate, traditional, or cautionary remain qualified and should be checked against the source register and chapter bibliography.</p></section><section class="card"><h2>Maps and geography</h2><p>Modern coordinates are orientation aids and do not imply timeless political borders. Historical regions, sites, corridors, and remembered geographies remain analytically distinct. GeoJSON carries source/status properties rather than unsupported reconstructed frontiers.</p></section><section class="card warning"><h2>Chronological social-classification safeguard</h2><p>Later social classifications are not projected backwards. Śrotriya/Srotriya is not presented as a fixed medieval Maithil Brahmin sub-caste; the archive treats its distinct sub-caste emergence as a later development around 1800 CE unless source-controlled evidence requires a narrower formulation.</p></section><section class="card"><h2>Translation and scripts</h2><p>Source-controlled supplied Maithili and English readings remain authoritative. Automated translation is an access aid only. Variant-script and transliteration search is a discovery layer, not a replacement for source spelling.</p></section><section class="card"><h2>Versioning and corrections</h2><p>Permanent records carry a release identifier and date modified. Dataset releases include checksums, and substantive corrections remain visible in the changelog.</p></section>`;
write('method/index.html', shell({ title: 'Editorial method | Mithila–Vajji–Anga', description: 'Evidence, uncertainty, map, translation, chronology, and correction policies.', canonical: `${SITE_URL}/method/`, body: methodBody }));

const accessibilityBody = `<p class="eyebrow">ACCESSIBILITY STATEMENT</p><h1>Accessibility and inclusive research access</h1><p class="lead">The site is designed toward WCAG 2.2 AA and maintained as a keyboard- and assistive-technology-friendly research environment.</p><section class="card good"><h2>Implemented support</h2><ul><li>Skip link and semantic landmarks.</li><li>Keyboard-operable tabs, selects, disclosure controls, search, and timeline controls.</li><li>Visible focus and reduced-motion handling.</li><li>Text resizing, contrast modes, readable width, link highlighting, image hiding, larger targets, and reader view.</li><li>Alt text and labelled form controls.</li><li>Responsive reflow and read-aloud support.</li></ul></section><section class="card"><h2>WCAG 2.2 AA audit checklist</h2><p>Continuing review covers keyboard order, focus visibility, headings, alternative text, contrast, 200–400% zoom/reflow, language tags, target size, captions/transcripts, and status announcements. Automated testing alone is not treated as conformance.</p></section><section class="card"><h2>Known limits</h2><p>Third-party translation interfaces, external websites, and some reproduced historical images fall outside direct control. Where a historical image is essential, textual description or transcription should accompany it.</p></section><section class="card"><h2>Feedback</h2><p>Report accessibility barriers through the Videha community channel with the page URL and affected control/content.</p><div class="actions"><a href="https://groups.google.com/g/videha">Videha community group</a></div></section><p><strong>Statement reviewed:</strong> ${UPDATED_HUMAN}</p>`;
write('accessibility/index.html', shell({ title: 'Accessibility statement | Mithila–Vajji–Anga', description: 'WCAG 2.2 AA-oriented accessibility statement.', canonical: `${SITE_URL}/accessibility/`, body: accessibilityBody }));

const rightsBody = `<p class="eyebrow">LICENSING & RIGHTS</p><h1>Rights matrix</h1><p class="lead">The archive separates reusable code and structured research data from reproduced or third-party material whose rights differ.</p><section class="card"><h2>Website code</h2><p>Repository-authored code is released under the MIT License.</p></section><section class="card"><h2>Original structured research data</h2><p>Original normalized portal data is released under CC BY 4.0 with attribution to Gajendra Thakur / Videha Maithili eJournal and the relevant permanent record or data-release URL.</p></section><section class="card"><h2>Original portal-level editorial text</h2><p>Unless otherwise stated, original explanatory portal text is CC BY 4.0. Long-form books, manuscript texts, and translations remain governed by their own publication/right statements.</p></section><section class="card warning"><h2>Excluded material</h2><p>Book-cover art, reproduced manuscripts, archival images, quotations, map bases, and external editions are not automatically relicensed.</p></section><section class="card"><h2>Machine translation</h2><p>Machine-generated convenience translations are not source-controlled editions and should not be cited in place of supplied authoritative text.</p></section>`;
write('rights/index.html', shell({ title: 'Rights and licences | Mithila–Vajji–Anga', description: 'Rights matrix for code, data, text, images, and third-party materials.', canonical: `${SITE_URL}/rights/`, body: rightsBody }));

const csvColumns = ['type', 'id', 'title', 'subtitle', 'status', 'source', 'evidence', 'period', 'region', 'url', 'summary'];
const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`;
const csv = `${[csvColumns.join(','), ...records.map((record) => csvColumns.map((key) => csvEscape(record[key])).join(','))].join('\n')}\n`;
const ndjson = `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
const coordinateOf = (item) => {
  const latitude = Number(item.lat ?? item.latitude ?? item.coordinates?.[1]);
  const longitude = Number(item.lon ?? item.lng ?? item.long ?? item.longitude ?? item.coordinates?.[0]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [longitude, latitude] : null;
};
const geojson = {
  type: 'FeatureCollection',
  name: 'Mithila–Vajji–Anga sourced place records',
  features: safeArray(learningData.places).map((item, index) => {
    const coordinates = coordinateOf(item);
    return {
      type: 'Feature',
      id: slugify(item.id || item.name || item.label || `place-${index + 1}`),
      geometry: coordinates ? { type: 'Point', coordinates } : null,
      properties: {
        name: item.name || item.label || item.title || `Place ${index + 1}`,
        region: item.region || '',
        country: item.country || '',
        period: item.period || '',
        source: item.source || '',
        note: item.text || item.description || item.note || '',
        geometryStatus: coordinates ? 'source-provided point' : 'no coordinate asserted',
      },
    };
  }),
};
const releaseDir = `data/releases/${RELEASE}`;
const releaseFiles = {
  'records.json': `${JSON.stringify(records, null, 2)}\n`,
  'records.csv': csv,
  'records.ndjson': ndjson,
  'places.geojson': `${JSON.stringify(geojson, null, 2)}\n`,
};
const sums = [];
for (const [name, content] of Object.entries(releaseFiles)) {
  write(`${releaseDir}/${name}`, content);
  sums.push(`${createHash('sha256').update(content).digest('hex')}  ${name}`);
}
write(`${releaseDir}/SHA256SUMS.txt`, `${sums.join('\n')}\n`);
write(`${releaseDir}/README.txt`, `Mithila–Vajji–Anga · Videha Historical Research\nRelease: ${RELEASE}\nGenerated: ${UPDATED_ISO}\nData licence: CC BY 4.0 for original structured portal data. Third-party/reproduced material excluded.\nFiles: records.json, records.csv, records.ndjson, places.geojson, SHA256SUMS.txt\n`);
write('data/latest.json', `${JSON.stringify({ release: RELEASE, generatedAt: UPDATED_ISO, base: `${SITE_URL}/data/releases/${RELEASE}/`, license: DATA_LICENSE }, null, 2)}\n`);

const dataBody = `<p class="eyebrow">OPEN RESEARCH DATA</p><h1>Versioned downloads</h1><p class="lead">Download normalized research records and source-aware geography in machine-readable formats. Original structured portal data is CC BY 4.0; reproduced and third-party content remains excluded.</p><section class="card good"><h2>Current release · ${RELEASE}</h2><table class="download-table"><thead><tr><th>File</th><th>Purpose</th></tr></thead><tbody><tr><td><a href="${SITE_PATH}/${releaseDir}/records.json">records.json</a></td><td>Full normalized permanent-record dataset</td></tr><tr><td><a href="${SITE_PATH}/${releaseDir}/records.csv">records.csv</a></td><td>Spreadsheet / R / Python import</td></tr><tr><td><a href="${SITE_PATH}/${releaseDir}/records.ndjson">records.ndjson</a></td><td>Streaming and command-line workflows</td></tr><tr><td><a href="${SITE_PATH}/${releaseDir}/places.geojson">places.geojson</a></td><td>Source/status-bearing place features; null geometry where no coordinate is asserted</td></tr><tr><td><a href="${SITE_PATH}/${releaseDir}/SHA256SUMS.txt">SHA256SUMS.txt</a></td><td>Integrity verification</td></tr></tbody></table></section><section class="card warning"><h2>Interpretation warning</h2><p>GeoJSON points are orientation aids. Null geometry means the archive declines to invent a coordinate. Historical boundaries and identities must be reconstructed from dated evidence rather than modern polygons.</p></section><p><a href="${SITE_PATH}/rights/">Rights matrix</a> · <a href="${SITE_PATH}/method/">Editorial method</a></p>`;
write('data/index.html', shell({ title: 'Research data downloads | Mithila–Vajji–Anga', description: 'Versioned research data releases in JSON, CSV, NDJSON and GeoJSON.', canonical: `${SITE_URL}/data/`, body: dataBody, jsonLd: { '@context': 'https://schema.org', '@type': 'Dataset', name: 'Mithila–Vajji–Anga normalized research records', description: 'Source-status-aware research records and sourced place features.', creator: { '@type': 'Person', name: AUTHOR }, publisher: { '@type': 'Organization', name: PUBLISHER }, version: RELEASE, dateModified: UPDATED_ISO, license: DATA_LICENSE, url: `${SITE_URL}/data/` } }));

const offlineBody = `<p class="eyebrow">OFFLINE MODE</p><h1>The research portal is temporarily offline</h1><p class="lead">Previously visited pages may still be available from browser cache. Reconnect to update source records, citations, and release metadata.</p><div class="actions"><a href="${SITE_PATH}/">Try the archive home</a><a class="secondary" href="${SITE_PATH}/records/">Open cached records</a></div>`;
write('offline/index.html', shell({ title: 'Offline | Mithila–Vajji–Anga', description: 'Offline fallback for the research portal.', canonical: `${SITE_URL}/offline/`, body: offlineBody }));

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
const core = [`${SITE_PATH}/`, `${SITE_PATH}/records/`, `${SITE_PATH}/method/`, `${SITE_PATH}/data/`, `${SITE_PATH}/accessibility/`, `${SITE_PATH}/offline/`, `${SITE_PATH}/assets/scholarly.css`, `${SITE_PATH}/assets/scholarly.js`, `${SITE_PATH}/records-index.json`];
write('sw.js', `const CACHE='mva-${RELEASE}';const CORE=${JSON.stringify(core)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mva-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r;}).catch(()=>caches.match('${SITE_PATH}/offline/'))));});\n`);

const historyChapterUrls = [
  ...safeArray(researchData.political),
  ...safeArray(researchData.social),
]
  .filter((chapter) => chapter?.id)
  .map((chapter) => `${SITE_URL}/chapters/${chapter.id}/`);

const bilingualCollectionUrls = [
  `${SITE_URL}/philosophy/`,
  `${SITE_URL}/literature/`,
  `${SITE_URL}/panji/`,
  `${SITE_URL}/en/`,
  `${SITE_URL}/en/philosophy/`,
  `${SITE_URL}/en/literature/`,
  `${SITE_URL}/en/panji/`,
];

const sitemapUrls = [
  `${SITE_URL}/`,
  `${SITE_URL}/history/`,
  ...historyChapterUrls,
  ...bilingualCollectionUrls,
  `${SITE_URL}/sources/`,
  `${SITE_URL}/updates/`,
  `${SITE_URL}/records/`,
  `${SITE_URL}/compare/`,
  `${SITE_URL}/method/`,
  `${SITE_URL}/data/`,
  `${SITE_URL}/accessibility/`,
  `${SITE_URL}/rights/`,
  ...recordTypes.map(([type]) => `${SITE_URL}/records/${type}/`),
  ...records.map((record) => record.url),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${url}</loc><lastmod>${UPDATED_ISO}</lastmod><changefreq>${url.includes('/records/') ? 'monthly' : 'weekly'}</changefreq></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const report = {
  generatedAt: UPDATED_ISO,
  release: RELEASE,
  recordCount: records.length,
  permanentRecordPages: records.length,
  citationFiles: records.length * 3,
  sitemapUrls: sitemapUrls.length,
  categories: Object.fromEntries(recordTypes.map(([type]) => [type, records.filter((record) => record.type === type).length])),
  checks: {
    uniqueRecordKeys: recordByKey.size === records.length,
    allRecordsHaveTitle: records.every((record) => Boolean(record.title)),
    allRecordsHaveUrl: records.every((record) => Boolean(record.url)),
    allRecordsHaveCitation: records.every((record) => citationText(record).includes(record.url)),
  },
};
write('data/scholarly-export-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(`Scholarly export ${RELEASE}: ${records.length} permanent records, ${sitemapUrls.length} sitemap URLs.`);
