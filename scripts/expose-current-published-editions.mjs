import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RECORDS_ROOT = join(ROOT, 'dist/client/records');
const PROVENANCE_PATH = join(RECORDS_ROOT, 'source-provenance.json');
const SITE = 'https://videha-ejournal.github.io/mithila-vajji-anga';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

if (!existsSync(PROVENANCE_PATH)) {
  throw new Error('Record-source provenance must be generated before published-edition links are exposed.');
}

const provenance = JSON.parse(readFileSync(PROVENANCE_PATH, 'utf8'));
const mappings = Array.isArray(provenance.mappings) ? provenance.mappings : [];
const machineProvenanceLink = `<a class="secondary" href="${SITE}/records/source-provenance.json">Machine provenance</a>`;
let linkedCount = 0;

for (const mapping of mappings) {
  if (!mapping.currentPublishedUrl) continue;

  let publishedUrl;
  try {
    publishedUrl = new URL(mapping.currentPublishedUrl);
  } catch {
    throw new Error(`Invalid current published URL for ${mapping.recordType}:${mapping.recordId}: ${mapping.currentPublishedUrl}`);
  }
  if (!['https:', 'http:'].includes(publishedUrl.protocol)) {
    throw new Error(`Unsupported current published URL protocol for ${mapping.recordType}:${mapping.recordId}: ${publishedUrl.protocol}`);
  }

  const pagePath = join(RECORDS_ROOT, mapping.recordType, mapping.recordId, 'index.html');
  if (!existsSync(pagePath)) {
    throw new Error(`Mapped permanent record page is missing while exposing published edition: ${mapping.recordType}/${mapping.recordId}`);
  }

  let html = readFileSync(pagePath, 'utf8');
  if (html.includes('data-current-published-edition="true"')) {
    linkedCount += 1;
    continue;
  }
  if (!html.includes(machineProvenanceLink)) {
    throw new Error(`Could not locate source-provenance actions for ${mapping.recordType}/${mapping.recordId}`);
  }

  const publishedEditionLink = `<a class="secondary" data-current-published-edition="true" href="${escapeHtml(publishedUrl.toString())}">Current published edition</a>`;
  html = html.replace(machineProvenanceLink, `${publishedEditionLink}${machineProvenanceLink}`);
  writeFileSync(pagePath, html);
  linkedCount += 1;
}

provenance.currentPublishedLinkCount = linkedCount;
writeFileSync(PROVENANCE_PATH, `${JSON.stringify(provenance, null, 2)}\n`);

console.log(`Published-edition links: ${linkedCount} verified current URLs exposed from source-catalogue metadata; no inferred URLs or PDF page locators added.`);
