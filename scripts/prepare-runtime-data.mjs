import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const learning = JSON.parse(readFileSync('app/learning-data.json', 'utf8'));

const records = [
  ...learning.places.map((place) => ({
    id: `global-map-${place.id}`,
    title: place.name,
    kind: 'Places',
    meta: `${place.admin} · ${place.countryCode} · sourced map record`,
    text: `${place.context} ${place.frame}`,
    route: 'historical-map',
  })),
  ...learning.panji.map((entry) => ({
    id: `global-panji-${entry.id}`,
    title: entry.heading,
    kind: 'Texts',
    meta: `${entry.volume} · Panji manuscript heading`,
    text: `${entry.context} ${entry.canSupport}`,
    route: 'panji',
  })),
  ...learning.comparators.map((entry) => ({
    id: `global-concept-${entry.id}`,
    title: entry.name,
    kind: 'Ideas',
    meta: 'Parallel Philosophy comparison',
    text: `${entry.question} ${entry.purvapaksha} ${entry.uttarapaksha} ${entry.synthesis}`,
    route: 'knowledge-graph',
  })),
];

const output = {
  counts: {
    places: learning.places.length,
    panji: learning.panji.length,
    comparators: learning.comparators.length,
  },
  records,
};

mkdirSync('app/generated', { recursive: true });
writeFileSync(
  'app/generated/specialist-search-lite.json',
  `${JSON.stringify(output)}\n`,
  'utf8',
);

console.log(
  `Prepared lightweight specialist search index: ${records.length} records (${Buffer.byteLength(JSON.stringify(output))} bytes).`,
);
