import { existsSync, readFileSync } from 'node:fs';

const units = JSON.parse(readFileSync('app/generated/archive-units.json', 'utf8'));
const maithili = JSON.parse(readFileSync('app/generated/archive-maithili.json', 'utf8'));
const literatureInventoryPath = 'app/literature-inventory.json';

const genericLiterature = [
  /^A Parallel History of Mithil[aā] & Maithil[iī] Literature\s*[—-]\s*Volume\s+\d+$/i,
  /^Parallel (?:History|Literature).*Volume\s+\d+$/i,
  /^Chapter\s+\d+$/i,
];

function expectedTome(number) {
  if (number >= 1 && number <= 25) return 'I';
  if (number <= 50) return 'II';
  if (number <= 75) return 'III';
  if (number <= 100) return 'IV';
  return null;
}

function verifyLiteratureInventory() {
  if (!existsSync(literatureInventoryPath)) {
    console.log('Parallel Literature inventory is not yet committed; Literature detail publication remains disabled.');
    return;
  }

  const inventory = JSON.parse(readFileSync(literatureInventoryPath, 'utf8'));
  if (!Array.isArray(inventory) || inventory.length !== 100) {
    throw new Error(`app/literature-inventory.json must contain exactly 100 source-verified chapters; found ${Array.isArray(inventory) ? inventory.length : 'non-array data'}.`);
  }

  const seen = new Set();
  for (const record of inventory) {
    const number = record?.number;
    const title = String(record?.title ?? '').trim();
    const tome = String(record?.tome ?? '').trim();
    const sources = Array.isArray(record?.verificationSources) ? record.verificationSources.map(String) : [];
    const sourceNote = String(record?.sourceNote ?? '').trim();

    if (!Number.isInteger(number) || number < 1 || number > 100 || seen.has(number)) {
      throw new Error(`Invalid or duplicate Parallel Literature chapter number: ${number}`);
    }
    seen.add(number);
    if (!title || genericLiterature.some((pattern) => pattern.test(title))) {
      throw new Error(`Missing or synthetic Parallel Literature title: Chapter ${number} — ${title}`);
    }

    const requiredTome = expectedTome(number);
    if (tome !== requiredTome) {
      throw new Error(`Parallel Literature Chapter ${number} must belong to Tome ${requiredTome}; found Tome ${tome || '(missing)'}.`);
    }

    const expectedQuiz = `https://videha-ejournal.github.io/VIDEHA_PARALLEL_HISTORY_TOME_${requiredTome}.html`;
    if (!sources.includes(expectedQuiz)) {
      throw new Error(`Parallel Literature Chapter ${number} is missing its authoritative Tome ${requiredTome} quiz provenance.`);
    }
    if (!sources.some((url) => url.startsWith('https://videhamaithili.wordpress.com/2026/06/18/'))) {
      throw new Error(`Parallel Literature Chapter ${number} is missing the Videha eLearning source-index provenance.`);
    }
    if (!sourceNote.includes('VIDEHA_Parallel_History.pdf') || !sourceNote.includes(`Tome ${requiredTome}`) || !sourceNote.includes(`Chapter ${number}`)) {
      throw new Error(`Parallel Literature Chapter ${number} has incomplete source-note provenance.`);
    }
  }

  const numbers = [...seen].sort((a, b) => a - b);
  if (numbers.some((number, index) => number !== index + 1)) {
    throw new Error('Parallel Literature inventory must cover Chapters 1–100 without gaps.');
  }

  console.log('Verified canonical Parallel Literature inventory: Chapters 1–100, Tome boundaries I–IV, titles and source provenance.');
}

verifyLiteratureInventory();

if (!Array.isArray(units)) {
  throw new Error('archive-units.json must contain an array');
}
if (!maithili || Array.isArray(maithili) || typeof maithili !== 'object') {
  throw new Error('archive-maithili.json must contain an object keyed by archive unit');
}

if (units.length === 0) {
  console.log('Bilingual archive detail inventory is not yet committed; collection indexes remain available and no synthetic detail pages will be emitted.');
  process.exit(0);
}

const allowedGroups = new Set(['philosophy', 'literature', 'panji']);
const keys = new Set();

for (const unit of units) {
  if (!allowedGroups.has(unit.group)) {
    throw new Error(`Unsupported archive group: ${unit.group}`);
  }
  if (!unit.key || keys.has(unit.key)) {
    throw new Error(`Missing or duplicate archive key: ${unit.key}`);
  }
  keys.add(unit.key);
  if (!unit.workId || !unit.unitId || !Number.isInteger(unit.number) || unit.number < 1) {
    throw new Error(`Invalid route identity for ${unit.key}`);
  }
  if (!String(unit.title ?? '').trim()) {
    throw new Error(`Missing source title for ${unit.key}`);
  }
  if (!String(unit.sourcePdf ?? '').includes('github.com/videha-ejournal/videha-ejournal/blob/main/')) {
    throw new Error(`Archive unit does not point to the source repository PDF: ${unit.key}`);
  }
  if (unit.group === 'literature' && genericLiterature.some((pattern) => pattern.test(unit.title.trim()))) {
    throw new Error(`Synthetic/generic Literature title refused: ${unit.key} — ${unit.title}`);
  }
  if (!String(maithili[unit.key] ?? '').trim()) {
    throw new Error(`Missing paired Maithili reading for ${unit.key}`);
  }
}

const literature = units.filter((unit) => unit.group === 'literature');
if (literature.length !== 0) {
  const numbers = literature.map((unit) => unit.number).sort((a, b) => a - b);
  if (literature.length !== 100 || numbers.some((number, index) => number !== index + 1)) {
    throw new Error(`Parallel Literature must be either unpublished or a complete verified 1–100 inventory; found ${literature.length} units.`);
  }
}

const panji = units.filter((unit) => unit.group === 'panji');
if (panji.length !== 0) {
  const volumes = new Set(panji.map((unit) => unit.workId));
  for (let number = 1; number <= 6; number += 1) {
    if (!volumes.has(`panji-${number}`)) {
      throw new Error(`Missing source-grounded permanent units for panji-${number}`);
    }
  }
}

const philosophy = units.filter((unit) => unit.group === 'philosophy');
if (philosophy.length !== 0) {
  const requiredWorks = [
    'parallel-philosophy-1',
    'parallel-philosophy-2',
    'bhamati',
    'atmatattvaviveka',
    'nyayakusumanjali',
    'tattvacintamani',
  ];
  const works = new Set(philosophy.map((unit) => unit.workId));
  for (const work of requiredWorks) {
    if (!works.has(work)) throw new Error(`Missing philosophy source work: ${work}`);
  }
}

console.log(`Verified ${units.length} bilingual archive units; no synthetic Literature titles detected.`);
