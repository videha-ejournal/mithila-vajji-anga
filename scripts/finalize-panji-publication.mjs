import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = 'public';
const INVENTORY = 'app/generated/panji-article-inventory.json';
const BASE = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const FIGURE_DISCLAIMER = 'Synthetic illustrated reconstruction for editorial use. This is not a photograph or facsimile of a historical manuscript.';
const GRAPH_REVIEW = 'Human review required.';
const GRAPH_LIMIT = 'This prototype encodes relationships and tags; it does not decide marriage eligibility or kinship status.';
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
const VOLUME_ART = {
  1: 'assets/book-covers/cover-front.webp',
  2: 'assets/book-covers/decoding-panji-ii-front.webp',
  3: 'assets/book-covers/decoding-panji-vol-iii-spread.webp',
  4: 'assets/book-covers/decoding-panji-vol-iv-spread.webp',
  5: 'assets/book-covers/decoding-panji-vol-v-spread.webp',
  6: 'assets/book-covers/decoding-panji-vi-front.webp',
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function publicationBlock(record) {
  const outline = Array.isArray(record.source_outline) ? record.source_outline : [];
  const outlineNote = outline.length
    ? `The repository source-heading inventory records ${outline.length} subordinate heading${outline.length === 1 ? '' : 's'} for this chapter: ${outline.slice(0, 8).map((item) => `“${item}”`).join('; ')}${outline.length > 8 ? '; …' : ''}.`
    : 'The repository source-heading inventory records no separately encoded subordinate heading for this chapter.';
  const volumeArt = `${BASE}${VOLUME_ART[record.volume]}`;
  const seriesArt = `${BASE}assets/book-covers/decoding-the-panji.webp`;
  const orientationArt = `${BASE}assets/orientation-map-page.png`;
  return `<section class="panji-publication-apparatus" data-panji-publication-figures="4" aria-labelledby="panji-visual-title">
<h2 id="panji-visual-title">Illustrated research apparatus</h2>
<p class="scope-badges" aria-label="Archive geographical scope">Mithila · Vajji · Anga</p>
<nav class="panji-archive-nav" aria-label="Videha research archive navigation">
<a href="${BASE}">Home</a>
<a href="${BASE}panji/">Panji Text Corpus</a>
<a href="${BASE}about/">Metadata</a>
<a href="${BASE}history/">Map</a>
<a href="${BASE}#global-search">Search</a>
<a href="${BASE}sources/">Sources</a>
<a href="${BASE}research-articles/decoding-panji/">Decoding Panji Vol. I–VI</a>
</nav>
<div class="panji-figure-grid">
<figure id="panji-asset-art-1" data-panji-figure="asset-art-1">
<img src="${seriesArt}" alt="Decoding the Panji publication artwork" loading="lazy" decoding="async">
<figcaption><strong>Figure 1 · Asset Art 1.</strong> Decoding the Panji publication artwork retained as series-level visual context.</figcaption>
</figure>
<figure id="panji-gallery-artwork-a" data-panji-figure="gallery-artwork-a">
<img src="${volumeArt}" alt="Decoding the Panji Volume ${ROMAN[record.volume]} publication artwork" loading="lazy" decoding="async">
<figcaption><strong>Figure 2 · Gallery artwork A.</strong> Publication artwork associated with Volume ${ROMAN[record.volume]}.</figcaption>
</figure>
<figure id="panji-gallery-artwork-b" data-panji-figure="gallery-artwork-b">
<img src="${orientationArt}" alt="Mithila Vajji Anga orientation map artwork" loading="lazy" decoding="async">
<figcaption><strong>Figure 3 · Gallery artwork B.</strong> Archive orientation artwork situating the research corpus within the governing Mithila–Vajji–Anga frame.</figcaption>
</figure>
<figure id="panji-synthetic-reconstruction" data-panji-figure="synthetic-reconstruction">
<div class="panji-synthetic-grid" role="group" aria-label="Synthetic Panji folio and genealogical network reconstruction">
<svg class="panji-folio" viewBox="0 0 520 330" role="img" aria-labelledby="folio-title-${record.stable_id}">
<title id="folio-title-${record.stable_id}">Synthetic illustrated Panji folio reconstruction</title>
<rect x="12" y="12" width="496" height="306" rx="10" fill="#f4e2ad" stroke="#68491d" stroke-width="4"/>
<path d="M54 64H460M54 98H430M54 132H470M54 166H405M54 200H455M54 234H420M54 268H468" stroke="#77582a" stroke-width="7" stroke-linecap="round" opacity=".78"/>
<path d="M112 45v247M270 45v247" stroke="#b99859" stroke-width="2" opacity=".8"/>
<circle cx="82" cy="64" r="8" fill="#9b3d24"/><circle cx="82" cy="166" r="8" fill="#9b3d24"/><circle cx="82" cy="268" r="8" fill="#9b3d24"/>
<text x="360" y="296" font-family="serif" font-size="22" fill="#523714">PANJI · SYNTHETIC</text>
</svg>
<svg class="panji-network" viewBox="0 0 520 330" role="img" aria-labelledby="network-title-${record.stable_id}">
<title id="network-title-${record.stable_id}">Synthetic genealogical network for editorial explanation</title>
<g stroke="#6e7c75" stroke-width="4" fill="none"><path d="M260 55L140 145M260 55L380 145M140 145L85 250M140 145L195 250M380 145L325 250M380 145L435 250"/></g>
<g fill="#f8f3e7" stroke="#203b34" stroke-width="4"><circle cx="260" cy="55" r="31"/><circle cx="140" cy="145" r="31"/><circle cx="380" cy="145" r="31"/><circle cx="85" cy="250" r="31"/><circle cx="195" cy="250" r="31"/><circle cx="325" cy="250" r="31"/><circle cx="435" cy="250" r="31"/></g>
<g font-family="system-ui,sans-serif" font-size="15" text-anchor="middle" fill="#203b34"><text x="260" y="60">Anchor</text><text x="140" y="150">Branch A</text><text x="380" y="150">Branch B</text><text x="85" y="255">A1</text><text x="195" y="255">A2</text><text x="325" y="255">B1</text><text x="435" y="255">B2</text></g>
</svg>
</div>
<figcaption><strong>Figure 4 · Synthetic reconstruction plate.</strong> Left: a synthetic Panji folio. Right: a synthetic genealogical network used only to explain record relationships. ${FIGURE_DISCLAIMER} <strong>${GRAPH_REVIEW}</strong> ${GRAPH_LIMIT}</figcaption>
</figure>
</div>
</section>
<section class="panji-footnotes" data-panji-footnotes="chapter-specific" aria-labelledby="panji-notes-title">
<h2 id="panji-notes-title">Chapter-specific source notes</h2>
<ol>
<li id="note-source-${record.stable_id}"><strong>Primary chapter witness.</strong> Gajendra Thakur, <em>${esc(record.source_book)}</em>, formal Chapter ${record.chapter}, ${esc(record.source_locator)}. The HTML transcription is generated from the commit-pinned source PDF and retains the chapter boundary recorded in this edition.</li>
<li id="note-structure-${record.stable_id}"><strong>Internal structure.</strong> ${esc(outlineNote)}</li>
<li id="note-method-${record.stable_id}"><strong>Digital editorial method.</strong> The page keeps the preserved source text distinct from generated navigational, concordance, visual, and provenance apparatus. The synthetic reconstruction is explanatory only and is not evidence for an individual lineage or a determination of social or marital status.</li>
</ol>
</section>`;
}

const records = JSON.parse(readFileSync(INVENTORY, 'utf8'));
if (!Array.isArray(records) || records.length !== 247) throw new Error(`Expected 247 Panji chapter records; found ${records?.length ?? 'invalid'}`);

for (const record of records) {
  const filePath = path.join(ROOT, record.route, 'index.html');
  let page = readFileSync(filePath, 'utf8');
  page = page.replace(/<section class="panji-publication-apparatus"[\s\S]*?<\/section>\s*<section class="panji-footnotes"[\s\S]*?<\/section>\s*/g, '');
  const block = publicationBlock(record);
  const navMarker = '<nav class="nav">';
  if (!page.includes(navMarker)) throw new Error(`Cannot insert Panji publication apparatus: ${filePath}`);
  page = page.replace(navMarker, `${block}${navMarker}`);
  page = page.replace('</style>', `.panji-publication-apparatus,.panji-footnotes{margin:1.5rem 0;padding:1rem 1.2rem;border:1px solid #cfbf9d;border-radius:12px;background:#fffaf0}.scope-badges{font:800 .82rem/1.4 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7a351c}.panji-archive-nav{display:flex;flex-wrap:wrap;gap:.45rem .9rem;margin:1rem 0 1.4rem;font:700 .88rem/1.4 system-ui,sans-serif}.panji-figure-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}.panji-figure-grid figure{margin:0;padding:.75rem;border:1px solid #ded3bc;border-radius:10px;background:#fff}.panji-figure-grid img,.panji-figure-grid svg{display:block;width:100%;height:auto;border-radius:7px}.panji-figure-grid figcaption{margin-top:.6rem;font:14px/1.5 system-ui,sans-serif}.panji-synthetic-grid{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}.panji-footnotes li{margin:.75rem 0}@media(max-width:620px){.panji-synthetic-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}</style>`);
  writeFileSync(filePath, page);
}

console.log('Decoding Panji publication apparatus restored:', { chapters: records.length, figuresPerChapter: 4, chapterSpecificSourceNotes: true, scope: 'Mithila · Vajji · Anga' });
