import { readFileSync, writeFileSync } from 'node:fs';

const path = 'app/archive-english.tsx';
let source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const replacements = [
  {
    from: "import learningData from './learning-data.json';\nimport ResearchExpansion from './research-expansion';\nimport LearningLab from './learning-lab';",
    to: "import specialistSearchData from './generated/specialist-search-lite.json';\nimport DeferredResearchRooms from './deferred-research-rooms';",
    label: 'replace heavyweight specialist imports',
  },
  {
    from: "  ...learningData.places.map((place) => ({ id: `global-map-${place.id}`, title: place.name, kind: 'Places' as const, meta: `${place.admin} · ${place.countryCode} · sourced map record`, text: `${place.context} ${place.frame}`, route: 'historical-map' as const })),\n  ...learningData.panji.map((entry) => ({ id: `global-panji-${entry.id}`, title: entry.heading, kind: 'Texts' as const, meta: `${entry.volume} · Panji manuscript heading`, text: `${entry.context} ${entry.canSupport}`, route: 'panji' as const })),\n  ...learningData.comparators.map((entry) => ({ id: `global-concept-${entry.id}`, title: entry.name, kind: 'Ideas' as const, meta: 'Parallel Philosophy comparison', text: `${entry.question} ${entry.purvapaksha} ${entry.uttarapaksha} ${entry.synthesis}`, route: 'knowledge-graph' as const })),",
    to: "  ...(specialistSearchData.records as GlobalSearchRecord[]),",
    label: 'replace heavyweight specialist search expansion',
  },
  {
    from: "Map gazetteer: {learningData.places.length} sourced reference points",
    to: "Map gazetteer: {specialistSearchData.counts.places} sourced reference points",
    label: 'replace heavyweight map count',
  },
  {
    from: "        <ResearchExpansion />\n\n        <LearningLab />",
    to: "        <DeferredResearchRooms />",
    label: 'defer specialist research rooms',
  },
];

let changed = false;
for (const { from, to, label } of replacements) {
  if (source.includes(to)) continue;
  if (!source.includes(from)) {
    throw new Error(`Homepage runtime optimization drift: could not ${label}.`);
  }
  source = source.replace(from, to);
  changed = true;
}

if (source.includes("from './learning-data.json'")) {
  throw new Error('Homepage runtime still imports the full learning-data.json payload.');
}
if (source.includes('<ResearchExpansion />') || source.includes('<LearningLab />')) {
  throw new Error('Homepage runtime still eagerly renders specialist research rooms.');
}
if (!source.includes('<DeferredResearchRooms />')) {
  throw new Error('Deferred specialist research gateway is missing from homepage runtime.');
}

if (changed) writeFileSync(path, source, 'utf8');
console.log(JSON.stringify({
  status: 'homepage-runtime-optimized',
  source: path,
  fullLearningDataOnInitialPath: false,
  specialistRoomsDeferred: true,
  changed,
}, null, 2));
