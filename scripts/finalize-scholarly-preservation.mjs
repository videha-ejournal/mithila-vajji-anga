import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist', 'client');
const destination = path.join(out, 'data', 'preservation');

const sources = [
  ['CITATION.cff', 'CITATION.cff'],
  ['.zenodo.json', 'zenodo.json'],
  ['SCHOLARLY-PRESERVATION.md', 'SCHOLARLY-PRESERVATION.md'],
  ['EVIDENCE-REFINEMENT-REGISTER.md', 'EVIDENCE-REFINEMENT-REGISTER.md'],
  ['data/release-manifest.json', 'release-manifest.json'],
  ['data/evidence-refinement-register.json', 'evidence-refinement-register.json']
];

await mkdir(destination, { recursive: true });
const files = [];

for (const [sourceRelative, outputName] of sources) {
  const sourcePath = path.join(root, sourceRelative);
  const bytes = await readFile(sourcePath);
  await writeFile(path.join(destination, outputName), bytes);
  files.push({
    path: `/data/preservation/${outputName}`,
    source: sourceRelative,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  });
}

const release = JSON.parse(await readFile(path.join(root, 'data', 'release-manifest.json'), 'utf8'));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  releaseVersion: release.version,
  releaseTag: release.tag,
  parentPublication: release.parentPublication,
  researchArchive: release.researchArchive,
  preservation: release.preservation,
  files,
  failClosed: true
};

await writeFile(
  path.join(destination, 'preservation-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8'
);

console.log({
  status: 'scholarly-preservation-finalized',
  releaseVersion: release.version,
  files: files.length,
  doi: release.preservation.doi,
  doiStatus: release.preservation.doiStatus,
  orcid: release.preservation.orcid,
  failClosed: true
});
