import { existsSync, readFileSync } from 'node:fs';

const panjiInventoryPath = 'app/generated/panji-article-inventory.json';
const coreInventoryPath = 'app/generated/research-article-inventory.json';
const homepages = [
  { path: 'dist/client/index.html', locale: 'mai' },
  { path: 'dist/client/en/index.html', locale: 'en' },
];
const expected = { 1: 20, 2: 38, 3: 32, 4: 87, 5: 40, 6: 30 };
const PANJI_PREFIX = 'https://videha-ejournal.github.io/mithila-vajji-anga/decoding-panji/';

if (!existsSync(panjiInventoryPath) || !existsSync(coreInventoryPath)) {
  throw new Error('Required research inventories are missing.');
}

const panji = JSON.parse(readFileSync(panjiInventoryPath, 'utf8'));
const core = JSON.parse(readFileSync(coreInventoryPath, 'utf8'));

if (!Array.isArray(panji) || panji.length !== 247) {
  throw new Error(`Expected 247 Decoding Panji chapter records; found ${panji?.length ?? 'invalid'}.`);
}
if (!Array.isArray(core) || core.length !== 522) {
  throw new Error(`Expected 522 core research records; found ${core?.length ?? 'invalid'}.`);
}
if (panji.some((record) => !record.canonical?.startsWith(PANJI_PREFIX))) {
  throw new Error('Decoding Panji inventory contains a non-canonical route family.');
}

for (const [volumeText, count] of Object.entries(expected)) {
  const volume = Number(volumeText);
  const records = panji.filter((record) => record.volume === volume);
  if (records.length !== count || records.some((record) => record.kind !== 'chapter')) {
    throw new Error(`Volume ${volume} is not an exact ${count}-chapter corpus.`);
  }
}

const expectedPanjiLinks = new Set(panji.map((record) => record.canonical));

function extractPanjiLinks(page) {
  return new Set(
    [...page.matchAll(/href="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((href) => href.startsWith(PANJI_PREFIX) && href !== PANJI_PREFIX),
  );
}

for (const homepage of homepages) {
  if (!existsSync(homepage.path)) throw new Error(`Missing built homepage: ${homepage.path}`);
  const page = readFileSync(homepage.path, 'utf8');

  if (page.includes('decoding-panji-directory-anchor')) {
    throw new Error(`Legacy post-build Panji injection anchor remains in ${homepage.path}.`);
  }
  if (!page.includes('data-panji-render-mode="react"')) {
    throw new Error(`Hydration-safe React Panji marker missing from ${homepage.path}.`);
  }
  if (!page.includes('data-panji-article-count="247"')) {
    throw new Error(`Panji count marker missing from ${homepage.path}.`);
  }
  if (!page.includes('data-research-corpus-count="522"')) {
    throw new Error(`522-directory marker missing from ${homepage.path}.`);
  }

  const panjiIndex = page.indexOf('id="decoding-panji-live-directory"');
  const coreIndex = page.indexOf('id="research-corpus-522"');
  if (panjiIndex < 0 || coreIndex < 0 || panjiIndex >= coreIndex) {
    throw new Error(`Homepage order is wrong in ${homepage.path}: Panji must precede the 522 directory.`);
  }

  for (let volume = 1; volume <= 6; volume += 1) {
    if (!page.includes(`id="decoding-panji-volume-${volume}"`)) {
      throw new Error(`Panji Volume ${volume} navigation section missing from ${homepage.path}.`);
    }
  }

  for (const record of panji) {
    if (!page.includes(`href="${record.canonical}"`)) {
      throw new Error(`Decoding Panji chapter missing from ${homepage.path}: ${record.canonical}`);
    }
  }
  for (const record of core) {
    if (!page.includes(`href="${record.canonical}"`)) {
      throw new Error(`Verified 522-core link missing from ${homepage.path}: ${record.canonical}`);
    }
  }

  const actualPanjiLinks = extractPanjiLinks(page);
  if (actualPanjiLinks.size !== expectedPanjiLinks.size) {
    throw new Error(
      `Panji link-set mismatch in ${homepage.path}: found ${actualPanjiLinks.size}, expected ${expectedPanjiLinks.size}.`,
    );
  }
  for (const link of expectedPanjiLinks) {
    if (!actualPanjiLinks.has(link)) throw new Error(`Missing Panji canonical in ${homepage.path}: ${link}`);
  }
  for (const link of actualPanjiLinks) {
    if (!expectedPanjiLinks.has(link)) throw new Error(`Unexpected Panji canonical in ${homepage.path}: ${link}`);
  }
}

console.log(
  'Verified hydration-safe React homepage directories: 247 exact Panji canonicals precede a collapsible 522-link core directory on both locales.',
);
