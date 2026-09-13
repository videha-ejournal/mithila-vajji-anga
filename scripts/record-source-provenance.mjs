import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'dist/client');
const RECORDS_ROOT = join(OUT, 'records');
const SOURCE_LIBRARY_ROOT = join(OUT, 'source-library');
const CONFIG_PATH = join(ROOT, 'data/record-source-provenance.json');
const SOURCE_CATALOG_PATH = join(SOURCE_LIBRARY_ROOT, 'catalog.json');
const SOURCE_LIBRARY_HTML = join(SOURCE_LIBRARY_ROOT, 'index.html');
const SITE = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const SOURCE_REPOSITORY = 'videha-ejournal/videha-ejournal';
const SOURCE_CATALOG_REPO_PATH = 'data/videha-pdf-catalog.json';
const REQUIRE_EXTERNAL = process.env.REQUIRE_EXTERNAL_SOURCE_LIBRARY === '1';
const TRANSLATOR = 'Gajendra Thakur';
const ASHISH = 'Ashish Anchinhar';
const JPM = 'Jagdish Prasad Mandal';

const REQUESTED_ENGLISH_TRANSLATIONS = [
  'ENGLISH_MAITHILI_GRAMMAR_GHAZAL_HISTORY.pdf',
  'ENGLISH_MAITHILI_WEB_JOURNALISM.pdf',
  'ENGLISH_MAULAIL_GACHHAK_PHOOL.pdf',
  'ENGLISH_PARVAT_OOPAR_BHAMRA_JE_SOOTAL.pdf',
  'ENGLISH_PREETI_KARAN_SETU_BANHAL.pdf',
  'ENGLISH_SAHASRABADHANI.pdf',
  'ENGLISH_SAHASRASHIRSHA.pdf',
  'ENGLISH_SETUSHAM.pdf',
  'ENGLISH_JPM_BIOGRAPHY.pdf',
  'ENGLISH_JPM_ECHOES_OF_EXISTENCE.pdf',
  'ENGLISH_JPM_JEEVAN_SANGHARSH.pdf',
  'ENGLISH_JPM_LAHSAN.pdf',
];

const VERIFIED_TRANSLATION_PAIRS = [
  ['ENGLISH_PREETI_KARAN_SETU_BANHAL.pdf', 'PREETI_KARAN_SETU_BANHAL.pdf'],
  ['ENGLISH_SETUSHAM.pdf', 'SETUSHAM.pdf'],
  ['ENGLISH_SAHASRABADHANI.pdf', 'sahasrabadhani.pdf'],
  ['ENGLISH_SAHASRASHIRSHA.pdf', 'sahasrashirsha.pdf'],
];

const BIBLIOGRAPHIC_FIELDS = [
  'author',
  'originalAuthor',
  'editor',
  'originalEditor',
  'translator',
  'originalLanguage',
  'originalLanguageCode',
  'subjectPersons',
  'documentType',
  'contributorNote',
  'language',
  'languageCode',
  'editionNote',
  'translationOf',
  'translationOfTitle',
  'translatedAs',
  'translatedAsTitle',
];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const shortSha = (value) => value ? String(value).slice(0, 12) : '';
const includesAll = (values, expected) => expected.every((value) => values?.includes(value));

if (!existsSync(CONFIG_PATH)) throw new Error(`Missing record provenance configuration: ${CONFIG_PATH}`);
if (!existsSync(SOURCE_CATALOG_PATH)) throw new Error('Source-library catalogue must be generated before record provenance.');
if (!existsSync(RECORDS_ROOT)) throw new Error('Permanent scholarly records must be generated before record provenance.');

const config = readJson(CONFIG_PATH);
const archiveCatalog = readJson(SOURCE_CATALOG_PATH);
const sourceRepository = archiveCatalog.sourceRepositories?.find((item) => item.repository === SOURCE_REPOSITORY)
  ?? archiveCatalog.sourceRepositories?.[0];

if (!sourceRepository?.sourceCommit) {
  if (REQUIRE_EXTERNAL) throw new Error('Record provenance requires an exact external source commit in production.');
  console.warn('No external source commit is available; record provenance generation skipped for this local build.');
  process.exit(0);
}

const sourceCommit = sourceRepository.sourceCommit;
const rawCatalogUrl = `https://raw.githubusercontent.com/${SOURCE_REPOSITORY}/${sourceCommit}/${SOURCE_CATALOG_REPO_PATH}`;
let remoteCatalog = null;
try {
  const response = await fetch(rawCatalogUrl, { headers: { 'User-Agent': 'Videha-Digital-Research-Archive' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  remoteCatalog = await response.json();
} catch (error) {
  if (REQUIRE_EXTERNAL) throw new Error(`Could not load commit-pinned source metadata for provenance: ${error instanceof Error ? error.message : error}`);
  console.warn('Commit-pinned source metadata unavailable; continuing without bibliographic enrichment.');
}

const remoteByPath = new Map((remoteCatalog?.items ?? []).map((item) => [item.path, item]));
const enrichCollection = (collection = []) => {
  for (const item of collection) {
    if (item.sourceType !== 'external-github') continue;
    const supplied = remoteByPath.get(item.filename);
    if (!supplied) continue;
    for (const field of BIBLIOGRAPHIC_FIELDS) {
      item[field] = supplied[field] ?? item[field] ?? null;
    }
  }
};
enrichCollection(archiveCatalog.items);
enrichCollection(archiveCatalog.books);
enrichCollection(archiveCatalog.supportDocuments);
archiveCatalog.recordProvenance = `${SITE}/records/source-provenance.json`;
archiveCatalog.bibliographicRoleSchema = 1;
writeFileSync(SOURCE_CATALOG_PATH, `${JSON.stringify(archiveCatalog, null, 2)}\n`);

if (REQUIRE_EXTERNAL) {
  if ((remoteCatalog?.schemaVersion ?? 0) < 5) {
    throw new Error(`Curated bibliographic roles require source catalogue schema v5 or newer; found ${remoteCatalog?.schemaVersion ?? 'none'}.`);
  }
  for (const filename of REQUESTED_ENGLISH_TRANSLATIONS) {
    const item = remoteByPath.get(filename);
    if (!item) throw new Error(`Requested English translation is absent from the commit-pinned source catalogue: ${filename}`);
    if (item.languageCode !== 'en') throw new Error(`English language metadata is missing for ${filename}.`);
    if (item.translator !== TRANSLATOR) throw new Error(`Translator metadata mismatch for ${filename}: expected ${TRANSLATOR}.`);
  }
  for (const [english, source] of VERIFIED_TRANSLATION_PAIRS) {
    const englishItem = remoteByPath.get(english);
    const sourceItem = remoteByPath.get(source);
    if (!sourceItem) throw new Error(`Verified translation source PDF is missing: ${source}`);
    if (englishItem?.translationOf !== source || sourceItem.translatedAs !== english) {
      throw new Error(`Reciprocal translation relationship is incomplete: ${english} ↔ ${source}`);
    }
  }

  for (const filename of ['ENGLISH_MAITHILI_GRAMMAR_GHAZAL_HISTORY.pdf', 'ENGLISH_MAITHILI_WEB_JOURNALISM.pdf']) {
    if (remoteByPath.get(filename)?.originalAuthor !== ASHISH) {
      throw new Error(`Original-author metadata mismatch for ${filename}: expected ${ASHISH}.`);
    }
  }
  if (remoteByPath.get('ENGLISH_MAULAIL_GACHHAK_PHOOL.pdf')?.originalAuthor !== JPM) {
    throw new Error(`Original-author metadata mismatch for ENGLISH_MAULAIL_GACHHAK_PHOOL.pdf: expected ${JPM}.`);
  }
  for (const filename of ['PREETI_KARAN_SETU_BANHAL.pdf', 'SETUSHAM.pdf']) {
    if (remoteByPath.get(filename)?.editor !== ASHISH) {
      throw new Error(`Original-editor metadata mismatch for ${filename}: expected ${ASHISH}.`);
    }
  }
  for (const filename of ['ENGLISH_PREETI_KARAN_SETU_BANHAL.pdf', 'ENGLISH_SETUSHAM.pdf']) {
    if (remoteByPath.get(filename)?.originalEditor !== ASHISH) {
      throw new Error(`Original-editor metadata mismatch for ${filename}: expected ${ASHISH}.`);
    }
  }

  const criticism = remoteByPath.get('GT_PT_Criticism.pdf');
  if (criticism?.documentType !== 'criticism-collection'
      || !includesAll(criticism?.subjectPersons, ['Gajendra Thakur', 'Preeti Thakur'])) {
    throw new Error('GT_PT_Criticism metadata must identify a multi-writer criticism collection on Gajendra Thakur and Preeti Thakur.');
  }

  const biography = remoteByPath.get('ENGLISH_JPM_BIOGRAPHY.pdf');
  if (biography?.author !== TRANSLATOR || biography?.originalAuthor !== TRANSLATOR
      || !includesAll(biography?.subjectPersons, [JPM])) {
    throw new Error('JPM biography metadata must identify Gajendra Thakur as author and Jagdish Prasad Mandal as subject.');
  }
  for (const filename of ['ENGLISH_JPM_ECHOES_OF_EXISTENCE.pdf', 'ENGLISH_JPM_JEEVAN_SANGHARSH.pdf', 'ENGLISH_JPM_LAHSAN.pdf']) {
    const item = remoteByPath.get(filename);
    if (item?.author !== JPM || item?.originalAuthor !== JPM) {
      throw new Error(`JPM authorship metadata mismatch for ${filename}: expected ${JPM}.`);
    }
  }
}

const sourceByFilename = new Map((archiveCatalog.items ?? []).map((item) => [item.filename, item]));
const exactByKey = new Map((config.exact ?? []).map((mapping) => [`${mapping.recordType}:${mapping.recordId}`, mapping]));
const rules = [...(config.rules ?? [])].sort((a, b) => (b.recordIdPrefix?.length ?? 0) - (a.recordIdPrefix?.length ?? 0));

const provenance = [];
const recordTypeEntries = readdirSync(RECORDS_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory());
for (const typeEntry of recordTypeEntries) {
  const recordType = typeEntry.name;
  const typePath = join(RECORDS_ROOT, recordType);
  for (const recordEntry of readdirSync(typePath, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    const recordId = recordEntry.name;
    const key = `${recordType}:${recordId}`;
    const mapping = exactByKey.get(key)
      ?? rules.find((rule) => rule.recordType === recordType && recordId.startsWith(rule.recordIdPrefix ?? ''));
    if (!mapping) continue;

    const source = sourceByFilename.get(mapping.sourcePdfPath);
    if (!source) throw new Error(`Mapped source PDF is not in the exact source-library build: ${mapping.sourcePdfPath}`);
    if (source.sourceType === 'external-github' && (!source.sourceCommit || !source.gitBlobSha || !source.sourceSha256)) {
      throw new Error(`Mapped source PDF lacks complete object provenance: ${mapping.sourcePdfPath}`);
    }

    const recordUrl = `${SITE}/records/${recordType}/${recordId}/`;
    const item = {
      recordType,
      recordId,
      recordUrl,
      relation: mapping.relation,
      evidenceStatus: mapping.evidenceStatus,
      sourcePdfPath: source.filename,
      sourcePdfTitle: source.title,
      author: source.author ?? null,
      originalAuthor: source.originalAuthor ?? null,
      editor: source.editor ?? null,
      originalEditor: source.originalEditor ?? null,
      language: source.language ?? null,
      languageCode: source.languageCode ?? null,
      translator: source.translator ?? null,
      subjectPersons: source.subjectPersons ?? null,
      repository: source.repository ?? null,
      branch: source.branch ?? null,
      sourceCommit: source.sourceCommit ?? null,
      sourceCommitDate: source.sourceCommitDate ?? null,
      gitBlobSha: source.gitBlobSha ?? null,
      sha256: source.sourceSha256 ?? source.sha256 ?? null,
      pinnedPdfUrl: source.url,
      pinnedGithubUrl: source.githubUrl ?? null,
      currentPublishedUrl: source.currentPublishedUrl ?? null,
      pageLocator: mapping.pageLocator ?? null,
    };
    provenance.push(item);

    const pagePath = join(typePath, recordId, 'index.html');
    if (!existsSync(pagePath)) throw new Error(`Mapped permanent record page is missing: ${recordType}/${recordId}`);
    let html = readFileSync(pagePath, 'utf8');
    const authorLine = item.author ? `<p><strong>Author:</strong> ${escapeHtml(item.author)}</p>` : '';
    const editorLine = item.editor ? `<p><strong>Editor:</strong> ${escapeHtml(item.editor)}</p>` : '';
    const translatorLine = item.translator ? `<p><strong>Translator:</strong> ${escapeHtml(item.translator)}</p>` : '';
    const languageLine = item.language ? `<p><strong>Language:</strong> ${escapeHtml(item.language)}</p>` : '';
    const pageLine = item.pageLocator
      ? `<p><strong>Verified PDF locator:</strong> ${escapeHtml(item.pageLocator)}</p>`
      : '<p><strong>PDF page locator:</strong> not asserted yet; the exact source PDF object is verified.</p>';
    const sourceSection = `<!-- source-provenance --><section class="card good" id="source-provenance"><h2>Exact source PDF</h2><p>This permanent record is linked to a verified source-work PDF in the Videha source repository.</p><p><strong>Source:</strong> ${escapeHtml(item.sourcePdfTitle)} <code>${escapeHtml(item.sourcePdfPath)}</code></p>${authorLine}${editorLine}${languageLine}${translatorLine}${pageLine}<p><strong>Source commit:</strong> <code title="${escapeHtml(item.sourceCommit ?? '')}">${escapeHtml(shortSha(item.sourceCommit))}</code><br><strong>Git blob:</strong> <code>${escapeHtml(item.gitBlobSha ?? '')}</code><br><strong>SHA-256:</strong> <code>${escapeHtml(item.sha256 ?? '')}</code></p><div class="actions"><a href="${escapeHtml(item.pinnedPdfUrl)}">Open commit-pinned PDF</a>${item.pinnedGithubUrl ? `<a class="secondary" href="${escapeHtml(item.pinnedGithubUrl)}">Exact source object</a>` : ''}<a class="secondary" href="${SITE}/records/source-provenance.json">Machine provenance</a></div></section>`;
    if (!html.includes('<!-- source-provenance -->')) {
      if (!html.includes('</main>')) throw new Error(`Could not locate record-page insertion point: ${recordType}/${recordId}`);
      html = html.replace('</main>', `${sourceSection}</main>`);
      writeFileSync(pagePath, html);
    }
  }
}

for (const mapping of config.exact ?? []) {
  const key = `${mapping.recordType}:${mapping.recordId}`;
  if (!provenance.some((item) => `${item.recordType}:${item.recordId}` === key)) {
    throw new Error(`Configured exact provenance mapping did not resolve to a permanent record: ${key}`);
  }
}

provenance.sort((a, b) => a.recordType.localeCompare(b.recordType) || a.recordId.localeCompare(b.recordId, undefined, { numeric: true }));
const payload = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  policy: config.policy,
  archive: `${SITE}/`,
  sourceRepository: SOURCE_REPOSITORY,
  sourceCommit,
  sourceCommitDate: sourceRepository.sourceCommitDate ?? null,
  mappedRecordCount: provenance.length,
  pageLocatorCount: provenance.filter((item) => item.pageLocator).length,
  mappings: provenance,
};
writeFileSync(join(RECORDS_ROOT, 'source-provenance.json'), `${JSON.stringify(payload, null, 2)}\n`);

if (existsSync(SOURCE_LIBRARY_HTML)) {
  let html = readFileSync(SOURCE_LIBRARY_HTML, 'utf8');
  const roleDetail = (source) => {
    const details = [];
    if (source.author) details.push(`author: ${escapeHtml(source.author)}`);
    if (source.originalAuthor && source.originalAuthor !== source.author) details.push(`original Maithili author: ${escapeHtml(source.originalAuthor)}`);
    if (source.editor) details.push(`editor: ${escapeHtml(source.editor)}`);
    if (source.originalEditor) details.push(`original Maithili editor: ${escapeHtml(source.originalEditor)}`);
    if (source.translator) details.push(`translator: ${escapeHtml(source.translator)}`);
    if (source.subjectPersons?.length) details.push(`subjects: ${source.subjectPersons.map(escapeHtml).join(', ')}`);
    return details.join(' · ');
  };

  const curatedFiles = [
    ...REQUESTED_ENGLISH_TRANSLATIONS,
    'PREETI_KARAN_SETU_BANHAL.pdf',
    'SETUSHAM.pdf',
    'GT_PT_Criticism.pdf',
  ];
  const curatedRows = curatedFiles.map((filename) => {
    const source = sourceByFilename.get(filename);
    if (!source) return '';
    const roles = roleDetail(source);
    const relation = source.translationOf ? ` · translation of <code>${escapeHtml(source.translationOf)}</code>` : '';
    const note = source.contributorNote ? ` · ${escapeHtml(source.contributorNote)}` : '';
    return `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a>${roles ? ` — ${roles}` : ''}${relation}${note}</li>`;
  }).filter(Boolean).join('');
  const section = `<section id="curated-bibliography"><h2>Curated authorship, editorial and translation roles</h2><p>These roles are supplied or confirmed by the editor and are preserved separately so authorship, editing, translation and subject relationships are not conflated. JPM in the listed filenames expands to <strong>Jagdish Prasad Mandal</strong>.</p><ul>${curatedRows}</ul><p><a href="${SITE}/records/source-provenance.json">Record → exact source PDF provenance (JSON)</a></p></section>`;
  html = html.replace(/<section id="curated-translations">[\s\S]*?<\/section>/, '');
  if (!html.includes('id="curated-bibliography"')) html = html.replace('<footer>', `${section}<footer>`);

  const graph = curatedFiles.map((filename) => sourceByFilename.get(filename)).filter(Boolean).map((source) => ({
    '@type': 'DigitalDocument',
    name: source.title,
    contentUrl: source.url,
    inLanguage: source.languageCode ?? source.language ?? undefined,
    author: source.author ? { '@type': 'Person', name: source.author } : undefined,
    editor: source.editor ? { '@type': 'Person', name: source.editor } : undefined,
    translator: source.translator ? { '@type': 'Person', name: source.translator } : undefined,
    about: source.subjectPersons?.length
      ? source.subjectPersons.map((name) => ({ '@type': 'Person', name }))
      : undefined,
    additionalProperty: [
      source.originalAuthor ? { '@type': 'PropertyValue', name: 'Original Maithili author', value: source.originalAuthor } : undefined,
      source.originalEditor ? { '@type': 'PropertyValue', name: 'Original Maithili editor', value: source.originalEditor } : undefined,
      source.documentType ? { '@type': 'PropertyValue', name: 'Document type', value: source.documentType } : undefined,
    ].filter(Boolean),
  }));
  const ld = `<script type="application/ld+json" id="curated-bibliographic-roles">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`;
  if (!html.includes('id="curated-bibliographic-roles"')) html = html.replace('</head>', `${ld}</head>`);
  writeFileSync(SOURCE_LIBRARY_HTML, html);
}

console.log(`Record-source provenance: ${provenance.length} permanent records mapped to exact source PDFs at ${sourceCommit}; ${payload.pageLocatorCount} verified PDF page locators asserted; curated bibliographic roles preserved.`);
