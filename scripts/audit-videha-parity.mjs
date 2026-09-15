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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function serializeError(error) {
  const cause = error?.cause;
  return {
    name: error?.name ?? 'Error',
    message: error?.message ?? String(error),
    code: error?.code ?? cause?.code ?? null,
    cause: cause?.message ?? null
  };
}

async function fetchPage(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'Videha-Parity-Audit/1.1 (+https://www.videha.co.in/)'
        },
        signal: AbortSignal.timeout(30000)
      });
      const text = await response.text();
      if (response.ok || attempt === 4) {
        return {
          state: 'fetched',
          requestedUrl: url,
          finalUrl: response.url,
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          bytes: Buffer.byteLength(text),
          attemptCount: attempt,
          text
        };
      }
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(attempt * 1500);
  }
  throw lastError ?? new Error(`Unable to fetch ${url}`);
}

async function safeFetchPage(url) {
  try {
    return await fetchPage(url);
  } catch (error) {
    return {
      state: 'unavailable',
      requestedUrl: url,
      finalUrl: null,
      status: null,
      ok: false,
      contentType: null,
      bytes: 0,
      attemptCount: 4,
      error: serializeError(error),
      text: null
    };
  }
}

function publicFetchRecord(page, requiredMarkers) {
  if (page.state === 'unavailable') {
    return {
      state: page.state,
      requestedUrl: page.requestedUrl,
      finalUrl: page.finalUrl,
      status: page.status,
      ok: page.ok,
      contentType: page.contentType,
      bytes: page.bytes,
      attemptCount: page.attemptCount,
      error: page.error,
      requiredMarkers: null,
      normalizedSha256: null
    };
  }

  const normalized = normalizeHtml(page.text);
  return {
    state: page.state,
    requestedUrl: page.requestedUrl,
    finalUrl: page.finalUrl,
    status: page.status,
    ok: page.ok,
    contentType: page.contentType,
    bytes: page.bytes,
    attemptCount: page.attemptCount,
    requiredMarkers: Object.fromEntries(requiredMarkers.map((marker) => [marker, page.text.includes(marker)])),
    normalizedSha256: sha256(normalized)
  };
}

const results = [];
let blockingFailure = false;
let unavailableSourceCount = 0;

for (const target of config.targets) {
  const [primary, mirror] = await Promise.all([
    safeFetchPage(target.primary),
    safeFetchPage(target.mirror)
  ]);

  const requiredMarkers = config.requiredIdentityMarkers ?? [];
  const primaryRecord = publicFetchRecord(primary, requiredMarkers);
  const mirrorRecord = publicFetchRecord(mirror, requiredMarkers);
  const comparable = primary.state === 'fetched' && mirror.state === 'fetched';
  const primaryNormalized = comparable ? normalizeHtml(primary.text) : null;
  const mirrorNormalized = comparable ? normalizeHtml(mirror.text) : null;

  if (!comparable) unavailableSourceCount += Number(primary.state === 'unavailable') + Number(mirror.state === 'unavailable');

  const record = {
    id: target.id,
    primary: primaryRecord,
    mirror: mirrorRecord,
    comparisonState: comparable ? 'completed' : 'unavailable-source',
    normalizedEquivalent: comparable ? primaryNormalized === mirrorNormalized : null,
    driftPolicy: 'report-only; never overwrite either host automatically'
  };

  if (!primary.ok || !mirror.ok || !comparable) blockingFailure = true;
  if (comparable && requiredMarkers.some((marker) => !primaryRecord.requiredMarkers[marker] || !mirrorRecord.requiredMarkers[marker])) blockingFailure = true;
  results.push(record);
}

const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  publication: {
    title: 'Videha — First Maithili Fortnightly eJournal',
    issn: '2229-547X',
    primary: config.primaryBase,
    mirror: config.mirrorBase
  },
  targetCount: results.length,
  unavailableSourceCount,
  blockingFailure,
  auditStatus: unavailableSourceCount > 0 ? 'incomplete-source-unavailable' : blockingFailure ? 'completed-with-failures' : 'completed',
  policy: config.policy,
  results
};

if (outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify(report, null, 2));
if (blockingFailure) process.exit(1);
