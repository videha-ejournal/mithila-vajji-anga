import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const INVENTORY = 'dist/client/source-library/article-expansion-inventory.json';
const ROADMAP_HTML = 'dist/client/source-library/article-expansion-roadmap.html';
const ROADMAP_TSV = 'dist/client/source-library/article-expansion-roadmap.tsv';
const SOURCE_LIBRARY_INDEX = 'dist/client/source-library/index.html';
const CORE_ARTICLES = 522;

function load(file) {
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function tsv(value) {
  return String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

function statusLabel(status) {
  return ({
    'published-core': 'Certified core',
    'structure-audited': 'Structure audited',
    'needs-structure-audit': 'Needs structure audit',
    'book-only-support': 'Reference / support only',
    'duplicate-source-copy': 'Duplicate source copy',
  })[status] ?? status;
}

function groupLabel(group) {
  return ({
    'parallel-history': 'Parallel History',
    'panji': 'Decoding Panji',
    'samagra-and-collected-works': 'Samagra & collected works',
    'translation-pairs': 'Translation-linked books',
    'mithila-vajji-anga-history': 'Mithila–Vajji–Anga history',
    'remaining-books': 'Other books awaiting structural audit',
    'learning-and-reference-resources': 'Learning & reference resources',
    'duplicate-source-copies': 'Duplicate source copies',
  })[group] ?? group;
}

const inventory = load(INVENTORY);
const items = Array.isArray(inventory.items) ? inventory.items : [];
if (!items.length) throw new Error('Expansion inventory contains no source PDFs.');
if (inventory.certifiedCoreArticleCount !== CORE_ARTICLES) {
  throw new Error(`Roadmap refuses non-certified core count ${inventory.certifiedCoreArticleCount}; expected ${CORE_ARTICLES}.`);
}

const groups = [];
for (const item of items) {
  let group = groups.find((entry) => entry.id === item.queueGroup);
  if (!group) {
    group = { id: item.queueGroup, priority: Number(item.operationalPriority ?? 99), items: [] };
    groups.push(group);
  }
  group.items.push(item);
}
groups.sort((a, b) => a.priority - b.priority || groupLabel(a.id).localeCompare(groupLabel(b.id)));

const summaryCards = Object.entries(inventory.countsByStatus ?? {})
  .map(([status, count]) => `<li><strong>${esc(count)}</strong><span>${esc(statusLabel(status))}</span></li>`)
  .join('');

const sections = groups.map((group) => {
  const rows = group.items.map((item) => {
    const relation = item.translationOfTitle
      ? `Translation of: ${item.translationOfTitle}`
      : item.translatedAsTitle
        ? `Translated as: ${item.translatedAsTitle}`
        : item.workFamilyTitle
          ? `${item.workFamilyTitle}${item.workFamilyRole ? ` · ${item.workFamilyRole}` : ''}`
          : item.seriesTitle
            ? `${item.seriesTitle}${item.seriesPart ? ` · Part ${item.seriesPart}` : ''}`
            : '';
    const units = item.confirmedUnitCount == null ? '—' : String(item.confirmedUnitCount);
    const articles = item.articleCount == null ? '—' : String(item.articleCount);
    const duplicate = item.duplicateOf ? `<p><strong>Duplicate of:</strong> <code>${esc(item.duplicateOf)}</code></p>` : '';
    const segmentation = item.segmentation?.basis
      ? `<p><strong>Boundary evidence:</strong> ${esc(item.segmentation.basis)}</p>`
      : '';
    return `<tr data-source-row="true">
      <td><strong>${esc(item.title)}</strong><br><code>${esc(item.filename)}</code>${relation ? `<br><small>${esc(relation)}</small>` : ''}</td>
      <td>${esc(item.language ?? item.languageCode ?? '—')}</td>
      <td><span class="status status-${esc(item.status)}">${esc(statusLabel(item.status))}</span></td>
      <td>${esc(units)}</td>
      <td>${esc(articles)}</td>
      <td>${segmentation}${duplicate}<p>${esc(item.publicationRule ?? '')}</p></td>
      <td><a href="${esc(item.pinnedSourceUrl)}">Pinned PDF</a><br><a href="${esc(item.pinnedGithubUrl)}">Exact GitHub object</a></td>
    </tr>`;
  }).join('\n');
  return `<section class="group" id="${esc(group.id)}"><h2>${esc(groupLabel(group.id))} <small>(${group.items.length})</small></h2>
  <div class="table-wrap"><table><thead><tr><th>Source book / object</th><th>Language</th><th>Status</th><th>Verified units</th><th>Published articles</th><th>Scholarly gate</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>79-book scholarly expansion roadmap | Videha Digital Research Archive</title>
<meta name="description" content="Source-grounded roadmap for expanding the Videha Digital Research Archive beyond its certified 522 scholarly article editions.">
<meta name="source-pdf-count" content="${items.length}">
<link rel="canonical" href="https://videha-ejournal.github.io/mithila-vajji-anga/source-library/article-expansion-roadmap.html">
<style>
:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fbfaf6;color:#172437}main{max-width:1450px;margin:auto;padding:2.5rem 1rem 4rem}h1{font:700 clamp(2.2rem,5vw,4rem)/1.05 Georgia,serif;color:#0d2742}.lede{font:1.12rem/1.6 Georgia,serif;max-width:1000px}.warning{border:2px solid #9b5a24;background:#fff7e9;padding:1rem 1.1rem;border-radius:.6rem;max-width:1100px}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:.7rem;padding:0;list-style:none}.summary li{border:1px solid #c8c1b5;border-radius:.5rem;background:white;padding:.8rem}.summary strong{display:block;font-size:1.7rem}.summary span{font-size:.9rem}.group{margin:2.2rem 0}.group h2{font:700 1.55rem Georgia,serif}.group h2 small{font:400 .9rem system-ui,sans-serif}.table-wrap{overflow:auto;border:1px solid #d3ccc0;border-radius:.5rem;background:white}table{border-collapse:collapse;width:100%;min-width:1150px}th,td{text-align:left;vertical-align:top;padding:.7rem;border-bottom:1px solid #e2ddd3}th{position:sticky;top:0;background:#f2eee5;font-size:.82rem;text-transform:uppercase;letter-spacing:.03em}td:nth-child(4),td:nth-child(5){text-align:center}.status{display:inline-block;border:1px solid currentColor;border-radius:999px;padding:.15rem .45rem;font-size:.78rem;font-weight:700}.status-published-core{font-weight:900}.status-structure-audited{font-weight:900}code{font-size:.78rem;overflow-wrap:anywhere}a{color:#174c7d}a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}footer{margin-top:2rem;border-top:1px solid #cbc5b9;padding-top:1rem}.tools{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.tools a{border:1px solid #b8c0c8;border-radius:999px;padding:.45rem .7rem;text-decoration:none;font-weight:700;background:white}
@media(prefers-color-scheme:dark){body{background:#111827;color:#e5e7eb}h1{color:#f3f4f6}.warning{background:#2b2115}.summary li,.table-wrap{background:#161f2d}.table-wrap{border-color:#485260}th{background:#202b3a}a{color:#93c5fd}}
</style></head><body><main data-source-count="${items.length}">
<p><a href="./">← Source PDF Library</a></p>
<h1>Scholarly expansion roadmap</h1>
<p class="lede">This roadmap covers <strong>${items.length} commit-pinned source PDFs</strong> in the Videha source repository. The existing <strong>${CORE_ARTICLES} scholarly article editions</strong> remain the certified core. Every other source stays gated until its own internal structure and full-text boundaries are verified.</p>
<div class="warning"><strong>Inventory / roadmap only.</strong> A listed book is not automatically a published article corpus. “Structure audited” means unit boundaries are verified enough for the next extraction pass; it does not mean article pages have been published. No source is split mechanically by page count.</div>
<ul class="summary">${summaryCards}</ul>
<div class="tools"><a href="./article-expansion-inventory.json">Machine-readable expansion inventory</a><a href="./article-expansion-roadmap.tsv">TSV roadmap</a><a href="./catalog.json">Source PDF catalogue</a></div>
${sections}
<footer><p>Source identities are pinned to the exact Git commit and Git blob recorded in the source-library catalogue. Byte-identical copies are retained for provenance but suppressed from duplicate extraction.</p><p>Videha — First Maithili Fortnightly eJournal · ISSN 2229-547X · Mithila–Vajji–Anga research archive.</p></footer>
</main></body></html>`;

const tsvHeader = [
  'priority','queue_group','status','document_kind','filename','title','language','confirmed_units','published_articles','duplicate_of','translation_of','translated_as','work_family','publication_rule','pinned_source_url','git_blob_sha',
];
const tsvRows = items.map((item) => [
  item.operationalPriority,
  item.queueGroup,
  item.status,
  item.documentKind,
  item.filename,
  item.title,
  item.language ?? item.languageCode ?? '',
  item.confirmedUnitCount ?? '',
  item.articleCount ?? '',
  item.duplicateOf ?? '',
  item.translationOf ?? '',
  item.translatedAs ?? '',
  item.workFamilyTitle ?? '',
  item.publicationRule ?? '',
  item.pinnedSourceUrl,
  item.gitBlobSha,
].map(tsv).join('\t'));

writeFileSync(ROADMAP_HTML, html);
writeFileSync(ROADMAP_TSV, `${tsvHeader.join('\t')}\n${tsvRows.join('\n')}\n`);

if (existsSync(SOURCE_LIBRARY_INDEX)) {
  let index = readFileSync(SOURCE_LIBRARY_INDEX, 'utf8');
  if (!index.includes('article-expansion-roadmap.html')) {
    const marker = '<div class="tools">';
    if (!index.includes(marker)) throw new Error('Source-library index has no tools block for roadmap link insertion.');
    index = index.replace(marker, `${marker}<a href="./article-expansion-roadmap.html">Scholarly expansion roadmap</a><a href="./article-expansion-inventory.json">Article-expansion inventory (JSON)</a>`);
    writeFileSync(SOURCE_LIBRARY_INDEX, index);
  }
}

console.log(`Rendered scholarly expansion roadmap for ${items.length} source PDFs; certified core remains ${CORE_ARTICLES} article editions.`);
