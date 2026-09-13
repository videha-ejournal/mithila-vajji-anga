import { readFileSync } from 'node:fs';

const path = 'app/classical-philosophy-inventory.json';
const data = JSON.parse(readFileSync(path, 'utf8'));
const requireComplete = process.argv.includes('--require-complete');
const requiredWorks = [
  'bhamati',
  'atmatattvaviveka',
  'nyayakusumanjali',
  'tattvacintamani',
];

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

const errors = [];
if (!data || Array.isArray(data) || typeof data !== 'object') {
  errors.push(`${path} must contain an object`);
}
if (data?.schemaVersion !== 1) errors.push(`${path} must use schemaVersion 1`);
if (!data?.works || Array.isArray(data.works) || typeof data.works !== 'object') {
  errors.push(`${path} must contain a works object`);
}

for (const workId of requiredWorks) {
  const work = data?.works?.[workId];
  if (!work || Array.isArray(work) || typeof work !== 'object') {
    errors.push(`Missing classical Philosophy inventory: ${workId}`);
    continue;
  }

  const units = Array.isArray(work.units) ? work.units : [];
  const status = clean(work.status);
  const sourceDocument = clean(work.sourceDocument);
  if (!['pending', 'verified'].includes(status)) {
    errors.push(`${workId}: status must be pending or verified`);
  }
  if (!sourceDocument && status === 'verified') {
    errors.push(`${workId}: verified inventory needs sourceDocument provenance`);
  }

  const seen = new Set();
  for (const unit of units) {
    const number = Number(unit?.number);
    const title = clean(unit?.title);
    const sections = Array.isArray(unit?.sections) ? unit.sections.map(clean).filter(Boolean) : [];
    const sourceNote = clean(unit?.sourceNote);

    if (!Number.isInteger(number) || number < 1 || seen.has(number)) {
      errors.push(`${workId}: invalid or duplicate unit number ${number}`);
      continue;
    }
    seen.add(number);
    if (!title || /^Chapter\s+\d+$/i.test(title) || /^Unit\s+\d+$/i.test(title)) {
      errors.push(`${workId}/${number}: missing substantive source title`);
    }
    if (sections.length < 2) {
      errors.push(`${workId}/${number}: at least two source-indexed sections are required`);
    }
    if (!sourceNote) {
      errors.push(`${workId}/${number}: sourceNote is required`);
    }
  }

  const numbers = [...seen].sort((a, b) => a - b);
  if (numbers.some((number, index) => number !== index + 1)) {
    errors.push(`${workId}: unit numbering must be contiguous from 1`);
  }

  if (status === 'verified' && units.length === 0) {
    errors.push(`${workId}: verified inventory cannot be empty`);
  }
  if (status === 'verified' && work.maithiliSourceReady !== true) {
    errors.push(`${workId}: verified source-bilingual inventory must confirm maithiliSourceReady=true`);
  }
  if (requireComplete && status !== 'verified') {
    errors.push(`${workId}: generation remains blocked until the source inventory is verified`);
  }
}

for (const workId of Object.keys(data?.works ?? {})) {
  if (!requiredWorks.includes(workId)) errors.push(`Unexpected classical Philosophy work: ${workId}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  if (requireComplete) {
    console.error(`Classical Philosophy generation gate failed with ${errors.length} issue(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Classical Philosophy inventory schema is present; ${errors.length} completion issue(s) remain intentionally unpublished.`);
  }
} else {
  console.log(
    requireComplete
      ? 'All four classical Philosophy inventories are source-verified and Maithili-source ready.'
      : 'Classical Philosophy source-inventory schema is valid.',
  );
}
