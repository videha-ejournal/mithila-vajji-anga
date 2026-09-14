import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'app/archive-english.tsx');
const TARGET = path.join(ROOT, 'app/home-maithili.tsx');
const DICTIONARY = path.join(ROOT, 'data/maithili-interface.json');

const source = await readFile(SOURCE, 'utf8');
const dictionary = JSON.parse(await readFile(DICTIONARY, 'utf8'));

let output = source;
let applied = 0;
const missed = [];

for (const [english, maithili] of Object.entries(dictionary.exact ?? {})) {
  let changed = false;
  const forms = [
    [`>${english}<`, `>${maithili}<`],
    [`'${english.replaceAll("'", "\\'")}'`, `'${maithili.replaceAll("'", "\\'")}'`],
    [`"${english.replaceAll('"', '\\"')}"`, `"${maithili.replaceAll('"', '\\"')}"`],
    [`>${english} `, `>${maithili} `],
  ];
  for (const [from, to] of forms) {
    if (output.includes(from)) {
      output = output.split(from).join(to);
      changed = true;
    }
  }
  if (changed) applied += 1;
  else missed.push(english);
}

// Maithili edition behavior: Maithili is the source UI language for translation and speech.
output = output.replace(
  "const [translationTarget, setTranslationTarget] = useState('mai');",
  "const [translationTarget, setTranslationTarget] = useState('en');",
);
output = output.replaceAll('_x_tr_sl=en', '_x_tr_sl=mai');
output = output.replace(
  "[['mai','Maithili'],['hi','Hindi'],['bn','Bengali'],['ne','Nepali']]",
  "[['en','English'],['hi','Hindi'],['bn','Bengali'],['ne','Nepali']]",
);
output = output.replace(
  "utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === 'en-in')\n        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))\n        ?? null;\n      utterance.lang = utterance.voice?.lang ?? 'en-IN';",
  "utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === 'mai-in')\n        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('mai'))\n        ?? voices.find((voice) => voice.lang.toLowerCase() === 'hi-in')\n        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('hi'))\n        ?? null;\n      utterance.lang = utterance.voice?.lang ?? 'mai-IN';",
);

const provenance = `/*\n * GENERATED FILE — do not edit directly.\n * Source: app/archive-english.tsx\n * Generator: scripts/generate-maithili-home.mjs\n * Policy: only UI/editorial framing is localized. Source-derived catalogue titles,\n * quotations, summaries and evidence passages stay in their verified source language\n * unless a reviewed Maithili text exists. No machine translation is used here.\n */\n`;
output = provenance + output;

const devanagariCount = (output.match(/[\u0900-\u097F]/g) ?? []).length;
const forbiddenProminent = [
  'Explore Mithila, Vajji and Anga',
  'Four doors into one archive',
  'Find a person, place, text, chapter, or idea',
  'ONE SEARCH · THE WHOLE ARCHIVE',
  'THE VIDEHA RESEARCH STUDIO',
  'SPECIALIST WORKSPACES BEHIND THE FOUR DOORS',
];
for (const phrase of forbiddenProminent) {
  if (output.includes(`>${phrase}<`)) throw new Error(`Maithili homepage still exposes prominent English UI: ${phrase}`);
}
if (devanagariCount < 900) {
  throw new Error(`Maithili homepage localization is too sparse: only ${devanagariCount} Devanagari code points`);
}
if (!output.includes('_x_tr_sl=mai')) throw new Error('Maithili translation tool source language was not corrected');
if (!output.includes("'mai-IN'")) throw new Error('Maithili Listen fallback language was not corrected');

await writeFile(TARGET, output, 'utf8');
console.log({
  generated: path.relative(ROOT, TARGET),
  curatedInterfaceEntriesApplied: applied,
  dictionaryEntriesNotPresentInHomepageSource: missed.length,
  devanagariCount,
  sourceLanguage: 'mai',
  machineTranslationUsedForAuthoritativeContent: false,
});
