import { readFileSync, writeFileSync } from 'node:fs';

const unitsPath = 'app/generated/archive-units.json';
const correctionsPath = 'app/panji-source-corrections.json';

const units = JSON.parse(readFileSync(unitsPath, 'utf8'));
const corrections = JSON.parse(readFileSync(correctionsPath, 'utf8'));

if (!Array.isArray(units)) throw new Error(`${unitsPath} must contain an array`);
if (!corrections || Array.isArray(corrections) || typeof corrections !== 'object') {
  throw new Error(`${correctionsPath} must contain an object keyed by work/chapter`);
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function dedupe(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const text = clean(value);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
  }
  return output;
}

function panjiDescription(unit) {
  const sections = dedupe(unit.sections).slice(0, 16);
  const focus = sections.slice(0, 8).join('; ');
  const opening = `“${unit.title}” is treated as a documentary chapter in ${unit.workTitle}, part of the Mithila–Vajji–Anga research archive. The chapter is read as evidence about genealogy, kinship, settlement, social memory, recording practice and the historical institutions that made Panji a long-duration archive across India and Nepal.`;
  let middle = `Its indexed structure follows ${sections.length} recorded subsection${sections.length === 1 ? '' : 's'}.`;
  if (focus) middle += ` The principal recorded lines of inquiry include ${focus}.`;
  const closing = 'This permanent page exposes the source hierarchy, section index and PDF provenance together; it is not a catalogue stub or a generic topic page. Readers should use the description as an analytical guide and the linked PDF as the authoritative text for quotation, pagination and philological verification.';
  return `${opening}\n\n${middle}\n\n${closing}`;
}

let applied = 0;
for (const [correctionKey, correction] of Object.entries(corrections)) {
  const match = /^(panji-[1-6])\/(\d+)$/.exec(correctionKey);
  if (!match) throw new Error(`Invalid Panji correction key: ${correctionKey}`);

  const workId = match[1];
  const number = Number(match[2]);
  const unitKey = `panji/${workId}/${String(number).padStart(3, '0')}`;
  const unit = units.find((item) => item.key === unitKey);
  if (!unit) throw new Error(`Panji correction has no generated archive unit: ${correctionKey}`);

  const title = clean(correction.title);
  const source = clean(correction.source);
  const sourcePages = clean(correction.sourcePages);
  const verification = clean(correction.verification);
  if (!title || !source || !verification) {
    throw new Error(`Incomplete Panji source correction: ${correctionKey}`);
  }

  unit.title = title;
  unit.sections = dedupe([...(Array.isArray(correction.prependSections) ? correction.prependSections : []), ...(Array.isArray(unit.sections) ? unit.sections : [])]);
  unit.description = panjiDescription(unit);
  unit.sourceCorrection = {
    source,
    sourcePages,
    verification,
  };
  if (!clean(unit.sourceNote).includes(source)) {
    unit.sourceNote = `${clean(unit.sourceNote)} · corrected against ${source}${sourcePages ? ` · pp. ${sourcePages}` : ''}`;
  }
  applied += 1;
}

writeFileSync(unitsPath, `${JSON.stringify(units, null, 2)}\n`, 'utf8');
console.log(`Applied ${applied} verified Panji source correction(s).`);
