'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Check,
  ChevronLeft,
  ChevronRight,
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

type Work = (typeof libraryData)[number];
type MapLayer = 'Polities' | 'Learning' | 'Sacred' | 'Trade' | 'Archives';
type ReadingMode = 'English' | 'Maithili' | 'Devanagari' | 'Tirhuta';

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

const graphNodes = [
  {
    id: 'janaka',
    label: 'Janaka',
    type: 'People',
    x: 10,
    y: 16,
    note: 'Royal interlocutor in Videha traditions of philosophical assembly.',
  },
  {
    id: 'yajnavalkya',
    label: 'Yājñavalkya',
    type: 'People',
    x: 30,
    y: 8,
    note: 'Philosopher associated with the Bṛhadāraṇyaka Upaniṣad.',
  },
  {
    id: 'gargi',
    label: 'Gārgī',
    type: 'People',
    x: 48,
    y: 18,
    note: 'Interlocutor remembered for cosmological questioning.',
  },
  {
    id: 'vacaspati',
    label: 'Vācaspati Miśra',
    type: 'People',
    x: 72,
    y: 9,
    note: 'Mithila-linked philosopher and author of the Bhāmatī.',
  },
  {
    id: 'udayana',
    label: 'Udayanācārya',
    type: 'People',
    x: 90,
    y: 20,
    note: 'Nyāya thinker associated with Ātmatattvaviveka and Nyāyakusumāñjali.',
  },
  {
    id: 'brihad',
    label: 'Bṛhadāraṇyaka',
    type: 'Texts',
    x: 21,
    y: 34,
    note: 'An Upaniṣadic arena for questions about self, knowledge, and reality.',
  },
  {
    id: 'bhamati',
    label: 'Bhāmatī',
    type: 'Texts',
    x: 67,
    y: 34,
    note: 'A commentary central to the Bhāmatī tradition of Advaita.',
  },
  {
    id: 'nyayakusuma',
    label: 'Nyāyakusumāñjali',
    type: 'Texts',
    x: 88,
    y: 42,
    note: 'Udayana’s structured Nyāya arguments, translated into Maithili.',
  },
  {
    id: 'mithila',
    label: 'Mithila',
    type: 'Places',
    x: 38,
    y: 53,
    note: 'A historical region whose names and boundaries change across periods.',
  },
  {
    id: 'vaishali',
    label: 'Vaiśālī',
    type: 'Places',
    x: 12,
    y: 60,
    note: 'A Vajjian political and sacred centre.',
  },
  {
    id: 'champa',
    label: 'Campā',
    type: 'Places',
    x: 86,
    y: 64,
    note: 'A major Anga centre within eastern routes and traditions.',
  },
  {
    id: 'pramana',
    label: 'Pramāṇa',
    type: 'Ideas',
    x: 54,
    y: 46,
    note: 'Methods and warrants through which knowledge becomes justified.',
  },
  {
    id: 'debate',
    label: 'Pūrvapakṣa / Uttara',
    type: 'Ideas',
    x: 63,
    y: 63,
    note: 'An objection-and-response architecture for disciplined inquiry.',
  },
  {
    id: 'panji',
    label: 'Panji archive',
    type: 'Texts',
    x: 29,
    y: 70,
    note: 'Genealogical records connecting descent, marriage, titles, and villages.',
  },
  {
    id: 'maithili',
    label: 'Maithili',
    type: 'Ideas',
    x: 48,
    y: 82,
    note: 'A living language of literature, philosophy, translation, and public culture.',
  },
  {
    id: 'gajendra',
    label: 'Gajendra Thakur',
    type: 'People',
    x: 70,
    y: 83,
    note: 'Editor, translator, and author building the cumulative Videha research ecosystem.',
  },
] as const;

const graphEdges: Array<[string, string, string]> = [
  ['janaka', 'yajnavalkya', 'dialogue'],
  ['janaka', 'gargi', 'assembly'],
  ['yajnavalkya', 'brihad', 'text'],
  ['gargi', 'brihad', 'text'],
  ['vacaspati', 'bhamati', 'authorship'],
  ['udayana', 'nyayakusuma', 'authorship'],
  ['bhamati', 'pramana', 'argument'],
  ['nyayakusuma', 'pramana', 'argument'],
  ['mithila', 'janaka', 'memory'],
  ['mithila', 'vacaspati', 'scholastic tradition'],
  ['mithila', 'panji', 'archive'],
  ['vaishali', 'mithila', 'regional network'],
  ['champa', 'mithila', 'regional network'],
  ['pramana', 'debate', 'method'],
  ['panji', 'maithili', 'language'],
  ['maithili', 'gajendra', 'editorial work'],
  ['gajendra', 'bhamati', 'translation'],
  ['gajendra', 'nyayakusuma', 'translation'],
  ['gajendra', 'panji', 'decoding'],
  ['gajendra', 'debate', 'parallel philosophy'],
];

const maithiliPassage =
  'विदेह प्रश्न, वाद-विवाद आ ज्ञानक भूमि रहल अछि। मिथिलाक पञ्जी परिवार, गाम आ स्मृतिक सम्बन्ध सुरक्षित रखैत अछि। संस्कृत ग्रन्थक मैथिली अनुवाद पुरान विचारकेँ जीवित संवादमे आनैत अछि।';

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

const toTirhuta = (text: string) =>
  Array.from(text)
    .map((character) => devanagariToTirhuta[character] ?? character)
    .join('');

const classroomTimeline = [
  {
    date: 'Later Vedic horizon',
    title: 'Janaka’s court',
    text: 'The Upanishadic tradition remembers Videha as a place where rulers and scholars test claims through questions.',
  },
  {
    date: 'Sixth–fifth centuries BCE',
    title: 'Vajji and Anga',
    text: 'Political communities, trade routes, and renunciant traditions connect Vaishali, Mithila, and Champa.',
  },
  {
    date: 'Medieval centuries',
    title: 'Scholastic Mithila',
    text: 'Commentary, logic, ritual learning, and manuscript culture develop through teachers and institutions.',
  },
  {
    date: 'Long duration',
    title: 'The Panji archive',
    text: 'Genealogical records preserve relationships among lineages, marriages, settlements, titles, and remembered events.',
  },
  {
    date: 'Modern Videha',
    title: 'Translation and digital research',
    text: 'Maithili editions and cumulative volumes place inherited texts into contemporary public scholarship.',
  },
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
  const [graphType, setGraphType] = useState('All');
  const [graphSearch, setGraphSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState('mithila');
  const [readingMode, setReadingMode] = useState<ReadingMode>('English');
  const [narrating, setNarrating] = useState<number | null>(null);

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
  const graphNode =
    graphNodes.find((node) => node.id === selectedNode) ?? graphNodes[0];
  const relatedNodes = graphEdges
    .filter(([a, b]) => a === graphNode.id || b === graphNode.id)
    .map(([a, b, relation]) => ({
      relation,
      node: graphNodes.find(
        (node) => node.id === (a === graphNode.id ? b : a),
      )!,
    }));
  const visibleNodeIds = useMemo(
    () =>
      new Set(
        graphNodes
          .filter((node) => graphType === 'All' || node.type === graphType)
          .filter((node) =>
            `${node.label} ${node.note}`
              .toLowerCase()
              .includes(graphSearch.toLowerCase()),
          )
          .map((node) => node.id),
      ),
    [graphType, graphSearch],
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
      `${item.date}. ${item.title}. ${item.text}`,
    );
    utterance.rate = 0.9;
    utterance.onend = () => setNarrating(null);
    setNarrating(index);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section
      className="research-expansion"
      id="research-wing"
      aria-labelledby="research-wing-title"
    >
      <header className="wing-header">
        <p>FIVE CONNECTED RESEARCH ROOMS</p>
        <h2 id="research-wing-title">The expanded Videha research wing</h2>
        <div
          className="wing-status"
          aria-label="Five completed site improvements"
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
            <h3>Period and evidence layers reshape the landscape</h3>
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
            <small>
              Modern reference points only. No ancient or medieval frontier is
              implied.
            </small>
          </div>
          <aside>
            <Map />
            <p>{place.layers.join(' · ')}</p>
            <h4>{place.name}</h4>
            <p>{place.note}</p>
            <dl>
              <dt>Visible range</dt>
              <dd>
                {place.from < 0
                  ? `${Math.abs(place.from)} BCE`
                  : `${place.from} CE`}{' '}
                – {place.to} CE
              </dd>
              <dt>Evidence frame</dt>
              <dd>{place.evidence}</dd>
            </dl>
            <strong>
              {visiblePlaces.length} places visible at the selected date
            </strong>
          </aside>
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
            <span className="sr-only">Search the knowledge graph</span>
            <input
              value={graphSearch}
              onChange={(event) => setGraphSearch(event.target.value)}
              placeholder="Find a person, text, place, or idea"
            />
          </label>
          <div>
            {['All', 'People', 'Texts', 'Places', 'Ideas'].map((type) => (
              <button
                key={type}
                className={graphType === type ? 'active' : ''}
                onClick={() => setGraphType(type)}
              >
                {type}
              </button>
            ))}
          </div>
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
              {graphEdges.map(([a, b], index) => {
                const first = graphNodes.find((node) => node.id === a)!;
                const second = graphNodes.find((node) => node.id === b)!;
                const related = a === selectedNode || b === selectedNode;
                return (
                  <line
                    key={index}
                    x1={first.x}
                    y1={first.y}
                    x2={second.x}
                    y2={second.y}
                    className={related ? 'active' : ''}
                  />
                );
              })}
            </svg>
            {graphNodes.map((node) => (
              <button
                key={node.id}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className={`${node.type.toLowerCase()} ${node.id === selectedNode ? 'selected' : ''} ${visibleNodeIds.has(node.id) ? '' : 'dim'}`}
                onClick={() => setSelectedNode(node.id)}
              >
                <span>{node.label}</span>
                <small>{node.type}</small>
              </button>
            ))}
          </div>
          <aside>
            <GitFork />
            <p>{graphNode.type}</p>
            <h4>{graphNode.label}</h4>
            <p>{graphNode.note}</p>
            <h5>Connected records</h5>
            <ul>
              {relatedNodes.map(({ relation, node }) => (
                <li key={`${relation}-${node.id}`}>
                  <button onClick={() => setSelectedNode(node.id)}>
                    <span>{relation}</span>
                    <b>{node.label}</b>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </article>

      <article className="wing-room reader-room" id="wing-4">
        <div className="room-heading">
          <span>04</span>
          <div>
            <p>MULTISCRIPT READER</p>
            <h3>One research passage across language and script modes</h3>
          </div>
        </div>
        <div className="reader-tabs" role="tablist" aria-label="Reading mode">
          {(
            ['English', 'Maithili', 'Devanagari', 'Tirhuta'] as ReadingMode[]
          ).map((mode) => (
            <button
              key={mode}
              role="tab"
              aria-selected={readingMode === mode}
              className={readingMode === mode ? 'active' : ''}
              onClick={() => setReadingMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
        <div
          className={`reader-page ${readingMode.toLowerCase()}`}
          role="tabpanel"
        >
          <Languages />
          {readingMode === 'English' && (
            <>
              <p className="script-label">ENGLISH TRANSLATION</p>
              <h4>Videha as a region of questions</h4>
              <p>
                Videha has remained a region of questions, debate, and
                knowledge. Mithila’s Panji records preserve relationships among
                families, villages, and memory. Maithili translations of
                Sanskrit works bring inherited arguments into living
                conversation.
              </p>
            </>
          )}
          {readingMode === 'Maithili' && (
            <>
              <p className="script-label">मैथिली</p>
              <h4>प्रश्नक भूमि विदेह</h4>
              <p lang="mai">{maithiliPassage}</p>
            </>
          )}
          {readingMode === 'Devanagari' && (
            <>
              <p className="script-label">देवनागरी READING AID</p>
              <h4 lang="mai">विदेह · मिथिला · पञ्जी · प्रमाण</h4>
              <p lang="mai">{maithiliPassage}</p>
              <div className="word-gloss">
                <span>
                  <b>विदेह</b> Videha
                </span>
                <span>
                  <b>पञ्जी</b> genealogy register
                </span>
                <span>
                  <b>प्रमाण</b> warrant of knowledge
                </span>
                <span>
                  <b>संवाद</b> dialogue
                </span>
              </div>
            </>
          )}
          {readingMode === 'Tirhuta' && (
            <>
              <p className="script-label">TIRHUTA / MITHILĀKṢARA</p>
              <h4 lang="mai-Tirh">
                {toTirhuta('विदेह · मिथिला · पञ्जी · प्रमाण')}
              </h4>
              <p className="tirhuta-text" lang="mai-Tirh">
                {toTirhuta(maithiliPassage)}
              </p>
              <small>
                Unicode Tirhuta rendering depends on the reader’s installed
                script font. The Devanagari mode remains available as a parallel
                reading aid.
              </small>
            </>
          )}
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
                key={item.title}
                className={narrating === index ? 'playing' : ''}
              >
                <button
                  aria-label={`${narrating === index ? 'Stop' : 'Listen to'} ${item.title}`}
                  onClick={() => speakTimeline(index)}
                >
                  {narrating === index ? <Pause /> : <Volume2 />}
                </button>
                <div>
                  <span>{item.date}</span>
                  <h5>{item.title}</h5>
                  <p>{item.text}</p>
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
            href="./downloads/mithila-vajji-anga-videha-classroom.pptx"
            download
          >
            <Download /> Download PowerPoint
          </a>
        </div>
      </article>
    </section>
  );
}
