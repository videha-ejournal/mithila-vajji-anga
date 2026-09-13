import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SITE = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const sourceRoot = 'public/books';
const outputRoot = 'dist/client/source-library';
const sitemapPath = 'dist/client/sitemap.xml';
const EXTERNAL_REPOSITORY = 'videha-ejournal/videha-ejournal';
const EXTERNAL_BRANCH = 'main';
const EXTERNAL_REPOSITORY_URL = `https://github.com/${EXTERNAL_REPOSITORY}`;
const EXTERNAL_CATALOG_PATH = 'data/videha-pdf-catalog.json';
const requireExternal = process.env.REQUIRE_EXTERNAL_SOURCE_LIBRARY === '1';
const GOHI_FAMILY_ID = 'gohi-sabhak-beech-jalsamadhi';
const GOHI_ORIGINAL = 'Gohi_Sabhak_Beech_Jalsamadhi.pdf';

const REQUIRED_CURATED_SOURCE_METADATA = [
  ['37_CHILDREN_NOVELS.pdf', 'en'],
  ['GAJENDRA_THAKUR_SAMAGRA_37_MAITHILI_CHILDREN_NOVELS.pdf', 'mai'],
  ['Gohi_Jalsamadhi_Bal_Sanskaran.pdf', 'mai'],
  ['Gohi_Jalsamadhi_Kishor_Sanskaran.pdf', 'mai'],
  ['Gohi_Sabhak_Beech_Jalsamadhi.pdf', 'mai'],
  ['Water_Burial_Among_the_Crocodiles.pdf', 'en'],
];

const walk = (directory) =>
  existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      })
    : [];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll(String.fromCharCode(34), '&quot;');

const titleFromFilename = (filename) =>
  path.basename(filename, path.extname(filename))
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim();

const encodePath = (value) => value.split('/').map(encodeURIComponent).join('/');
const recordId = (value) => value
  .replace(/\.pdf$/i, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const formatMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Videha-Digital-Research-Archive',
  ...(process.env.GITHUB_API_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}` }
    : {}),
};

async function fetchJson(url, headers = githubHeaders) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function loadExternalSourceRepository() {
  const branch = await fetchJson(
    `https://api.github.com/repos/${EXTERNAL_REPOSITORY}/branches/${EXTERNAL_BRANCH}`,
  );
  const sourceCommit = branch.commit.sha;
  const sourceCommitDate = branch.commit.commit?.committer?.date
    ?? branch.commit.commit?.author?.date
    ?? null;
  const tree = await fetchJson(
    `https://api.github.com/repos/${EXTERNAL_REPOSITORY}/git/trees/${sourceCommit}?recursive=1`,
  );
  if (tree.truncated) throw new Error('External source-repository tree was truncated by GitHub.');

  const catalog = await fetchJson(
    `https://raw.githubusercontent.com/${EXTERNAL_REPOSITORY}/${sourceCommit}/${EXTERNAL_CATALOG_PATH}`,
    { 'User-Agent': 'Videha-Digital-Research-Archive' },
  );
  const catalogByPath = new Map((catalog.items ?? []).map((item) => [item.path, item]));
  const pdfBlobs = (tree.tree ?? []).filter(
    (item) => item.type === 'blob' && item.path?.toLowerCase().endsWith('.pdf'),
  );
  const pinnedUrl = (relatedPath) => relatedPath
    ? `https://raw.githubusercontent.com/${EXTERNAL_REPOSITORY}/${sourceCommit}/${encodePath(relatedPath)}`
    : null;
  const pinnedGithubUrl = (relatedPath) => relatedPath
    ? `${EXTERNAL_REPOSITORY_URL}/blob/${sourceCommit}/${encodePath(relatedPath)}`
    : null;

  const items = pdfBlobs.map((item) => {
    const supplied = catalogByPath.get(item.path);
    const pinnedPath = encodePath(item.path);
    const relatedResources = Array.isArray(supplied?.relatedResources)
      ? supplied.relatedResources.map((related) => ({
          ...related,
          url: pinnedUrl(related.path),
          githubUrl: pinnedGithubUrl(related.path),
        }))
      : [];
    return {
      id: `external-${recordId(item.path)}`,
      title: supplied?.title || titleFromFilename(item.path),
      alternateTitle: supplied?.alternateTitle ?? null,
      filename: item.path,
      mediaType: 'application/pdf',
      bytes: item.size ?? 0,
      sourceType: 'external-github',
      sourceRole: supplied ? 'book-or-research-document' : 'repository-support',
      repository: EXTERNAL_REPOSITORY,
      repositoryUrl: EXTERNAL_REPOSITORY_URL,
      branch: EXTERNAL_BRANCH,
      sourceCommit,
      sourceCommitDate,
      gitBlobSha: item.sha,
      sourceSha256: supplied?.sha256 ?? null,
      language: supplied?.language ?? null,
      languageCode: supplied?.languageCode ?? null,
      editionNote: supplied?.editionNote ?? null,
      seriesTitle: supplied?.seriesTitle ?? null,
      seriesPart: supplied?.seriesPart ?? null,
      workFamilyId: supplied?.workFamilyId ?? null,
      workFamilyTitle: supplied?.workFamilyTitle ?? null,
      workFamilyRole: supplied?.workFamilyRole ?? null,
      isBasedOn: supplied?.isBasedOn ?? null,
      isBasedOnTitle: supplied?.isBasedOnTitle ?? null,
      isBasedOnUrl: pinnedUrl(supplied?.isBasedOn),
      isBasedOnGithubUrl: pinnedGithubUrl(supplied?.isBasedOn),
      relatedResources,
      translationOf: supplied?.translationOf ?? null,
      translationOfTitle: supplied?.translationOfTitle ?? null,
      translationOfUrl: pinnedUrl(supplied?.translationOf),
      translationOfGithubUrl: pinnedGithubUrl(supplied?.translationOf),
      translatedAs: supplied?.translatedAs ?? null,
      translatedAsTitle: supplied?.translatedAsTitle ?? null,
      translatedAsUrl: pinnedUrl(supplied?.translatedAs),
      translatedAsGithubUrl: pinnedGithubUrl(supplied?.translatedAs),
      url: `https://raw.githubusercontent.com/${EXTERNAL_REPOSITORY}/${sourceCommit}/${pinnedPath}`,
      githubUrl: `${EXTERNAL_REPOSITORY_URL}/blob/${sourceCommit}/${pinnedPath}`,
      currentPublishedUrl: supplied?.url ?? null,
    };
  }).sort((a, b) => a.title.localeCompare(b.title));

  return {
    repository: EXTERNAL_REPOSITORY,
    repositoryUrl: EXTERNAL_REPOSITORY_URL,
    branch: EXTERNAL_BRANCH,
    sourceCommit,
    sourceCommitDate,
    sourceCatalogSchemaVersion: catalog.schemaVersion ?? null,
    sourceCatalogVersion: catalog.version ?? null,
    sourceCatalogCount: catalog.count ?? null,
    items,
  };
}

const localPdfs = walk(sourceRoot).filter((file) => file.toLowerCase().endsWith('.pdf'));
const localItems = localPdfs.map((file) => {
  const relative = path.relative(sourceRoot, file).replaceAll(path.sep, '/');
  const bytes = statSync(file).size;
  return {
    id: `local-${recordId(relative)}`,
    title: titleFromFilename(relative),
    filename: relative,
    mediaType: 'application/pdf',
    bytes,
    sourceType: 'local-archive',
    sourceRole: 'book-or-research-document',
    sha256: sha256(file),
    url: `${SITE}books/${encodePath(relative)}`,
  };
});

let externalSource = null;
try {
  externalSource = await loadExternalSourceRepository();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (requireExternal) throw new Error(`External Videha PDF source library is required but unavailable: ${message}`);
  console.warn(`External Videha PDF source library unavailable; continuing with local PDFs only: ${message}`);
}

const externalItems = externalSource?.items ?? [];
if (requireExternal) {
  if ((externalSource?.sourceCatalogSchemaVersion ?? 0) < 4) {
    throw new Error(`External source catalogue schema v4 or newer is required; found ${externalSource?.sourceCatalogSchemaVersion ?? 'none'}.`);
  }
  const externalByFilename = new Map(externalItems.map((item) => [item.filename, item]));
  for (const [filename, languageCode] of REQUIRED_CURATED_SOURCE_METADATA) {
    const sourceItem = externalByFilename.get(filename);
    if (!sourceItem) throw new Error(`Required curated source PDF is missing: ${filename}`);
    if (sourceItem.languageCode !== languageCode) {
      throw new Error(`Required language metadata mismatch for ${filename}: expected ${languageCode}, found ${sourceItem.languageCode ?? 'none'}`);
    }
  }
  const englishTranslation = externalByFilename.get('37_CHILDREN_NOVELS.pdf');
  const maithiliOriginal = externalByFilename.get('GAJENDRA_THAKUR_SAMAGRA_37_MAITHILI_CHILDREN_NOVELS.pdf');
  if (englishTranslation?.translationOf !== maithiliOriginal?.filename
      || maithiliOriginal?.translatedAs !== englishTranslation?.filename) {
    throw new Error('The Maithili-original ↔ English-translation relationship for the 37 children novels is incomplete.');
  }

  const gohiOriginal = externalByFilename.get(GOHI_ORIGINAL);
  const gohiEnglish = externalByFilename.get('Water_Burial_Among_the_Crocodiles.pdf');
  const gohiBal = externalByFilename.get('Gohi_Jalsamadhi_Bal_Sanskaran.pdf');
  const gohiKishor = externalByFilename.get('Gohi_Jalsamadhi_Kishor_Sanskaran.pdf');
  const gohiTeaching = externalByFilename.get('Videha_Teaching_Gohi_Jalsamadhi.pdf');
  const gohiTeachingMerge = externalByFilename.get('Gohi_Jalsamadhi_Teaching_merge.pdf');
  if (gohiOriginal?.workFamilyRole !== 'principal-work' || gohiOriginal?.workFamilyId !== GOHI_FAMILY_ID) {
    throw new Error('Gohi Sabhak Beech Jalsamadhi must be catalogued as the principal work of its work family.');
  }
  if (gohiEnglish?.translationOf !== GOHI_ORIGINAL || gohiOriginal?.translatedAs !== gohiEnglish?.filename) {
    throw new Error('The Gohi Sabhak Beech Jalsamadhi ↔ Water-Burial Among the Crocodiles translation relationship is incomplete.');
  }
  for (const derivative of [gohiBal, gohiKishor, gohiTeaching, gohiTeachingMerge]) {
    if (!derivative || derivative.workFamilyId !== GOHI_FAMILY_ID || derivative.isBasedOn !== GOHI_ORIGINAL) {
      throw new Error('A Gohi adaptation or teaching resource is missing its principal-work relationship.');
    }
  }
  const gohiRelatedPaths = new Set((gohiOriginal.relatedResources ?? []).map((item) => item.path));
  for (const requiredPath of [
    'Gohi_Jalsamadhi_Bal_Sanskaran.pdf',
    'Gohi_Jalsamadhi_Kishor_Sanskaran.pdf',
    'Water_Burial_Among_the_Crocodiles.pdf',
    'Videha_Teaching_Gohi_Jalsamadhi.pdf',
    'Gohi_Jalsamadhi_Teaching_merge.pdf',
  ]) {
    if (!gohiRelatedPaths.has(requiredPath)) throw new Error(`Gohi principal-work record is missing related resource: ${requiredPath}`);
  }

  const gadyaOne = externalByFilename.get('GADYA_PADYA_BHARTI_1.pdf');
  const gadyaTwo = externalByFilename.get('GAJENDRA_THAKUR_SAMAGRA_ANUVAD_KHAND.pdf');
  if (gadyaOne?.seriesTitle !== 'GADYA PADYA BHARTI' || gadyaOne?.seriesPart !== 1
      || gadyaTwo?.seriesTitle !== 'GADYA PADYA BHARTI' || gadyaTwo?.seriesPart !== 2) {
    throw new Error('GADYA PADYA BHARTI 1–2 series metadata is incomplete.');
  }
}

const items = [...externalItems, ...localItems].sort((a, b) => a.title.localeCompare(b.title));
const books = items.filter((item) => item.sourceRole === 'book-or-research-document');
const supportDocuments = items.filter((item) => item.sourceRole !== 'book-or-research-document');
const gohiFamilyBooks = books
  .filter((item) => item.workFamilyId === GOHI_FAMILY_ID)
  .sort((a, b) => {
    const order = { 'principal-work': 0, 'bal-sanskaran': 1, 'kishor-sanskaran': 2, 'english-translation': 3, 'teaching-resource': 4 };
    return (order[a.workFamilyRole] ?? 99) - (order[b.workFamilyRole] ?? 99) || a.title.localeCompare(b.title);
  });

mkdirSync(outputRoot, { recursive: true });
const catalog = {
  name: 'Videha Digital Research Archive · Source PDF Library',
  description: 'Machine-readable catalogue of source PDFs used by the Videha Digital Research Archive, including commit-pinned objects from the dedicated Videha PDF repository.',
  generatedAt: new Date().toISOString(),
  archive: SITE,
  count: items.length,
  bookCount: books.length,
  supportDocumentCount: supportDocuments.length,
  localCount: localItems.length,
  externalCount: externalItems.length,
  workFamilies: gohiFamilyBooks.length
    ? [{ id: GOHI_FAMILY_ID, title: 'Gohi Sabhak Beech Jalsamadhi', members: gohiFamilyBooks.map((item) => item.id) }]
    : [],
  sourceRepositories: externalSource
    ? [{
        repository: externalSource.repository,
        repositoryUrl: externalSource.repositoryUrl,
        branch: externalSource.branch,
        sourceCommit: externalSource.sourceCommit,
        sourceCommitDate: externalSource.sourceCommitDate,
        sourceCatalogSchemaVersion: externalSource.sourceCatalogSchemaVersion,
        sourceCatalogVersion: externalSource.sourceCatalogVersion,
        sourceCatalogCount: externalSource.sourceCatalogCount,
      }]
    : [],
  books,
  supportDocuments,
  items,
};
writeFileSync(path.join(outputRoot, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
writeFileSync(
  path.join(outputRoot, 'SHA256SUMS.txt'),
  localItems.length
    ? `# SHA-256 checksums for PDFs physically published by the archive repository.\n${localItems.map((book) => `${book.sha256}  ${book.filename}`).join('\n')}\n`
    : '# No local archive PDFs in this build. External source PDFs are identified by commit-pinned Git blob IDs; source SHA-256 values, where supplied, are preserved in catalog.json.\n',
);
writeFileSync(
  path.join(outputRoot, 'GIT-BLOB-IDS.txt'),
  externalSource
    ? [
        `# Source repository: ${externalSource.repository}`,
        `# Branch observed: ${externalSource.branch}`,
        `# Source commit: ${externalSource.sourceCommit}`,
        '# Git blob IDs below identify exact PDF objects in that commit. They are Git object IDs, not SHA-256 checksums.',
        ...externalItems.map((book) => `${book.gitBlobSha}  ${book.filename}`),
        '',
      ].join('\n')
    : '# No external GitHub PDF source repository was available in this build.\n',
);

const roleLabel = (role) => ({
  'principal-work': 'Principal work',
  'bal-sanskaran': 'Bal Sanskaran',
  'kishor-sanskaran': 'Kishor Sanskaran',
  'english-translation': 'English translation',
  'teaching-resource': 'Teaching resource',
}[role] ?? role);

const renderItem = (book) => {
  const external = book.sourceType === 'external-github';
  const relatedResourceRow = book.relatedResources?.length
    ? `<dt>Related work-family resources</dt><dd><ul>${book.relatedResources.map((related) => `<li>${escapeHtml(roleLabel(related.relation))}: <a href="${escapeHtml(related.url)}">${escapeHtml(related.title || related.path)}</a> · <a href="${escapeHtml(related.githubUrl)}">exact source object</a></li>`).join('')}</ul></dd>`
    : '';
  const relationshipRows = [
    book.alternateTitle ? `<dt>Alternate title</dt><dd>${escapeHtml(book.alternateTitle)}</dd>` : '',
    book.language ? `<dt>Language</dt><dd>${escapeHtml(book.language)}${book.languageCode ? ` (<code>${escapeHtml(book.languageCode)}</code>)` : ''}</dd>` : '',
    book.seriesTitle ? `<dt>Series</dt><dd>${escapeHtml(book.seriesTitle)}${book.seriesPart ? ` · Part ${escapeHtml(book.seriesPart)}` : ''}</dd>` : '',
    book.workFamilyTitle ? `<dt>Work family</dt><dd>${escapeHtml(book.workFamilyTitle)}${book.workFamilyRole ? ` · ${escapeHtml(roleLabel(book.workFamilyRole))}` : ''}</dd>` : '',
    book.editionNote ? `<dt>Edition / relation note</dt><dd>${escapeHtml(book.editionNote)}</dd>` : '',
    book.isBasedOnUrl ? `<dt>Based on</dt><dd><a href="${escapeHtml(book.isBasedOnUrl)}">${escapeHtml(book.isBasedOnTitle || book.isBasedOn)}</a> · <a href="${escapeHtml(book.isBasedOnGithubUrl)}">exact source object</a></dd>` : '',
    book.translationOfUrl ? `<dt>Translation of</dt><dd><a href="${escapeHtml(book.translationOfUrl)}">${escapeHtml(book.translationOfTitle || book.translationOf)}</a> · <a href="${escapeHtml(book.translationOfGithubUrl)}">exact source object</a></dd>` : '',
    book.translatedAsUrl ? `<dt>English translation</dt><dd><a href="${escapeHtml(book.translatedAsUrl)}">${escapeHtml(book.translatedAsTitle || book.translatedAs)}</a> · <a href="${escapeHtml(book.translatedAsGithubUrl)}">exact source object</a></dd>` : '',
    relatedResourceRow,
  ].filter(Boolean).join('');
  return `
      <article class="book">
        <h2><a href="${escapeHtml(book.url)}">${escapeHtml(book.title)}</a></h2>
        <p><code>${escapeHtml(book.filename)}</code></p>
        <dl>
          <dt>Format</dt><dd>PDF</dd>
          <dt>Size</dt><dd>${formatMb(book.bytes)}</dd>
          ${relationshipRows}
          ${external
            ? `<dt>Source repository</dt><dd><a href="${escapeHtml(book.repositoryUrl)}">${escapeHtml(book.repository)}</a></dd><dt>Version</dt><dd><code>${book.sourceCommit.slice(0, 12)}</code> · commit-pinned</dd><dt>Git blob ID</dt><dd><code>${book.gitBlobSha}</code></dd>${book.sourceSha256 ? `<dt>Source SHA-256</dt><dd><code>${book.sourceSha256}</code></dd>` : ''}`
            : `<dt>SHA-256</dt><dd><code>${book.sha256}</code></dd>`}
        </dl>
        ${external
          ? `<p class="record-links"><a href="${escapeHtml(book.url)}">Open pinned PDF</a> · <a href="${escapeHtml(book.githubUrl)}">View exact source object on GitHub</a>${book.currentPublishedUrl ? ` · <a href="${escapeHtml(book.currentPublishedUrl)}">Current published copy</a>` : ''}</p>`
          : ''}
      </article>`;
};

const rows = books.length
  ? books.map(renderItem).join('')
  : `<section class="empty"><h2>PDF source-library infrastructure is ready</h2><p>No source PDFs are indexed in this build yet.</p></section>`;
const supportRows = supportDocuments.length
  ? `<section class="support"><h2>Repository support documents</h2><p>These PDFs exist in the source repository but are not listed in its generated book catalogue.</p>${supportDocuments.map(renderItem).join('')}</section>`
  : '';
const gohiFamilySection = gohiFamilyBooks.length
  ? `<section class="work-family"><p class="kicker">CURATED WORK FAMILY</p><h2>Gohi Sabhak Beech Jalsamadhi</h2><p>The archive treats <strong>Gohi Sabhak Beech Jalsamadhi</strong> as the principal Maithili novel and the largest Maithili novel in the Videha corpus. The Bal Sanskaran, Kishor Sanskaran, English translation <em>Water-Burial Among the Crocodiles</em>, and both teaching resources are catalogued as related records rather than as unrelated books.</p><ul>${gohiFamilyBooks.map((book) => `<li><strong>${escapeHtml(roleLabel(book.workFamilyRole))}:</strong> <a href="${escapeHtml(book.url)}">${escapeHtml(book.title)}</a></li>`).join('')}</ul></section>`
  : '';

const itemList = items.map((book, index) => ({
  '@type': 'ListItem',
  position: index + 1,
  item: {
    '@type': 'DigitalDocument',
    name: book.title,
    alternateName: book.alternateTitle ?? undefined,
    encodingFormat: 'application/pdf',
    contentUrl: book.url,
    version: book.sourceCommit ?? undefined,
    identifier: book.gitBlobSha ? `git-blob:${book.gitBlobSha}` : `sha256:${book.sha256}`,
    sameAs: book.githubUrl ?? undefined,
    inLanguage: book.languageCode ?? book.language ?? undefined,
    about: book.workFamilyTitle
      ? { '@type': 'CreativeWork', name: book.workFamilyTitle, identifier: book.workFamilyId ?? undefined }
      : undefined,
    isBasedOn: book.isBasedOnUrl
      ? { '@type': 'DigitalDocument', name: book.isBasedOnTitle ?? book.isBasedOn, contentUrl: book.isBasedOnUrl }
      : undefined,
    translationOfWork: book.translationOfUrl
      ? {
          '@type': 'DigitalDocument',
          name: book.translationOfTitle ?? book.translationOf,
          contentUrl: book.translationOfUrl,
          inLanguage: 'mai',
        }
      : undefined,
    workTranslation: book.translatedAsUrl
      ? {
          '@type': 'DigitalDocument',
          name: book.translatedAsTitle ?? book.translatedAs,
          contentUrl: book.translatedAsUrl,
          inLanguage: 'en',
        }
      : undefined,
    hasPart: book.relatedResources?.length
      ? book.relatedResources.map((related) => ({ '@type': 'DigitalDocument', name: related.title ?? related.path, contentUrl: related.url }))
      : undefined,
    additionalProperty: [
      book.seriesTitle ? { '@type': 'PropertyValue', name: 'Series', value: `${book.seriesTitle}${book.seriesPart ? ` · Part ${book.seriesPart}` : ''}` } : undefined,
      book.workFamilyRole ? { '@type': 'PropertyValue', name: 'Work-family role', value: roleLabel(book.workFamilyRole) } : undefined,
    ].filter(Boolean),
    isPartOf: book.repositoryUrl
      ? { '@type': 'Collection', name: book.repository, url: book.repositoryUrl }
      : { '@type': 'WebSite', name: 'Videha Digital Research Archive', url: SITE },
  },
}));

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Videha Digital Research Archive · Source PDF Library',
  url: `${SITE}source-library/`,
  isPartOf: { '@type': 'WebSite', name: 'Videha Digital Research Archive', url: SITE },
  mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: itemList },
};

const sourceProvenance = externalSource
  ? `<p><strong>Dedicated source repository:</strong> <a href="${externalSource.repositoryUrl}">${externalSource.repository}</a>. This build indexes <strong>${externalItems.length}</strong> PDFs at source commit <code>${externalSource.sourceCommit}</code>. Links labelled “Open pinned PDF” are bound to that exact commit, so the archive record does not silently change when a later PDF replaces a file on <code>main</code>.</p>`
  : '<p>The dedicated external PDF repository was unavailable during this build; only local archive PDFs are listed.</p>';

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Source PDF Library | Videha Digital Research Archive</title>
<meta name="description" content="Version-pinned source PDF library and machine-readable PDF catalogue for the Videha Digital Research Archive.">
<link rel="canonical" href="${SITE}source-library/">
<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>
<style>
body{margin:0;background:#fbfaf6;color:#172437;font:17px/1.65 Georgia,"Times New Roman",serif}main{max-width:1000px;margin:auto;padding:3rem 1.2rem 4rem}h1{font-size:clamp(2.2rem,6vw,4.6rem);line-height:1;color:#0d2742;margin:.4rem 0 1rem}.kicker{font:800 .78rem/1.4 system-ui,sans-serif;letter-spacing:.16em;color:#8c3d24}.subtitle{font-size:1.25rem;font-weight:700;color:#8c3d24}.meta{padding:1rem 0 2rem;border-bottom:1px solid #cbc5b9}.tools,.record-links{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.2rem 0}.tools a,.record-links a{font:700 .9rem system-ui,sans-serif;color:#174c7d;text-decoration:none;border:1px solid #b8c0c8;border-radius:999px;padding:.5rem .75rem;background:white}.book{padding:1.3rem 0;border-bottom:1px solid #ddd7ca}.book h2{margin:.1rem 0}.book dl{display:grid;grid-template-columns:max-content 1fr;gap:.3rem .8rem}.book dt{font-weight:700}.book dd{margin:0;overflow-wrap:anywhere}.book dd ul{margin:.2rem 0;padding-left:1.2rem}.work-family{margin:2rem 0;padding:1.4rem;border:2px solid #b7a57a;background:#fffdf7;border-radius:10px}.work-family h2{margin:.2rem 0 .7rem;color:#0d2742}code{font:13px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;background:#f1eee7;padding:.1rem .3rem;border-radius:4px}.empty,.support{margin:2rem 0;padding:1.4rem;border:1px solid #d3ccc0;background:white;border-radius:10px}a{color:#174c7d}a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}
</style></head><body><main>
<p class="kicker">VIDEHA DIGITAL RESEARCH ARCHIVE</p><h1>Source PDF Library</h1>
<p class="subtitle">Primary and foundational book objects for the Digital Humanities Research Environment for Mithila, Vajji &amp; Anga</p>
<div class="meta"><p><strong>${books.length}</strong> book/research PDF${books.length === 1 ? '' : 's'} indexed${supportDocuments.length ? `, plus ${supportDocuments.length} repository-support PDF${supportDocuments.length === 1 ? '' : 's'}` : ''}. External objects are version-pinned to the exact source-repository commit observed by this build.</p>
${sourceProvenance}
<div class="tools"><a href="./catalog.json">Machine-readable catalogue (JSON)</a><a href="./GIT-BLOB-IDS.txt">Pinned Git blob IDs</a><a href="./SHA256SUMS.txt">Local SHA-256 checksums</a><a href="${SITE}about/">About the archive</a><a href="${SITE}records/">Permanent records</a></div></div>
${gohiFamilySection}
${rows}${supportRows}
<footer><p><a href="${SITE}">← Videha Digital Research Archive</a></p><p>© Gajendra Thakur, Editor, Videha Maithili eJournal · ISSN 2229-547X</p><p>Listing a PDF here does not change its copyright or licence; the source document’s own rights statement remains controlling.</p></footer>
</main></body></html>`;
writeFileSync(path.join(outputRoot, 'index.html'), html);

if (existsSync(sitemapPath)) {
  let sitemap = readFileSync(sitemapPath, 'utf8');
  const urls = [`${SITE}about/`, `${SITE}source-library/`];
  for (const url of urls) {
    if (!sitemap.includes(`<loc>${url}</loc>`)) {
      sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>2026-09-13</lastmod></url>\n</urlset>`);
    }
  }
  writeFileSync(sitemapPath, sitemap);
}

const identityStyle = `<style id="videha-archive-identity-style">.videha-archive-identity{box-sizing:border-box;width:100%;padding:.55rem 1rem;background:#0d2742;color:#fff;font:600 13px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center}.videha-archive-identity a{color:#fff!important;font-weight:800;text-decoration:none}.videha-archive-identity span{opacity:.88}.videha-archive-identity a:focus-visible{outline:3px solid #e39b45;outline-offset:2px}@media print{.videha-archive-identity{display:none}}</style>`;
const identityStrip = `<div class="videha-archive-identity" role="note"><a href="${SITE}">Videha Digital Research Archive</a> <span>· Digital Humanities Research Environment for Mithila, Vajji & Anga</span></div>`;
const identityRoots = ['records', 'compare', 'method', 'data', 'accessibility', 'rights'];
let identityPages = 0;
for (const root of identityRoots) {
  for (const file of walk(path.join('dist/client', root)).filter((item) => item.endsWith('.html'))) {
    let page = readFileSync(file, 'utf8');
    if (page.includes('videha-archive-identity')) continue;
    if (!/<body(?:\s[^>]*)?>/i.test(page)) continue;
    if (page.includes('</head>')) page = page.replace('</head>', `${identityStyle}</head>`);
    page = page.replace(/<body([^>]*)>/i, `<body$1>${identityStrip}`);
    writeFileSync(file, page);
    identityPages += 1;
  }
}

console.log(`Source PDF library: ${books.length} book/research PDF${books.length === 1 ? '' : 's'} indexed (${externalItems.length} external, ${localItems.length} local); archive identity applied to ${identityPages} scholarly pages.`);
