import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist/client');
const RELEASE = '2026.09';
const SITE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const AUTHOR = 'Gajendra Thakur';
const PUBLISHER = 'Videha Maithili eJournal';
const ISSN = '2229-547X';
const RECORDS_PATH = path.join(OUT, 'records-index.json');
const SOURCE_CATALOG_PATH = path.join(OUT, 'source-library/catalog.json');
const RELEASE_GEO_PATH = path.join(OUT, `data/releases/${RELEASE}/places.geojson`);
const BOUNDARY_SOURCE_PATH = path.join(ROOT, 'data/historical-boundaries.geojson');
const PROVENANCE_RULES_PATH = path.join(ROOT, 'data/record-source-provenance.json');

const requireFile = (file) => {
  if (!existsSync(file)) throw new Error(`Digital-humanities extension input missing: ${file}`);
};
for (const file of [RECORDS_PATH, SOURCE_CATALOG_PATH, RELEASE_GEO_PATH, BOUNDARY_SOURCE_PATH, PROVENANCE_RULES_PATH]) requireFile(file);

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const ensureDir = (dir) => mkdirSync(dir, { recursive: true });
const write = (relative, content) => {
  const target = path.join(OUT, relative);
  ensureDir(path.dirname(target));
  writeFileSync(target, content, 'utf8');
};
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const escapeBib = (value = '') => String(value).replaceAll('{', '').replaceAll('}', '');
const csv = (value = '') => `"${String(value ?? '').replaceAll('"', '""')}"`;
const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const records = readJson(RECORDS_PATH);
const sourceCatalog = readJson(SOURCE_CATALOG_PATH);
const releaseGeo = readJson(RELEASE_GEO_PATH);
const historicalBoundaries = readJson(BOUNDARY_SOURCE_PATH);
const provenanceRules = readJson(PROVENANCE_RULES_PATH);
const sourceItems = sourceCatalog.items ?? [];
const sourceByFilename = new Map(sourceItems.map((item) => [item.filename, item]));

// 1) Publish qualified historical boundary source data and inject an accessible map overlay into both mirror editions.
write('data/historical-boundaries.geojson', `${JSON.stringify(historicalBoundaries, null, 2)}\n`);

const mapCss = `
.historical-boundary-svg{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;overflow:visible}.historical-boundary-svg polygon{vector-effect:non-scaling-stroke;stroke-width:.45;fill-opacity:.22;transition:opacity .15s ease,fill-opacity .15s ease}.historical-boundary-svg polygon[data-region="Mithila"]{fill:var(--gold,#b38327);stroke:var(--gold,#b38327);stroke-dasharray:2 1}.historical-boundary-svg polygon[data-region="Vajji"]{fill:var(--green,#235a46);stroke:var(--green,#235a46);stroke-dasharray:1.2 .8}.historical-boundary-svg polygon[data-region="Anga"]{fill:var(--saffron,#c66a14);stroke:var(--saffron,#c66a14);stroke-dasharray:.5 .7}.expanded-map>button{z-index:4}.historical-boundary-controls{margin:.8rem 0 1rem;padding:.9rem 1rem;border:1px solid var(--line,#d9ddd7);border-radius:10px;background:var(--surface,#fff);display:grid;gap:.7rem}.historical-boundary-controls header{display:flex;gap:.8rem;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}.historical-boundary-controls h4,.historical-boundary-controls p{margin:0}.historical-boundary-controls .boundary-options{display:flex;gap:.65rem;flex-wrap:wrap}.historical-boundary-controls label.boundary-toggle{display:flex;gap:.4rem;align-items:center;min-height:44px;padding:.35rem .55rem;border:1px solid var(--line,#d9ddd7);border-radius:8px;background:#fff;color:#17211d}.historical-boundary-controls .opacity-control{display:grid;grid-template-columns:max-content minmax(140px,260px) max-content;gap:.55rem;align-items:center}.historical-boundary-controls details{font-size:.82rem}.historical-boundary-controls .boundary-status{font-size:.78rem;font-weight:700;color:var(--muted,#667069)}@media(max-width:620px){.historical-boundary-controls .opacity-control{grid-template-columns:1fr}.historical-boundary-controls .boundary-options{display:grid}}@media(prefers-reduced-motion:reduce){.historical-boundary-svg polygon{transition:none}}
`;
write('assets/historical-boundaries.css', mapCss);

const mapJs = `
(()=>{
 const BASE='/mithila-vajji-anga';
 const periodOk=(feature,year)=>feature.properties?.region==='Mithila'||(year>=-700&&year<=-300);
 const labelSet=(lang)=>lang==='mai'?{
  title:'ऐतिहासिक सीमा-परत',note:'अनुमानित शोध-आवरण — ठीक-ठीक प्राचीन सीमा नहि',opacity:'परतक पारदर्शिता',legend:'स्रोत आ अनिश्चितता',status:'चुनल वर्षक अनुसार परत देखाओल जा रहल अछि',mithila:'मिथिला सांस्कृतिक-ऐतिहासिक रूपरेखा',vajji:'वज्जि लगभग 500 ई.पू.',anga:'अंग लगभग 500 ई.पू.'
 }:{title:'Historical boundary layers',note:'Approximate research envelopes — not exact ancient frontiers',opacity:'Layer opacity',legend:'Sources and uncertainty',status:'Layers are filtered against the selected historical year',mithila:'Mithila cultural-historical frame',vajji:'Vajji c. 500 BCE',anga:'Anga c. 500 BCE'};
 const project=(lon,lat,b)=>({x:5+((lon-b.minLon)/(b.maxLon-b.minLon||1))*90,y:5+((b.maxLat-lat)/(b.maxLat-b.minLat||1))*90});
 async function install(){
  const map=document.querySelector('.map-room .expanded-map');
  const controls=document.querySelector('.map-room .map-controls-expanded');
  if(!map||!controls||document.getElementById('historical-boundary-svg')) return false;
  const [boundaries,release]=await Promise.all([
   fetch(BASE+'/data/historical-boundaries.geojson').then(r=>{if(!r.ok)throw new Error('boundary data');return r.json()}),
   fetch(BASE+'/data/releases/${RELEASE}/places.geojson').then(r=>{if(!r.ok)throw new Error('place data');return r.json()})
  ]);
  const points=(release.features||[]).filter(f=>f.geometry?.type==='Point').map(f=>f.geometry.coordinates);
  const b={minLon:Math.min(...points.map(p=>p[0])),maxLon:Math.max(...points.map(p=>p[0])),minLat:Math.min(...points.map(p=>p[1])),maxLat:Math.max(...points.map(p=>p[1]))};
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');svg.id='historical-boundary-svg';svg.classList.add('historical-boundary-svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
  for(const feature of boundaries.features||[]){const ring=feature.geometry?.coordinates?.[0]||[];const polygon=document.createElementNS(ns,'polygon');polygon.dataset.boundaryId=feature.id;polygon.dataset.region=feature.properties?.region||'';polygon.setAttribute('points',ring.map(([lon,lat])=>{const p=project(lon,lat,b);return p.x.toFixed(2)+','+p.y.toFixed(2)}).join(' '));svg.appendChild(polygon)}
  map.appendChild(svg);
  const lang=document.documentElement.lang||'en',t=labelSet(lang);
  const panel=document.createElement('section');panel.className='historical-boundary-controls';panel.setAttribute('aria-labelledby','historical-boundary-title');
  panel.innerHTML='<header><div><h4 id="historical-boundary-title">'+t.title+'</h4><p>'+t.note+'</p></div><span class="boundary-status" aria-live="polite">'+t.status+'</span></header><div class="boundary-options"></div><label class="opacity-control"><span>'+t.opacity+'</span><input type="range" min="8" max="45" value="22" step="1" aria-label="'+t.opacity+'"><output>22%</output></label><details><summary>'+t.legend+'</summary><ul></ul></details>';
  const names={Mithila:t.mithila,Vajji:t.vajji,Anga:t.anga};
  const options=panel.querySelector('.boundary-options'),list=panel.querySelector('details ul');
  for(const feature of boundaries.features||[]){const id='toggle-'+feature.id;const label=document.createElement('label');label.className='boundary-toggle';label.innerHTML='<input id="'+id+'" type="checkbox" checked data-feature="'+feature.id+'"><span>'+escapeHtmlForJs(names[feature.properties?.region]||feature.properties?.name||feature.id)+'</span>';options.appendChild(label);const li=document.createElement('li');const e=feature.properties?.historicalGeometryEvidence||{};li.innerHTML='<strong>'+escapeHtmlForJs(feature.properties?.name||feature.id)+'</strong> — '+escapeHtmlForJs(e.geometryScope||'')+' <a href="'+escapeAttrForJs(e.sourceUrl||'#')+'" target="_blank" rel="noopener">source</a>';list.appendChild(li)}
  controls.insertAdjacentElement('afterend',panel);
  const yearInput=controls.querySelector('input[type="range"]');
  const opacity=panel.querySelector('.opacity-control input'),output=panel.querySelector('.opacity-control output');
  const apply=()=>{const year=Number(yearInput?.value??-500);for(const feature of boundaries.features||[]){const polygon=svg.querySelector('[data-boundary-id="'+CSS.escape(feature.id)+'"]');const toggle=panel.querySelector('[data-feature="'+CSS.escape(feature.id)+'"]');const visible=Boolean(toggle?.checked)&&periodOk(feature,year);if(polygon){polygon.style.opacity=visible?'1':'0';polygon.style.fillOpacity=String(Number(opacity.value)/100)}}output.textContent=opacity.value+'%';panel.querySelector('.boundary-status').textContent=t.status+' · '+(year<0?Math.abs(year)+' BCE':year+' CE')};
  panel.addEventListener('change',apply);opacity.addEventListener('input',apply);yearInput?.addEventListener('input',apply);apply();
  return true;
 }
 function escapeHtmlForJs(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function escapeAttrForJs(v){return escapeHtmlForJs(v)}
 let tries=0;const timer=setInterval(async()=>{tries++;try{if(await install())clearInterval(timer)}catch(e){console.warn('Historical boundary overlay unavailable',e);clearInterval(timer)}if(tries>80)clearInterval(timer)},250);
})();
`;
write('assets/historical-boundaries.js', mapJs);

for (const relative of ['index.html', 'en/index.html']) {
  const file = path.join(OUT, relative);
  if (!existsSync(file)) continue;
  let html = readFileSync(file, 'utf8');
  if (!html.includes('/assets/historical-boundaries.css')) html = html.replace('</head>', `<link rel="stylesheet" href="/mithila-vajji-anga/assets/historical-boundaries.css"></head>`);
  if (!html.includes('/assets/historical-boundaries.js')) html = html.replace('</body>', `<script defer src="/mithila-vajji-anga/assets/historical-boundaries.js"></script></body>`);
  writeFileSync(file, html, 'utf8');
}

// 2) IIIF Presentation API 3.0: document-level manifests for every commit-pinned source PDF.
const iiifRoot = 'iiif';
const languageMap = (code, value) => ({ [code || 'none']: [String(value)] });
const manifestRefs = [];
for (const item of sourceItems) {
  const manifestId = `${SITE}/${iiifRoot}/${item.id}/manifest.json`;
  const label = languageMap(item.languageCode, item.title);
  const manifest = {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: manifestId,
    type: 'Manifest',
    label,
    summary: { en: ['Document-level IIIF Presentation 3 manifest for a version-pinned Videha source PDF. Page canvases are intentionally not fabricated where page images/page locators have not been independently verified.'] },
    metadata: [
      { label: { en: ['Filename'] }, value: { none: [item.filename] } },
      ...(item.sourceCommit ? [{ label: { en: ['Source commit'] }, value: { none: [item.sourceCommit] } }] : []),
      ...(item.gitBlobSha ? [{ label: { en: ['Git blob ID'] }, value: { none: [item.gitBlobSha] } }] : []),
      ...(item.sourceSha256 ? [{ label: { en: ['Source SHA-256'] }, value: { none: [item.sourceSha256] } }] : []),
      { label: { en: ['IIIF coverage'] }, value: { en: ['Document-level manifest; page canvases pending independently verified page-level source evidence.'] } },
    ],
    requiredStatement: { label: { en: ['Attribution'] }, value: { en: ['Videha Digital Research Archive · Gajendra Thakur, Editor · ISSN 2229-547X. Source-document rights remain controlling.'] } },
    provider: [{ id: 'https://www.videha.co.in/', type: 'Agent', label: { en: ['Videha Maithili eJournal'] }, homepage: [{ id: 'https://www.videha.co.in/', type: 'Text', label: { en: ['Videha'] }, format: 'text/html' }] }],
    homepage: [{ id: `${SITE}/source-library/`, type: 'Text', label: { en: ['Source PDF Library'] }, format: 'text/html' }],
    rendering: [{ id: item.url, type: 'Text', label: { en: ['Open commit-pinned PDF'] }, format: 'application/pdf' }],
    items: [{ id: `${SITE}/${iiifRoot}/${item.id}/canvas/source`, type: 'Canvas', label: { en: ['Source document'] }, width: 1, height: 1, rendering: [{ id: item.url, type: 'Text', label: { en: ['Open PDF'] }, format: 'application/pdf' }] }],
  };
  write(`${iiifRoot}/${item.id}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  manifestRefs.push({ id: manifestId, type: 'Manifest', label });
}
const iiifCollection = {
  '@context': 'http://iiif.io/api/presentation/3/context.json', id: `${SITE}/${iiifRoot}/collection.json`, type: 'Collection',
  label: { en: ['Videha Digital Research Archive · Source PDF IIIF Collection'] },
  summary: { en: ['Document-level IIIF Presentation 3 manifests for the version-pinned source PDF library.'] },
  requiredStatement: { label: { en: ['Scope'] }, value: { en: ['Document-level interoperability is available now; page-level canvases are withheld until page evidence can be verified rather than inferred.'] } },
  items: manifestRefs,
};
write(`${iiifRoot}/collection.json`, `${JSON.stringify(iiifCollection, null, 2)}\n`);
const iiifHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IIIF Source Collection | Videha Digital Research Archive</title><link rel="canonical" href="${SITE}/iiif/"><style>body{margin:0;background:#fbfaf6;color:#172437;font:17px/1.65 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:3rem 1rem}h1{font:700 clamp(2rem,6vw,4rem)/1.1 Georgia,serif}a{color:#174c7d}a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}.note{padding:1rem;border:1px solid #d0c8b8;background:white;border-radius:10px}li{margin:.45rem 0}</style></head><body><main><p>VIDEHA DIGITAL RESEARCH ARCHIVE</p><h1>IIIF Presentation 3 source collection</h1><div class="note"><p><strong>${sourceItems.length}</strong> version-pinned source PDFs now have document-level IIIF manifests. No synthetic page canvases or unverified page locators are generated.</p><p><a href="./collection.json">Open IIIF Collection JSON</a> · <a href="${SITE}/source-library/">Source PDF Library</a></p></div><ol>${sourceItems.map((item) => `<li><a href="./${encodeURIComponent(item.id)}/manifest.json">${escapeHtml(item.title)}</a></li>`).join('')}</ol></main></body></html>`;
write(`${iiifRoot}/index.html`, iiifHtml);

// 3) Machine-readable PROV-O / JSON-LD provenance graph.
const exact = provenanceRules.exact ?? [];
const rules = provenanceRules.rules ?? [];
function mappingFor(record) {
  const direct = exact.find((entry) => entry.recordType === record.type && entry.recordId === record.id);
  if (direct) return direct;
  return rules.find((entry) => entry.recordType === record.type && record.id.startsWith(entry.recordIdPrefix ?? '')) ?? null;
}
const sourceEntityId = (filename) => `${SITE}/provenance/source/${encodeURIComponent(filename)}`;
const graph = [];
const edges = [];
for (const item of sourceItems) {
  graph.push({ '@id': sourceEntityId(item.filename), '@type': ['prov:Entity', 'schema:DigitalDocument'], 'schema:name': item.title, 'schema:url': item.url, 'schema:encodingFormat': 'application/pdf', 'schema:identifier': [item.gitBlobSha ? `git-blob:${item.gitBlobSha}` : null, item.sourceSha256 ? `sha256:${item.sourceSha256}` : null].filter(Boolean), 'prov:specializationOf': item.currentPublishedUrl ? { '@id': item.currentPublishedUrl } : undefined, 'schema:isPartOf': item.repositoryUrl ? { '@id': item.repositoryUrl } : undefined } );
}
let mappedRecords = 0;
for (const record of records) {
  const mapping = mappingFor(record);
  const sourceItem = mapping ? sourceByFilename.get(mapping.sourcePdfPath) : null;
  const node = { '@id': record.url, '@type': ['prov:Entity', 'schema:CreativeWork'], 'schema:name': record.title, 'schema:identifier': `${record.type}:${record.id}`, 'schema:url': record.url, 'schema:isPartOf': { '@id': SITE + '/' }, ...(sourceItem ? { 'prov:wasDerivedFrom': { '@id': sourceEntityId(sourceItem.filename) }, 'prov:hadPrimarySource': { '@id': sourceEntityId(sourceItem.filename) } } : {}) };
  graph.push(node);
  if (sourceItem) { mappedRecords += 1; edges.push([record.url, sourceEntityId(sourceItem.filename), mapping.relation, mapping.evidenceStatus]); }
}
for (const feature of historicalBoundaries.features ?? []) {
  const evidence = feature.properties?.historicalGeometryEvidence ?? {};
  const geometryId = `${SITE}/data/historical-boundaries.geojson#${encodeURIComponent(feature.id)}`;
  graph.push({ '@id': geometryId, '@type': ['prov:Entity', 'schema:Map'], 'schema:name': feature.properties?.name ?? feature.id, 'schema:url': `${SITE}/data/historical-boundaries.geojson`, 'schema:temporalCoverage': feature.properties?.periodLabel ?? feature.properties?.temporalScope ?? '', 'schema:spatialCoverage': feature.properties?.region ?? '', 'prov:wasDerivedFrom': evidence.sourceUrl ? { '@id': evidence.sourceUrl } : undefined, 'schema:description': evidence.geometryScope ?? '' });
  if (evidence.sourceUrl) edges.push([geometryId, evidence.sourceUrl, 'qualified-geometric-derivation', 'verified-source-citation']);
}
const provenance = {
  '@context': { prov: 'http://www.w3.org/ns/prov#', schema: 'https://schema.org/', dcterms: 'http://purl.org/dc/terms/' },
  '@id': `${SITE}/data/provenance-graph.jsonld`, '@type': ['prov:Entity', 'schema:Dataset'], 'schema:name': 'Videha Digital Research Archive provenance graph', 'schema:creator': { '@type': 'schema:Person', 'schema:name': AUTHOR }, 'schema:isPartOf': { '@id': SITE + '/' }, 'dcterms:conformsTo': 'https://www.w3.org/TR/prov-o/', '@graph': graph,
};
write('data/provenance-graph.jsonld', `${JSON.stringify(provenance, null, 2)}\n`);
write('data/provenance-edges.csv', ['source,target,relation,evidenceStatus', ...edges.map((row) => row.map(csv).join(','))].join('\n') + '\n');
write('provenance/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Provenance Graph | Videha Digital Research Archive</title></head><body><main style="max-width:900px;margin:auto;padding:3rem 1rem;font:17px/1.65 system-ui,sans-serif"><p>VIDEHA DIGITAL RESEARCH ARCHIVE</p><h1>PROV-O provenance graph</h1><p>${mappedRecords} of ${records.length} permanent scholarly records are linked to exact source-work objects under the current fail-closed provenance rules; all ${historicalBoundaries.features?.length ?? 0} qualified historical geometries retain source-citation derivations.</p><p><a href="${SITE}/data/provenance-graph.jsonld">JSON-LD / PROV-O</a> · <a href="${SITE}/data/provenance-edges.csv">Edge CSV</a> · <a href="${SITE}/source-library/">Source PDF Library</a></p><p>Absence of a provenance edge means the archive has not asserted an exact source-work mapping for that record; it is not filled by inference.</p></main></body></html>`);

// 4) Bulk CSL-JSON, BibTeX and RIS, including a separate historical-geography evidence set.
const citationId = (record) => `thakur2026_${record.type}_${record.id}`.replace(/[^a-zA-Z0-9_:-]/g, '_');
const recordCsl = records.map((record) => ({ id: citationId(record), type: record.type === 'text' ? 'book' : 'webpage', title: record.title, author: [{ family: 'Thakur', given: 'Gajendra' }], 'container-title': 'Videha Digital Research Archive · Mithila–Vajji–Anga', publisher: PUBLISHER, issued: { 'date-parts': [[2026]] }, URL: record.url, ISSN, note: `Permanent scholarly record · release ${RELEASE}` }));
const recordBib = records.map((record) => `@online{${citationId(record)},\n  author = {Thakur, Gajendra},\n  title = {${escapeBib(record.title)}},\n  year = {2026},\n  publisher = {${PUBLISHER}},\n  url = {${record.url}},\n  note = {Videha Digital Research Archive; ISSN ${ISSN}; release ${RELEASE}}\n}`).join('\n\n') + '\n';
const recordRis = records.map((record) => `TY  - ELEC\nAU  - Thakur, Gajendra\nTI  - ${record.title}\nT2  - Videha Digital Research Archive · Mithila–Vajji–Anga\nPB  - ${PUBLISHER}\nPY  - 2026\nSN  - ${ISSN}\nUR  - ${record.url}\nER  - `).join('\n\n') + '\n';
write('data/citations/all-records.csl.json', `${JSON.stringify(recordCsl, null, 2)}\n`);
write('data/citations/all-records.bib', recordBib);
write('data/citations/all-records.ris', recordRis);
const geometryCsl = (historicalBoundaries.features ?? []).map((feature) => { const evidence = feature.properties?.historicalGeometryEvidence ?? {}; return { id: `videha2026_${feature.id}`, type: 'map', title: feature.properties?.name ?? feature.id, author: [{ literal: 'Videha Digital Research Archive' }], issued: { 'date-parts': [[2026]] }, URL: `${SITE}/data/historical-boundaries.geojson#${feature.id}`, note: `${evidence.geometryScope ?? ''} Source: ${evidence.sourceCitation ?? ''} ${evidence.sourceUrl ?? ''}` }; });
write('data/citations/historical-geography.csl.json', `${JSON.stringify(geometryCsl, null, 2)}\n`);
write('data/citations/historical-geography.bib', (historicalBoundaries.features ?? []).map((feature) => { const e=feature.properties?.historicalGeometryEvidence??{}; return `@misc{videha2026_${feature.id.replace(/[^a-zA-Z0-9_:-]/g,'_')},\n  author = {{Videha Digital Research Archive}},\n  title = {${escapeBib(feature.properties?.name ?? feature.id)}},\n  year = {2026},\n  url = {${SITE}/data/historical-boundaries.geojson},\n  note = {Qualified research envelope; source: ${escapeBib(e.sourceCitation ?? '')}}\n}`; }).join('\n\n') + '\n');
write('data/citations/historical-geography.ris', (historicalBoundaries.features ?? []).map((feature) => { const e=feature.properties?.historicalGeometryEvidence??{}; return `TY  - MAP\nAU  - Videha Digital Research Archive\nTI  - ${feature.properties?.name ?? feature.id}\nPY  - 2026\nUR  - ${SITE}/data/historical-boundaries.geojson\nN1  - ${e.geometryScope ?? ''}\nN1  - Source: ${e.sourceCitation ?? ''}\nER  - `; }).join('\n\n') + '\n');
write('citations/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Citation Downloads | Videha Digital Research Archive</title></head><body><main style="max-width:900px;margin:auto;padding:3rem 1rem;font:17px/1.65 system-ui,sans-serif"><p>VIDEHA DIGITAL RESEARCH ARCHIVE</p><h1>Bulk scholarly citation exports</h1><h2>${records.length} permanent records</h2><p><a href="${SITE}/data/citations/all-records.csl.json">CSL-JSON</a> · <a href="${SITE}/data/citations/all-records.bib">BibTeX</a> · <a href="${SITE}/data/citations/all-records.ris">RIS</a></p><h2>Qualified historical-geography evidence</h2><p><a href="${SITE}/data/citations/historical-geography.csl.json">CSL-JSON</a> · <a href="${SITE}/data/citations/historical-geography.bib">BibTeX</a> · <a href="${SITE}/data/citations/historical-geography.ris">RIS</a></p></main></body></html>`);

function addSitemapRoute(route) {
  const sitemapPath = path.join(OUT, 'sitemap.xml');
  let xml = readFileSync(sitemapPath, 'utf8');
  const url = `${SITE}/${route}`;
  if (!xml.includes(`<loc>${url}</loc>`)) xml = xml.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>2026-09-14</lastmod></url>\n</urlset>`);
  writeFileSync(sitemapPath, xml, 'utf8');
}
for (const route of ['iiif/', 'provenance/', 'citations/']) addSitemapRoute(route);

// Patch the source-library landing page with interoperability links without removing any existing tool.
const sourceIndex = path.join(OUT, 'source-library/index.html');
if (existsSync(sourceIndex)) {
  let html = readFileSync(sourceIndex, 'utf8');
  const marker = '<div class="tools">';
  if (html.includes(marker) && !html.includes(`${SITE}/iiif/`)) {
    html = html.replace(marker, `${marker}<a href="${SITE}/iiif/">IIIF Presentation 3</a><a href="${SITE}/provenance/">PROV-O provenance</a><a href="${SITE}/citations/">Bulk citations</a>`);
    writeFileSync(sourceIndex, html, 'utf8');
  }
}

const splitReportPath = path.join(ROOT, 'app/generated/split-specialist-data-report.json');
const splitReport = existsSync(splitReportPath) ? readJson(splitReportPath) : null;
const report = {
  generatedAt: new Date().toISOString(),
  historicalMapOverlay: { sourceFeatures: historicalBoundaries.features?.length ?? 0, mirrorPagesInjected: ['/', '/en/'] },
  iiif: { version: 'Presentation API 3.0', manifests: manifestRefs.length, pageCanvasPolicy: 'no synthetic page canvases' },
  provenance: { graphEntities: graph.length, edges: edges.length, mappedPermanentRecords: mappedRecords, totalPermanentRecords: records.length },
  citations: { permanentRecords: records.length, historicalGeometries: geometryCsl.length, formats: ['CSL-JSON', 'BibTeX', 'RIS'] },
  performanceSplitting: splitReport ? { chunks: splitReport.totalChunks, largestGeneratedChunkBytes: splitReport.largestGeneratedChunkBytes, targetBytes: splitReport.maxTargetChunkBytes } : null,
  checksums: {
    boundaries: sha256(readFileSync(path.join(OUT, 'data/historical-boundaries.geojson'))),
    iiifCollection: sha256(readFileSync(path.join(OUT, 'iiif/collection.json'))),
    provenanceGraph: sha256(readFileSync(path.join(OUT, 'data/provenance-graph.jsonld'))),
    citationCsl: sha256(readFileSync(path.join(OUT, 'data/citations/all-records.csl.json'))),
  },
};
write('data/digital-humanities-extensions-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(`Digital-humanities extensions: ${manifestRefs.length} IIIF manifests; ${mappedRecords}/${records.length} records provenance-mapped; ${recordCsl.length} bulk citations; ${historicalBoundaries.features?.length ?? 0} map overlays.`);
