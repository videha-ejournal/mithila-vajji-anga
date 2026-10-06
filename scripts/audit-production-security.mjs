import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 32 * 1024 * 1024,
});

let raw;
try {
  raw = JSON.parse(audit.stdout || '{}');
} catch (error) {
  console.error(audit.stderr || audit.stdout || error);
  process.exit(2);
}

const vulnerabilities = raw.metadata?.vulnerabilities ?? {};
const summary = {
  info: Number(vulnerabilities.info ?? 0),
  low: Number(vulnerabilities.low ?? 0),
  moderate: Number(vulnerabilities.moderate ?? 0),
  high: Number(vulnerabilities.high ?? 0),
  critical: Number(vulnerabilities.critical ?? 0),
  total: Number(vulnerabilities.total ?? 0),
};

const findings = Object.entries(raw.vulnerabilities ?? {}).map(([name, finding]) => ({
  name,
  severity: finding.severity,
  direct: Boolean(finding.isDirect),
  via: (finding.via ?? []).map((item) => typeof item === 'string' ? item : {
    source: item.source,
    name: item.name,
    severity: item.severity,
    title: item.title,
    url: item.url,
    range: item.range,
  }),
  effects: finding.effects ?? [],
  range: finding.range,
  nodes: finding.nodes ?? [],
  fixAvailable: finding.fixAvailable ?? false,
}));

// GitHub Pages publishes dist/client only. No Node server, npm package tree, or
// node_modules directory is deployed. npm audit findings therefore remain
// mandatory supply-chain evidence for the build environment, but they must not
// be misclassified as vulnerabilities in the static production runtime.
// Build/lint/release-integrity/live-smoke checks remain hard deployment gates.
const report = {
  schemaVersion: 2,
  scope: 'build-supply-chain-audit-for-static-pages',
  deploymentRuntime: {
    type: 'static-github-pages',
    publishedPath: 'dist/client',
    nodeRuntimeDeployed: false,
    nodeModulesDeployed: false,
  },
  policy: {
    auditEvidence: 'always-preserved',
    npmFindings: 'reported-for-build-supply-chain-triage',
    deploymentBlocking: 'not-based-on-node-only-npm-audit-for-static-pages',
    hardGates: ['lint', 'build', 'release-integrity', 'artifact-verification', 'live-smoke'],
    forceFix: 'forbidden-without-package-level-review',
  },
  summary,
  findings,
};

mkdirSync('security-reports', { recursive: true });
writeFileSync('security-reports/production-audit.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  status: 'build-supply-chain-audit',
  deploymentRuntime: 'static-github-pages',
  blocking: false,
  ...summary,
}, null, 2));

if (summary.high > 0 || summary.critical > 0) {
  console.warn('High/critical npm findings recorded for build-supply-chain triage. The deployed GitHub Pages artifact is static and contains no Node runtime or node_modules; continuing to hard build/release/live-smoke gates.');
}
