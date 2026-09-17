import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DETAILS = 'app/collection-details.json';
const INVENTORY = 'app/generated/panji-article-inventory.json';
const PUBLIC_INVENTORY = 'public/research-articles/decoding-panji/inventory.json';
const ROOT = 'public';
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
const APPARATUS_RE = /<section class="panji-source-apparatus"[\s\S]*?<\/section>\s*/g;
const CONTAMINATED_TITLE_RE = /\b(?:This chapter continues|The Panji system is built around memory anchors|Source span decoded in this chapter)\b/i;
const SOURCE_NOTES_RE = /^Chapter\s+\d+\s+Source Notes$/i;
const STOPWORDS = new Set(`about above after again against all also among an and any are as at be because been before being below between both but by can chapter could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just may more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves source panji volume mithila`.split(/\s+/));

function clean(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function esc(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function decode(value) {
  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&');
}
function chapterMarker(title) {
  return clean(title).match(/^Chapter\s+(\d+)(?:\s*[.:\-–—]\s*(.+))?$/i);
}

function buildSourceStructure(details, volume) {
  const items = details[`panji-${volume}`]?.items;
  if (!Array.isArray(items)) throw new Error(`Missing source-heading inventory for panji-${volume}`);
  const chapters = new Map();
  let current = null;
  for (const item of items) {
    const level = Number(item?.level);
    const title = clean(item?.title);
    if (!title) continue;
    if (level === 1) {
      const marker = chapterMarker(title);
      if (marker) {
        const chapter = Number(marker[1]);
        current = { chapter, sourceTitle: clean(marker[2]), headings: [] };
        chapters.set(chapter, current);
        continue;
      }
      if (current && SOURCE_NOTES_RE.test(title)) {
        current.headings.push(title);
        continue;
      }
      if (current && !current.sourceTitle) {
        current.sourceTitle = title;
        continue;
      }
      current = null;
      continue;
    }
    if (level === 2 && current) current.headings.push(title);
  }
  return chapters;
}

function extractSourceBody(page, filePath) {
  const match = page.match(/<pre>([\s\S]*?)<\/pre>/);
  if (!match) throw new Error(`Missing source body in ${filePath}`);
  return decode(match[1]);
}

function concordance(text, limit = 80) {
  const tokens = text.match(/[\p{L}\p{N}][\p{L}\p{N}’'-]{3,}/gu) ?? [];
  const seen = new Set();
  const out = [];
  for (const raw of tokens) {
    const token = raw.replace(/^[-'’]+|[-'’]+$/g, '');
    const key = token.toLocaleLowerCase('en');
    if (token.length < 4 || STOPWORDS.has(key) || seen.has(key) || /^\d+$/.test(token)) continue;
    seen.add(key);
    out.push(token);
    if (out.length >= limit) break;
  }
  return out;
}

function repairTitle(page, record, sourceInfo) {
  const oldTitle = clean(record.title);
  const sourceTitle = clean(sourceInfo?.sourceTitle);
  if (!CONTAMINATED_TITLE_RE.test(oldTitle) || !sourceTitle) return page;
  record.title = sourceTitle;
  return page.replaceAll(esc(oldTitle), esc(sourceTitle)).replaceAll(oldTitle, sourceTitle);
}

function apparatusHtml(record, sourceInfo, sourceBody, previous, following) {
  const headings = (sourceInfo?.headings ?? []).filter(Boolean);
  const terms = concordance(sourceBody, 80);
  record.source_outline = headings;
  record.source_concordance = terms;
  const headingList = headings.length
    ? `<ol>${headings.map((h) => `<li>${esc(h)}</li>`).join('')}</ol>`
    : '<p>No subordinate heading was separately encoded in the repository source-heading inventory for this chapter.</p>';
  const termText = terms.length ? terms.map(esc).join(' · ') : 'No additional concordance terms were extracted.';
  const previousText = previous ? `Volume ${ROMAN[record.volume]} Chapter ${previous.chapter}, “${previous.title}”` : 'the beginning of this volume’s formal chapter sequence';
  const followingText = following ? `Volume ${ROMAN[record.volume]} Chapter ${following.chapter}, “${following.title}”` : 'the end of this volume’s formal chapter sequence';
  return `<section class="panji-source-apparatus" data-panji-substantive-apparatus="true">
<h2>Source structure and verification apparatus</h2>
<p><strong>Editorial source apparatus.</strong> This apparatus is descriptive, not interpretive. It records the source-controlled structure used to verify that this page corresponds to formal Chapter ${record.chapter} of <em>${esc(record.source_book)}</em>. The chapter text above is preserved from ${esc(record.source_locator)} in the commit-pinned authoritative source. It is not merged with a neighboring chapter, appendix, annexure, or independent front/back-matter unit. The internal headings below come from the repository’s source-heading inventory and are retained as navigational and audit evidence; showing them here does not turn those headings into separate publications or add claims that are absent from the source.</p>
<h3>Internal source headings</h3>
${headingList}
<h3>Source-text concordance</h3>
<p class="panji-concordance">${termText}</p>
<p><strong>Boundary verification.</strong> In the formal sequence this chapter follows ${esc(previousText)} and precedes ${esc(followingText)}. The chapter extractor begins at the verified formal Chapter ${record.chapter} marker and stops at the next verified formal chapter marker; for a final chapter it stops before recognized book-level back matter. The concordance above is generated only from distinct terms already present in this chapter’s preserved source text. It is provided for discovery, comparison, and audit, not as an automated judgment about persons, lineages, status, kinship, marriage eligibility, or historical truth.</p>
</section>`;
}

const details = JSON.parse(readFileSync(DETAILS, 'utf8'));
const records = JSON.parse(readFileSync(INVENTORY, 'utf8'));
if (!Array.isArray(records) || records.length !== 247) throw new Error(`Expected 247 Panji chapter records, found ${records?.length ?? 'invalid'}`);
const structures = new Map(Array.from({ length: 6 }, (_, i) => [i + 1, buildSourceStructure(details, i + 1)]));

for (const record of records) {
  const filePath = path.join(ROOT, record.route, 'index.html');
  let page = readFileSync(filePath, 'utf8').replace(APPARATUS_RE, '');
  const volumeStructure = structures.get(record.volume);
  const sourceInfo = volumeStructure?.get(record.chapter)
    ?? (volumeStructure?.size === 0
      ? { chapter: record.chapter, sourceTitle: record.title, headings: [] }
      : null);
  if (!sourceInfo) throw new Error(`Missing source structure for Volume ${record.volume} Chapter ${record.chapter}`);
  page = repairTitle(page, record, sourceInfo);
  const sourceBody = extractSourceBody(page, filePath);
  const sameVolume = records.filter((r) => r.volume === record.volume);
  const index = sameVolume.findIndex((r) => r.stable_id === record.stable_id);
  const previous = index > 0 ? sameVolume[index - 1] : null;
  const following = index >= 0 && index + 1 < sameVolume.length ? sameVolume[index + 1] : null;
  const apparatus = apparatusHtml(record, sourceInfo, sourceBody, previous, following);
  if (!page.includes('</pre>')) throw new Error(`Cannot insert source apparatus in ${filePath}`);
  page = page.replace('</pre>', `</pre>${apparatus}`);
  if (!page.includes('.panji-source-apparatus')) {
    page = page.replace('</style>', '.panji-source-apparatus{margin:1.5rem 0;padding:1rem 1.2rem;border:1px solid #cfbf9d;border-radius:12px;background:#fffaf0}.panji-source-apparatus h2,.panji-source-apparatus h3{color:#17243a}.panji-source-apparatus li{margin:.3rem 0}.panji-concordance{overflow-wrap:anywhere}</style>');
  }
  writeFileSync(filePath, page);
}

const serialized = `${JSON.stringify(records, null, 2)}\n`;
writeFileSync(INVENTORY, serialized);
writeFileSync(PUBLIC_INVENTORY, serialized);
console.log('Decoding Panji source apparatus enriched:', {
  chapters: records.length,
  volumes: 6,
  volumesWithoutFormalHeadingAnchors: [...structures.entries()].filter(([, map]) => map.size === 0).map(([volume]) => volume),
});
