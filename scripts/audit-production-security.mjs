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

const report = {
  schemaVersion: 1,
  scope: 'production-dependencies-only',
  policy: {
    blockingSeverities: ['high', 'critical'],
    moderateAndLow: 'reported for triage; not allowed to hide high/critical production risk',
    forceFix: 'forbidden-without-package-level-review',
  },
  summary,
  findings,
};

mkdirSync('security-reports', { recursive: true });
writeFileSync('security-reports/production-audit.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ status: 'production-security-audit', ...summary }, null, 2));
if (summary.high > 0 || summary.critical > 0) {
  console.error('Blocking production dependency vulnerabilities remain. Review security-reports/production-audit.json; do not use npm audit fix --force blindly.');
  process.exit(1);
}
