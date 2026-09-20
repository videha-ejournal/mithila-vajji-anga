import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const inventoryPath = 'app/generated/panji-article-inventory.json';
const base = 'https://videha-ejournal.github.io/mithila-vajji-anga/decoding-panji/';
const expected = [20, 38, 32, 87, 40, 30];
function valid(records) {
  return Array.isArray(records) && records.length === 247 &&
    new Set(records.map(record => record.stable_id)).size === 247 &&
    records.every(record => record.kind === 'chapter' && record.canonical?.startsWith(base) && record.title && /^[a-f0-9]{40}$/i.test(record.source_commit)) &&
    expected.every((count, index) => records.filter(record => record.volume === index + 1).length === count);
}

// Development uses the published, source-pinned inventory. Production continues
// to regenerate and validate the corpus from the original PDFs.
let records;
try { records = JSON.parse(readFileSync(inventoryPath, 'utf8')); } catch {}
if (!valid(records)) {
  console.log('Preparing the complete published Panji inventory for local development…');
  const response = await fetch(`${base}inventory.json`);
  if (!response.ok) throw new Error(`Panji inventory download failed: HTTP ${response.status}. Run npm run generate:panji-research-articles when offline.`);
  const text = await response.text();
  records = JSON.parse(text);
  if (!valid(records)) throw new Error('Published Panji inventory failed the 247-chapter and six-volume checks.');
  mkdirSync('app/generated', { recursive: true });
  writeFileSync(inventoryPath, text);
}
for (const [script, ...args] of [
  ['export-isbn-authority'],
  ['audit-panji-source', '--strict', '--write-inventory'],
  ['prepare-runtime-data'],
  ['optimize-home-runtime'],
]) {
  const result = spawnSync(process.execPath, [`scripts/${script}.mjs`, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Development data ready: 247 Panji chapters across all six volumes.');
