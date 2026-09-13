import { readFileSync, writeFileSync } from 'node:fs';

const details = JSON.parse(readFileSync('app/collection-details.json', 'utf8'));
const corrections = JSON.parse(readFileSync('app/panji-source-corrections.json', 'utf8'));
const strict = process.argv.includes('--strict');
const jsonOutput = process.argv.includes('--json');
const writeInventory = process.argv.includes('--write-inventory');
const inventoryPath = 'app/generated/panji-inventory.json';

const chapterPattern = /^\s*Chapter\s+(\d+)\b\s*[:.\-–—]?\s*(.*)$/i;
const genericChapterPattern = /^Chapter\s+\d+$/i;
const sectionOnlyTitles = [
  /^Opening$/i,
  /^Purpose of This Chapter$/i,
  /^Chapter\s+\d+\s+Source Notes$/i,
  /^Source Notes$/i,
];

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseChapters(items) {
  const chapters = [];
  let current = null;

  const finish = () => {
    if (!current) return;
    current.sections = [...new Set(current.sections.map(clean).filter(Boolean))];
    chapters.push(current);
    current = null;
  };

  for (const item of Array.isArray(items) ? items : []) {
    const title = clean(item?.title);
    const level = Number(item?.level ?? 99);
    if (!title) continue;

    const match = chapterPattern.exec(title);
    if (match) {
      finish();
      const number = Number(match[1]);
      const inlineTitle = clean(match[2]);
      current = {
        number,
        marker: title,
        title: inlineTitle || null,
        titleSource: inlineTitle ? 'inline chapter heading' : null,
        sections: [],
      };
      continue;
    }

    if (!current) continue;

    // A title split away from a bare "Chapter N" marker is accepted only when
    // it is another top-level heading. Lower-level headings are evidence about
    // chapter structure, never a safe substitute for a missing chapter title.
    if (!current.title && level === 1 && !sectionOnlyTitles.some((pattern) => pattern.test(title))) {
      current.title = title;
      current.titleSource = 'following top-level heading';
      continue;
    }

    current.sections.push(title);
  }

  finish();
  return chapters;
}

function applyVerifiedCorrection(workId, chapter) {
  if (chapter.title) return;
  const key = `${workId}/${chapter.number}`;
  const correction = corrections?.[key];
  if (!correction) return;

  const title = clean(correction.title);
  const source = clean(correction.source);
  const verification = clean(correction.verification);
  if (!title || !source || !verification) {
    throw new Error(`Incomplete Panji source correction: ${key}`);
  }
  if (genericChapterPattern.test(title) || sectionOnlyTitles.some((pattern) => pattern.test(title))) {
    throw new Error(`Invalid corrected Panji chapter title: ${key} — ${title}`);
  }

  chapter.title = title;
  chapter.titleSource = `verified source correction · ${source}`;
  chapter.sections = [
    ...(Array.isArray(correction.prependSections) ? correction.prependSections.map(clean) : []),
    ...chapter.sections,
  ].filter(Boolean);
  chapter.sections = [...new Set(chapter.sections)];
}

function auditVolume(volumeNumber) {
  const workId = `panji-${volumeNumber}`;
  const detail = details[workId];
  if (!detail) {
    return {
      workId,
      source: null,
      chapterCount: 0,
      chapters: [],
      errors: [`Missing ${workId} in app/collection-details.json`],
    };
  }

  const chapters = parseChapters(detail.items);
  for (const chapter of chapters) applyVerifiedCorrection(workId, chapter);

  const errors = [];
  const seen = new Set();

  for (const chapter of chapters) {
    if (!Number.isInteger(chapter.number) || chapter.number < 1 || seen.has(chapter.number)) {
      errors.push(`Invalid or duplicate chapter number ${chapter.number}`);
    }
    seen.add(chapter.number);

    if (!chapter.title || genericChapterPattern.test(chapter.title) || sectionOnlyTitles.some((pattern) => pattern.test(chapter.title))) {
      errors.push(`Chapter ${chapter.number} has no resolved source title`);
    }
    if (chapter.sections.length < 2) {
      errors.push(`Chapter ${chapter.number} has fewer than two indexed subsections`);
    }
  }

  const numbers = [...seen].sort((a, b) => a - b);
  if (numbers.length > 0 && numbers.some((number, index) => number !== index + 1)) {
    errors.push(`Chapter numbering is not contiguous from 1: ${numbers.join(', ')}`);
  }

  return {
    workId,
    source: clean(detail.source),
    sourceParagraphs: Number(detail.paragraphs ?? 0),
    sourceTables: Number(detail.tables ?? 0),
    chapterCount: chapters.length,
    chapters: chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      titleSource: chapter.titleSource,
      sections: chapter.sections,
      sectionCount: chapter.sections.length,
    })),
    errors,
  };
}

const report = Array.from({ length: 6 }, (_, index) => auditVolume(index + 1));
const parsedKeys = new Set(
  report.flatMap((volume) => volume.chapters.map((chapter) => `${volume.workId}/${chapter.number}`)),
);
const correctionErrors = [];
for (const key of Object.keys(corrections)) {
  if (!parsedKeys.has(key)) correctionErrors.push(`Correction does not match a parsed Panji chapter: ${key}`);
}

const failures = [
  ...report.flatMap((volume) => volume.errors.map((error) => `${volume.workId}: ${error}`)),
  ...correctionErrors,
];

if (writeInventory) {
  if (failures.length > 0) {
    console.error(`Refusing to write ${inventoryPath}: Panji source audit has ${failures.length} unresolved issue(s).`);
  } else {
    const inventory = report.flatMap((volume) =>
      volume.chapters.map((chapter) => {
        const correctionKey = `${volume.workId}/${chapter.number}`;
        const correction = corrections?.[correctionKey];
        return {
          workId: volume.workId,
          number: chapter.number,
          title: chapter.title,
          titleSource: chapter.titleSource,
          sections: chapter.sections,
          source: volume.source,
          sourceParagraphs: volume.sourceParagraphs,
          sourceTables: volume.sourceTables,
          sourceCorrection: correction
            ? {
                source: clean(correction.source),
                sourcePages: clean(correction.sourcePages),
                verification: clean(correction.verification),
              }
            : null,
        };
      }),
    );
    writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${inventory.length} verified Panji source chapter record(s) to ${inventoryPath}.`);
  }
}

if (jsonOutput) {
  console.log(JSON.stringify({ volumes: report, corrections, failures }, null, 2));
} else {
  console.log('Decoding Panji source-structure audit');
  for (const volume of report) {
    console.log(`- ${volume.workId}: ${volume.chapterCount} parsed chapters · ${volume.sourceParagraphs ?? 0} paragraphs · ${volume.sourceTables ?? 0} tables`);
    for (const chapter of volume.chapters.filter((item) => !item.title)) {
      console.log(`  unresolved: Chapter ${chapter.number}`);
    }
    for (const chapter of volume.chapters.filter((item) => String(item.titleSource ?? '').startsWith('verified source correction'))) {
      console.log(`  corrected: Chapter ${chapter.number} — ${chapter.title}`);
    }
    for (const error of volume.errors) {
      console.log(`  ERROR: ${error}`);
    }
  }
  for (const error of correctionErrors) console.log(`  ERROR: ${error}`);
  console.log(failures.length === 0 ? 'Panji source structure is publication-ready.' : `${failures.length} source-structure issue(s) require resolution before Panji detail publication.`);
}

if (strict && failures.length > 0) {
  process.exitCode = 1;
}
