'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Download,
  Footprints,
  GitCompareArrows,
  MapPinned,
  NotebookPen,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import researchData from './research-data.json';
import libraryData from './library-data.json';
import deepData from './deep-data.json';

type ActivityId =
  | 'archive'
  | 'detective'
  | 'debate'
  | 'journey'
  | 'notebook'
  | 'identity'
  | 'chronology'
  | 'panji'
  | 'comparator'
  | 'architecture'
  | 'daily'
  | 'classification';

type NotebookEntry = {
  id: string;
  title: string;
  body: string;
  source: string;
  created: string;
};

type DailyProgress = {
  lastDay: string;
  streak: number;
};

type ArchiveRecord = {
  id: string;
  kind: string;
  title: string;
  text: string;
  source: string;
};

const activities: Array<{
  id: ActivityId;
  number: number;
  label: string;
  note: string;
  core?: boolean;
}> = [
  {
    id: 'archive',
    number: 1,
    label: 'Ask the Archive',
    note: 'Grounded answers from indexed records',
    core: true,
  },
  {
    id: 'detective',
    number: 2,
    label: 'Source Detective',
    note: 'Match claims to usable evidence',
    core: true,
  },
  {
    id: 'debate',
    number: 3,
    label: 'Pūrvapakṣa Debate',
    note: 'Build and test an objection',
    core: true,
  },
  {
    id: 'journey',
    number: 4,
    label: 'Map Journey',
    note: 'Travel a narrated historical route',
    core: true,
  },
  {
    id: 'notebook',
    number: 5,
    label: 'Research Notebook',
    note: 'Save and export research notes',
    core: true,
  },
  {
    id: 'identity',
    number: 6,
    label: 'Who am I?',
    note: 'Identify historical figures from clues',
  },
  {
    id: 'chronology',
    number: 7,
    label: 'Build a Chronology',
    note: 'Arrange evidence horizons in order',
  },
  {
    id: 'panji',
    number: 8,
    label: 'Panji Laboratory',
    note: 'Decode a fictional practice record',
  },
  {
    id: 'comparator',
    number: 9,
    label: 'Concept Comparator',
    note: 'Compare methods and questions',
  },
  {
    id: 'architecture',
    number: 10,
    label: 'Architecture Viewer',
    note: 'Read structural layers and cautions',
  },
  {
    id: 'daily',
    number: 11,
    label: 'Daily Challenge',
    note: 'One rotating question each day',
  },
  {
    id: 'classification',
    number: 12,
    label: 'Memory or Evidence?',
    note: 'Classify the basis of a statement',
  },
];

const archiveRecords: ArchiveRecord[] = [
  ...researchData.political.map((chapter) => ({
    id: chapter.id,
    kind: 'History chapter',
    title: chapter.title,
    text: `${chapter.summary} ${chapter.sections.join(' ')}`,
    source: `${chapter.collection} · ${chapter.volume} · ${chapter.part} · ${chapter.pages}`,
  })),
  ...researchData.social.map((chapter) => ({
    id: chapter.id,
    kind: 'History chapter',
    title: chapter.title,
    text: `${chapter.summary} ${chapter.sections.join(' ')}`,
    source: `${chapter.collection} · ${chapter.volume} · ${chapter.part} · ${chapter.pages}`,
  })),
  ...libraryData.map((work) => ({
    id: work.id,
    kind: 'Book',
    title: work.title,
    text: `${work.description} ${work.structure.join(' ')}`,
    source: `${work.creator} · ${work.sequence} · ${work.extent}`,
  })),
  ...deepData.people.map((person) => ({
    id: person.id,
    kind: 'Person',
    title: person.name,
    text: `${person.description} ${person.field} ${person.era}`,
    source: person.source,
  })),
  ...deepData.philosophyChapters.map((chapter) => ({
    id: chapter.id,
    kind: 'Philosophy chapter',
    title: chapter.title,
    text: `${chapter.summary} Pūrvapakṣa: ${chapter.purvapaksha}. Uttarapakṣa: ${chapter.uttarapaksha}. ${chapter.synthesis}`,
    source: `Parallel Philosophy · ${chapter.part} · Chapter ${chapter.number}`,
  })),
];

const detectiveQuestions = [
  {
    claim:
      'An inscription records that a named donor supported a monument at a specific place.',
    answer: 'Inscription',
    options: [
      'Later legend',
      'Inscription',
      'Modern boundary map',
      'Genealogical analogy',
    ],
    why: 'An inscription can directly support the recorded name, act, and location, while interpretation still requires date and context.',
  },
  {
    claim:
      'A settlement contained brick structures during a securely excavated occupational phase.',
    answer: 'Archaeology',
    options: [
      'Archaeology',
      'Epic memory',
      'Modern census',
      'Philosophical commentary',
    ],
    why: 'Stratified excavation and material analysis can support the presence and phase of structures.',
  },
  {
    claim:
      'A Panji entry connects a lineage, marriage link, title, and village notation.',
    answer: 'Panji manuscript',
    options: [
      'Temple reconstruction',
      'Panji manuscript',
      'Royal eulogy alone',
      'Present-day map',
    ],
    why: 'The manuscript entry is the direct source for its own recorded relationship, though it does not automatically prove every remembered event.',
  },
  {
    claim:
      'A community presently performs a ritual associated with Sita and Janakpur.',
    answer: 'Living tradition',
    options: [
      'Living tradition',
      'Coins alone',
      'Grammar treatise',
      'Carbon date alone',
    ],
    why: 'Observation and documentation of living practice support the present ritual, not the absolute antiquity claimed for it.',
  },
  {
    claim:
      'Vaiśālī appears in Buddhist itineraries as a place connected with teaching and community memory.',
    answer: 'Textual tradition',
    options: [
      'Textual tradition',
      'Modern state border',
      'Architectural drawing',
      'Family tree',
    ],
    why: 'The textual tradition supports its own remembered itinerary; archaeology answers different questions.',
  },
];

const debateCases = [
  {
    topic: 'Can a later literary memory serve historical research?',
    objection: 'Later texts cannot provide any historical evidence.',
    proof:
      'Date the textual layers and compare them with independent material and textual evidence.',
    response:
      'Use the text as evidence for remembered geography and ideas while avoiding automatic conversion into event chronology.',
    weak: [
      'Assume every detail is literal history.',
      'Reject the text because it contains poetry.',
      'Use modern boundaries to settle the question.',
    ],
  },
  {
    topic: 'Can Panji records illuminate social history?',
    objection: 'Genealogies only list names and cannot reveal institutions.',
    proof:
      'Compare recurring formulas, marriage links, titles, villages, and editorial layers across entries.',
    response:
      'Patterns can illuminate recorded social organization, provided silence and inherited hierarchy remain visible.',
    weak: [
      'Treat every omission as proof.',
      'Convert lineage into biological certainty.',
      'Ignore the manuscript’s editorial history.',
    ],
  },
  {
    topic: 'Does translation preserve philosophical argument?',
    objection: 'Technical philosophy loses all precision outside Sanskrit.',
    proof:
      'Compare key terms, inferential structure, commentary, gloss, and disputed renderings passage by passage.',
    response:
      'A documented translation can preserve argument while exposing places where Maithili requires explanation or a retained technical term.',
    weak: [
      'Replace every technical term with a slogan.',
      'Hide uncertain choices.',
      'Translate from a summary instead of the source.',
    ],
  },
];

const journeyStops = [
  {
    name: 'Janakpur',
    x: 47,
    y: 15,
    frame: 'Videha memory and living sacred geography',
    narration:
      'Begin at Janakpur, where textual memory, pilgrimage, and modern cultural life meet across the India–Nepal region.',
    question: 'Which caution best governs this stop?',
    options: [
      'A living tradition proves an exact ancient date',
      'Textual memory and living practice answer different historical questions',
      'Modern borders define ancient Videha',
    ],
    correct: 1,
  },
  {
    name: 'Simraungadh',
    x: 31,
    y: 28,
    frame: 'Karnata polity and the Nepal Tarai',
    narration:
      'Move west to Simraungadh, a medieval political centre whose archaeology and dynastic history connect Mithila with the Tarai.',
    question: 'Which evidence is most relevant to its political history?',
    options: [
      'Dynastic records and archaeology',
      'A modern language survey alone',
      'A fictional genealogy',
    ],
    correct: 0,
  },
  {
    name: 'Darbhanga',
    x: 45,
    y: 43,
    frame: 'Court, manuscripts, print, and learning',
    narration:
      'Darbhanga represents later courtly institutions, manuscript preservation, scholarship, and the transformation of learning through print.',
    question: 'Which process belongs here?',
    options: [
      'Only prehistoric settlement',
      'Courtly and print-era archival formation',
      'A single unchanging boundary',
    ],
    correct: 1,
  },
  {
    name: 'Vaiśālī',
    x: 25,
    y: 57,
    frame: 'Vajjian polity and sacred itineraries',
    narration:
      'At Vaiśālī, political traditions intersect with Buddhist and Jain itineraries and an archaeological landscape.',
    question: 'Why combine texts and archaeology?',
    options: [
      'They are identical forms of proof',
      'Each can test different aspects of the historical reconstruction',
      'One makes the other unnecessary',
    ],
    correct: 1,
  },
  {
    name: 'Pāṭaliputra',
    x: 33,
    y: 72,
    frame: 'Imperial and commercial corridor',
    narration:
      'Pāṭaliputra links these regions to middle Ganga political power, mobility, exchange, and administrative history.',
    question: 'What does a route demonstrate most securely?',
    options: [
      'A permanent cultural border',
      'Connectivity and movement',
      'The date of every tradition',
    ],
    correct: 1,
  },
  {
    name: 'Campā',
    x: 78,
    y: 82,
    frame: 'Anga, trade, and religious networks',
    narration:
      'The journey concludes at Campā in Anga, an eastern centre tied to political memory, trade, Buddhist traditions, and Jain traditions.',
    question: 'Which description is most careful?',
    options: [
      'Campā belongs to several intersecting historical networks',
      'Campā had only one historical role',
      'No source criticism is needed',
    ],
    correct: 0,
  },
];

const identityFigures = [
  {
    name: 'Gārgī Vācaknavī',
    clues: [
      'I appear in a remembered philosophical assembly.',
      'My questions press toward the structure underlying the world.',
      'I debate Yājñavalkya in an Upaniṣadic tradition.',
    ],
    choices: ['Gārgī Vācaknavī', 'Vidyāpati', 'Gaṅgeśa Upādhyāya', 'Faxian'],
  },
  {
    name: 'Vācaspati Miśra',
    clues: [
      'I belong to Mithila’s scholastic memory.',
      'My works range across more than one philosophical school.',
      'Bhāmatī is associated with my commentary.',
    ],
    choices: ['Udayanācārya', 'Vācaspati Miśra', 'Janaka', 'Mahāvīra'],
  },
  {
    name: 'Gaṅgeśa Upādhyāya',
    clues: [
      'I am central to Navya-Nyāya.',
      'My work reorganizes epistemological analysis.',
      'Tattvacintāmaṇi is attributed to me.',
    ],
    choices: ['Gaṅgeśa Upādhyāya', 'Yājñavalkya', 'Aśoka', 'Jyotirishwar'],
  },
  {
    name: 'Vidyāpati',
    clues: [
      'I am remembered across literary, courtly, and devotional contexts.',
      'My language history reaches Maithili and Brajabuli discussions.',
      'Songs associated with my name travelled far beyond Mithila.',
    ],
    choices: ['Gārgī Vācaknavī', 'Vidyāpati', 'Vācaspati Miśra', 'Buddha'],
  },
];

const chronologyItems = [
  { id: 'vedic', date: -800, label: 'Later Vedic Videha traditions' },
  { id: 'vajji', date: -500, label: 'Vajji, Anga, and renunciant networks' },
  {
    id: 'ashoka',
    date: -250,
    label: 'Mauryan monumental and inscriptional horizon',
  },
  { id: 'simraun', date: 1100, label: 'Karnata Simraungadh' },
  { id: 'print', date: 1900, label: 'Modern print and literary institutions' },
  {
    id: 'videha',
    date: 2004,
    label: 'Videha digital and translation initiatives',
  },
];

const panjiTokens = [
  {
    token: 'मूल: उदाहरणपुर',
    label: 'Mūla',
    meaning:
      'A fictional root designation used here only to demonstrate record grammar.',
  },
  {
    token: 'गोत्र: काश्यप',
    label: 'Gotra',
    meaning:
      'A lineage category that must not be treated as modern genetic evidence.',
  },
  {
    token: 'ग्राम: उत्तरगाम',
    label: 'Village',
    meaning:
      'An invented settlement marker showing how place information can enter an entry.',
  },
  {
    token: 'कन्या-संबन्ध: दक्षिणगाम',
    label: 'Marriage link',
    meaning:
      'A fictional affinal connection illustrating how another settlement may enter the record.',
  },
  {
    token: 'उपाधि: पाठक',
    label: 'Title',
    meaning:
      'A recorded social or scholarly title whose meaning may change across periods.',
  },
];

const concepts = [
  {
    id: 'pramana',
    name: 'Pramāṇa',
    question: 'What warrants knowledge?',
    method:
      'Analysis of perception, inference, testimony, and other proposed means of knowledge.',
    caution:
      'Schools disagree over the number, scope, and independence of pramāṇas.',
  },
  {
    id: 'purvapaksha',
    name: 'Pūrvapakṣa',
    question: 'What is the strongest serious objection?',
    method: 'Reconstruct the opposing position before replying.',
    caution: 'A weak or caricatured objection cannot test the conclusion.',
  },
  {
    id: 'uttarapaksha',
    name: 'Uttarapakṣa',
    question: 'What answer survives the objection?',
    method: 'Respond to the actual premises and evidence raised.',
    caution:
      'A reply that changes the question leaves the objection unanswered.',
  },
  {
    id: 'adhyasa',
    name: 'Adhyāsa',
    question: 'How does superimposition structure error?',
    method: 'Examine subject, object, memory, appearance, and attribution.',
    caution:
      'Different Advaita traditions explain locus and mechanism differently.',
  },
  {
    id: 'vyapti',
    name: 'Vyāpti',
    question: 'How does inference depend on an invariant relation?',
    method:
      'Test positive and negative instances, counterexamples, and limiting conditions.',
    caution:
      'A repeated association alone does not establish unrestricted pervasion.',
  },
  {
    id: 'panji',
    name: 'Panji memory',
    question: 'How does a register organize remembered social relations?',
    method:
      'Decode formulas, lineages, marriage links, settlements, titles, and editorial layers.',
    caution:
      'Recorded genealogy is neither complete social reality nor direct genome data.',
  },
];

const architectureTypes = [
  {
    id: 'stupa',
    name: 'Stupa complex',
    period: 'Ancient and later sacred landscapes',
    parts: [
      'Mound or dome',
      'Circumambulatory path',
      'Railing or boundary',
      'Votive additions',
    ],
    caution:
      'Visible remains may combine several construction and restoration phases.',
  },
  {
    id: 'temple',
    name: 'Temple complex',
    period: 'Medieval to modern continuities',
    parts: [
      'Sanctum',
      'Mandapa or hall',
      'Threshold sequence',
      'Subsidiary shrines',
    ],
    caution:
      'A present building cannot be assigned wholesale to the earliest tradition associated with the site.',
  },
  {
    id: 'monastery',
    name: 'Monastic complex',
    period: 'Institutional religious landscapes',
    parts: [
      'Cells',
      'Central court',
      'Assembly or worship space',
      'Water and service areas',
    ],
    caution:
      'Function should follow excavated plan, finds, and comparisons rather than shape alone.',
  },
  {
    id: 'fort',
    name: 'Fortified settlement',
    period: 'Political and urban landscapes',
    parts: [
      'Defensive circuit',
      'Gateways',
      'Habitation zones',
      'Water management',
    ],
    caution:
      'Ramparts can be rebuilt repeatedly; each phase requires separate dating.',
  },
];

const classificationQuestions = [
  {
    statement:
      'A festival is documented in present-day Janakpur through observation and community testimony.',
    answer: 'Living tradition',
    options: [
      'Living tradition',
      'Archaeology',
      'Inscription',
      'Modern inference',
    ],
  },
  {
    statement:
      'A later text remembers Janaka’s court as a setting for philosophical questioning.',
    answer: 'Textual memory',
    options: [
      'Textual memory',
      'Excavated event record',
      'Modern census',
      'Genetic proof',
    ],
  },
  {
    statement:
      'A sealed occupational layer contains datable ceramics and structural remains.',
    answer: 'Material evidence',
    options: [
      'Royal memory',
      'Material evidence',
      'Living tradition',
      'Literary style',
    ],
  },
  {
    statement:
      'A historian proposes that two corridors interacted because multiple independent sources show movement between them.',
    answer: 'Historical reconstruction',
    options: [
      'Inscription alone',
      'Historical reconstruction',
      'Myth alone',
      'Modern border',
    ],
  },
];

const dailyQuestions = [
  ...detectiveQuestions,
  ...classificationQuestions.map((item) => ({
    claim: item.statement,
    answer: item.answer,
    options: item.options,
    why: `The statement is best classified as ${item.answer.toLowerCase()} based on the evidence it describes.`,
  })),
];

const formatDate = (date: number) =>
  date < 0 ? `${Math.abs(date)} BCE` : `${date} CE`;

export default function LearningLab() {
  const [activity, setActivity] = useState<ActivityId>('archive');
  const [askInput, setAskInput] = useState(
    'How do Panji records support social history?',
  );
  const [askedQuestion, setAskedQuestion] = useState(
    'How do Panji records support social history?',
  );
  const [detectiveIndex, setDetectiveIndex] = useState(0);
  const [detectiveChoice, setDetectiveChoice] = useState('');
  const [detectiveScore, setDetectiveScore] = useState(0);
  const [debateIndex, setDebateIndex] = useState(0);
  const [debateProof, setDebateProof] = useState('');
  const [debateResponse, setDebateResponse] = useState('');
  const [debateChecked, setDebateChecked] = useState(false);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [journeyChoice, setJourneyChoice] = useState<number | null>(null);
  const [identityIndex, setIdentityIndex] = useState(0);
  const [clueCount, setClueCount] = useState(1);
  const [identityChoice, setIdentityChoice] = useState('');
  const [orderedChronology, setOrderedChronology] = useState(() => [
    chronologyItems[2],
    chronologyItems[0],
    chronologyItems[5],
    chronologyItems[3],
    chronologyItems[1],
    chronologyItems[4],
  ]);
  const [chronologyChecked, setChronologyChecked] = useState(false);
  const [panjiToken, setPanjiToken] = useState(0);
  const [conceptA, setConceptA] = useState('pramana');
  const [conceptB, setConceptB] = useState('purvapaksha');
  const [architectureId, setArchitectureId] = useState('stupa');
  const [dailyChoice, setDailyChoice] = useState('');
  const [classificationIndex, setClassificationIndex] = useState(0);
  const [classificationChoice, setClassificationChoice] = useState('');
  const [today] = useState(() => new Date());
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [notes, setNotes] = useState<NotebookEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(
        window.localStorage.getItem('videha-research-notebook') ?? '[]',
      ) as NotebookEntry[];
    } catch {
      return [];
    }
  });
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => {
    if (typeof window === 'undefined') return { lastDay: '', streak: 0 };
    try {
      return JSON.parse(
        window.localStorage.getItem('videha-daily-progress') ??
          '{"lastDay":"","streak":0}',
      ) as DailyProgress;
    } catch {
      return { lastDay: '', streak: 0 };
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      'videha-research-notebook',
      JSON.stringify(notes),
    );
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem(
      'videha-daily-progress',
      JSON.stringify(dailyProgress),
    );
  }, [dailyProgress]);

  const archiveResults = useMemo(() => {
    const terms = askedQuestion
      .toLowerCase()
      .split(/[^a-zāīūṛṅñṭḍṇśṣṃḥ]+/u)
      .filter((term) => term.length > 2);
    return archiveRecords
      .map((record) => ({
        record,
        score: terms.reduce(
          (score, term) =>
            score +
            (`${record.title} ${record.text} ${record.source}`
              .toLowerCase()
              .includes(term)
              ? 1
              : 0),
          0,
        ),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.record);
  }, [askedQuestion]);

  const addNote = (title: string, body: string, source: string) => {
    const entry: NotebookEntry = {
      id: `${title}-${body.length}-${notes.length}`,
      title,
      body,
      source,
      created: `Entry ${notes.length + 1}`,
    };
    setNotes((current) => [entry, ...current]);
  };

  const submitAsk = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAskedQuestion(askInput.trim());
  };

  const exportNotes = () => {
    const content = notes
      .map(
        (note, index) =>
          `${index + 1}. ${note.title}\n${note.body}\nSource: ${note.source}\nSaved: ${note.created}\n`,
      )
      .join('\n');
    const href = URL.createObjectURL(
      new Blob([`VIDEHA RESEARCH NOTEBOOK\n\n${content}`], {
        type: 'text/plain',
      }),
    );
    const link = document.createElement('a');
    link.href = href;
    link.download = 'videha-research-notebook.txt';
    link.click();
    URL.revokeObjectURL(href);
  };

  const moveChronology = (index: number, direction: number) => {
    const next = [...orderedChronology];
    const destination = index + direction;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    setOrderedChronology(next);
    setChronologyChecked(false);
  };

  const speakStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      journeyStops[journeyIndex].narration,
    );
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const currentDetective = detectiveQuestions[detectiveIndex];
  const currentDebate = debateCases[debateIndex];
  const currentStop = journeyStops[journeyIndex];
  const currentIdentity = identityFigures[identityIndex];
  const selectedConceptA = concepts.find((item) => item.id === conceptA)!;
  const selectedConceptB = concepts.find((item) => item.id === conceptB)!;
  const selectedArchitecture = architectureTypes.find(
    (item) => item.id === architectureId,
  )!;
  const dailyIndex =
    Math.floor(today.getTime() / 86400000) % dailyQuestions.length;
  const daily = dailyQuestions[dailyIndex];
  const todayKey = today.toISOString().slice(0, 10);
  const classification = classificationQuestions[classificationIndex];
  const chronologyCorrect = orderedChronology.every(
    (item, index) =>
      index === 0 || orderedChronology[index - 1].date <= item.date,
  );

  return (
    <section
      className="learning-lab"
      id="learning-lab"
      aria-labelledby="learning-lab-title"
    >
      <header className="lab-header">
        <div>
          <p>INTERACTIVE VIDEHA LEARNING LAB</p>
          <h2 id="learning-lab-title">
            Question, test, compare, and keep a research trail
          </h2>
        </div>
        <dl>
          <div>
            <dt>Core research tools</dt>
            <dd>5</dd>
          </div>
          <div>
            <dt>Activities</dt>
            <dd>12</dd>
          </div>
          <div>
            <dt>Notebook entries</dt>
            <dd>{notes.length}</dd>
          </div>
        </dl>
      </header>

      <div className="lab-shell">
        <aside className="lab-navigation">
          <p>CORE WORKFLOW</p>
          {activities
            .filter((item) => item.core)
            .map((item) => (
              <button
                key={item.id}
                className={activity === item.id ? 'active' : ''}
                onClick={() => setActivity(item.id)}
              >
                <b>{String(item.number).padStart(2, '0')}</b>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                </span>
                <ChevronRight />
              </button>
            ))}
          <p>CHALLENGES &amp; LABS</p>
          {activities
            .filter((item) => !item.core)
            .map((item) => (
              <button
                key={item.id}
                className={activity === item.id ? 'active' : ''}
                onClick={() => setActivity(item.id)}
              >
                <b>{String(item.number).padStart(2, '0')}</b>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                </span>
                <ChevronRight />
              </button>
            ))}
        </aside>

        <main className="lab-workbench">
          {activity === 'archive' && (
            <section
              className="lab-activity ask-archive"
              aria-labelledby="lab-archive-title"
            >
              <div className="activity-heading">
                <Archive />
                <div>
                  <p>01 · SOURCE-GROUNDED Q&amp;A</p>
                  <h3 id="lab-archive-title">Ask the Archive</h3>
                  <span>
                    Searches the site’s chapter, book, person, and philosophy
                    indexes. Results show their source record.
                  </span>
                </div>
              </div>
              <form onSubmit={submitAsk}>
                <label>
                  <span className="sr-only">Question for the archive</span>
                  <Search />
                  <input
                    value={askInput}
                    onChange={(event) => setAskInput(event.target.value)}
                    placeholder="Ask about a person, place, text, event, or idea"
                  />
                </label>
                <button type="submit">Search records</button>
              </form>
              <div className="starter-questions">
                {[
                  'What does the Panji record?',
                  'Who was Gārgī?',
                  'How are Vajji and Vaiśālī connected?',
                  'What is pūrvapakṣa?',
                  'Where does Campā appear?',
                ].map((question) => (
                  <button
                    key={question}
                    onClick={() => {
                      setAskInput(question);
                      setAskedQuestion(question);
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
              <div className="archive-answer">
                <p>ARCHIVE RESPONSE</p>
                <h4>{askedQuestion}</h4>
                {archiveResults.length ? (
                  <>
                    <p>
                      The closest indexed records are listed below. Read them
                      together because different records may represent textual
                      memory, material evidence, genealogy, or later
                      interpretation.
                    </p>
                    <div className="archive-results">
                      {archiveResults.map((record) => (
                        <article key={`${record.kind}-${record.id}`}>
                          <span>{record.kind}</span>
                          <h5>{record.title}</h5>
                          <p>
                            {record.text.slice(0, 330)}
                            {record.text.length > 330 ? '…' : ''}
                          </p>
                          <small>{record.source}</small>
                          <button
                            onClick={() =>
                              addNote(
                                record.title,
                                record.text.slice(0, 600),
                                record.source,
                              )
                            }
                          >
                            <NotebookPen /> Save to notebook
                          </button>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="lab-empty">
                    <CircleHelp />
                    <h5>No close indexed match</h5>
                    <p>
                      Try a name, place, book title, or concept already
                      represented in the archive.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activity === 'detective' && (
            <section className="lab-activity" aria-labelledby="detective-title">
              <div className="activity-heading">
                <ClipboardCheck />
                <div>
                  <p>02 · EVIDENCE QUIZ</p>
                  <h3 id="detective-title">Source Detective</h3>
                  <span>
                    Choose the evidence that can directly support the stated
                    claim.
                  </span>
                </div>
              </div>
              <div className="quiz-progress">
                <span>
                  Case {detectiveIndex + 1} of {detectiveQuestions.length}
                </span>
                <b>{detectiveScore} correct</b>
              </div>
              <div className="question-card">
                <p>CLAIM</p>
                <h4>{currentDetective.claim}</h4>
                <div className="answer-grid">
                  {currentDetective.options.map((option) => (
                    <button
                      key={option}
                      disabled={Boolean(detectiveChoice)}
                      className={
                        detectiveChoice
                          ? option === currentDetective.answer
                            ? 'correct'
                            : option === detectiveChoice
                              ? 'incorrect'
                              : ''
                          : ''
                      }
                      onClick={() => {
                        setDetectiveChoice(option);
                        if (option === currentDetective.answer)
                          setDetectiveScore((score) => score + 1);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {detectiveChoice && (
                  <div className="answer-explanation">
                    <strong>
                      {detectiveChoice === currentDetective.answer
                        ? 'Supported choice'
                        : 'Reconsider the evidence type'}
                    </strong>
                    <p>{currentDetective.why}</p>
                    <button
                      onClick={() => {
                        setDetectiveIndex(
                          (detectiveIndex + 1) % detectiveQuestions.length,
                        );
                        setDetectiveChoice('');
                      }}
                    >
                      Next case <ChevronRight />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activity === 'debate' && (
            <section className="lab-activity" aria-labelledby="debate-title">
              <div className="activity-heading">
                <BookOpenCheck />
                <div>
                  <p>03 · ARGUMENT WORKSHOP</p>
                  <h3 id="debate-title">Pūrvapakṣa Debate Game</h3>
                  <span>
                    Construct an answer that meets the objection without
                    changing the question.
                  </span>
                </div>
              </div>
              <div className="debate-builder">
                <p>QUESTION</p>
                <h4>{currentDebate.topic}</h4>
                <article>
                  <span>01</span>
                  <div>
                    <b>Pūrvapakṣa</b>
                    <p>{currentDebate.objection}</p>
                  </div>
                </article>
                <label>
                  <b>02 · Choose a proof test</b>
                  <select
                    value={debateProof}
                    onChange={(event) => {
                      setDebateProof(event.target.value);
                      setDebateChecked(false);
                    }}
                  >
                    <option value="">Select the relevant test</option>
                    {[currentDebate.proof, ...currentDebate.weak]
                      .sort()
                      .map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                  </select>
                </label>
                <label>
                  <b>03 · Choose the Uttarapakṣa</b>
                  <select
                    value={debateResponse}
                    onChange={(event) => {
                      setDebateResponse(event.target.value);
                      setDebateChecked(false);
                    }}
                  >
                    <option value="">Select the strongest response</option>
                    {[currentDebate.response, ...currentDebate.weak]
                      .reverse()
                      .map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                  </select>
                </label>
                <button
                  className="primary-lab-action"
                  disabled={!debateProof || !debateResponse}
                  onClick={() => setDebateChecked(true)}
                >
                  Test the argument
                </button>
                {debateChecked && (
                  <div
                    className={`debate-verdict ${debateProof === currentDebate.proof && debateResponse === currentDebate.response ? 'correct' : 'incorrect'}`}
                  >
                    {debateProof === currentDebate.proof &&
                    debateResponse === currentDebate.response ? (
                      <Check />
                    ) : (
                      <X />
                    )}
                    <div>
                      <strong>
                        {debateProof === currentDebate.proof &&
                        debateResponse === currentDebate.response
                          ? 'The response survives this test'
                          : 'The objection remains unanswered'}
                      </strong>
                      <p>
                        {debateProof === currentDebate.proof &&
                        debateResponse === currentDebate.response
                          ? 'The evidence test matches the claim, and the response preserves the distinction raised by the objection.'
                          : 'Choose a test that examines the evidence directly and a response that answers the objection as stated.'}
                      </p>
                      <button
                        onClick={() => {
                          setDebateIndex(
                            (debateIndex + 1) % debateCases.length,
                          );
                          setDebateProof('');
                          setDebateResponse('');
                          setDebateChecked(false);
                        }}
                      >
                        Try another debate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activity === 'journey' && (
            <section className="lab-activity" aria-labelledby="journey-title">
              <div className="activity-heading">
                <MapPinned />
                <div>
                  <p>04 · NARRATED ROUTE</p>
                  <h3 id="journey-title">Map Journey</h3>
                  <span>
                    Answer at each stop to unlock the connected historical
                    route.
                  </span>
                </div>
              </div>
              <div className="journey-map">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    points={journeyStops
                      .map((stop) => `${stop.x},${stop.y}`)
                      .join(' ')}
                  />
                </svg>
                {journeyStops.map((stop, index) => (
                  <button
                    key={stop.name}
                    disabled={index > journeyIndex}
                    className={
                      index === journeyIndex
                        ? 'active'
                        : index < journeyIndex
                          ? 'complete'
                          : ''
                    }
                    style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                    onClick={() =>
                      index <= journeyIndex && setJourneyIndex(index)
                    }
                  >
                    <span>{index < journeyIndex ? <Check /> : index + 1}</span>
                    {stop.name}
                  </button>
                ))}
              </div>
              <div className="journey-stop">
                <div>
                  <p>
                    STOP {journeyIndex + 1} · {currentStop.frame}
                  </p>
                  <h4>{currentStop.name}</h4>
                  <p>{currentStop.narration}</p>
                  <button onClick={speakStop}>
                    <Volume2 /> Listen
                  </button>
                </div>
                <div>
                  <strong>{currentStop.question}</strong>
                  {currentStop.options.map((option, index) => (
                    <button
                      key={option}
                      className={
                        journeyChoice !== null
                          ? index === currentStop.correct
                            ? 'correct'
                            : index === journeyChoice
                              ? 'incorrect'
                              : ''
                          : ''
                      }
                      onClick={() => setJourneyChoice(index)}
                    >
                      {option}
                    </button>
                  ))}
                  {journeyChoice === currentStop.correct &&
                    journeyIndex < journeyStops.length - 1 && (
                      <button
                        className="next-stop"
                        onClick={() => {
                          setJourneyIndex(journeyIndex + 1);
                          setJourneyChoice(null);
                        }}
                      >
                        Unlock next stop <Footprints />
                      </button>
                    )}
                  {journeyChoice === currentStop.correct &&
                    journeyIndex === journeyStops.length - 1 && (
                      <strong className="journey-complete">
                        <Trophy /> Route completed
                      </strong>
                    )}
                </div>
              </div>
            </section>
          )}

          {activity === 'notebook' && (
            <section className="lab-activity" aria-labelledby="notebook-title">
              <div className="activity-heading">
                <NotebookPen />
                <div>
                  <p>05 · PRIVATE BROWSER NOTEBOOK</p>
                  <h3 id="notebook-title">Research Notebook</h3>
                  <span>
                    Entries remain on this device until exported or deleted.
                  </span>
                </div>
              </div>
              <div className="notebook-compose">
                <label>
                  Title
                  <input
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    placeholder="Research question or observation"
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                    placeholder="Record an argument, comparison, quotation reference, or question"
                  />
                </label>
                <div>
                  <button
                    disabled={!noteTitle.trim() || !noteBody.trim()}
                    onClick={() => {
                      addNote(noteTitle, noteBody, 'Personal research note');
                      setNoteTitle('');
                      setNoteBody('');
                    }}
                  >
                    Save note
                  </button>
                  <button disabled={!notes.length} onClick={exportNotes}>
                    <Download /> Export notebook
                  </button>
                </div>
              </div>
              <div className="notebook-list">
                {notes.length ? (
                  notes.map((note) => (
                    <article key={note.id}>
                      <span>{note.created}</span>
                      <h4>{note.title}</h4>
                      <p>{note.body}</p>
                      <small>{note.source}</small>
                      <button
                        aria-label={`Delete ${note.title}`}
                        onClick={() =>
                          setNotes((current) =>
                            current.filter((item) => item.id !== note.id),
                          )
                        }
                      >
                        <X />
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="lab-empty">
                    <NotebookPen />
                    <h5>No saved notes yet</h5>
                    <p>
                      Search Ask the Archive and save a result, or write a note
                      above.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activity === 'identity' && (
            <section className="lab-activity" aria-labelledby="identity-title">
              <div className="activity-heading">
                <CircleHelp />
                <div>
                  <p>06 · HISTORICAL FIGURES</p>
                  <h3 id="identity-title">Who am I?</h3>
                  <span>Reveal only as many clues as you need.</span>
                </div>
              </div>
              <div className="identity-game">
                <div className="clue-stack">
                  {currentIdentity.clues
                    .slice(0, clueCount)
                    .map((clue, index) => (
                      <p key={clue}>
                        <b>{String(index + 1).padStart(2, '0')}</b>
                        {clue}
                      </p>
                    ))}
                  {clueCount < currentIdentity.clues.length && (
                    <button onClick={() => setClueCount(clueCount + 1)}>
                      Reveal another clue
                    </button>
                  )}
                </div>
                <div className="answer-grid">
                  {currentIdentity.choices.map((choice) => (
                    <button
                      key={choice}
                      disabled={Boolean(identityChoice)}
                      className={
                        identityChoice
                          ? choice === currentIdentity.name
                            ? 'correct'
                            : choice === identityChoice
                              ? 'incorrect'
                              : ''
                          : ''
                      }
                      onClick={() => setIdentityChoice(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {identityChoice && (
                  <div className="answer-explanation">
                    <strong>
                      {identityChoice === currentIdentity.name
                        ? 'Correct identification'
                        : `The figure is ${currentIdentity.name}`}
                    </strong>
                    <button
                      onClick={() => {
                        setIdentityIndex(
                          (identityIndex + 1) % identityFigures.length,
                        );
                        setIdentityChoice('');
                        setClueCount(1);
                      }}
                    >
                      Next figure
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activity === 'chronology' && (
            <section
              className="lab-activity"
              aria-labelledby="chronology-lab-title"
            >
              <div className="activity-heading">
                <ArrowDown />
                <div>
                  <p>07 · ORDERING LAB</p>
                  <h3 id="chronology-lab-title">Build a Chronology</h3>
                  <span>
                    Move the evidence horizons from earliest to latest.
                  </span>
                </div>
              </div>
              <ol className="chronology-builder">
                {orderedChronology.map((item, index) => (
                  <li key={item.id}>
                    <b>{index + 1}</b>
                    <span>{item.label}</span>
                    <div>
                      <button
                        aria-label={`Move ${item.label} earlier`}
                        disabled={index === 0}
                        onClick={() => moveChronology(index, -1)}
                      >
                        <ArrowUp />
                      </button>
                      <button
                        aria-label={`Move ${item.label} later`}
                        disabled={index === orderedChronology.length - 1}
                        onClick={() => moveChronology(index, 1)}
                      >
                        <ArrowDown />
                      </button>
                    </div>
                    {chronologyChecked && <time>{formatDate(item.date)}</time>}
                  </li>
                ))}
              </ol>
              <button
                className="primary-lab-action"
                onClick={() => setChronologyChecked(true)}
              >
                Check order
              </button>
              {chronologyChecked && (
                <div
                  className={`compact-verdict ${chronologyCorrect ? 'correct' : 'incorrect'}`}
                >
                  {chronologyCorrect ? <Check /> : <RotateCcw />}
                  <span>
                    {chronologyCorrect
                      ? 'The chronology is correctly ordered.'
                      : 'Some evidence horizons remain out of sequence. Dates are now revealed.'}
                  </span>
                </div>
              )}
            </section>
          )}

          {activity === 'panji' && (
            <section className="lab-activity" aria-labelledby="panji-lab-title">
              <div className="activity-heading">
                <Archive />
                <div>
                  <p>08 · FICTIONAL PRACTICE RECORD</p>
                  <h3 id="panji-lab-title">Panji Decoding Laboratory</h3>
                  <span>
                    No personal genealogy appears in this demonstration.
                  </span>
                </div>
              </div>
              <div className="panji-lab">
                <div className="panji-record">
                  <p>अभ्यास-पञ्जी · केवल पद्धति प्रदर्शन</p>
                  {panjiTokens.map((item, index) => (
                    <button
                      key={item.token}
                      className={panjiToken === index ? 'active' : ''}
                      onClick={() => setPanjiToken(index)}
                    >
                      {item.token}
                    </button>
                  ))}
                </div>
                <div className="panji-reading">
                  <span>SELECTED FIELD</span>
                  <h4>{panjiTokens[panjiToken].label}</h4>
                  <p>{panjiTokens[panjiToken].meaning}</p>
                  <dl>
                    <dt>What it can support</dt>
                    <dd>
                      The fact that this category or formula appears in the
                      demonstration record.
                    </dd>
                    <dt>What it cannot prove alone</dt>
                    <dd>
                      Modern identity, biological descent, exact social
                      practice, or the full history of a community.
                    </dd>
                  </dl>
                </div>
              </div>
            </section>
          )}

          {activity === 'comparator' && (
            <section
              className="lab-activity"
              aria-labelledby="comparator-title"
            >
              <div className="activity-heading">
                <GitCompareArrows />
                <div>
                  <p>09 · SIDE-BY-SIDE INQUIRY</p>
                  <h3 id="comparator-title">
                    Philosophical Concept Comparator
                  </h3>
                  <span>
                    Compare questions, methods, and cautions without collapsing
                    differences.
                  </span>
                </div>
              </div>
              <div className="compare-selectors">
                <label>
                  First concept
                  <select
                    value={conceptA}
                    onChange={(event) => setConceptA(event.target.value)}
                  >
                    {concepts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Second concept
                  <select
                    value={conceptB}
                    onChange={(event) => setConceptB(event.target.value)}
                  >
                    {concepts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="concept-comparison">
                {[selectedConceptA, selectedConceptB].map((item) => (
                  <article key={item.id}>
                    <p>CONCEPT</p>
                    <h4>{item.name}</h4>
                    <strong>{item.question}</strong>
                    <h5>Method</h5>
                    <p>{item.method}</p>
                    <h5>Research caution</h5>
                    <p>{item.caution}</p>
                    <button
                      onClick={() =>
                        addNote(
                          `Comparison note: ${item.name}`,
                          `${item.question} ${item.method} Caution: ${item.caution}`,
                          'Videha concept comparator',
                        )
                      }
                    >
                      <NotebookPen /> Save
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activity === 'architecture' && (
            <section
              className="lab-activity"
              aria-labelledby="architecture-title"
            >
              <div className="activity-heading">
                <Sparkles />
                <div>
                  <p>10 · STRUCTURAL READING</p>
                  <h3 id="architecture-title">
                    Architecture Reconstruction Viewer
                  </h3>
                  <span>
                    A schematic teaching aid for reading remains, not a claim
                    about one excavated building.
                  </span>
                </div>
              </div>
              <div className="architecture-tabs">
                {architectureTypes.map((item) => (
                  <button
                    key={item.id}
                    className={architectureId === item.id ? 'active' : ''}
                    onClick={() => setArchitectureId(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div className={`architecture-stage ${selectedArchitecture.id}`}>
                <div
                  className="architecture-diagram"
                  aria-label={`Schematic diagram of ${selectedArchitecture.name}`}
                >
                  <span className="architecture-core"></span>
                  <span className="architecture-ring"></span>
                  <span className="architecture-entry"></span>
                  <span className="architecture-field"></span>
                </div>
                <div>
                  <p>{selectedArchitecture.period}</p>
                  <h4>{selectedArchitecture.name}</h4>
                  <ol>
                    {selectedArchitecture.parts.map((part, index) => (
                      <li key={part}>
                        <b>{index + 1}</b>
                        {part}
                      </li>
                    ))}
                  </ol>
                  <aside>
                    <strong>Interpretive caution</strong>
                    <p>{selectedArchitecture.caution}</p>
                  </aside>
                </div>
              </div>
            </section>
          )}

          {activity === 'daily' && (
            <section className="lab-activity" aria-labelledby="daily-title">
              <div className="activity-heading">
                <Trophy />
                <div>
                  <p>11 · ROTATES EACH CALENDAR DAY</p>
                  <h3 id="daily-title">Daily Videha Challenge</h3>
                  <span>
                    Return tomorrow for a different evidence question.
                  </span>
                </div>
              </div>
              <div className="daily-card">
                <div className="daily-meta">
                  <time>
                    {today.toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <strong>
                    <Trophy /> {dailyProgress.streak} day streak
                  </strong>
                </div>
                <h4>{daily.claim}</h4>
                <div className="answer-grid">
                  {daily.options.map((option) => (
                    <button
                      key={option}
                      disabled={Boolean(dailyChoice)}
                      className={
                        dailyChoice
                          ? option === daily.answer
                            ? 'correct'
                            : option === dailyChoice
                              ? 'incorrect'
                              : ''
                          : ''
                      }
                      onClick={() => {
                        setDailyChoice(option);
                        if (
                          option === daily.answer &&
                          dailyProgress.lastDay !== todayKey
                        ) {
                          const yesterday = new Date(today.getTime() - 86400000)
                            .toISOString()
                            .slice(0, 10);
                          setDailyProgress({
                            lastDay: todayKey,
                            streak:
                              dailyProgress.lastDay === yesterday
                                ? dailyProgress.streak + 1
                                : 1,
                          });
                        }
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {dailyChoice && (
                  <div className="answer-explanation">
                    <strong>
                      {dailyChoice === daily.answer
                        ? 'Daily challenge completed'
                        : `Best answer: ${daily.answer}`}
                    </strong>
                    <p>{daily.why}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activity === 'classification' && (
            <section
              className="lab-activity"
              aria-labelledby="classification-title"
            >
              <div className="activity-heading">
                <Search />
                <div>
                  <p>12 · CLAIM CLASSIFICATION</p>
                  <h3 id="classification-title">Myth, Memory, or Evidence?</h3>
                  <span>
                    Identify what kind of support the statement actually
                    describes.
                  </span>
                </div>
              </div>
              <div className="classification-card">
                <span>
                  {classificationIndex + 1} / {classificationQuestions.length}
                </span>
                <h4>{classification.statement}</h4>
                <div className="answer-grid">
                  {classification.options.map((option) => (
                    <button
                      key={option}
                      disabled={Boolean(classificationChoice)}
                      className={
                        classificationChoice
                          ? option === classification.answer
                            ? 'correct'
                            : option === classificationChoice
                              ? 'incorrect'
                              : ''
                          : ''
                      }
                      onClick={() => setClassificationChoice(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {classificationChoice && (
                  <div className="answer-explanation">
                    <strong>
                      {classificationChoice === classification.answer
                        ? 'Classification supported'
                        : `Best classification: ${classification.answer}`}
                    </strong>
                    <p>
                      The wording determines the evidence class. It does not
                      automatically validate broader claims about date,
                      identity, or causation.
                    </p>
                    <button
                      onClick={() => {
                        setClassificationIndex(
                          (classificationIndex + 1) %
                            classificationQuestions.length,
                        );
                        setClassificationChoice('');
                      }}
                    >
                      Next statement
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}
