import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const config = JSON.parse(await readFile(new URL('../data/videha-parity-targets.json', import.meta.url), 'utf8'));
const outputArgIndex = process.argv.indexOf('--write');
const outputPath = outputArgIndex >= 0 && process.argv[outputArgIndex + 1]
  ? process.argv[outputArgIndex + 1]
  : null;

function normalizeHtml(value) {
  return value
    .replaceAll('https://www.videha.co.in/', 'VIDEHA_BASE/')
    .replaceAll('https://videha.co.in/', 'VIDEHA_BASE/')
    .replaceAll('https://videha-ejournal.github.io/videha/', 'VIDEHA_BASE/')
    .replace(/([?&](?:v|ver|version)=[^"'&\s>]+)/gi, '')
    .replace(/<!--.*?-->/gs, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function fetchPage(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Videha-Parity-Audit/1.0 (+https://www.videha.co.in/)'
    }
  });
  const text = await response.text();
  return {
    requestedUrl: url,
    finalUrl: response.url,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type'),
    bytes: Buffer.byteLength(text),
    text
  };
}

const results = [];
let blockingFailure = false;

for (const target of config.targets) {
  const [primary, mirror] = await Promise.all([
    fetchPage(target.primary),
    fetchPage(target.mirror)
  ]);

  const requiredMarkers = config.requiredIdentityMarkers ?? [];
  const primaryMarkers = Object.fromEntries(requiredMarkers.map((marker) => [marker, primary.text.includes(marker)]));
  const mirrorMarkers = Object.fromEntries(requiredMarkers.map((marker) => [marker, mirror.text.includes(marker)]));
  const primaryNormalized = normalizeHtml(primary.text);
  const mirrorNormalized = normalizeHtml(mirror.text);

  const record = {
    id: target.id,
    primary: {
      requestedUrl: primary.requestedUrl,
      finalUrl: primary.finalUrl,
      status: primary.status,
      ok: primary.ok,
      contentType: primary.contentType,
      bytes: primary.bytes,
      requiredMarkers: primaryMarkers,
      normalizedSha256: sha256(primaryNormalized)
    },
    mirror: {
      requestedUrl: mirror.requestedUrl,
      finalUrl: mirror.finalUrl,
      status: mirror.status,
      ok: mirror.ok,
      contentType: mirror.contentType,
      bytes: mirror.bytes,
      requiredMarkers: mirrorMarkers,
      normalizedSha256: sha256(mirrorNormalized)
    },
    normalizedEquivalent: primaryNormalized === mirrorNormalized,
    driftPolicy: 'report-only; never overwrite either host automatically'
  };

  if (!primary.ok || !mirror.ok) blockingFailure = true;
  if (requiredMarkers.some((marker) => !primaryMarkers[marker] || !mirrorMarkers[marker])) blockingFailure = true;
  results.push(record);
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  publication: {
    title: 'Videha — First Maithili Fortnightly eJournal',
    issn: '2229-547X',
    primary: config.primaryBase,
    mirror: config.mirrorBase
  },
  targetCount: results.length,
  blockingFailure,
  policy: config.policy,
  results
};

if (outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify(report, null, 2));
if (blockingFailure) process.exit(1);
