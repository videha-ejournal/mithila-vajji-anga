import { readFileSync } from 'node:fs';

const pairs = JSON.parse(readFileSync('data/verified-translation-source-pairs.json', 'utf8'));
const catalog = JSON.parse(readFileSync('dist/client/source-library/catalog.json', 'utf8'));
const byFilename = new Map((catalog.items ?? []).map((item) => [item.filename, item]));

const sourceRepository = (catalog.sourceRepositories ?? []).find(
  (item) => item.repository === 'videha-ejournal/videha-ejournal',
);
if (!sourceRepository?.sourceCommit) {
  throw new Error('Verified translation pairs require the commit-pinned Videha source repository.');
}

const sourceCatalogUrl = `https://raw.githubusercontent.com/videha-ejournal/videha-ejournal/${sourceRepository.sourceCommit}/data/videha-pdf-catalog.json`;
const sourceCatalogResponse = await fetch(sourceCatalogUrl, {
  headers: { 'User-Agent': 'Videha-Digital-Research-Archive' },
});
if (!sourceCatalogResponse.ok) {
  throw new Error(`Could not load commit-pinned source metadata: ${sourceCatalogResponse.status} ${sourceCatalogResponse.statusText}`);
}
const sourceCatalog = await sourceCatalogResponse.json();
const sourceByFilename = new Map((sourceCatalog.items ?? []).map((item) => [item.path, item]));

for (const pair of pairs.pairs ?? []) {
  const english = byFilename.get(pair.english);
  const original = byFilename.get(pair.maithiliOriginal);
  const sourceEnglish = sourceByFilename.get(pair.english);
  const sourceOriginal = sourceByFilename.get(pair.maithiliOriginal);

  if (!english) throw new Error(`Verified English translation is missing from source library: ${pair.english}`);
  if (!original) throw new Error(`Verified Maithili original is missing from source library: ${pair.maithiliOriginal}`);
  if (!sourceEnglish || !sourceOriginal) {
    throw new Error(`Commit-pinned role metadata is missing for verified pair: ${pair.english} ↔ ${pair.maithiliOriginal}`);
  }

  if (english.translationOf !== pair.maithiliOriginal
      || sourceEnglish.translationOf !== pair.maithiliOriginal) {
    throw new Error(`translationOf mismatch: ${pair.english} must point to ${pair.maithiliOriginal}`);
  }
  if (original.translatedAs !== pair.english
      || sourceOriginal.translatedAs !== pair.english) {
    throw new Error(`translatedAs mismatch: ${pair.maithiliOriginal} must point to ${pair.english}`);
  }
  if (sourceEnglish.translator !== pair.translator) {
    throw new Error(`Translator mismatch for ${pair.english}: expected ${pair.translator}`);
  }
  if (sourceEnglish.originalAuthor !== pair.originalAuthor) {
    throw new Error(`Original-author mismatch for ${pair.english}: expected ${pair.originalAuthor}`);
  }
  if (sourceOriginal.author !== pair.originalAuthor) {
    throw new Error(`Author mismatch for ${pair.maithiliOriginal}: expected ${pair.originalAuthor}`);
  }
  if (english.languageCode !== 'en' || original.languageCode !== 'mai'
      || sourceEnglish.languageCode !== 'en' || sourceOriginal.languageCode !== 'mai') {
    throw new Error(`Language metadata mismatch for verified pair: ${pair.english} ↔ ${pair.maithiliOriginal}`);
  }
  if (!english.sourceCommit || !english.gitBlobSha || !english.sourceSha256
      || !original.sourceCommit || !original.gitBlobSha || !original.sourceSha256) {
    throw new Error(`Exact object provenance is incomplete for verified pair: ${pair.english} ↔ ${pair.maithiliOriginal}`);
  }
  if (english.sourceCommit !== sourceRepository.sourceCommit
      || original.sourceCommit !== sourceRepository.sourceCommit) {
    throw new Error(`Source-commit mismatch for verified pair: ${pair.english} ↔ ${pair.maithiliOriginal}`);
  }
  if (english.sourceSha256 !== sourceEnglish.sha256 || original.sourceSha256 !== sourceOriginal.sha256) {
    throw new Error(`Source SHA-256 mismatch for verified pair: ${pair.english} ↔ ${pair.maithiliOriginal}`);
  }
}

console.log(`Verified ${pairs.pairs?.length ?? 0} exact Maithili-original ↔ English-translation PDF pairs and their commit-pinned scholarly roles.`);
