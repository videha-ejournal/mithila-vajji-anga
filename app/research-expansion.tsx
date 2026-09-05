'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import Image from 'next/image';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  GitFork,
  Languages,
  Map,
  Pause,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';
import coverData from './cover-data.json';
import libraryData from './library-data.json';
import collectionDetailsData from './collection-details.json';
import deepData from './deep-data.json';
import learningData from './learning-data.json';
import researchData from './research-data.json';
import ideasVolumeTwoData from './ideas-volume2.json';
import readerMaithiliData from './reader-maithili.json';

type Work = (typeof libraryData)[number];
type MapLayer = 'Polities' | 'Learning' | 'Sacred' | 'Trade' | 'Archives';
type ReadingMode = 'English' | 'Maithili (Devanagari)' | 'Maithili (Tirhuta)';
type ReaderPassage = {
  id: string;
  number: number;
  title: string;
  summary: string;
  part: string;
  source: string;
  volume: string;
  status: string;
  sections?: string[];
  purvapaksha?: string;
  uttarapaksha?: string;
  synthesis?: string;
};
type VolumeTwoIdea = (typeof ideasVolumeTwoData)[number];
const volumeTwoIdeas = ideasVolumeTwoData as VolumeTwoIdea[];
const readerPassages: ReaderPassage[] = [
  ...deepData.philosophyChapters.map((idea) => ({
    id: `reader-v1-${idea.id}`,
    number: idea.number,
    title: idea.title,
    summary: idea.summary,
    part: idea.part,
    source: `Gajendra Thakur’s Parallel Philosophy · Volume I · Chapter ${idea.number}`,
    volume: 'Volume I',
    status: 'Complete',
    sections: idea.sections,
    purvapaksha: idea.purvapaksha,
    uttarapaksha: idea.uttarapaksha,
    synthesis: idea.synthesis,
  })),
  ...volumeTwoIdeas.map((idea) => ({
    ...idea,
    volume: 'Volume II',
    status: idea.status === 'Available in English' ? 'Complete' : 'Planned',
  })),
];
const readerCompleteCount = readerPassages.filter((item) => item.status === 'Complete').length;
const readerPlannedCount = readerPassages.length - readerCompleteCount;
const readerMaithili = readerMaithiliData as Record<string, string>;

const mapPlaces: Array<{
  id: string;
  name: string;
  x: number;
  y: number;
  from: number;
  to: number;
  layers: MapLayer[];
  note: string;
  evidence: string;
}> = [
  {
    id: 'kathmandu',
    name: 'Kathmandu',
    x: 32,
    y: 22,
    from: 400,
    to: 2026,
    layers: ['Archives', 'Sacred'],
    note: 'A major Nepal Valley centre for manuscript circulation, religious institutions, and later preservation.',
    evidence: 'Manuscript and institutional history',
  },
  {
    id: 'simraungadh',
    name: 'Simraungadh',
    x: 28,
    y: 37,
    from: 1097,
    to: 1324,
    layers: ['Polities'],
    note: 'The Karnata capital connects medieval Mithila with the Nepal Tarai and wider northern networks.',
    evidence: 'Dynastic and archaeological history',
  },
  {
    id: 'janakpur',
    name: 'Janakpur',
    x: 45,
    y: 43,
    from: -700,
    to: 2026,
    layers: ['Learning', 'Sacred'],
    note: 'A living sacred and cultural centre associated with Janaka and Sita traditions across the India–Nepal region.',
    evidence: 'Layered textual and living traditions',
  },
  {
    id: 'darbhanga',
    name: 'Darbhanga',
    x: 45,
    y: 54,
    from: 1300,
    to: 2026,
    layers: ['Archives', 'Learning'],
    note: 'A later courtly, scholastic, literary, and archival centre central to modern Mithila research.',
    evidence: 'Court, print, and manuscript records',
  },
  {
    id: 'vaishali',
    name: 'Vaiśālī / Basarh',
    x: 28,
    y: 63,
    from: -600,
    to: 700,
    layers: ['Polities', 'Sacred'],
    note: 'The Vajjian political centre also belongs to Buddhist and Jain itineraries and council traditions.',
    evidence: 'Textual traditions and archaeology',
  },
  {
    id: 'pataliputra',
    name: 'Pāṭaliputra / Patna',
    x: 28,
    y: 72,
    from: -450,
    to: 2026,
    layers: ['Polities', 'Trade'],
    note: 'An imperial and commercial node linking the middle Ganga with Mithila, Vajji, and Anga.',
    evidence: 'Political, travel, and material history',
  },
  {
    id: 'purnia',
    name: 'Purnia',
    x: 76,
    y: 64,
    from: 500,
    to: 2026,
    layers: ['Archives', 'Trade'],
    note: 'An eastern corridor joining north Bihar, Bengal-facing routes, settlements, and later administrative archives.',
    evidence: 'Settlement and administrative history',
  },
  {
    id: 'champa',
    name: 'Campā / Bhagalpur',
    x: 64,
    y: 79,
    from: -600,
    to: 2026,
    layers: ['Trade', 'Sacred'],
    note: 'The Anga capital appears in eastern political, commercial, Buddhist, and Jain textual worlds.',
    evidence: 'Textual geography and archaeology',
  },
];
const geoPlaces = learningData.places;
const geoBounds = geoPlaces.reduce(
  (bounds, place) => ({
    minLat: Math.min(bounds.minLat, place.latitude),
    maxLat: Math.max(bounds.maxLat, place.latitude),
    minLon: Math.min(bounds.minLon, place.longitude),
    maxLon: Math.max(bounds.maxLon, place.longitude),
  }),
  { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 },
);
const geoPosition = (latitude: number, longitude: number) => ({
  x: 5 + ((longitude - geoBounds.minLon) / (geoBounds.maxLon - geoBounds.minLon || 1)) * 90,
  y: 5 + ((geoBounds.maxLat - latitude) / (geoBounds.maxLat - geoBounds.minLat || 1)) * 90,
});
const geoPlaceLayers = (place: (typeof geoPlaces)[number]): MapLayer[] => {
  const text = `${place.name} ${place.context} ${place.frame}`.toLowerCase();
  const layers: MapLayer[] = [];
  if (/polity|kingdom|court|state|empire|capital|administr|district|sovereign/.test(text)) layers.push('Polities');
  if (/learn|school|education|language|liter|scholar|university|manuscript/.test(text)) layers.push('Learning');
  if (/sacred|temple|shrine|pilgr|buddh|jain|monast|sita|janaka/.test(text)) layers.push('Sacred');
  if (/trade|market|route|rail|port|merchant|commodity|crossing|traffic/.test(text)) layers.push('Trade');
  if (/archive|record|inscription|grant|plate|survey|report|contents|diagram/.test(text)) layers.push('Archives');
  return layers.length ? layers : ['Archives'];
};

type GraphType = 'People' | 'Texts' | 'Places' | 'Ideas';
type GraphNode = {
  id: string;
  label: string;
  type: GraphType;
  note: string;
  source: string;
  collectionKey: string;
};

const completeHistoryChapters = [
  ...researchData.political,
  ...researchData.social,
].filter((chapter) => chapter.status === 'Complete');

const graphNodes: GraphNode[] = [
  ...deepData.people.map((person) => ({
    id: `person-${person.id}`,
    label: person.name,
    type: 'People' as const,
    note: `${person.description} Field: ${person.field}. Era: ${person.era}.`,
    source: person.source,
    collectionKey: 'parallel-history',
  })),
  ...libraryData.map((work) => ({
    id: `text-${work.id}`,
    label: work.title,
    type: 'Texts' as const,
    note: `${work.description} ${work.structure.join(' ')}`,
    source: `${work.creator} · ${work.sequence} · ${work.extent}`,
    collectionKey: work.id,
  })),
  ...completeHistoryChapters.map((chapter) => ({
    id: `text-history-${chapter.id}`,
    label: `History chapter ${chapter.number}: ${chapter.title}`,
    type: 'Texts' as const,
    note: `${chapter.summary} ${chapter.sections.join(' ')}`,
    source: `${chapter.collection} · ${chapter.volume} · ${chapter.part} · ${chapter.pages}`,
    collectionKey: 'history',
  })),
  ...deepData.philosophyChapters.map((chapter) => ({
    id: `text-philosophy-${chapter.id}`,
    label: `Parallel Philosophy ${chapter.number}: ${chapter.title}`,
    type: 'Texts' as const,
    note: `${chapter.summary} Pūrvapakṣa: ${chapter.purvapaksha}. Uttarapakṣa: ${chapter.uttarapaksha}.`,
    source: `Gajendra Thakur’s Parallel Philosophy · ${chapter.part} · Chapter ${chapter.number}`,
    collectionKey: 'parallel-philosophy',
  })),
  ...volumeTwoIdeas.map((chapter) => ({
    id: `idea-v2-${chapter.id}`,
    label: `Parallel Philosophy II.${chapter.number}: ${chapter.title}`,
    type: 'Ideas' as const,
    note: chapter.summary,
    source: chapter.source,
    collectionKey: 'parallel-philosophy',
  })),
  ...learningData.panji.map((entry) => ({
    id: `text-panji-${entry.id}`,
    label: `${entry.volume}: ${entry.heading}`,
    type: 'Texts' as const,
    note: `${entry.context}. ${entry.canSupport}`,
    source: entry.source,
    collectionKey: `panji-${entry.volume.replace(/\D/g, '')}`,
  })),
  ...learningData.places.map((place) => ({
    id: `place-${place.id}`,
    label: place.name,
    type: 'Places' as const,
    note: `${place.context} ${place.frame} ${place.admin} ${place.countryCode}`,
    source: `${place.source} · GeoNames ${place.geonameId}`,
    collectionKey: 'history',
  })),
  ...learningData.comparators.map((idea) => ({
    id: `idea-${idea.id}`,
    label: idea.name,
    type: 'Ideas' as const,
    note: `${idea.question} Pūrvapakṣa: ${idea.purvapaksha}. Uttarapakṣa: ${idea.uttarapaksha}. ${idea.synthesis}`,
    source: idea.source,
    collectionKey: 'parallel-philosophy',
  })),
];

const graphStopWords = new Set([
  'across',
  'against',
  'about',
  'after',
  'also',
  'among',
  'because',
  'been',
  'before',
  'being',
  'between',
  'chapter',
  'contemporary',
  'could',
  'demonstrate',
  'development',
  'different',
  'evidence',
  'from',
  'however',
  'historical',
  'history',
  'indexed',
  'including',
  'into',
  'major',
  'many',
  'other',
  'mithila',
  'parallel',
  'source',
  'study',
  'system',
  'tradition',
  'their',
  'these',
  'this',
  'through',
  'under',
  'volume',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'with',
  'within',
  'would',
]);
const graphShortConcepts = new Set([
  'anga', 'bihar', 'caste', 'court', 'ganga', 'jaina', 'logic', 'nepal',
  'nyaya', 'panji', 'print', 'ritual', 'sacred', 'tarai', 'trade', 'vajji',
  'vedic', 'women',
]);

const graphTerms = (value: string) =>
  new Set(
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => (term.length > 5 || graphShortConcepts.has(term)) && !graphStopWords.has(term)),
  );

const graphNodeTerms = new globalThis.Map(
  graphNodes.map((node) => [node.id, graphTerms(`${node.label} ${node.note}`)]),
);

const graphCounts = Object.fromEntries(
  (['People', 'Texts', 'Places', 'Ideas'] as GraphType[]).map((type) => [
    type,
    graphNodes.filter((node) => node.type === type).length,
  ]),
) as Record<GraphType, number>;
const graphLetters = [...new Set(graphNodes.map((node) => node.label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase()))]
  .filter((letter) => /[A-Z]/.test(letter))
  .sort();

const graphEra = (node: GraphNode) => {
  const text = `${node.label} ${node.note} ${node.source}`.toLowerCase();
  if (/contemporary|twentieth|digital|modern/.test(text)) return 'Modern / contemporary';
  if (/colonial|company rule|british/.test(text)) return 'Colonial';
  if (/early.modern|mughal|oiniwar/.test(text)) return 'Early modern';
  if (/medieval|karnata|pāla|pala/.test(text)) return 'Medieval';
  if (/ancient|vedic|upanishad|buddh|jain|maurya|gupta/.test(text)) return 'Ancient';
  return 'Multi-period';
};
const graphRegion = (node: GraphNode) => {
  const text = `${node.label} ${node.note} ${node.source}`.toLowerCase();
  if (/nepal|janakpur|kathmandu|simraungadh|madhesh|tarai/.test(text)) return 'Nepal / borderland';
  if (/anga|champa|bhagalpur|munger/.test(text)) return 'Anga';
  if (/vajji|vaiśāl|vaishal|licchavi/.test(text)) return 'Vajji';
  if (/mithila|maithili|tirhut|darbhanga|videha/.test(text)) return 'Mithila';
  if (/india|bihar|ganga/.test(text)) return 'India / Ganga context';
  return 'Transregional';
};

const graphEras = [
  'Ancient',
  'Medieval',
  'Early modern',
  'Colonial',
  'Modern / contemporary',
  'Multi-period',
] as const;
const graphRegions = [
  'Mithila',
  'Vajji',
  'Anga',
  'Nepal / borderland',
  'India / Ganga context',
  'Transregional',
] as const;
const graphEraCounts = Object.fromEntries(
  graphEras.map((era) => [era, graphNodes.filter((node) => graphEra(node) === era).length]),
) as Record<(typeof graphEras)[number], number>;
const graphRegionCounts = Object.fromEntries(
  graphRegions.map((region) => [region, graphNodes.filter((node) => graphRegion(node) === region).length]),
) as Record<(typeof graphRegions)[number], number>;

const controlledRelationLabel = (
  selected: GraphNode,
  candidate: GraphNode,
  directCollection: boolean,
  sameCollection: boolean,
) => {
  if (directCollection) return 'catalogued in';
  if (sameCollection) {
    if (selected.collectionKey === 'parallel-history') return 'co-indexed in Parallel History';
    if (selected.collectionKey === 'parallel-philosophy') return 'co-indexed in Parallel Philosophy';
    if (selected.collectionKey.startsWith('panji-')) return 'co-indexed in the same Panji volume';
    return 'co-indexed in the same work';
  }
  const pair = new Set([selected.type, candidate.type]);
  if (pair.has('People') && pair.has('Texts')) return 'person–text connection';
  if (pair.has('People') && pair.has('Places')) return 'person–place connection';
  if (pair.has('People') && pair.has('Ideas')) return 'person–idea connection';
  if (pair.has('Texts') && pair.has('Places')) return 'text–place connection';
  if (pair.has('Texts') && pair.has('Ideas')) return 'text–idea connection';
  if (pair.has('Places') && pair.has('Ideas')) return 'place–idea connection';
  return `related ${candidate.type.toLowerCase()}`;
};

const devanagariToTirhuta: Record<string, string> = Object.fromEntries([
  ['अ', '𑒁'],
  ['आ', '𑒂'],
  ['इ', '𑒃'],
  ['ई', '𑒄'],
  ['उ', '𑒅'],
  ['ऊ', '𑒆'],
  ['ऋ', '𑒇'],
  ['ए', '𑒋'],
  ['ऐ', '𑒌'],
  ['ओ', '𑒍'],
  ['औ', '𑒎'],
  ['क', '𑒏'],
  ['ख', '𑒐'],
  ['ग', '𑒑'],
  ['घ', '𑒒'],
  ['ङ', '𑒓'],
  ['च', '𑒔'],
  ['छ', '𑒕'],
  ['ज', '𑒖'],
  ['झ', '𑒗'],
  ['ञ', '𑒘'],
  ['ट', '𑒙'],
  ['ठ', '𑒚'],
  ['ड', '𑒛'],
  ['ढ', '𑒜'],
  ['ण', '𑒝'],
  ['त', '𑒞'],
  ['थ', '𑒟'],
  ['द', '𑒠'],
  ['ध', '𑒡'],
  ['न', '𑒢'],
  ['प', '𑒣'],
  ['फ', '𑒤'],
  ['ब', '𑒥'],
  ['भ', '𑒦'],
  ['म', '𑒧'],
  ['य', '𑒨'],
  ['र', '𑒩'],
  ['ल', '𑒪'],
  ['व', '𑒫'],
  ['श', '𑒬'],
  ['ष', '𑒭'],
  ['स', '𑒮'],
  ['ह', '𑒯'],
  ['ा', '𑒰'],
  ['ि', '𑒱'],
  ['ी', '𑒲'],
  ['ु', '𑒳'],
  ['ू', '𑒴'],
  ['ृ', '𑒵'],
  ['े', '𑒹'],
  ['ै', '𑒻'],
  ['ो', '𑒼'],
  ['ौ', '𑒾'],
  ['ं', '𑓀'],
  ['ः', '𑓁'],
  ['्', '𑓂'],
  ['ँ', '𑒿'],
  ['।', '।'],
  ['़', '𑓃'],
  [' ', ' '],
  [',', ','],
  ['–', '–'],
  ['.', '.'],
]);

const _toTirhuta = (text: string) =>
  Array.from(text)
    .map((character) => devanagariToTirhuta[character] ?? character)
    .join('');

const sortedClassroomChronology = [...learningData.chronology].sort((a, b) => a.date - b.date);
const classroomTimeline = Array.from({ length: 12 }, (_, index) =>
  sortedClassroomChronology[Math.round((index * (sortedClassroomChronology.length - 1)) / 11)],
);
const classroomLessons = [
  { title: 'Read a dated claim', question: 'What does a date establish—and what remains uncertain?', method: 'Compare label, date wording, and cited source before treating an event as an anchor.', source: '160-entry source-controlled chronology' },
  { title: 'Map without inventing borders', question: 'How can places be mapped when territorial limits changed?', method: 'Separate modern coordinates from dated political, sacred, trade, learning, and archival evidence.', source: '120-place orientation gazetteer + eight dated anchors' },
  { title: 'Open Chapters 52–86', question: 'How does social and cultural history extend the political narrative?', method: 'Use the supplied chapter headings and section maps to move from chapter claim to internal evidence structure.', source: 'Three supplied cumulative Volume II manuscripts' },
  { title: 'Follow the linguistic turn', question: 'Why did twentieth-century philosophy place language at the centre?', method: 'Read the completed philosophy sequence, then distinguish it from the 75 ideas retained as future scope.', source: 'Gajendra Thakur’s Parallel Philosophy, Volumes I–II' },
  { title: 'Test a relation', question: 'Does a shared word prove a historical connection?', method: 'Use the graph as a discovery aid, then verify every inferred relation in the cited record.', source: 'People, texts, places, and ideas knowledge graph' },
  { title: 'Decode a Panji record', question: 'Which link is genealogical, marital, territorial, or remembered?', method: 'Track person, lineage, village, marriage, and maternal links without collapsing them into one relation.', source: 'Decoding the Panji of Mithila, Volumes I–VI' },
];

function matchingCovers(work: Work) {
  if (work.id.startsWith('panji-')) {
    const volume = `Volume ${['I', 'II', 'III', 'IV', 'V', 'VI'][Number(work.id.slice(-1)) - 1]}`;
    return coverData.filter(
      (cover) =>
        cover.title === 'Decoding the Panji of Mithila' &&
        cover.sequence === volume,
    );
  }
  if (work.id === 'parallel-history')
    return coverData.filter((cover) =>
      cover.title.startsWith('A Parallel History'),
    );
  if (work.id === 'parallel-philosophy')
    return coverData.filter((cover) =>
      cover.title.includes('Parallel Philosophy'),
    );
  return coverData.filter((cover) => cover.title === work.title);
}

export default function ResearchExpansion() {
  const [workId, setWorkId] = useState(libraryData[0].id);
  const [coverSide, setCoverSide] = useState(0);
  const [mapYear, setMapYear] = useState(-500);
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    'Polities',
    'Learning',
    'Sacred',
    'Trade',
    'Archives',
  ]);
  const [selectedPlace, setSelectedPlace] = useState('vaishali');
  const [selectedGeoPlace, setSelectedGeoPlace] = useState(geoPlaces[0].id);
  const [mapSearch, setMapSearch] = useState('');
  const [graphType, setGraphType] = useState('All');
  const [graphEraFilter, setGraphEraFilter] = useState('All eras');
  const [graphRegionFilter, setGraphRegionFilter] = useState('All regions');
  const [graphLetter, setGraphLetter] = useState('All letters');
  const [graphSearch, setGraphSearch] = useState('');
  const [graphVisibleCount, setGraphVisibleCount] = useState(48);
  const [selectedNode, setSelectedNode] = useState('person-figure-18');
  const [readingMode, setReadingMode] = useState<ReadingMode>('English');
  const [readerIndex, setReaderIndex] = useState(0);
  const [readerSearch, setReaderSearch] = useState('');
  const [readerCopied, setReaderCopied] = useState(false);
  const [narrating, setNarrating] = useState<number | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  const work = libraryData.find((item) => item.id === workId) ?? libraryData[0];
  const workCovers = matchingCovers(work);
  const activeCover = workCovers[coverSide] ?? workCovers[0] ?? coverData[0];
  const detail = (
    collectionDetailsData as Record<
      string,
      {
        paragraphs: number;
        tables: number;
        items: Array<{ level: number; title: string }>;
      }
    >
  )[work.id];
  const visiblePlaces = mapPlaces.filter(
    (place) =>
      place.from <= mapYear &&
      place.to >= mapYear &&
      place.layers.some((layer) => mapLayers.includes(layer)),
  );
  const place =
    mapPlaces.find((item) => item.id === selectedPlace) ??
    visiblePlaces[0] ??
    mapPlaces[0];
  const filteredGeoPlaces = geoPlaces.filter((item) =>
    geoPlaceLayers(item).some((layer) => mapLayers.includes(layer)) &&
    `${item.name} ${item.admin} ${item.countryCode} ${item.context}`
      .toLowerCase()
      .includes(mapSearch.toLowerCase()),
  );
  const geoPlace =
    filteredGeoPlaces.find((item) => item.id === selectedGeoPlace) ??
    filteredGeoPlaces[0] ?? geoPlaces[0];
  const filteredGraphNodes = useMemo(
    () =>
      graphNodes.filter(
        (node) =>
          (graphType === 'All' || node.type === graphType) &&
          (graphEraFilter === 'All eras' || graphEra(node) === graphEraFilter) &&
          (graphRegionFilter === 'All regions' || graphRegion(node) === graphRegionFilter) &&
          (graphLetter === 'All letters' || node.label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().startsWith(graphLetter)) &&
          `${node.label} ${node.note} ${node.source}`
            .toLowerCase()
            .includes(graphSearch.toLowerCase()),
      ),
    [graphType, graphSearch, graphEraFilter, graphRegionFilter, graphLetter],
  );
  const graphNode =
    graphNodes.find((node) => node.id === selectedNode) ?? graphNodes[0];
  const readerIdea = readerPassages[readerIndex] ?? readerPassages[0];
  const readerEnglishText = [
    readerIdea.title,
    readerIdea.summary,
    readerIdea.purvapaksha && `Pūrvapakṣa\n${readerIdea.purvapaksha}`,
    readerIdea.uttarapaksha && `Uttarapakṣa\n${readerIdea.uttarapaksha}`,
    readerIdea.synthesis && `Parallel conclusion\n${readerIdea.synthesis}`,
    readerIdea.sections?.length && `Chapter structure\n${readerIdea.sections.join('\n')}`,
  ].filter(Boolean).join('\n\n');
  const filteredReaderPassages = useMemo(
    () => readerPassages.filter((item) =>
      `${item.title} ${item.part} ${item.volume} ${item.summary} ${item.purvapaksha ?? ''} ${item.uttarapaksha ?? ''}`.toLowerCase().includes(readerSearch.toLowerCase())),
    [readerSearch],
  );
  const readerTranslation = readerMaithili[readerIdea.id] ?? '';

  useEffect(() => {
    queueMicrotask(() => setReaderCopied(false));
  }, [readingMode, readerIdea]);
  const relatedNodes = useMemo(() => {
    const selectedTerms = graphNodeTerms.get(graphNode.id) ?? new Set<string>();
    return graphNodes
      .filter((node) => node.id !== graphNode.id)
      .map((node) => {
        const terms = graphNodeTerms.get(node.id) ?? new Set<string>();
        const shared = [...selectedTerms]
          .filter((term) => terms.has(term))
          .sort((a, b) => b.length - a.length);
        const directCollection =
          node.id === `text-${graphNode.collectionKey}` ||
          graphNode.id === `text-${node.collectionKey}`;
        const sameCollection =
          graphNode.collectionKey === node.collectionKey &&
          graphNode.collectionKey !== 'history';
        const score =
          (directCollection ? 100 : 0) +
          (sameCollection ? 7 : 0) +
          shared.reduce((total, term) => total + Math.min(term.length, 12), 0) +
          (node.type !== graphNode.type ? 2 : 0);
        const relation = controlledRelationLabel(
          graphNode,
          node,
          directCollection,
          sameCollection,
        );
        const relationBasis = directCollection
          ? 'Direct catalogue relation'
          : sameCollection
            ? 'Shared source collection'
            : 'Index-derived thematic lead';
        return { node, relation, relationBasis, score, shared };
      })
      .filter(
        (item) =>
          item.score >= 7 && (item.shared.length > 0 || item.score >= 100),
      )
      .sort(
        (a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label),
      )
      .slice(0, 20);
  }, [graphNode]);
  const directoryNodes = filteredGraphNodes.slice(0, graphVisibleCount);
  const sceneNodes = [
    graphNode,
    ...relatedNodes.map((item) => item.node),
    ...directoryNodes.slice(0, 10),
  ]
    .filter(
      (node, index, nodes) =>
        nodes.findIndex((candidate) => candidate.id === node.id) === index,
    )
    .slice(0, 28);
  const scenePositions = new globalThis.Map(
    sceneNodes.map((node, index) => {
      if (index === 0) return [node.id, { x: 50, y: 47 }];
      const angle =
        ((index - 1) / Math.max(1, sceneNodes.length - 1)) * Math.PI * 2;
      const radiusX = index % 2 ? 39 : 29;
      const radiusY = index % 2 ? 37 : 27;
      return [
        node.id,
        {
          x: Number((50 + Math.cos(angle) * radiusX).toFixed(4)),
          y: Number((47 + Math.sin(angle) * radiusY).toFixed(4)),
        },
      ];
    }),
  );

  const selectWork = (id: string) => {
    setWorkId(id);
    setCoverSide(0);
    window.history.replaceState(null, '', `#book-${id}`);
  };
  const toggleLayer = (layer: MapLayer) =>
    setMapLayers((current) =>
      current.includes(layer)
        ? current.filter((item) => item !== layer)
        : [...current, layer],
    );
  const speakTimeline = (index: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (narrating === index) {
      setNarrating(null);
      return;
    }
    const item = classroomTimeline[index];
    const utterance = new SpeechSynthesisUtterance(
      `${item.displayDate}. ${item.label}. Source: ${item.source}`,
    );
    utterance.rate = 0.9;
    utterance.onend = () => setNarrating(null);
    setNarrating(index);
    window.speechSynthesis.speak(utterance);
  };
  const handleReaderTabKeys = (event: KeyboardEvent<HTMLButtonElement>, current: ReadingMode) => {
    const modes: ReadingMode[] = ['English', 'Maithili (Devanagari)', 'Maithili (Tirhuta)'];
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = modes.indexOf(current);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + modes.length) % modes.length;
    setReadingMode(modes[next]);
    requestAnimationFrame(() => document.getElementById(`reader-tab-${next}`)?.focus());
  };

  return (
    <section
      className="research-expansion"
      id="research-wing"
      aria-labelledby="research-wing-title"
    >
      <header className="wing-header">
        <p>SPECIALIST WORKSPACES BEHIND THE FOUR DOORS</p>
        <h2 id="research-wing-title">Go deeper after choosing a path</h2>
        <div
          className="wing-status"
          aria-label="Specialist archive workspaces"
        >
          {[
            'Book exhibitions',
            'Historical map',
            'Knowledge graph',
            'Script reader',
            'Videha classroom',
          ].map((label, index) => (
            <a href={`#wing-${index + 1}`} key={label}>
              <Check />{' '}
              <span>
                {index + 1}. {label}
              </span>
            </a>
          ))}
        </div>
      </header>

      <article className="wing-room exhibition-room" id="wing-1">
        <div className="room-heading">
          <span>01</span>
          <div>
            <p>BOOK EXHIBITIONS</p>
            <h3>Every volume opens as a research object</h3>
          </div>
        </div>
        <div className="exhibition-layout">
          <nav
            className="exhibition-index"
            aria-label="Choose a book exhibition"
          >
            {libraryData.map((item) => {
              const cover = matchingCovers(item)[0];
              return (
                <button
                  key={item.id}
                  className={item.id === work.id ? 'active' : ''}
                  onClick={() => selectWork(item.id)}
                >
                  {cover && (
                    <Image
                      unoptimized
                      src={cover.src}
                      width={cover.width}
                      height={cover.height}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  )}
                  <span>
                    <b>{item.sequence}</b>
                    <strong>{item.title}</strong>
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="exhibition-stage">
            <div className="exhibition-cover">
              <Image
                unoptimized
                src={activeCover.src}
                width={activeCover.width}
                height={activeCover.height}
                alt={`${work.title}, ${activeCover.side}`}
              />
              {workCovers.length > 1 && (
                <div className="cover-side-controls">
                  <button
                    aria-label="Previous side"
                    onClick={() =>
                      setCoverSide(
                        (coverSide - 1 + workCovers.length) % workCovers.length,
                      )
                    }
                  >
                    <ChevronLeft />
                  </button>
                  <span>{activeCover.side}</span>
                  <button
                    aria-label="Next side"
                    onClick={() =>
                      setCoverSide((coverSide + 1) % workCovers.length)
                    }
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
            <div className="exhibition-copy">
              <p className="room-kicker">
                {work.shelf} · {work.sequence}
              </p>
              <h4>{work.title}</h4>
              <p className="exhibition-subtitle">{work.subtitle}</p>
              <p>{work.description}</p>
              <dl>
                <div>
                  <dt>Creator</dt>
                  <dd>{work.creator}</dd>
                </div>
                <div>
                  <dt>Extent</dt>
                  <dd>{work.extent}</dd>
                </div>
                {detail && (
                  <>
                    <div>
                      <dt>Source paragraphs</dt>
                      <dd>{detail.paragraphs.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Tables</dt>
                      <dd>{detail.tables.toLocaleString()}</dd>
                    </div>
                  </>
                )}
              </dl>
              <h5>Research pathways</h5>
              <ol>
                {work.structure.map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ol>
              {detail && (
                <details>
                  <summary>
                    Open the manuscript map (
                    {detail.items.length.toLocaleString()} headings)
                  </summary>
                  <ul>
                    {detail.items.slice(0, 60).map((item, index) => (
                      <li
                        key={`${item.title}-${index}`}
                        className={`level-${item.level}`}
                      >
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      </article>

      <article className="wing-room map-room" id="wing-2">
        <div className="room-heading">
          <span>02</span>
          <div>
            <p>HISTORICAL MAP</p>
            <h3>{geoPlaces.length} sourced map places · period and evidence layers reshape the landscape</h3>
          </div>
        </div>
        <div className="map-controls-expanded">
          <label>
            <span>Historical year</span>
            <input
              type="range"
              min="-900"
              max="2026"
              step="25"
              value={mapYear}
              onChange={(event) => setMapYear(Number(event.target.value))}
            />
            <b>{mapYear < 0 ? `${Math.abs(mapYear)} BCE` : `${mapYear} CE`}</b>
          </label>
          <div aria-label="Map layers">
            {(
              [
                'Polities',
                'Learning',
                'Sacred',
                'Trade',
                'Archives',
              ] as MapLayer[]
            ).map((layer) => (
              <button
                key={layer}
                className={mapLayers.includes(layer) ? 'active' : ''}
                aria-pressed={mapLayers.includes(layer)}
                onClick={() => toggleLayer(layer)}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>
        <div className="expanded-map-layout">
          <div className="expanded-map">
            <Image
              unoptimized
              src="./assets/orientation-map-page.png"
              width={704}
              height={1080}
              alt="Modern orientation map of selected reference points in the Mithila, Vajji, and Anga study area"
            />
            <div className="map-context-banner" role="note" aria-label="Important map interpretation notice">
              <strong>Modern orientation—not a historical border map</strong>
              <span>Points locate present-day reference places. No ancient or medieval frontier is claimed.</span>
            </div>
            {visiblePlaces.map((item) => (
              <button
                key={item.id}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className={selectedPlace === item.id ? 'active' : ''}
                aria-label={`Open ${item.name}`}
                onClick={() => setSelectedPlace(item.id)}
              >
                <span></span>
                {item.name}
              </button>
            ))}
            {filteredGeoPlaces.map((item) => {
              const position = geoPosition(item.latitude, item.longitude);
              return (
                <button
                  key={`geo-${item.id}`}
                  className={`gazetteer-marker ${selectedGeoPlace === item.id ? 'active' : ''}`}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  title={`${item.name}, ${item.admin}`}
                  aria-label={`Open modern orientation record for ${item.name}`}
                  onClick={() => setSelectedGeoPlace(item.id)}
                ><span></span></button>
              );
            })}
          </div>
          <aside>
            <Map />
            <p>SELECTED MODERN ORIENTATION RECORD</p>
            <h4>{geoPlace.name}</h4>
            <p>{geoPlace.context}</p>
            <dl>
              <dt>Location</dt><dd>{geoPlace.admin} · {geoPlace.countryCode}</dd>
              <dt>Coordinates</dt><dd>{geoPlace.latitude.toFixed(4)}, {geoPlace.longitude.toFixed(4)}</dd>
              <dt>Source</dt><dd>{geoPlace.source}</dd>
            </dl>
            <strong>
              {geoPlaces.length} sourced place records · {visiblePlaces.length} historical anchors visible at the selected date
            </strong>
          </aside>
        </div>
        <div className="map-evidence-band">
          <div>
            <h4>Period-sensitive evidence anchors</h4>
            <p>The year control changes the dated historical anchors. Evidence-layer buttons filter both those anchors and the sourced gazetteer list below.</p>
          </div>
          <div>
            {visiblePlaces.map((item) => (
              <button key={item.id} className={selectedPlace === item.id ? 'active' : ''} onClick={() => setSelectedPlace(item.id)}>
                <b>{item.name}</b><span>{item.evidence}</span>
              </button>
            ))}
          </div>
          <aside><strong>{place.name}</strong><p>{place.note}</p><small>{place.layers.join(' · ')}</small></aside>
        </div>
        <div className="map-directory">
          <header><div><h4>Sourced place directory</h4><p>Search by place or source context; category filters are derived from terms in each cited passage.</p></div><output aria-live="polite">{filteredGeoPlaces.length} of {geoPlaces.length} places</output></header>
          <label><Search /><span className="sr-only">Filter the sourced place directory</span><input value={mapSearch} onChange={(event) => setMapSearch(event.target.value)} placeholder="Type a place, district, or source term" /></label>
          <div>{filteredGeoPlaces.map((item) => <button key={item.id} className={selectedGeoPlace === item.id ? 'active' : ''} onClick={() => setSelectedGeoPlace(item.id)}><b>{item.name}</b><small>{item.admin} · {item.countryCode}</small><span>{geoPlaceLayers(item).join(' · ')}</span></button>)}</div>
        </div>
      </article>

      <article className="wing-room graph-room" id="wing-3">
        <div className="room-heading">
          <span>03</span>
          <div>
            <p>KNOWLEDGE GRAPH</p>
            <h3>People, places, texts, and ideas become navigable relations</h3>
          </div>
        </div>
        <div className="graph-tools">
          <label>
            <Search />
            <span className="sr-only">Filter only the knowledge graph</span>
            <input
              value={graphSearch}
              onChange={(event) => {
                setGraphSearch(event.target.value);
                setGraphVisibleCount(48);
              }}
              placeholder="Filter this graph view"
            />
          </label>
          <div>
            {['All', 'People', 'Texts', 'Places', 'Ideas'].map((type) => (
              <button
                key={type}
                className={graphType === type ? 'active' : ''}
                aria-pressed={graphType === type}
                onClick={() => {
                  setGraphType(type);
                  setGraphVisibleCount(48);
                }}
              >
                {type}{' '}
                <b>
                  {type === 'All'
                    ? graphNodes.length
                    : graphCounts[type as GraphType]}
                </b>
              </button>
            ))}
          </div>
          <div className="graph-facets" aria-label="Knowledge graph facets">
            <label><span>Era</span><select value={graphEraFilter} onChange={(event) => { setGraphEraFilter(event.target.value); setGraphVisibleCount(48); }}><option>All eras</option>{graphEras.map((era) => <option key={era} value={era}>{era} ({graphEraCounts[era]})</option>)}</select></label>
            <label><span>Region</span><select value={graphRegionFilter} onChange={(event) => { setGraphRegionFilter(event.target.value); setGraphVisibleCount(48); }}><option>All regions</option>{graphRegions.map((region) => <option key={region} value={region}>{region} ({graphRegionCounts[region]})</option>)}</select></label>
            <label><span>Initial letter</span><select value={graphLetter} onChange={(event) => { setGraphLetter(event.target.value); setGraphVisibleCount(48); }}><option>All letters</option>{graphLetters.map((letter) => <option key={letter}>{letter}</option>)}</select></label>
          </div>
          <details className="graph-facet-key"><summary>Show all facet values and record counts</summary><div><p><strong>Era</strong>{graphEras.map((era) => <button key={era} onClick={() => { setGraphEraFilter(era); setGraphVisibleCount(48); }}>{era} <b>{graphEraCounts[era]}</b></button>)}</p><p><strong>Region</strong>{graphRegions.map((region) => <button key={region} onClick={() => { setGraphRegionFilter(region); setGraphVisibleCount(48); }}>{region} <b>{graphRegionCounts[region]}</b></button>)}</p></div></details>
        </div>
        <div className="graph-inventory" aria-label="Knowledge graph inventory">
          {(Object.keys(graphCounts) as GraphType[]).map((type) => (
            <button
              key={type}
              className={graphType === type ? 'active' : ''}
              aria-pressed={graphType === type}
              onClick={() => {
                setGraphType(type);
                setGraphVisibleCount(48);
              }}
            >
              <strong>{graphCounts[type]}</strong>
              <span>{type}</span>
            </button>
          ))}
          <output aria-live="polite">
            Showing {filteredGraphNodes.length} of {graphNodes.length} indexed
            records · era and region facets are derived from indexed descriptions
          </output>
        </div>
        <div className="graph-directory" aria-label="Searchable graph records">
          {directoryNodes.map((node) => (
            <button
              key={node.id}
              className={`${node.type.toLowerCase()} ${node.id === selectedNode ? 'selected' : ''}`}
              onClick={() => setSelectedNode(node.id)}
            >
              <small>{node.type}</small>
              <b>{node.label}</b>
            </button>
          ))}
        </div>
        <div className="graph-pagination graph-load-more">
          <progress value={directoryNodes.length} max={Math.max(1, filteredGraphNodes.length)} aria-label={`${directoryNodes.length} of ${filteredGraphNodes.length} graph records shown`} />
          <strong>Showing {directoryNodes.length} of {filteredGraphNodes.length}</strong>
          {directoryNodes.length < filteredGraphNodes.length && <button onClick={() => setGraphVisibleCount((count) => count + 48)}>Show 48 more <ChevronRight /></button>}
        </div>
        <div className="graph-layout">
          <div
            className="knowledge-graph"
            aria-label="Interactive research relationship graph"
          >
            <svg
              viewBox="0 0 100 92"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {relatedNodes.map(({ node }, index) => {
                const first = scenePositions.get(graphNode.id)!;
                const second = scenePositions.get(node.id);
                if (!second) return null;
                return (
                  <line
                    key={index}
                    x1={first.x}
                    y1={first.y}
                    x2={second.x}
                    y2={second.y}
                    className="active"
                  />
                );
              })}
            </svg>
            {sceneNodes.map((node) => {
              const position = scenePositions.get(node.id)!;
              return (
                <button
                  key={node.id}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  className={`${node.type.toLowerCase()} ${node.id === selectedNode ? 'selected' : ''}`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <span>{node.label}</span>
                  <small>{node.type}</small>
                </button>
              );
            })}
          </div>
          <aside>
            <GitFork />
            <p>{graphNode.type}</p>
            <h4>{graphNode.label}</h4>
            <p>{graphNode.note}</p>
            <dl>
              <dt>Source</dt>
              <dd>{graphNode.source}</dd>
              <dt>Relations shown</dt>
              <dd>{relatedNodes.length}</dd>
            </dl>
            <h5>Connected records</h5>
            {relatedNodes.length ? (
              <ul>
                {relatedNodes.map(({ relation, relationBasis, node }) => (
                  <li key={`${relation}-${node.id}`}>
                    <button onClick={() => setSelectedNode(node.id)}>
                      <span>{relation}</span>
                      <b>{node.label}</b>
                      <small>{relationBasis}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <small>
                No strong indexed-term relation was inferred. Search the full
                directory instead of inventing a connection.
              </small>
            )}
          </aside>
        </div>
      </article>

      <article className="wing-room reader-room" id="wing-4">
        <div className="room-heading">
          <span>04</span>
          <div>
            <p>MULTISCRIPT READER</p>
            <h3>{readerPassages.length} ideas · {readerCompleteCount} completed · {readerPlannedCount} planned for future supplied chapters</h3>
          </div>
        </div>
        <label className="reader-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search the Multiscript Reader</span>
          <input value={readerSearch} onChange={(event) => setReaderSearch(event.target.value)} placeholder="Search all 172 ideas…" />
        </label>
        <div className="reader-passages" aria-label="Choose a philosophy idea">
          {filteredReaderPassages.map((item) => {
            const index = readerPassages.findIndex((entry) => entry.id === item.id);
            return (
            <button key={item.id} className={readerIndex === index ? 'active' : ''} onClick={() => setReaderIndex(index)}>
              <span>{item.volume === 'Volume I' ? 'I' : 'II'}-{String(item.number).padStart(2, '0')}</span>
              <span className="reader-title">{item.title}<small>{item.status}</small></span>
            </button>
          )})}
        </div>
        <div className="reader-tabs" role="tablist" aria-label="Reading mode">
          {(
            ['English', 'Maithili (Devanagari)', 'Maithili (Tirhuta)'] as ReadingMode[]
          ).map((mode) => (
            <button
              key={mode}
              role="tab"
              id={`reader-tab-${['English', 'Maithili (Devanagari)', 'Maithili (Tirhuta)'].indexOf(mode)}`}
              tabIndex={readingMode === mode ? 0 : -1}
              aria-selected={readingMode === mode}
              aria-controls="reader-panel"
              className={readingMode === mode ? 'active' : ''}
              onClick={() => setReadingMode(mode)}
              onKeyDown={(event) => handleReaderTabKeys(event, mode)}
            >
              {mode}
            </button>
          ))}
        </div>
        <div
          className={`reader-page ${readingMode === 'Maithili (Tirhuta)' ? 'tirhuta' : ''}`}
          role="tabpanel"
          id="reader-panel"
          aria-labelledby={`reader-tab-${['English', 'Maithili (Devanagari)', 'Maithili (Tirhuta)'].indexOf(readingMode)}`}
          tabIndex={0}
        >
          <Languages />
          {readingMode === 'English' && (
            <>
              <p className="script-label">SUPPLIED ENGLISH READING</p>
              <h4>{readerIdea.title}</h4>
              <p>{readerIdea.summary}</p>
              {readerIdea.purvapaksha && <div className="reader-debate"><strong>Pūrvapakṣa</strong><p>{readerIdea.purvapaksha}</p></div>}
              {readerIdea.uttarapaksha && <div className="reader-debate"><strong>Uttarapakṣa</strong><p>{readerIdea.uttarapaksha}</p></div>}
              {readerIdea.synthesis && <div className="reader-debate"><strong>Parallel conclusion</strong><p>{readerIdea.synthesis}</p></div>}
              {!!readerIdea.sections?.length && <details className="reader-structure"><summary>Chapter structure</summary><ol>{readerIdea.sections.map((section) => <li key={section}>{section}</li>)}</ol></details>}
              <small>{readerIdea.volume} · Chapter {readerIdea.number} · {readerIdea.source}</small>
            </>
          )}
          {readingMode !== 'English' && readerIdea.status === 'Planned' && (
            <div className="reader-notice"><p className="script-label">PLANNED</p><h4>{readerIdea.title}</h4><p>No completed English chapter is claimed. When the chapter is supplied, this same record will receive its Google Maithili translation and Tirhuta conversion.</p></div>
          )}
          {readingMode !== 'English' && readerIdea.status !== 'Planned' && !readerTranslation && <p className="reader-notice">The maintained Maithili reading is not yet available for this chapter.</p>}
          {readingMode === 'Maithili (Devanagari)' && readerTranslation && (
            <><p className="script-label">GOOGLE TRANSLATE · ENGLISH → MAITHILI</p><p lang="mai">{readerTranslation}</p><small>Machine translation prepared for reliable offline reading; scholarly review is recommended.</small></>
          )}
          {readingMode === 'Maithili (Tirhuta)' && readerTranslation && (
            <><p className="script-label">VIDEHA CONVERTER · MAITHILI DEVANAGARI → TIRHUTA</p><p className="tirhuta-text" lang="mai-Tirh">{_toTirhuta(readerTranslation)}</p><small>Converted from the Google Maithili result. Unicode Tirhuta rendering depends on font support.</small></>
          )}
          {(readingMode === 'English' || readerTranslation) && (
            <button className="reader-copy" onClick={async () => { const text = readingMode === 'English' ? readerEnglishText : readingMode === 'Maithili (Tirhuta)' ? _toTirhuta(readerTranslation) : readerTranslation; await navigator.clipboard.writeText(text); setReaderCopied(true); }}><Copy /> {readerCopied ? 'Copied' : 'Copy passage'}</button>
          )}
        </div>
        <div className="reader-pagination">
          <button disabled={readerIndex === 0} onClick={() => setReaderIndex(readerIndex - 1)}><ChevronLeft /> Previous</button>
          <strong>{readerIndex + 1} / {readerPassages.length}</strong>
          <button disabled={readerIndex === readerPassages.length - 1} onClick={() => setReaderIndex(readerIndex + 1)}>Next <ChevronRight /></button>
        </div>
      </article>

      <article className="wing-room classroom-room" id="wing-5">
        <div className="room-heading">
          <span>05</span>
          <div>
            <p>VIDEHA CLASSROOM</p>
            <h3>Illustration, research diagram, narration, and presentation</h3>
          </div>
        </div>
        <figure className="classroom-panorama">
          <Image
            unoptimized
            src="./assets/videha-classroom-panorama.webp"
            width={1680}
            height={945}
            alt="Illustrated sequence showing Panji study, philosophical debate, the India–Nepal landscape, and Maithili translation"
          />
          <figcaption>
            Four linked practices: decoding lineage, testing arguments, locating
            histories, and translating texts.
          </figcaption>
        </figure>
        <div className="classroom-lessons">
          <nav aria-label="Choose a source-based lesson">
            {classroomLessons.map((lesson, index) => <button key={lesson.title} className={lessonIndex === index ? 'active' : ''} onClick={() => setLessonIndex(index)}><span>{String(index + 1).padStart(2, '0')}</span>{lesson.title}</button>)}
          </nav>
          <article>
            <p>SEMINAR QUESTION</p>
            <h4>{classroomLessons[lessonIndex].question}</h4>
            <p>{classroomLessons[lessonIndex].method}</p>
            <small>Source base: {classroomLessons[lessonIndex].source}</small>
          </article>
        </div>
        <div className="classroom-grid">
          <div className="research-cycle">
            <h4>Research cycle</h4>
            <div>
              {[
                'Source',
                'Context',
                'Pūrvapakṣa',
                'Uttarapakṣa',
                'Cited synthesis',
              ].map((step, index) => (
                <span key={step}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  {step}
                </span>
              ))}
            </div>
            <p>
              Every conclusion returns to its source and remains open to
              revision.
            </p>
          </div>
          <div className="narrated-timeline">
            <h4>Narrated chronology</h4>
            {classroomTimeline.map((item, index) => (
              <article
                key={`${item.id}-${index}`}
                className={narrating === index ? 'playing' : ''}
              >
                <button
                  aria-label={`${narrating === index ? 'Stop' : 'Listen to'} ${item.label}`}
                  onClick={() => speakTimeline(index)}
                >
                  {narrating === index ? <Pause /> : <Volume2 />}
                </button>
                <div>
                  <span>{item.displayDate}</span>
                  <h5>{item.label}</h5>
                  <a className="source-citation" href={`./sources/index.html#record-${item.id}`}>{item.source}</a>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="classroom-download">
          <div>
            <Sparkles />
            <p>DOWNLOADABLE SEMINAR DECK</p>
            <h4>Mithila–Vajji–Anga: Five Ways into the Archive</h4>
            <span>
              An editable presentation for lectures, seminars, and independent
              study.
            </span>
          </div>
          <a
            href="./downloads/mithila-vajji-anga-videha-classroom-expanded.pptx"
            download
          >
            <Download /> Download PowerPoint
          </a>
        </div>
      </article>
    </section>
  );
}
