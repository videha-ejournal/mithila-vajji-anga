import { existsSync, readFileSync } from 'node:fs';

const units = JSON.parse(readFileSync('app/generated/archive-units.json', 'utf8'));
const maithili = JSON.parse(readFileSync('app/generated/archive-maithili.json', 'utf8'));
const literatureInventoryPath = 'app/literature-inventory.json';
const maithiliReviewPath = 'app/maithili-research-review.json';
const maithiliReviews = existsSync(maithiliReviewPath)
  ? JSON.parse(readFileSync(maithiliReviewPath, 'utf8'))
  : {};

const genericLiterature = [
  /^A Parallel History of Mithil[aā] & Maithil[iī] Literature\s*[—-]\s*Volume\s+\d+$/i,
  /^Parallel (?:History|Literature).*Volume\s+\d+$/i,
  /^Chapter\s+\d+$/i,
];

const invalidPanjiTitles = [
  /^Chapter\s+\d+$/i,
  /^Opening$/i,
  /^Chapter\s+\d+\s+Source Notes$/i,
  /^Source Notes$/i,
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

function verifyMaithiliResearchReview(unit) {
  if (unit.group !== 'literature' && unit.group !== 'panji') return;
  const review = maithiliReviews?.[unit.key];
  if (!review || review.status !== 'editorially-reviewed' || review.sourceChecked !== true) {
    throw new Error(`Maithili research edition is not editorially source-reviewed: ${unit.key}`);
  }
  if (!String(review.note ?? '').trim()) {
    throw new Error(`Maithili research-edition review record needs a note: ${unit.key}`);
  }
}

verifyLiteratureInventory();

if (!Array.isArray(units)) {
  throw new Error('archive-units.json must contain an array');
}
if (!maithili || Array.isArray(maithili) || typeof maithili !== 'object') {
  throw new Error('archive-maithili.json must contain an object keyed by archive unit');
}
if (!maithiliReviews || Array.isArray(maithiliReviews) || typeof maithiliReviews !== 'object') {
  throw new Error('app/maithili-research-review.json must contain an object keyed by archive unit');
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

  const title = String(unit.title ?? '').trim();
  if (!title) {
    throw new Error(`Missing source title for ${unit.key}`);
  }
  if (!String(unit.sourcePdf ?? '').includes('github.com/videha-ejournal/videha-ejournal/blob/main/')) {
    throw new Error(`Archive unit does not point to the source repository PDF: ${unit.key}`);
  }
  if (!String(unit.description ?? '').trim() || String(unit.description).trim().length < 280) {
    throw new Error(`Archive unit does not have a substantive description: ${unit.key}`);
  }
  if (unit.group === 'literature' && genericLiterature.some((pattern) => pattern.test(title))) {
    throw new Error(`Synthetic/generic Literature title refused: ${unit.key} — ${title}`);
  }
  if (unit.group === 'literature') {
    if (!String(unit.sourceLanguage ?? '').includes('Maithili research edition prepared for the Videha Digital Research Archive')) {
      throw new Error(`Literature unit is missing the required Maithili research-edition disclosure: ${unit.key}`);
    }
  }
  if (unit.group === 'panji') {
    if (invalidPanjiTitles.some((pattern) => pattern.test(title))) {
      throw new Error(`Unresolved or subsection-only Panji title refused: ${unit.key} — ${title}`);
    }
    if (!Array.isArray(unit.sections) || unit.sections.filter((value) => String(value).trim()).length < 2) {
      throw new Error(`Panji permanent page needs at least two source-indexed subsections: ${unit.key}`);
    }
    if (!String(unit.sourceLanguage ?? '').includes('Maithili research edition prepared for the Videha Digital Research Archive')) {
      throw new Error(`Panji unit is missing the required Maithili research-edition disclosure: ${unit.key}`);
    }
    if (!String(unit.sourceNote ?? '').includes('source paragraphs')) {
      throw new Error(`Panji unit is missing source-document structural provenance: ${unit.key}`);
    }
  }
  if (!String(maithili[unit.key] ?? '').trim()) {
    throw new Error(`Missing paired Maithili reading for ${unit.key}`);
  }
  verifyMaithiliResearchReview(unit);
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
    const workId = `panji-${number}`;
    if (!volumes.has(workId)) {
      throw new Error(`Missing source-grounded permanent units for ${workId}`);
    }
    const workUnits = panji.filter((unit) => unit.workId === workId).sort((a, b) => a.number - b.number);
    if (workUnits.length < 1 || workUnits.some((unit, index) => unit.number !== index + 1)) {
      throw new Error(`${workId} must expose a contiguous source-grounded chapter sequence beginning at Chapter 1.`);
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

console.log(`Verified ${units.length} bilingual archive units; source-grounded detail and paired-language gates passed.`);
