import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const fail = (message) => { throw new Error(`[scholarly-preservation] ${message}`); };
const readText = (relative) => readFile(path.join(root, relative), 'utf8');
const readJson = async (relative) => JSON.parse(await readText(relative));

const release = await readJson('data/release-manifest.json');
const zenodo = await readJson('.zenodo.json');
const evidence = await readJson('data/evidence-refinement-register.json');
const citation = await readText('CITATION.cff');
const policy = await readText('SCHOLARLY-PRESERVATION.md');
const verifiedDoi = '10.5281/zenodo.22754977';

if (release.version !== '2026.09' || release.tag !== 'v2026.09') fail('release version/tag mismatch');
if (release.parentPublication?.issn !== '2229-547X') fail('parent ISSN missing or incorrect');
if (release.parentPublication?.primaryUrl !== 'https://www.videha.co.in/') fail('primary Videha URL mismatch');
if (release.parentPublication?.githubMirrorUrl !== 'https://videha-ejournal.github.io/videha/') fail('GitHub mirror URL mismatch');
if (release.researchArchive?.repository !== 'https://github.com/videha-ejournal/mithila-vajji-anga') fail('research repository mismatch');
if (release.preservation?.doiStatus !== 'minted') fail('verified Zenodo DOI must be marked minted');
if (release.preservation?.doi !== verifiedDoi) fail('release manifest DOI mismatch');
if (release.preservation?.orcidStatus === 'not-supplied' && release.preservation?.orcid !== null) fail('unsupplied ORCID must remain null');
if (release.scholarlyGates?.isbnAuthorityCount !== 293) fail('ISBN authority count must remain 293');
if (release.scholarlyGates?.historyChapterCount !== 178) fail('History chapter count must remain 178');
if (release.scholarlyGates?.parallelPhilosophyChapterCount !== 172) fail('Parallel Philosophy count must remain 172');
if (release.scholarlyGates?.syntheticSourceTitlesAllowed !== false) fail('synthetic source titles must remain forbidden');

if (zenodo.version !== release.version) fail('Zenodo metadata version mismatch');
if (zenodo.upload_type !== 'dataset') fail('Zenodo upload_type must be dataset');
if (!String(zenodo.description ?? '').includes('ISSN 2229-547X')) fail('Zenodo description missing ISSN');
if ('doi' in zenodo) fail('Zenodo deposition configuration must not hard-code the DOI minted by Zenodo');

for (const marker of [
  'version: "2026.09"',
  `doi: "${verifiedDoi}"`,
  'ISSN 2229-547X',
  'https://www.videha.co.in/',
  'https://videha-ejournal.github.io/videha/',
  'https://github.com/videha-ejournal/mithila-vajji-anga'
]) {
  if (!citation.includes(marker)) fail(`CITATION.cff missing ${marker}`);
}

if (!policy.includes(verifiedDoi)) fail('preservation policy must state the verified Zenodo DOI');
if (!policy.includes('item-level authorship')) fail('preservation policy must preserve item-level attribution precedence');
if (evidence.publicationPolicy !== 'fail-closed') fail('evidence register must be fail-closed');
if (evidence.classes?.historicalGeography?.automaticPromotionAllowed !== false) fail('historical geography auto-promotion must remain forbidden');
if (evidence.classes?.panji?.syntheticTitlesAllowed !== false) fail('synthetic Panji titles must remain forbidden');
if (evidence.classes?.bilingualDetail?.machineTranslationAcceptedAsReviewedMaithili !== false) fail('machine translation must not count as reviewed Maithili');
if (evidence.classes?.accessibility?.machineChecksSubstituteForHumanTesting !== false) fail('machine accessibility checks must not substitute for human testing');
if (evidence.classes?.isbn?.publisherSourceColumnUsed !== false) fail('excluded publisher source column was reintroduced');

const distManifest = path.join(root, 'dist', 'client', 'data', 'preservation', 'preservation-manifest.json');
if (existsSync(distManifest)) {
  const manifest = JSON.parse(await readFile(distManifest, 'utf8'));
  if (manifest.releaseVersion !== release.version || manifest.failClosed !== true) fail('public preservation manifest mismatch');
  if (manifest.preservation?.doi !== verifiedDoi || manifest.preservation?.doiStatus !== 'minted') fail('public preservation DOI state mismatch');
  for (const file of manifest.files ?? []) {
    const local = path.join(root, 'dist', 'client', file.path.replace(/^\//, ''));
    if (!existsSync(local)) fail(`public preservation file missing: ${file.path}`);
    const bytes = await readFile(local);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== file.sha256) fail(`checksum mismatch for ${file.path}`);
  }
}

console.log({
  status: 'scholarly-preservation-verified',
  version: release.version,
  tag: release.tag,
  issn: release.parentPublication.issn,
  doiStatus: release.preservation.doiStatus,
  doi: release.preservation.doi,
  orcidAsserted: Boolean(release.preservation.orcid),
  failClosed: true
});
