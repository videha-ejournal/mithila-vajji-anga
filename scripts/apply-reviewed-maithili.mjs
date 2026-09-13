import { readFileSync, writeFileSync } from 'node:fs';

const unitsPath = 'app/generated/archive-units.json';
const outputPath = 'app/generated/archive-maithili.json';
const curatedPath = 'app/maithili-research-editions.json';
const reviewPath = 'app/maithili-research-review.json';

const units = JSON.parse(readFileSync(unitsPath, 'utf8'));
const generated = JSON.parse(readFileSync(outputPath, 'utf8'));
const curated = JSON.parse(readFileSync(curatedPath, 'utf8'));
const reviews = JSON.parse(readFileSync(reviewPath, 'utf8'));

if (!Array.isArray(units)) throw new Error(`${unitsPath} must contain an array`);
for (const [path, value] of [[outputPath, generated], [curatedPath, curated], [reviewPath, reviews]]) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${path} must contain an object keyed by archive unit`);
  }
}

const byKey = new Map(units.map((unit) => [unit.key, unit]));
let applied = 0;

for (const [key, review] of Object.entries(reviews)) {
  if (review?.status !== 'editorially-reviewed' || review?.sourceChecked !== true) continue;

  const unit = byKey.get(key);
  if (!unit) {
    throw new Error(`Review registry refers to a missing generated archive unit: ${key}`);
  }
  if (unit.group !== 'literature' && unit.group !== 'panji') {
    throw new Error(`Research-edition review registry may only target Literature/Panji units: ${key}`);
  }

  const text = String(curated[key] ?? '').trim();
  if (!text) {
    throw new Error(`Editorially reviewed unit is missing curated Maithili text in ${curatedPath}: ${key}`);
  }
  if (text.length < 280) {
    throw new Error(`Curated Maithili research edition is too short to be substantive: ${key}`);
  }

  generated[key] = text;
  applied += 1;
}

for (const key of Object.keys(curated)) {
  if (!byKey.has(key)) {
    throw new Error(`Curated Maithili store refers to a missing generated archive unit: ${key}`);
  }
}

writeFileSync(outputPath, `${JSON.stringify(generated, null, 2)}\n`, 'utf8');
console.log(`Applied ${applied} editorially reviewed Maithili research edition(s).`);
