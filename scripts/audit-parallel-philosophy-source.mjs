import { readFileSync, writeFileSync } from 'node:fs';

const deep = JSON.parse(readFileSync('app/deep-data.json', 'utf8'));
const volumeTwo = JSON.parse(readFileSync('app/ideas-volume2.json', 'utf8'));
const strict = process.argv.includes('--strict');
const writeInventory = process.argv.includes('--write-inventory');
const jsonOutput = process.argv.includes('--json');
const inventoryPath = 'app/generated/philosophy-inventory.json';

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function auditVolume({ workId, expectedCount, records, sourceLabel }) {
  const errors = [];
  const normalized = [];
  const seen = new Set();

  for (const item of Array.isArray(records) ? records : []) {
    if (item?.status === 'Planned') continue;
    const number = Number(item?.number);
    const title = clean(item?.title);
    const summary = clean(item?.summary);
    const sections = Array.isArray(item?.sections)
      ? [...new Set(item.sections.map(clean).filter(Boolean))]
      : [];
    const source = clean(item?.source);

    if (!Number.isInteger(number) || number < 1 || seen.has(number)) {
      errors.push(`Invalid or duplicate chapter number ${number}`);
      continue;
    }
    seen.add(number);
    if (!title || /^Chapter\s+\d+$/i.test(title)) {
      errors.push(`Chapter ${number} has no substantive source title`);
    }
    if (summary.length < 280) {
      errors.push(`Chapter ${number} has insufficient source summary (${summary.length} characters)`);
    }
    if (sections.length < 2) {
      errors.push(`Chapter ${number} has fewer than two indexed sections`);
    }
    if (!source) {
      errors.push(`Chapter ${number} is missing source provenance`);
    }

    normalized.push({
      workId,
      number,
      title,
      part: clean(item?.part),
      sections,
      source,
      sourceLabel,
    });
  }

  normalized.sort((a, b) => a.number - b.number);
  if (normalized.length !== expectedCount) {
    errors.push(`Expected ${expectedCount} source chapters, found ${normalized.length}`);
  }
  if (normalized.some((record, index) => record.number !== index + 1)) {
    errors.push(`Chapter numbering must be contiguous from 1 through ${expectedCount}`);
  }

  return { workId, expectedCount, chapters: normalized, errors };
}

const volumeOne = auditVolume({
  workId: 'parallel-philosophy-1',
  expectedCount: 72,
  records: deep?.philosophyChapters,
  sourceLabel: 'Maithili–English source-bilingual chapter',
});
const volumeTwoAudit = auditVolume({
  workId: 'parallel-philosophy-2',
  expectedCount: 100,
  records: volumeTwo,
  sourceLabel: 'Supplied Maithili chapter with English translation',
});

const report = [volumeOne, volumeTwoAudit];
const failures = report.flatMap((volume) =>
  volume.errors.map((error) => `${volume.workId}: ${error}`),
);

if (writeInventory) {
  if (failures.length > 0) {
    console.error(`Refusing to write ${inventoryPath}: Parallel Philosophy source audit has ${failures.length} issue(s).`);
  } else {
    const inventory = report.flatMap((volume) => volume.chapters);
    writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${inventory.length} verified Parallel Philosophy chapter record(s) to ${inventoryPath}.`);
  }
}

if (jsonOutput) {
  console.log(JSON.stringify({ volumes: report, failures }, null, 2));
} else {
  console.log('Parallel Philosophy source-structure audit');
  for (const volume of report) {
    console.log(`- ${volume.workId}: ${volume.chapters.length}/${volume.expectedCount} source chapters`);
    for (const error of volume.errors) console.log(`  ERROR: ${error}`);
  }
  console.log(
    failures.length === 0
      ? 'Parallel Philosophy Volumes I–II are source-inventory ready (72 + 100 chapters).'
      : `${failures.length} source issue(s) require resolution before inventory publication.`,
  );
}

if (strict && failures.length > 0) process.exitCode = 1;
