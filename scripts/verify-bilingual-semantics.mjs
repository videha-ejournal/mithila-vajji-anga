import { readFileSync } from 'node:fs';

const root = readFileSync('dist/client/index.html', 'utf8');
const english = readFileSync('dist/client/en/index.html', 'utf8');
const failures = [];

function requireMatch(label, text, pattern) {
  if (!pattern.test(text)) failures.push(label);
}

requireMatch('Root document must declare lang="mai"', root, /<html\b[^>]*\blang="mai"/i);
requireMatch('English document must declare lang="en"', english, /<html\b[^>]*\blang="en"/i);
requireMatch('Root must expose the Maithili edition marker', root, /data-edition="mai"/i);
requireMatch('English must expose the English edition marker', english, /data-edition="en"/i);
requireMatch('Root must contain the Maithili research gateway', root, /मिथिला, वज्जि आ अंगक शोध-द्वार/);
requireMatch('Root must contain substantial Maithili explanatory copy', root, /ई विदेहक मैथिली प्रवेश-पन्ना अछि/);
requireMatch('English must contain the English research gateway', english, /Research gateway to Mithila, Vajji and Anga/);
requireMatch('Root must link the English alternate', root, /hreflang="en"/i);
requireMatch('English must link the Maithili alternate', english, /hreflang="mai"/i);
requireMatch('Both editions must expose x-default', root + english, /hreflang="x-default"/i);

const requiredIds = [
  'edition-home-introduction',
  'doors',
  'archive-search',
  'project-status',
  'cover-showcase',
  'explorer',
];
for (const id of requiredIds) {
  const marker = new RegExp(`id=["']${id}["']`, 'i');
  if (!marker.test(root)) failures.push(`Root missing mirrored structural id: ${id}`);
  if (!marker.test(english)) failures.push(`English missing mirrored structural id: ${id}`);
}

function ids(text) {
  return [...text.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
}
const rootIds = ids(root);
const englishIds = ids(english);
const sharedRoot = rootIds.filter((id) => id !== 'edition-home-title');
const sharedEnglish = englishIds.filter((id) => id !== 'edition-home-title');
if (sharedRoot.length !== sharedEnglish.length) {
  failures.push(`Visible structural ID count differs: root=${sharedRoot.length}, en=${sharedEnglish.length}`);
}

const devanagari = (root.match(/[\u0900-\u097F]/g) ?? []).length;
if (devanagari < 180) failures.push(`Root Maithili signal is too small (${devanagari} Devanagari characters)`);

if (failures.length) {
  console.error('Bilingual semantic gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log({
  status: 'bilingual-semantic-gate-passed',
  rootLanguage: 'mai',
  englishLanguage: 'en',
  rootDevanagariCharacters: devanagari,
  rootIdCount: rootIds.length,
  englishIdCount: englishIds.length,
});
