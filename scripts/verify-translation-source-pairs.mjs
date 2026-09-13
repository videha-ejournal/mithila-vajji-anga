import { readFileSync } from 'node:fs';

const pairs = JSON.parse(readFileSync('data/verified-translation-source-pairs.json', 'utf8'));
const catalog = JSON.parse(readFileSync('dist/client/source-library/catalog.json', 'utf8'));
const byFilename = new Map((catalog.items ?? []).map((item) => [item.filename, item]));

for (const pair of pairs.pairs ?? []) {
  const english = byFilename.get(pair.english);
  const original = byFilename.get(pair.maithiliOriginal);
  if (!english) throw new Error(`Verified English translation is missing from source library: ${pair.english}`);
  if (!original) throw new Error(`Verified Maithili original is missing from source library: ${pair.maithiliOriginal}`);
  if (english.translationOf !== pair.maithiliOriginal) {
    throw new Error(`translationOf mismatch: ${pair.english} must point to ${pair.maithiliOriginal}`);
  }
  if (original.translatedAs !== pair.english) {
    throw new Error(`translatedAs mismatch: ${pair.maithiliOriginal} must point to ${pair.english}`);
  }
  if (english.translator !== pair.translator) {
    throw new Error(`Translator mismatch for ${pair.english}: expected ${pair.translator}`);
  }
  if (english.originalAuthor !== pair.originalAuthor) {
    throw new Error(`Original-author mismatch for ${pair.english}: expected ${pair.originalAuthor}`);
  }
  if (original.author !== pair.originalAuthor) {
    throw new Error(`Author mismatch for ${pair.maithiliOriginal}: expected ${pair.originalAuthor}`);
  }
  if (english.languageCode !== 'en' || original.languageCode !== 'mai') {
    throw new Error(`Language metadata mismatch for verified pair: ${pair.english} ↔ ${pair.maithiliOriginal}`);
  }
  if (!english.sourceCommit || !english.gitBlobSha || !english.sourceSha256
      || !original.sourceCommit || !original.gitBlobSha || !original.sourceSha256) {
    throw new Error(`Exact object provenance is incomplete for verified pair: ${pair.english} ↔ ${pair.maithiliOriginal}`);
  }
}

console.log(`Verified ${pairs.pairs?.length ?? 0} exact Maithili-original ↔ English-translation PDF pairs in the commit-pinned source library.`);
