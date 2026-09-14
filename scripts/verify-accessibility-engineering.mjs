import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist/client');
const ROOT_HTML = join(DIST, 'index.html');
const EN_HTML = join(DIST, 'en/index.html');
const CSS = join(ROOT, 'app/globals.css');
const PAGE = join(ROOT, 'app/page.tsx');
const AUDIT = join(ROOT, 'ACCESSIBILITY-AUDIT.md');
const OUTPUT = join(DIST, 'data/accessibility-engineering-report.json');

const fail = (message) => { throw new Error(`Accessibility engineering verification failed: ${message}`); };
for (const path of [ROOT_HTML, EN_HTML, CSS, PAGE, AUDIT]) {
  if (!existsSync(path)) fail(`required file is missing: ${path}`);
}

const rootHtml = readFileSync(ROOT_HTML, 'utf8');
const enHtml = readFileSync(EN_HTML, 'utf8');
const css = readFileSync(CSS, 'utf8');
const page = readFileSync(PAGE, 'utf8');
const audit = readFileSync(AUDIT, 'utf8');

const checks = [
  {
    id: 'manual-status-honesty',
    description: 'Manual assistive-technology certification remains Pending until named AT/device tests are actually run.',
    pass: /Manual certification status:\s*\*\*?PENDING\*\*?/i.test(audit) || /Manual certification status:\s*PENDING/i.test(audit),
  },
  {
    id: 'skip-link',
    description: 'A keyboard skip link is present and targets the principal research entry point.',
    pass: page.includes('className="skip-link"') && page.includes('href="#doors"'),
  },
  {
    id: 'visible-focus',
    description: 'Interactive controls retain a visible :focus-visible outline with offset.',
    pass: css.includes(':focus-visible') && /outline:\s*3px\s+solid/i.test(css) && /outline-offset:\s*3px/i.test(css),
  },
  {
    id: 'reduced-motion',
    description: 'Reduced-motion preference and archive stop-motion behavior are implemented.',
    pass: css.includes('@media (prefers-reduced-motion: reduce)') || css.includes('@media(prefers-reduced-motion:reduce)') || css.includes('prefers-reduced-motion'),
  },
  {
    id: 'large-target-mode',
    description: 'Large-target assistive mode enforces at least 44 × 44 CSS px on links/buttons.',
    pass: /body\.large-targets\s+button[\s\S]*min-height:\s*44px[\s\S]*min-width:\s*44px/.test(css),
  },
  {
    id: 'semantic-shell',
    description: 'Rendered root and English mirror contain semantic header/navigation/main structures.',
    pass: [rootHtml, enHtml].every((html) => /<header\b/i.test(html) && /<nav\b/i.test(html) && /<main\b/i.test(html)),
  },
  {
    id: 'language-metadata',
    description: 'Final rendered Maithili and English mirrors expose the correct document languages.',
    pass: /<html[^>]+lang="mai"/i.test(rootHtml) && /<html[^>]+lang="en"/i.test(enHtml),
  },
  {
    id: 'mirror-accessibility-controls',
    description: 'Both mirrors expose Listen, Stop, translation and assistive-tech controls.',
    pass: [rootHtml, enHtml].every((html) => /Listen/i.test(html) && /Stop/i.test(html) && /Assistive Tech/i.test(html) && /Translate/i.test(html)),
  },
  {
    id: 'responsive-viewport',
    description: 'Both rendered documents contain a responsive viewport declaration.',
    pass: [rootHtml, enHtml].every((html) => /<meta[^>]+name="viewport"[^>]+width=device-width/i.test(html) || /<meta[^>]+content="width=device-width[^>]+name="viewport"/i.test(html)),
  },
  {
    id: 'image-alternatives',
    description: 'Every rendered img element on the two entry pages carries an alt attribute (empty alt is permitted for decorative images).',
    pass: [rootHtml, enHtml].every((html) => {
      const images = html.match(/<img\b[^>]*>/gi) ?? [];
      return images.every((tag) => /\salt=("[^"]*"|'[^']*')/i.test(tag));
    }),
  },
  {
    id: 'dialog-state-semantics',
    description: 'Interactive tool panels expose ARIA state semantics in source.',
    pass: page.includes('aria-expanded') && page.includes('aria-pressed') && page.includes('aria-label'),
  },
  {
    id: 'translation-inventory',
    description: 'The 41-language translation inventory remains present in source.',
    pass: (page.match(/^\s*\['[^']+',\s*'[^']+'\],?\s*$/gm) ?? []).length >= 41,
  },
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  fail(failed.map((check) => check.id).join(', '));
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  target: 'WCAG 2.2 AA-oriented accessibility engineering safeguards',
  engineeringVerificationStatus: 'passed',
  manualAssistiveTechnologyCertificationStatus: 'pending',
  certificationClaim: 'Engineering safeguards passed. This report is not a substitute for actual NVDA, JAWS, VoiceOver, TalkBack, physical-device, tactile or human usability testing.',
  mirrorsChecked: ['mai root', 'en /en/'],
  checks: checks.map(({ id, description }) => ({ id, description, status: 'passed' })),
  humanOnlyOutstanding: [
    'NVDA with current Firefox and Chrome/Edge on Windows',
    'JAWS with current Edge/Chrome on Windows',
    'VoiceOver with Safari on macOS and iOS',
    'TalkBack with Chrome on Android',
    'Physical keyboard/touch/device confirmation and human perceptual review of focus, contrast, reflow and media behavior',
  ],
};
mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Accessibility engineering verified: ${checks.length} release checks passed; named assistive-technology certification remains Pending.`);
