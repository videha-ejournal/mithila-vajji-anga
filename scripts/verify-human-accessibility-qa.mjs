import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'accessibility-human-qa.json';
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const requiredIds = new Set((ledger.requiredEnvironments ?? []).map((item) => item.id));
const results = Array.isArray(ledger.results) ? ledger.results : [];
const passedIds = new Set(
  results
    .filter((item) => item?.result === 'passed' && item?.date && item?.tester && item?.browser && item?.platform)
    .map((item) => item.environmentId),
);
const blockers = Array.isArray(ledger.blockingDefects) ? ledger.blockingDefects.filter((item) => item?.status !== 'closed') : [];
const missing = [...requiredIds].filter((id) => !passedIds.has(id));
const claimsPassed = ledger.status === 'passed';
const eligibleForPass = missing.length === 0 && blockers.length === 0 && Boolean(ledger.certifiedAt) && Boolean(ledger.certifiedBy);

if (claimsPassed && !eligibleForPass) {
  console.error(JSON.stringify({
    status: 'invalid-human-accessibility-certification',
    missingEnvironments: missing,
    openBlockingDefects: blockers.length,
    certifiedAt: ledger.certifiedAt,
    certifiedBy: ledger.certifiedBy,
  }, null, 2));
  process.exit(1);
}
if (!claimsPassed && ledger.status !== 'pending-human-execution' && ledger.status !== 'in-progress') {
  console.error(`Unknown human accessibility QA status: ${ledger.status}`);
  process.exit(1);
}

const publication = {
  schemaVersion: 1,
  status: ledger.status,
  target: ledger.target,
  requiredEnvironmentCount: requiredIds.size,
  passedEnvironmentCount: passedIds.size,
  missingEnvironmentIds: missing,
  openBlockingDefectCount: blockers.length,
  certifiedAt: ledger.certifiedAt,
  certifiedBy: ledger.certifiedBy,
  machineChecksSubstituteForHumanTesting: false,
};

if (existsSync('dist/client')) {
  mkdirSync('dist/client/data', { recursive: true });
  writeFileSync('dist/client/data/accessibility-human-qa.json', `${JSON.stringify(publication, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ status: 'human-accessibility-qa-ledger-valid', ...publication }, null, 2));
