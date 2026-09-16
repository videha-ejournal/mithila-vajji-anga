import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const INVENTORY = 'app/generated/panji-article-inventory.json';
const OLD_ROOT = path.join('public', 'research-articles', 'decoding-panji');
const NEW_ROOT = path.join('public', 'decoding-panji');
const ROMAN = { 1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi' };
const OFFSETS = { 1: 0, 2: 20, 3: 58, 4: 90, 5: 177, 6: 217 };
const KNOWN = new Map([
  [82, 'ch-082-the-panjikar-anthropological-profile'],
  [183, 'ch-183-festivals-and-fairs-from-principles-to-public-culture'],
  [223, 'ch-223-compiling-panji-records-into-multi-generation-genealogies'],
]);

function slugify(value) {
  const ascii = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{ASCII}]+/gu, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return ascii || 'chapter';
}

const records = JSON.parse(readFileSync(INVENTORY, 'utf8'));
if (!Array.isArray(records) || records.length !== 247) throw new Error(`Expected 247 Panji chapter records; found ${records?.length ?? 'invalid'}.`);
if (!existsSync(OLD_ROOT)) throw new Error(`Temporary Panji source tree is missing: ${OLD_ROOT}`);
rmSync(NEW_ROOT, { recursive: true, force: true });
mkdirSync(NEW_ROOT, { recursive: true });

const mappings = [];
const seenRoutes = new Set();
for (const record of records) {
  const globalChapter = OFFSETS[record.volume] + record.chapter;
  const filename = KNOWN.get(globalChapter) ?? `ch-${String(globalChapter).padStart(3, '0')}-${slugify(record.title)}`;
  const route = `decoding-panji/vol-${ROMAN[record.volume]}/${filename}`;
  if (seenRoutes.has(route)) throw new Error(`Duplicate migrated Panji route: ${route}`);
  seenRoutes.add(route);
  mappings.push({
    record,
    globalChapter,
    oldRoute: record.route,
    oldCanonical: record.canonical,
    route,
    canonical: `${BASE}${route}/`,
  });
}

for (const mapping of mappings) {
  const oldFile = path.join('public', mapping.oldRoute, 'index.html');
  if (!existsSync(oldFile)) throw new Error(`Missing temporary chapter HTML: ${oldFile}`);
  let page = readFileSync(oldFile, 'utf8');
  for (const replacement of mappings) page = page.replaceAll(replacement.oldCanonical, replacement.canonical);
  page = page.replaceAll(`${BASE}research-articles/decoding-panji/`, `${BASE}decoding-panji/`);
  mapping.record.route = mapping.route;
  mapping.record.canonical = mapping.canonical;
  mapping.record.global_chapter = mapping.globalChapter;
  const target = path.join('public', mapping.route, 'index.html');
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, page);
}

const oldIndex = path.join(OLD_ROOT, 'index.html');
if (!existsSync(oldIndex)) throw new Error(`Missing temporary Panji collection index: ${oldIndex}`);
let indexPage = readFileSync(oldIndex, 'utf8');
for (const replacement of mappings) indexPage = indexPage.replaceAll(replacement.oldCanonical, replacement.canonical);
indexPage = indexPage.replaceAll(`${BASE}research-articles/decoding-panji/`, `${BASE}decoding-panji/`);
writeFileSync(path.join(NEW_ROOT, 'index.html'), indexPage);

const serialized = `${JSON.stringify(records, null, 2)}\n`;
writeFileSync(INVENTORY, serialized);
writeFileSync(path.join(NEW_ROOT, 'inventory.json'), serialized);
rmSync(OLD_ROOT, { recursive: true, force: true });

for (const knownGlobal of KNOWN.keys()) {
  const match = records.find((record) => record.global_chapter === knownGlobal);
  if (!match || !match.route.endsWith(KNOWN.get(knownGlobal))) throw new Error(`Known canonical slug correction failed for global chapter ${knownGlobal}.`);
}
console.log('Decoding Panji canonical route migration PASS', {
  chapters: records.length,
  first: records[0].canonical,
  last: records.at(-1).canonical,
  knownCorrections: [...KNOWN.keys()],
});
