'use client';

/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation for exported secondary routes. */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  Accessibility,
  ArrowUp,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GitBranch,
  Landmark,
  Layers3,
  Library,
  Languages,
  MapPin,
  Menu,
  Pause,
  Play,
  Search,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import researchData from './research-data.json';
import libraryData from './library-data.json';
import deepData from './deep-data.json';
import collectionDetailsData from './collection-details.json';
import coverData from './cover-data.json';
import ideasVolumeTwoData from './ideas-volume2.json';
import learningData from './learning-data.json';
import ResearchExpansion from './research-expansion';
import LearningLab from './learning-lab';

type Chapter = {
  id: string;
  number: number;
  title: string;
  collection: string;
  volume: string;
  part: string;
  status: 'Complete' | 'Planned';
  pages: string;
  summary: string;
  sections: string[];
};
type Work = {
  id: string;
  shelf: string;
  sequence: string;
  title: string;
  subtitle: string;
  creator: string;
  extent: string;
  description: string;
  structure: string[];
};
type PhilosophyChapter = {
  id: string;
  number: number;
  title: string;
  part: string;
  summary: string;
  sections: string[];
  purvapaksha: string;
  uttarapaksha: string;
  synthesis: string;
};
type IdeaRecord = {
  id: string;
  number: number;
  title: string;
  part: string;
  summary: string;
  sections: string[];
  purvapaksha?: string;
  uttarapaksha?: string;
  synthesis?: string;
  status: 'Available' | 'Available in English' | 'Planned';
  volume: 'Volume I' | 'Volume II';
  source: string;
};
type Person = {
  id: string;
  name: string;
  field: string;
  era: string;
  source: string;
  description: string;
};
type CollectionDetail = {
  source: string;
  paragraphs: number;
  tables: number;
  items: { level: number; title: string }[];
};
type Cover = {
  src: string;
  title: string;
  sequence: string;
  category: string;
  side: string;
  width: number;
  height: number;
};
type Tab =
  | 'chronology'
  | 'places'
  | 'chapters'
  | 'library'
  | 'people'
  | 'ideas'
  | 'sources';
type GlobalSearchRecord = {
  id: string;
  title: string;
  kind: 'People' | 'Histories' | 'Ideas' | 'Places' | 'Texts' | 'Chronology';
  meta: string;
  text: string;
  route: Tab | 'historical-map' | 'knowledge-graph' | 'panji';
  ref?: string;
  year?: number;
};
type ContrastMode = 'off' | 'dark' | 'light';
type ColourFilter = 'off' | 'gray' | 'invert';
type AssistivePrefs = {
  scale: number;
  contrast: ContrastMode;
  filter: ColourFilter;
  spacing: boolean;
  readableWidth: boolean;
  highlightLinks: boolean;
  hideImages: boolean;
  stopMotion: boolean;
  largeTargets: boolean;
  largeCursor: boolean;
  readerView: boolean;
};
const defaultAssistivePrefs: AssistivePrefs = {
  scale: 100,
  contrast: 'off',
  filter: 'off',
  spacing: false,
  readableWidth: false,
  highlightLinks: false,
  hideImages: false,
  stopMotion: false,
  largeTargets: false,
  largeCursor: false,
  readerView: false,
};
const translationLanguages = [
  ['as', 'Assamese · অসমীয়া'],
  ['bn', 'Bengali · বাংলা'],
  ['brx', 'Bodo · बड़ो'],
  ['doi', 'Dogri · डोगरी'],
  ['en', 'English · अंग्रेजी'],
  ['gu', 'Gujarati · ગુજરાતી'],
  ['hi', 'Hindi · हिन्दी'],
  ['kn', 'Kannada · ಕನ್ನಡ'],
  ['ks', 'Kashmiri · کٲشُر'],
  ['gom', 'Konkani · कोंकणी'],
  ['mai', 'Maithili · मैथिली'],
  ['ml', 'Malayalam · മലയാളം'],
  ['mni-Mtei', 'Manipuri · ꯃꯩꯇꯩꯂꯣꯟ'],
  ['mr', 'Marathi · मराठी'],
  ['ne', 'Nepali · नेपाली'],
  ['or', 'Odia · ଓଡ଼ିଆ'],
  ['pa', 'Punjabi · ਪੰਜਾਬੀ'],
  ['sa', 'Sanskrit · संस्कृतम्'],
  ['sat', 'Santhali · ᱥᱟᱱᱛᱟᱲᱤ'],
  ['sd', 'Sindhi · سنڌي'],
  ['ta', 'Tamil · தமிழ்'],
  ['te', 'Telugu · తెలుగు'],
  ['ur', 'Urdu · اردو'],
  ['zh-CN', 'Mandarin Chinese · 中文'],
  ['yue', 'Cantonese · 粵語'],
  ['fa', 'Persian · فارسی'],
  ['iw', 'Hebrew · עברית'],
  ['bo', 'Tibetan · བོད་སྐད་'],
  ['si', 'Sinhala · සිංහල'],
  ['es', 'Spanish · Español'],
  ['fr', 'French · Français'],
  ['de', 'German · Deutsch'],
  ['pt', 'Portuguese · Português'],
  ['it', 'Italian · Italiano'],
  ['ru', 'Russian · Русский'],
  ['ar', 'Arabic · العربية'],
  ['ja', 'Japanese · 日本語'],
  ['ko', 'Korean · 한국어'],
  ['id', 'Indonesian · Bahasa Indonesia'],
  ['th', 'Thai · ไทย'],
  ['tr', 'Turkish · Türkçe'],
] as const;
const chapters = [
  ...researchData.political,
  ...researchData.social,
] as Chapter[];
const completedHistoryCount = chapters.filter((chapter) => chapter.status === 'Complete').length;
const plannedHistoryCount = chapters.length - completedHistoryCount;
const works = libraryData as Work[];
const philosophyChapters = deepData.philosophyChapters as PhilosophyChapter[];
const ideas: IdeaRecord[] = [
  ...philosophyChapters.map((chapter) => ({
    ...chapter,
    status: 'Available' as const,
    volume: 'Volume I' as const,
    source: `Gajendra Thakur’s Parallel Philosophy · Volume I · Chapter ${chapter.number}`,
  })),
  ...(ideasVolumeTwoData as Array<
    Omit<IdeaRecord, 'volume'>
  >).map((chapter) => ({
    ...chapter,
    sections: chapter.sections ?? [],
    volume: 'Volume II' as const,
  })),
];
const completedIdeaCount = ideas.filter((idea) => idea.status !== 'Planned').length;
const plannedIdeaCount = ideas.length - completedIdeaCount;
const people = deepData.people as Person[];
const collectionDetails = collectionDetailsData as Record<
  string,
  CollectionDetail
>;
const covers = coverData as Cover[];
const journeySections = [
  { id: 'doors', label: 'Choose a path' },
  { id: 'archive-search', label: 'Search' },
  { id: 'explorer', label: 'Browse archive' },
  { id: 'wing-2', label: 'Historical map' },
  { id: 'wing-3', label: 'Knowledge graph' },
  { id: 'learning-lab', label: 'Research practice' },
] as const;
const coverCategories = [
  'All',
  'Histories',
  'Panji',
  'Parallel research',
  'Translations',
];

const chronology = [
  {
    year: -1800,
    date: 'c. 1800–1000 BCE',
    region: 'Comparative context',
    title: 'Early iron-working horizons',
    evidence: 'Archaeological range',
    text: 'Central Ganga and eastern Vindhya excavations provide comparative evidence, but cannot automatically date iron use in Mithila, the Nepal Tarai, or Anga.',
  },
  {
    year: -1500,
    date: 'Second millennium BCE',
    region: 'Middle Ganga',
    title: 'Early farming and mixed subsistence',
    evidence: 'Archaeological range',
    text: 'Chirand and related sites preserve early food-producing horizons; radiocarbon results require stratigraphic caution.',
  },
  {
    year: -900,
    date: 'Later Vedic period',
    region: 'Videha',
    title: 'Videgha Mathava and the Sadanira',
    evidence: 'Textual tradition · dating disputed',
    text: 'The Satapatha Brahmana represents an eastward movement to the Sadanira. It is a textual geography, not a modern border survey.',
  },
  {
    year: -650,
    date: 'Later Vedic / early Upanishadic horizon',
    region: 'Videha',
    title: 'Janaka’s learned court',
    evidence: 'Textual-historical horizon',
    text: 'The Brihadaranyaka Upanishad remembers Janaka, Yajnavalkya, Gargi, Maitreyi, and learned visitors within a layered textual tradition.',
  },
  {
    year: -550,
    date: 'Mid-first millennium BCE',
    region: 'Anga · Vajji',
    title: 'Eastern states and renunciant networks',
    evidence: 'Textual-political horizon',
    text: 'Anga and Champa appear among major eastern centres while Buddhist and Jain itineraries connect Vaishali, Champa, Rajagriha, and Mithila.',
  },
  {
    year: -500,
    date: 'c. sixth–fifth centuries BCE',
    region: 'Vajji · Videha',
    title: 'Buddha and Mahavira traditions',
    evidence: 'Conventional chronology · debated',
    text: 'Lives and communities associated with the Buddha and Mahavira place the region within the eastern Gangetic world of debate, patronage, and renunciation.',
  },
  {
    year: -450,
    date: 'Mid-first millennium BCE',
    region: 'Vajji',
    title: 'The Vajjian corporate polity',
    evidence: 'Normative Buddhist textual evidence',
    text: 'Buddhist narrative associates Vajjian resilience with assemblies, concord, established rules, elders, shrines, and protection of renunciants.',
  },
  {
    year: -350,
    date: 'About a century after the Buddha',
    region: 'Vaishali',
    title: 'Second Buddhist Council tradition',
    evidence: 'Cross-school Vinaya tradition',
    text: 'Several traditions remember a disciplinary dispute at Vaishali; details, absolute date, and relation to schism remain debated.',
  },
  {
    year: -250,
    date: 'Third century BCE',
    region: 'North Bihar',
    title: 'Ashokan monumental presence',
    evidence: 'Inscriptional and archaeological',
    text: 'Inscribed pillars in Champaran and the uninscribed Ashokan pillar at Kolhua anchor a major monumental corridor.',
  },
  {
    year: 400,
    date: 'Early fifth century CE',
    region: 'Vaishali',
    title: 'Faxian’s itinerary',
    evidence: 'Historical itinerary',
    text: 'Chinese Buddhist travel literature records a remembered sacred landscape, not eyewitness evidence for the Buddha’s lifetime.',
  },
  {
    year: 464,
    date: '464 CE',
    region: 'Licchavi Nepal',
    title: 'Manadeva’s Changu Narayan pillar',
    evidence: 'Secure inscriptional anchor',
    text: 'The inscription records genealogy, royal ideology, Queen Rajyavati, and campaigns; its conversion depends on identification of the Saka era.',
  },
  {
    year: 635,
    date: 'Seventh century CE',
    region: 'Vaishali',
    title: 'Xuanzang visits the region',
    evidence: 'Historical itinerary',
    text: 'Xuanzang describes Vaishali as largely ruined, with a complex Buddhist and non-Buddhist religious landscape.',
  },
  {
    year: 1097,
    date: 'c. 1097–1324/25',
    region: 'Mithila',
    title: 'Karnata rule and Simraongarh',
    evidence: 'Partly disputed chronology',
    text: 'The Karnata horizon links Mithila’s north and south plains; early and terminal dates vary by reconstruction.',
  },
  {
    year: 1236,
    date: '1236',
    region: 'Tirhut',
    title: 'Dharmasvamin in Tirhut',
    evidence: 'Near-contemporary travel-biographical evidence',
    text: 'Dharmasvamin stays near the Karnata capital and encounters Ramasimhadeva.',
  },
  {
    year: 1325,
    date: '1324–25',
    region: 'Mithila',
    title: 'Tughluq conquest horizon',
    evidence: 'Multi-source reconstruction',
    text: 'The displacement of Harisimhadeva is reconstructed across Persianate, Nepalese, and regional sources.',
  },
  {
    year: 1453,
    date: '1453',
    region: 'Saharsa',
    title: 'Kandaha inscriptional horizon',
    evidence: 'Dated inscription',
    text: 'The Narasimha inscription at Kandaha Sun Temple supplies a firm late-medieval anchor.',
  },
  {
    year: 1580,
    date: 'c. 1580',
    region: 'Bihar · Tirhut · Munger',
    title: 'Mughal provincial reorganization',
    evidence: 'Administrative-historical anchor',
    text: 'Akbar’s reorganization places Bihar within a subah and records Tirhut and Munger in the provincial hierarchy.',
  },
  {
    year: 1665,
    date: '1665–66',
    region: 'Mithila · Morang',
    title: 'Khandavala documentary horizon',
    evidence: 'Dated Mughal documents',
    text: 'A farman and letter anchor Mahinath Thakur’s enlarged hereditary rights and service on the Morang frontier.',
  },
  {
    year: 1765,
    date: '1765',
    region: 'Bihar',
    title: 'Company receives the diwani',
    evidence: 'Dated documentary anchor',
    text: 'The East India Company receives the diwani of Bengal, Bihar, and Orissa, creating a new sovereign revenue claim.',
  },
  {
    year: 1793,
    date: '22 March 1793',
    region: 'Bihar',
    title: 'Permanent Settlement',
    evidence: 'Primary legal-administrative',
    text: 'The government revenue demand is fixed in perpetuity for recognized proprietors, while subordinate rents and social ranks remain unsettled.',
  },
  {
    year: 1816,
    date: '1815–16',
    region: 'India–Nepal borderland',
    title: 'Treaty of Sugauli',
    evidence: 'Treaty anchor',
    text: 'The treaty and its ratification reshape sovereignty and the modern boundary framework without erasing older regional connections.',
  },
  {
    year: 1875,
    date: '1 November 1875',
    region: 'North Bihar',
    title: 'Tirhut Railway opens',
    evidence: 'Official railway record',
    text: 'The Dalsinghsarai–Samastipur–Darbhanga famine line opens to public traffic after emergency construction.',
  },
  {
    year: 1917,
    date: '1917',
    region: 'Mithila',
    title: 'Institutional recognition of Maithili',
    evidence: 'University record',
    text: 'Calcutta University recognizes Maithili within higher study and as an MA examination language.',
  },
  {
    year: 1934,
    date: '15 January 1934',
    region: 'Bihar · Nepal',
    title: 'The Bihar–Nepal earthquake',
    evidence: 'Scientific and administrative',
    text: 'The earthquake devastates the cross-border region and prompts scientific field investigation and large-scale relief.',
  },
  {
    year: 1947,
    date: '15 August 1947',
    region: 'India · Nepal',
    title: 'Different political transitions',
    evidence: 'Political anchor',
    text: 'British rule ends in India while Rana oligarchy continues in Nepal, producing two transitions across one connected borderland.',
  },
  {
    year: 1950,
    date: '31 July 1950',
    region: 'India–Nepal borderland',
    title: 'Treaty of Peace and Friendship',
    evidence: 'Treaty anchor',
    text: 'The treaty establishes a consequential framework for residence, property, trade, and movement.',
  },
  {
    year: 1954,
    date: '25 April 1954',
    region: 'Kosi basin',
    title: 'India–Nepal Kosi Agreement',
    evidence: 'Bilateral agreement',
    text: 'The agreement authorizes a barrage, embankments, canals, protective works, and associated arrangements in Nepal.',
  },
  {
    year: 1966,
    date: '1965–68',
    region: 'Mithila',
    title: 'Mithila painting enters the paper market',
    evidence: 'Institutional and art-historical',
    text: 'Drought and food insecurity form the context for a handicrafts intervention; handmade paper reaches Madhubani and a new market develops.',
  },
  {
    year: 2004,
    date: '7 January 2004',
    region: 'India',
    title: 'Maithili enters the Eighth Schedule',
    evidence: 'Constitutional anchor',
    text: 'The Ninety-second Amendment gives Maithili constitutional recognition in India.',
  },
  {
    year: 2008,
    date: '18 August 2008',
    region: 'Kosi · Nepal · Bihar',
    title: 'Kusaha breach and Kosi avulsion',
    evidence: 'Contemporary disaster record',
    text: 'The eastern afflux embankment breaches in Sunsari and the Kosi shifts into an older channel belt, causing a transboundary disaster.',
  },
  {
    year: 2015,
    date: '20 September 2015',
    region: 'Nepal · Madhesh',
    title: 'Nepal’s federal constitution',
    evidence: 'Constitutional anchor',
    text: 'Federalism is institutionalized amid major Madhesh protests and disputes over representation and provincial design.',
  },
  {
    year: 2022,
    date: '2 April 2022',
    region: 'Jayanagar–Kurtha',
    title: 'Cross-border passenger rail returns',
    evidence: 'Official bilateral infrastructure',
    text: 'The broad-gauge passenger section restores India–Nepal railway connectivity in a new form.',
  },
  {
    year: 900,
    date: 'c. ninth–tenth centuries',
    region: 'Mithila intellectual world',
    title: 'Vācaspati Miśra and multi-school commentary',
    evidence: 'Textual and intellectual-historical',
    text: 'The Bhāmatī tradition forms part of a wider commentarial achievement spanning several schools of Indian philosophy.',
  },
  {
    year: 1000,
    date: 'c. tenth–eleventh centuries',
    region: 'Mithila',
    title: 'Udayanācārya’s argument tradition',
    evidence: 'Textual and intellectual-historical',
    text: 'Works including Ātmatattvaviveka and Nyāyakusumāñjali exemplify disciplined objection, response, and inference.',
  },
  {
    year: 1250,
    date: 'c. thirteenth century',
    region: 'Mithila',
    title: 'Gaṅgeśa and the Navya-Nyāya turn',
    evidence: 'Textual and intellectual-historical',
    text: 'Tattvacintāmaṇi becomes a foundational work in the new analytical language of logic and epistemology.',
  },
  {
    year: 1320,
    date: 'Early fourteenth century',
    region: 'Karnata Mithila',
    title: 'Jyotiriśvara and Varṇaratnākara',
    evidence: 'Literary-textual horizon',
    text: 'The work preserves a remarkable lexical and cultural panorama associated with the Karnata-period Maithili world.',
  },
  {
    year: 1400,
    date: 'Fourteenth–fifteenth centuries',
    region: 'Mithila',
    title: 'Vidyāpati’s multilingual literary world',
    evidence: 'Manuscript and literary traditions',
    text: 'Maithili songs, Sanskrit scholarship, courtly work, and legal memory require a plural rather than single-genre reading.',
  },
  {
    year: 1881,
    date: 'Late nineteenth century',
    region: 'Mithila · colonial linguistic survey',
    title: 'Maithili in modern linguistic classification',
    evidence: 'Colonial philology · critically contextualized',
    text: 'Grammars and surveys expanded print-era description while also imposing administrative categories that require criticism.',
  },
  {
    year: 1952,
    date: 'Mid-twentieth century',
    region: 'Mithila',
    title: 'Modern Maithili genres and institutions expand',
    evidence: 'Print and institutional record',
    text: 'Poetry, fiction, drama, criticism, journals, and literary organizations enlarge the modern public sphere.',
  },
  {
    year: 2004,
    date: '2004 onward',
    region: 'Videha digital archive',
    title: 'Videha Maithili eJournal and digital continuity',
    evidence: 'Digital publication archive',
    text: 'The eJournal creates a persistent space for Maithili writing, translation, criticism, new authors, and parallel historiography.',
  },
  {
    year: 2026,
    date: '2026',
    region: 'Mithila · Vajji · Anga',
    title: 'A cumulative research ecosystem',
    evidence: 'Current editorial programme',
    text: 'Connected history, Panji research, Parallel Philosophy, the hundred-volume literary history, and Sanskrit-to-Maithili translations are organized as one navigable research ecosystem.',
  },
].sort((a, b) => a.year - b.year);

const eras = [
  { name: 'Prehistory', from: -1800, to: -801 },
  { name: 'Ancient', from: -800, to: 599 },
  { name: 'Medieval', from: 600, to: 1525 },
  { name: 'Early modern', from: 1526, to: 1764 },
  { name: 'Colonial', from: 1765, to: 1946 },
  { name: 'Post-1950', from: 1947, to: 1999 },
  { name: 'Contemporary', from: 2000, to: 2026 },
];

const places = [
  {
    id: 'janakpur',
    name: 'Janakpur / Janakpurdham',
    country: 'Nepal',
    region: 'Mithila · Madhesh',
    period: 'Ancient memory to present',
    text: 'A major centre of Sita–Rama pilgrimage and living Mithila identity; modern localization must be distinguished from ancient textual geography.',
    links: 'Political ch. 6 · Social plan ch. 66, 72',
  },
  {
    id: 'simraongarh',
    name: 'Simraongarh',
    country: 'Nepal',
    region: 'Karnata Mithila',
    period: 'c. 11th–14th centuries',
    text: 'A fortified and hydraulic landscape associated with the Karnata polity and the cross-border plains of historical Mithila.',
    links: 'Political ch. 13',
  },
  {
    id: 'vaishali',
    name: 'Vaishali / Basarh',
    country: 'India',
    region: 'Vajji',
    period: 'Early historic to present',
    text: 'Archaeology, Buddhist and Jain traditions, and Gupta-period sealings make Vaishali a central but methodologically layered research site.',
    links: 'Political ch. 7, 9, 10 · Social ch. 13, 20, 21',
  },
  {
    id: 'kolhua',
    name: 'Kolhua',
    country: 'India',
    region: 'Vaishali',
    period: 'Mauryan and later',
    text: 'The uninscribed Ashokan pillar and monastic remains form a material anchor distinct from later constitutional legend.',
    links: 'Political ch. 7, 10',
  },
  {
    id: 'darbhanga',
    name: 'Darbhanga',
    country: 'India',
    region: 'Mithila',
    period: 'Early modern to contemporary',
    text: 'A major estate, educational, print, political, and cultural centre; Darbhanga Raj was a zamindari institution, not a princely state.',
    links: 'Political ch. 17–20',
  },
  {
    id: 'champa',
    name: 'Champa / Champanagar',
    country: 'India',
    region: 'Anga',
    period: 'Early historic and later',
    text: 'The Champanagar–Nathnagar archaeological zone near Bhagalpur preserves a multi-phase sequence and the remembered urban centre of Anga.',
    links: 'Political ch. 8 · Social ch. 14',
  },
  {
    id: 'bhagalpur',
    name: 'Bhagalpur',
    country: 'India',
    region: 'Anga corridor',
    period: 'Ancient to contemporary',
    text: 'A Ganga-connected centre of archaeology, silk, colonial administration, language history, and regional exchange.',
    links: 'Political ch. 8, 18, 24 · Social plan ch. 82',
  },
  {
    id: 'chirand',
    name: 'Chirand',
    country: 'India',
    region: 'Middle Ganga',
    period: 'Prehistory and protohistory',
    text: 'An excavated settlement used to study early food production and mixed subsistence, with explicit caution around radiocarbon stratigraphy.',
    links: 'Political ch. 2',
  },
  {
    id: 'munger',
    name: 'Munger / Mudgagiri',
    country: 'India',
    region: 'Anga–eastern Bihar',
    period: 'Early medieval to modern',
    text: 'A political and administrative node appearing in inscriptions, Mughal fiscal geography, and the eastern Ganga corridor.',
    links: 'Political ch. 12, 16',
  },
  {
    id: 'patna',
    name: 'Patna',
    country: 'India',
    region: 'Middle Ganga',
    period: 'Ancient to contemporary',
    text: 'A modern orientation point and institutional centre connecting the study region to wider Gangetic political and archival systems.',
    links: 'Political ch. 1, 17–20',
  },
  {
    id: 'purnia',
    name: 'Purnia',
    country: 'India',
    region: 'Eastern Mithila frontier',
    period: 'Colonial to contemporary',
    text: 'Settlement surveys, river history, mobility, and the eastern Kosi landscape make Purnia important to agrarian and environmental history.',
    links: 'Political ch. 18, 19, 26',
  },
  {
    id: 'birgunj',
    name: 'Raxaul–Birgunj corridor',
    country: 'India & Nepal',
    region: 'Borderland · Corridor',
    period: '19th century to present',
    text: 'A principal road, rail, customs, labour, and migration corridor whose formal infrastructure overlays older regional movement.',
    links: 'Political ch. 21, 23',
  },
  {
    id: 'janaki-mandir',
    name: 'Janaki Mandir',
    country: 'Nepal',
    region: 'Mithila · Temple architecture',
    period: 'Late 19th–early 20th century',
    text: 'Janakpur’s monumental pilgrimage architecture joins sacred geography, royal patronage, courtyards, ornament, and a living cross-border public culture.',
    links: 'Social plan ch. 66, 72 · architectural heritage dossier',
  },
  {
    id: 'raja-vishal',
    name: 'Raja Vishal ka Garh',
    country: 'India',
    region: 'Vajji · Archaeological landscape',
    period: 'Early historic attribution · layered site',
    text: 'A large fortified or enclosed archaeological mound at Basarh often associated with Vaishali’s assembly memory; function and dating must be argued from excavation rather than legend alone.',
    links: 'Political ch. 7, 10 · Social ch. 13',
  },
  {
    id: 'abhishek-pushkarini',
    name: 'Abhishek Pushkarini and Vaishali relic landscape',
    country: 'India',
    region: 'Vajji · Water and ritual architecture',
    period: 'Early historic memory to later commemoration',
    text: 'Tank, stupa, monastery, and modern memorial elements demonstrate how archaeology and commemorative architecture accumulate in one landscape.',
    links: 'Political ch. 7, 9, 10',
  },
  {
    id: 'vikramashila',
    name: 'Vikramashila Mahavihara',
    country: 'India',
    region: 'Anga corridor · Monastic university',
    period: 'c. 8th–12th centuries',
    text: 'The excavated cruciform monastery and teaching complex near the Ganga anchors Anga’s place in wider Buddhist intellectual and architectural networks.',
    links: 'Political ch. 12 · Social plan ch. 20, 71',
  },
  {
    id: 'mandar',
    name: 'Mandar Hill',
    country: 'India',
    region: 'Anga · Sacred landscape',
    period: 'Long-duration sacred geography',
    text: 'Rock, water, temple, Jain and Hindu associations make Mandar a layered landscape whose traditions must be separated by period and source.',
    links: 'Political ch. 8 · Social plan ch. 14, 66',
  },
  {
    id: 'rajnagar',
    name: 'Rajnagar Palace complex',
    country: 'India',
    region: 'Mithila · Palace and temple ruins',
    period: 'Early 20th century',
    text: 'Palace, temple, garden, and earthquake-damaged remains offer a material entry into Darbhanga Raj patronage, architectural eclecticism, and the 1934 disaster.',
    links: 'Political ch. 17, 19 · built-heritage dossier',
  },
  {
    id: 'darbhanga-raj',
    name: 'Darbhanga Raj campus and palaces',
    country: 'India',
    region: 'Mithila · Estate architecture',
    period: '19th–20th centuries',
    text: 'Palatial, administrative, educational, and religious buildings document estate power, philanthropy, institutional reuse, and changing urban memory.',
    links: 'Political ch. 17–20',
  },
  {
    id: 'kandaha',
    name: 'Kandaha Sun Temple',
    country: 'India',
    region: 'Mithila · Temple and inscription',
    period: 'Dated 1453 inscriptional horizon',
    text: 'The temple and Narasimha inscription provide a firm late-medieval anchor for patronage, sacred architecture, and regional chronology.',
    links: 'Political ch. 14 · chronology anchor 1453',
  },
  {
    id: 'dhanushadham',
    name: 'Dhanushadham',
    country: 'Nepal',
    region: 'Mithila · Pilgrimage landscape',
    period: 'Living tradition',
    text: 'A pilgrimage centre in the Janakpur cultural region, important for studying how epic memory is localized, renewed, and moved through modern routes.',
    links: 'Social plan ch. 66, 72',
  },
  {
    id: 'jaleshwar',
    name: 'Jaleshwar',
    country: 'Nepal',
    region: 'Mithila · Temple town',
    period: 'Historic and living sacred centre',
    text: 'A cross-border pilgrimage and market centre whose sacred architecture belongs to the living geography of Mithila rather than a frozen ancient map.',
    links: 'Social plan ch. 66, 72, 89',
  },
  {
    id: 'balirajgarh',
    name: 'Balirajgarh',
    country: 'India',
    region: 'Mithila · Fortified archaeological site',
    period: 'Early historic to early medieval layers',
    text: 'Fortification, mounds, and excavated remains make the site important for settlement and political archaeology; traditional identification is kept distinct from material dating.',
    links: 'Political ch. 4, 10, 12',
  },
  {
    id: 'nandangarh',
    name: 'Lauriya Nandangarh',
    country: 'India',
    region: 'North Bihar · Monumental corridor',
    period: 'Mauryan and earlier/later layers',
    text: 'Ashokan pillar, mound, and surrounding archaeology establish a monumental north-Bihar corridor linked to but not identical with the histories of Vajji and Mithila.',
    links: 'Political ch. 10',
  },
  {
    id: 'munger-fort',
    name: 'Munger Fort',
    country: 'India',
    region: 'Anga–eastern Bihar · Fortification',
    period: 'Medieval to colonial rebuilding',
    text: 'A strategic Ganga fort whose layered fabric helps connect military, administrative, commercial, and colonial histories of the eastern corridor.',
    links: 'Political ch. 12, 16–18',
  },
];

const visualGallery = [
  {
    src: './assets/library/parallel-philosophy-cover.png',
    alt: 'Cover of Gajendra Thakur’s Parallel Philosophy',
    title: 'Parallel Philosophy',
    note: 'Cover embedded in the supplied manuscript',
  },
  {
    src: './assets/library/parallel-history-cover.png',
    alt: 'Cover of A Parallel History of Mithila and Maithili Literature',
    title: 'Parallel History · Volumes 1–100',
    note: 'Cover embedded in the supplied manuscript',
  },
  {
    src: './assets/library/archive-portrait-pencil.png',
    alt: 'Pencil portrait reproduced in the Parallel History manuscript',
    title: 'Portrait from the literary archive',
    note: 'Embedded archival illustration; identification follows the manuscript context',
  },
  {
    src: './assets/library/archive-portrait-ink.png',
    alt: 'Ink portrait reproduced in the Parallel History manuscript',
    title: 'Author portrait from the archive',
    note: 'Embedded archival illustration',
  },
  {
    src: './assets/library/maithili-prose-page.png',
    alt: 'Reproduced page of Maithili prose',
    title: 'Maithili prose witness',
    note: 'Page image embedded in the Parallel History manuscript',
  },
  {
    src: './assets/library/maithili-poetry-page.png',
    alt: 'Reproduced page of Maithili poetry',
    title: 'Maithili verse witness',
    note: 'Page image embedded in the Parallel History manuscript',
  },
];

const sourceGroups = [
  {
    title: 'Archaeology and environment',
    examples:
      'Excavation reports · radiocarbon series · archaeobotany · geomorphology',
    rule: 'Material sequence does not automatically identify ethnicity, polity, or a textual event.',
  },
  {
    title: 'Texts and philology',
    examples: 'Vedic · Upanishadic · Buddhist · Jain · epic · literary corpora',
    rule: 'Composition, recension, transmission, genre, and remembered geography are evaluated separately.',
  },
  {
    title: 'Inscriptions, coins and manuscripts',
    examples: 'Copper plates · pillars · sealings · coinage · colophons',
    rule: 'Dated objects anchor claims, while panegyric and institutional purpose still require interpretation.',
  },
  {
    title: 'Archives and law',
    examples:
      'Revenue records · settlement reports · treaties · statutes · gazetteers',
    rule: 'Official records document administration and classification, not neutral or total descriptions of society.',
  },
  {
    title: 'Living and modern evidence',
    examples:
      'Census · oral traditions · ethnography · photographs · statistics',
    rule: 'Modern identity, memory, and administrative categories are not projected backward without period evidence.',
  },
];
const formatYear = (year: number) =>
  year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;

const globalSearchRecords: GlobalSearchRecord[] = [
  ...people.map((person) => ({ id: `global-person-${person.id}`, title: person.name, kind: 'People' as const, meta: `${person.field} · ${person.era}`, text: person.description, route: 'people' as const, ref: person.id })),
  ...chapters.map((chapter) => ({ id: `global-history-${chapter.id}`, title: chapter.title, kind: 'Histories' as const, meta: `${chapter.collection} · ${chapter.volume} · ${chapter.status}`, text: `${chapter.summary} ${chapter.sections.join(' ')}`, route: 'chapters' as const, ref: chapter.id })),
  ...ideas.map((idea) => ({ id: `global-idea-${idea.id}`, title: idea.title, kind: 'Ideas' as const, meta: `${idea.volume} · ${idea.status}`, text: `${idea.summary} ${idea.purvapaksha ?? ''} ${idea.uttarapaksha ?? ''}`, route: 'ideas' as const, ref: idea.id })),
  ...works.map((work) => ({ id: `global-work-${work.id}`, title: work.title, kind: 'Texts' as const, meta: `${work.sequence} · ${work.shelf}`, text: `${work.description} ${work.structure.join(' ')}`, route: 'library' as const, ref: work.id })),
  ...places.map((place) => ({ id: `global-place-${place.id}`, title: place.name, kind: 'Places' as const, meta: `${place.country} · ${place.region}`, text: `${place.text} ${place.period}`, route: 'places' as const, ref: place.id })),
  ...chronology.map((item, index) => ({ id: `global-chronology-${index}`, title: item.title, kind: 'Chronology' as const, meta: `${item.date} · ${item.region}`, text: `${item.text} ${item.evidence}`, route: 'chronology' as const, year: item.year })),
  ...learningData.places.map((place) => ({ id: `global-map-${place.id}`, title: place.name, kind: 'Places' as const, meta: `${place.admin} · ${place.countryCode} · sourced map record`, text: `${place.context} ${place.frame}`, route: 'historical-map' as const })),
  ...learningData.panji.map((entry) => ({ id: `global-panji-${entry.id}`, title: entry.heading, kind: 'Texts' as const, meta: `${entry.volume} · Panji manuscript heading`, text: `${entry.context} ${entry.canSupport}`, route: 'panji' as const })),
  ...learningData.comparators.map((entry) => ({ id: `global-concept-${entry.id}`, title: entry.name, kind: 'Ideas' as const, meta: 'Parallel Philosophy comparison', text: `${entry.question} ${entry.purvapaksha} ${entry.uttarapaksha} ${entry.synthesis}`, route: 'knowledge-graph' as const })),
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chronology');
  const [year, setYear] = useState(-550);
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('All collections');
  const [volume, setVolume] = useState('All volumes');
  const [status, setStatus] = useState('All statuses');
  const [shelf, setShelf] = useState('All shelves');
  const [ideaStatus, setIdeaStatus] = useState('All ideas');
  const [selectedChapter, setSelectedChapter] = useState('political-7');
  const [selectedPlace, setSelectedPlace] = useState('vaishali');
  const [selectedWork, setSelectedWork] = useState('panji-1');
  const [selectedPerson, setSelectedPerson] = useState('figure-1');
  const [selectedIdea, setSelectedIdea] = useState('philosophy-1');
  const [coverIndex, setCoverIndex] = useState(0);
  const [coverCategory, setCoverCategory] = useState('All');
  const [coverPlaying, setCoverPlaying] = useState(true);
  const [siteListening, setSiteListening] = useState(false);
  const [listenStatus, setListenStatus] = useState('');
  const [currentJourney, setCurrentJourney] = useState('doors');
  const [assistiveOpen, setAssistiveOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translationTarget, setTranslationTarget] = useState('mai');
  const [assistivePrefs, setAssistivePrefs] = useState(defaultAssistivePrefs);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalKind, setGlobalKind] = useState('All');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const speechQueueRef = useRef<string[]>([]);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechRunRef = useRef(0);
  const shownCovers = useMemo(
    () =>
      coverCategory === 'All'
        ? covers
        : covers.filter((cover) => cover.category === coverCategory),
    [coverCategory],
  );
  const currentCover = shownCovers[coverIndex] ?? shownCovers[0];
  useEffect(() => {
    if (
      !coverPlaying ||
      shownCovers.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setInterval(
      () => setCoverIndex((index) => (index + 1) % shownCovers.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, [coverPlaying, shownCovers.length]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mvaAssistivePrefs');
      if (saved) {
        const parsed = { ...defaultAssistivePrefs, ...JSON.parse(saved) };
        queueMicrotask(() => setAssistivePrefs(parsed));
      }
    } catch {}
  }, []);
  useEffect(() => {
    const classes = {
      'contrast-dark': assistivePrefs.contrast === 'dark',
      'contrast-light': assistivePrefs.contrast === 'light',
      'filter-gray': assistivePrefs.filter === 'gray',
      'filter-invert': assistivePrefs.filter === 'invert',
      'extra-spacing': assistivePrefs.spacing,
      'readable-width': assistivePrefs.readableWidth,
      'highlight-links': assistivePrefs.highlightLinks,
      'hide-images': assistivePrefs.hideImages,
      'stop-motion': assistivePrefs.stopMotion,
      'large-targets': assistivePrefs.largeTargets,
      'large-cursor': assistivePrefs.largeCursor,
      'reader-view': assistivePrefs.readerView,
    };
    document.documentElement.style.fontSize = `${assistivePrefs.scale}%`;
    Object.entries(classes).forEach(([name, enabled]) =>
      document.body.classList.toggle(name, enabled),
    );
    try {
      localStorage.setItem('mvaAssistivePrefs', JSON.stringify(assistivePrefs));
    } catch {}
    return () => {
      document.documentElement.style.fontSize = '';
      Object.keys(classes).forEach((name) => document.body.classList.remove(name));
    };
  }, [assistivePrefs]);
  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        globalSearchRef.current?.focus();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  useEffect(() => () => {
    speechRunRef.current += 1;
    window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => {
    const sections = journeySections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
        if (current?.target.id) setCurrentJourney(current.target.id);
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.1, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  const updateAssistive = <K extends keyof AssistivePrefs>(
    key: K,
    value: AssistivePrefs[K],
  ) => setAssistivePrefs((current) => ({ ...current, [key]: value }));
  const listenToPage = () => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setListenStatus('Listen is not supported by this browser.');
      return;
    }
    if (siteListening) {
      speechRunRef.current += 1;
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];
      speechUtteranceRef.current = null;
      setSiteListening(false);
      setListenStatus('Reading stopped.');
      return;
    }
    const text = (document.querySelector('main')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) {
      setListenStatus('No readable page text was found.');
      return;
    }
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
    const chunks: string[] = [];
    sentences.forEach((sentence) => {
      const cleaned = sentence.trim();
      const previous = chunks.at(-1);
      if (previous && previous.length + cleaned.length + 1 <= 1100) {
        chunks[chunks.length - 1] = `${previous} ${cleaned}`;
      } else if (cleaned.length <= 1100) {
        chunks.push(cleaned);
      } else {
        for (let start = 0; start < cleaned.length; start += 1000) {
          chunks.push(cleaned.slice(start, start + 1000));
        }
      }
    });
    speechRunRef.current += 1;
    const run = speechRunRef.current;
    speechQueueRef.current = chunks;
    window.speechSynthesis.cancel();
    const speakNext = () => {
      if (speechRunRef.current !== run) return;
      const chunk = speechQueueRef.current.shift();
      if (!chunk) {
        speechUtteranceRef.current = null;
        setSiteListening(false);
        setListenStatus('Reading finished.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunk);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === 'en-in')
        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
        ?? null;
      utterance.lang = utterance.voice?.lang ?? 'en-IN';
      utterance.rate = 0.9;
      utterance.onend = speakNext;
      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') return;
        speechQueueRef.current = [];
        speechUtteranceRef.current = null;
        setSiteListening(false);
        setListenStatus('Reading could not continue. Please try Listen again.');
      };
      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };
    setSiteListening(true);
    setListenStatus('Reading the page aloud. Select Listen again to stop.');
    window.setTimeout(speakNext, 50);
  };
  const openTranslation = (target = translationTarget) => {
    const current = new URL(window.location.href);
    const translatedHost = `${current.hostname.replace(/-/g, '--').replace(/\./g, '-')}.translate.goog`;
    const separator = current.search ? '&' : '?';
    const translated = `https://${translatedHost}${current.pathname}${current.search}${separator}_x_tr_sl=en&_x_tr_tl=${encodeURIComponent(target)}&_x_tr_hl=${encodeURIComponent(target)}&_x_tr_pto=wapp`;
    const opened = window.open(translated, '_blank', 'noopener,noreferrer');
    if (!opened) window.open(translated, '_self');
  };
  const nearestIndex = useMemo(
    () =>
      chronology.reduce(
        (best, item, index) =>
          Math.abs(item.year - year) < Math.abs(chronology[best].year - year)
            ? index
            : best,
        0,
      ),
    [year],
  );
  const selectedEvent = chronology[nearestIndex];
  const selectedEra =
    eras.find((era) => year >= era.from && year <= era.to) ?? eras[0];
  const volumeOptions = useMemo(
    () => [
      'All volumes',
      ...Array.from(
        new Set(
          chapters
            .filter(
              (c) =>
                collection === 'All collections' || c.collection === collection,
            )
            .map((c) => c.volume),
        ),
      ),
    ],
    [collection],
  );
  const filteredChapters = useMemo(
    () =>
      chapters.filter(
        (c) =>
          (collection === 'All collections' || c.collection === collection) &&
          (volume === 'All volumes' || c.volume === volume) &&
          (status === 'All statuses' || c.status === status) &&
          `${c.title} ${c.part} ${c.summary} ${c.sections.join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [collection, volume, status, query],
  );
  const filteredPlaces = useMemo(
    () =>
      places.filter((p) =>
        `${p.name} ${p.country} ${p.region} ${p.text}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const filteredChronology = useMemo(
    () =>
      chronology.filter(
        (item) =>
          item.year >= selectedEra.from &&
          item.year <= selectedEra.to &&
          `${item.title} ${item.region} ${item.text}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [selectedEra, query],
  );
  const filteredWorks = useMemo(
    () =>
      works.filter(
        (work) =>
          (shelf === 'All shelves' || work.shelf === shelf) &&
          `${work.title} ${work.subtitle} ${work.description} ${work.structure.join(' ')} ${(collectionDetails[work.id]?.items ?? []).map((item) => item.title).join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [shelf, query],
  );
  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        `${person.name} ${person.field} ${person.era} ${person.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const filteredIdeas = useMemo(
    () =>
      ideas.filter(
        (item) =>
          (ideaStatus === 'All ideas' ||
            (ideaStatus === 'Available' && item.status !== 'Planned') ||
            item.status === ideaStatus) &&
          `${item.title} ${item.part} ${item.summary} ${item.purvapaksha ?? ''} ${item.uttarapaksha ?? ''} ${item.sections.join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [ideaStatus, query],
  );
  const globalResults = useMemo(() => {
    const needle = globalQuery.trim().toLowerCase();
    if (needle.length < 2) return [];
    return globalSearchRecords
      .filter((record) => globalKind === 'All' || record.kind === globalKind)
      .map((record) => {
        const title = record.title.toLowerCase();
        const haystack = `${record.title} ${record.meta} ${record.text}`.toLowerCase();
        const score = title === needle ? 100 : title.startsWith(needle) ? 50 : title.includes(needle) ? 25 : haystack.includes(needle) ? 5 : 0;
        return { record, score };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
      .slice(0, 18)
      .map((result) => result.record);
  }, [globalKind, globalQuery]);
  const chapterDetail =
    chapters.find((c) => c.id === selectedChapter) ?? chapters[0];
  const placeDetail = places.find((p) => p.id === selectedPlace) ?? places[0];
  const workDetail = works.find((work) => work.id === selectedWork) ?? works[0];
  const personDetail =
    people.find((person) => person.id === selectedPerson) ?? people[0];
  const ideaDetail =
    ideas.find((item) => item.id === selectedIdea) ?? ideas[0];
  const materialDetail = collectionDetails[selectedWork];
  const changeEvent = (direction: number) => {
    const next = Math.max(
      0,
      Math.min(chronology.length - 1, nearestIndex + direction),
    );
    setYear(chronology[next].year);
  };
  const chooseTab = (tab: Tab) => {
    setActiveTab(tab);
    setQuery('');
    requestAnimationFrame(() =>
      document
        .getElementById('explorer')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };
  const openGlobalResult = (record: GlobalSearchRecord) => {
    setGlobalSearchOpen(false);
    if (record.route === 'historical-map' || record.route === 'knowledge-graph') {
      document
        .getElementById(record.route === 'historical-map' ? 'wing-2' : 'wing-3')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (record.route === 'panji') {
      openShelf('Decoding the Panji', 'panji-1');
      return;
    }
    if (record.route === 'people' && record.ref) setSelectedPerson(record.ref);
    if (record.route === 'chapters' && record.ref) setSelectedChapter(record.ref);
    if (record.route === 'ideas' && record.ref) setSelectedIdea(record.ref);
    if (record.route === 'places' && record.ref) setSelectedPlace(record.ref);
    if (record.route === 'library' && record.ref) setSelectedWork(record.ref);
    if (record.route === 'chronology' && typeof record.year === 'number') setYear(record.year);
    chooseTab(record.route);
  };
  const handleResearchTabKeys = (event: KeyboardEvent<HTMLButtonElement>, current: Tab) => {
    const tabs: Tab[] = ['chronology', 'places', 'chapters', 'library', 'people', 'ideas', 'sources'];
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabs.indexOf(current);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    chooseTab(tabs[nextIndex]);
    requestAnimationFrame(() => document.getElementById(`research-tab-${tabs[nextIndex]}`)?.focus());
  };
  const openWork = (id: string) => {
    setActiveTab('library');
    setSelectedWork(id);
    setQuery('');
    requestAnimationFrame(() =>
      document
        .getElementById('explorer')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };
  const openShelf = (name: string, id?: string) => {
    setShelf(name);
    if (id) openWork(id);
    else {
      setActiveTab('library');
      setQuery('');
      requestAnimationFrame(() =>
        document
          .getElementById('explorer')
          ?.scrollIntoView({ behavior: 'smooth' }),
      );
    }
  };
  const changeCover = (direction: number) => {
    setCoverIndex(
      (index) => (index + direction + shownCovers.length) % shownCovers.length,
    );
  };
  const chooseCoverCategory = (category: string) => {
    setCoverCategory(category);
    setCoverIndex(0);
  };
  const openCoverCollection = (cover: Cover) => {
    if (cover.title === 'A History of Mithila, Vajji and Anga') {
      chooseTab('chapters');
      return;
    }
    if (
      cover.title === 'A Parallel History of Mithilā and Maithilī Literature'
    ) {
      openShelf('Parallel Research', 'parallel-history');
      return;
    }
    if (cover.title.includes('Parallel Philosophy')) {
      openShelf('Parallel Research', 'parallel-philosophy');
      return;
    }
    if (cover.title === 'Decoding the Panji of Mithila') {
      const roman = cover.sequence.replace('Volume ', '');
      const volumeNumber =
        ['I', 'II', 'III', 'IV', 'V', 'VI'].indexOf(roman) + 1;
      openShelf('Decoding the Panji', `panji-${Math.max(1, volumeNumber)}`);
      return;
    }
    const translationIds: Record<string, string> = {
      Ātmatattvaviveka: 'atmatattvaviveka',
      Bhāmatī: 'bhamati',
      Nyāyakusumāñjali: 'nyayakusumanjali',
      Tattvacintāmaṇi: 'tattvacintamani',
      'Videha Philosophical Translations': 'atmatattvaviveka',
    };
    openShelf(
      'Sanskrit–Maithili Philosophical Texts',
      translationIds[cover.title] ?? 'atmatattvaviveka',
    );
  };

  return (
    <>
      <a className="skip-link" href="#doors">
        Skip to the four research doors
      </a>
      <header className="topbar">
        <a
          className="identity"
          href="#top"
          aria-label="Mithila–Vajji–Anga home"
        >
          <span className="mark" aria-hidden="true">
            𑒧
          </span>
          <span>
            <strong>Mithila–Vajji–Anga</strong>
            <small>Videha historical research</small>
          </span>
        </a>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? 'open' : ''} aria-label="Primary navigation">
          <a href="#doors">Start</a>
          <a href="#archive-search">Search</a>
          <a href="#explorer">Browse archive</a>
          <a href="#research-wing">Research rooms</a>
          <a href="./updates/index.html">Status &amp; updates</a>
          <a href="#about">About</a>
        </nav>
        <a className="videha-home" href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Videha <ExternalLink size={15} /></a>
      </header>

      <div className="videha-tools" aria-label="Videha accessibility tools">
        <button onClick={listenToPage} aria-pressed={siteListening}>
          {siteListening ? <Pause /> : <Volume2 />} सुनू · Listen
        </button>
        <output className="sr-only" aria-live="polite">{listenStatus}</output>
        <button onClick={() => setTranslateOpen(!translateOpen)} aria-expanded={translateOpen} aria-controls="mva-translate-panel">
          <Languages /> Translate with AI <span>(ए.आइ. द्वारा अनुवाद करू)</span>
        </button>
        {translateOpen && (
          <dialog open className="translate-panel" id="mva-translate-panel" aria-label="Choose translation language">
            <div className="tool-panel-heading"><strong>Translate this English page</strong><button onClick={() => setTranslateOpen(false)} aria-label="Close translator"><X /></button></div>
            <p><b>Source language:</b> English · <b>41 target languages</b></p>
            <div className="translate-quick">
              {[['mai','Maithili'],['hi','Hindi'],['bn','Bengali'],['ne','Nepali']].map(([code, label]) => <button key={code} onClick={() => openTranslation(code)}>{label}</button>)}
            </div>
            <label>
              <span>Translate into</span>
              <select value={translationTarget} onChange={(event) => setTranslationTarget(event.target.value)}>
                {translationLanguages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </label>
            <button className="translate-go" onClick={() => openTranslation()}>Translate in a new tab</button>
            <small>Free machine translation may contain errors. The original English page remains authoritative.</small>
          </dialog>
        )}
        <button onClick={() => setAssistiveOpen(!assistiveOpen)} aria-expanded={assistiveOpen}>
          <Accessibility /> सहायक तकनीक · Assistive Tech
        </button>
        {assistiveOpen && (
          <dialog open className="assistive-panel" aria-label="Assistive technology settings">
            <div className="tool-panel-heading"><strong>सहायक तकनीक · Assistive Tech</strong><button onClick={() => setAssistiveOpen(false)} aria-label="Close assistive technology settings"><X /></button></div>
            <h4>Vision</h4>
            <div className="assistive-row"><span>Text size</span><div><button onClick={() => updateAssistive('scale', Math.max(80, assistivePrefs.scale - 10))}>A−</button><b>{assistivePrefs.scale}%</b><button onClick={() => updateAssistive('scale', Math.min(200, assistivePrefs.scale + 10))}>A+</button></div></div>
            <div className="assistive-row"><span>High contrast</span><div>{([['off','Normal'],['dark','Dark'],['light','Light']] as const).map(([mode,label]) => <button key={mode} aria-pressed={assistivePrefs.contrast === mode} onClick={() => updateAssistive('contrast', mode)}>{label}</button>)}</div></div>
            <div className="assistive-row"><span>Colour filter</span><div>{([['off','Normal'],['gray','Gray'],['invert','Invert']] as const).map(([mode,label]) => <button key={mode} aria-pressed={assistivePrefs.filter === mode} onClick={() => updateAssistive('filter', mode)}>{label}</button>)}</div></div>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.hideImages} onClick={() => updateAssistive('hideImages', !assistivePrefs.hideImages)}>Hide images</button>
            <h4>Reading and cognition</h4>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.readerView} onClick={() => updateAssistive('readerView', !assistivePrefs.readerView)}>Reader view</button>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.spacing} onClick={() => updateAssistive('spacing', !assistivePrefs.spacing)}>Increase line, word, and letter spacing</button>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.readableWidth} onClick={() => updateAssistive('readableWidth', !assistivePrefs.readableWidth)}>Readable line width</button>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.highlightLinks} onClick={() => updateAssistive('highlightLinks', !assistivePrefs.highlightLinks)}>Highlight links</button>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.stopMotion} onClick={() => updateAssistive('stopMotion', !assistivePrefs.stopMotion)}>Stop animation and motion</button>
            <h4>Motor and screen-reader support</h4>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.largeTargets} onClick={() => updateAssistive('largeTargets', !assistivePrefs.largeTargets)}>Large buttons and links</button>
            <button className="assistive-toggle" aria-pressed={assistivePrefs.largeCursor} onClick={() => updateAssistive('largeCursor', !assistivePrefs.largeCursor)}>Large cursor</button>
            <button className="assistive-toggle" onClick={listenToPage}>Read the complete page aloud</button>
            <a href="https://www.nvaccess.org/download/" target="_blank" rel="noreferrer">Download free NVDA screen reader <ExternalLink /></a>
            <a href="https://www.videha.co.in/script-converter.html" target="_blank" rel="noreferrer">Devanagari ↔ Braille converter <ExternalLink /></a>
            <button className="assistive-reset" onClick={() => setAssistivePrefs(defaultAssistivePrefs)}>Reset all settings</button>
            <small>Preferences are saved on this device. The site remains keyboard-operable and uses semantic landmarks.</small>
          </dialog>
        )}
      </div>

      <aside className="journey-nav" aria-label="Page sections">
        <p>
          <span>You are in</span>
          <strong>{journeySections.find((section) => section.id === currentJourney)?.label}</strong>
          <small><span>Section </span>{journeySections.findIndex((section) => section.id === currentJourney) + 1}/{journeySections.length}</small>
        </p>
        <nav aria-label="Jump to a page section">
          {journeySections.map((section, index) => (
            <a key={section.id} href={`#${section.id}`} className={currentJourney === section.id ? 'active' : ''} aria-current={currentJourney === section.id ? 'location' : undefined}>
              <b>{index + 1}</b><span>{section.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main id="top">
        <section className="intro">
          <div>
            <p className="eyebrow">SOURCE-CONTROLLED REGIONAL ATLAS</p>
            <h1>Explore Mithila, Vajji and Anga</h1>
            <p>
              A guided entrance to the Videha archive: genealogy, regional
              history, philosophical debate, texts, and translation across
              India and Nepal. Choose a research question first; the archive
              will then lead you to the relevant evidence, chapter, or tool.
            </p>
            <nav className="intro-actions" aria-label="Four direct research paths">
              <a href="#wing-1"><b>01</b> Genealogy</a>
              <a href="#explorer"><b>02</b> History</a>
              <a href="#wing-3"><b>03</b> Debate</a>
              <a href="#wing-4"><b>04</b> Texts</a>
              <a className="intro-search" href="#archive-search"><Search /> Search archive</a>
            </nav>
          </div>
          <aside className="archive-method">
            <strong>How to read this archive</strong>
            <p>Entries distinguish supplied text, editorial interpretation, inferred discovery links, and planned material. Dates, map points, and contested claims carry source or method notes so they can be checked rather than merely accepted.</p>
            <a href="./sources/index.html">Read the evidentiary method <ChevronRight /></a>
          </aside>
        </section>

        <section className="research-studio" id="doors" aria-labelledby="studio-title">
          <div className="studio-visual">
            <Image
              unoptimized
              src="./assets/research-studio-panorama.png"
              width={1944}
              height={808}
              alt="Illustrated research panorama: Panji decoding, philosophical debate, manuscript translation and the India–Nepal landscape"
            />
          </div>
          <div className="studio-copy">
            <p>THE VIDEHA RESEARCH STUDIO</p>
            <h2 id="studio-title">Four doors into one archive</h2>
            <p className="studio-introduction">Choose the question closest to yours. Each door leads to specialist tools without requiring you to understand the archive’s full structure first.</p>
            <div className="studio-doors">
              <article><button onClick={() => openShelf('Decoding the Panji', 'panji-1')}><b>01</b><span><strong>Read genealogy</strong><small>Decode people, lineages, villages, and marriage relations</small></span></button><nav aria-label="Genealogy paths"><a href="#wing-1">Six Panji volumes</a><a href="#learning-lab">Panji laboratory</a></nav></article>
              <article><button onClick={() => chooseTab('chronology')}><b>02</b><span><strong>Follow history</strong><small>Move from dated evidence to chapters and changing landscapes</small></span></button><nav aria-label="History paths"><a href="#explorer">178 chapters</a><a href="#wing-2">Historical map</a><a href="./sources/index.html">Cited records</a></nav></article>
              <article><button onClick={() => chooseTab('ideas')}><b>03</b><span><strong>Enter a debate</strong><small>Compare Pūrvapakṣa, Uttarapakṣa, and parallel conclusions</small></span></button><nav aria-label="Debate paths"><a href="#wing-3">Knowledge graph</a><a href="#wing-4">Multiscript reader</a></nav></article>
              <article><button onClick={() => openShelf('Sanskrit–Maithili Philosophical Texts', 'atmatattvaviveka')}><b>04</b><span><strong>Work with texts</strong><small>Open translations, books, teaching material, and source practice</small></span></button><nav aria-label="Text and learning paths"><a href="#wing-5">Classroom</a><a href="#learning-lab">Research practice</a><a href="#cover-showcase">Library</a></nav></article>
            </div>
          </div>
        </section>

        <section className="global-search" id="archive-search" aria-labelledby="archive-search-title">
          <div className="global-search-heading">
            <div>
              <p className="eyebrow">ONE SEARCH · THE WHOLE ARCHIVE</p>
              <h2 id="archive-search-title">Find a person, place, text, chapter, or idea</h2>
              <p>Try “Vidyapati”, “Vaiśālī”, “Panji”, or “Nyāya”. Results open in the relevant research path.</p>
            </div>
            <span><Search /> Search across {globalSearchRecords.length.toLocaleString()} indexed records</span>
          </div>
          <div className="global-search-box">
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="global-archive-search">Search the complete Videha archive</label>
            <input
              id="global-archive-search"
              ref={globalSearchRef}
              value={globalQuery}
              onFocus={() => setGlobalSearchOpen(true)}
              onChange={(event) => { setGlobalQuery(event.target.value); setGlobalSearchOpen(true); }}
              onKeyDown={(event) => { if (event.key === 'Escape') setGlobalSearchOpen(false); if (event.key === 'Enter' && globalResults[0]) openGlobalResult(globalResults[0]); }}
              placeholder="Search across the full archive…"
              role="combobox"
              aria-expanded={globalSearchOpen && globalQuery.trim().length >= 2}
              aria-controls="global-search-results"
              aria-autocomplete="list"
            />
            <kbd>Ctrl K</kbd>
          </div>
          <div className="global-search-facets" aria-label="Limit global search by record type">
            {['All', 'People', 'Histories', 'Ideas', 'Places', 'Texts', 'Chronology'].map((kind) => <button key={kind} aria-pressed={globalKind === kind} onClick={() => setGlobalKind(kind)}>{kind}</button>)}
          </div>
          {globalSearchOpen && globalQuery.trim().length >= 2 && (
            <div className="global-search-results" id="global-search-results" aria-label="Archive search results">
              <output aria-live="polite">{globalResults.length ? `${globalResults.length} best matches` : 'No matching records'}</output>
              {globalResults.map((record) => (
                <button key={record.id} onClick={() => openGlobalResult(record)}>
                  <span>{record.kind}</span><strong>{record.title}</strong><small>{record.meta}</small><ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="project-status" id="project-status" aria-labelledby="project-status-title">
          <div><p className="eyebrow">A LIVING, SOURCE-CONTROLLED ARCHIVE</p><h2 id="project-status-title">Clear about what is complete—and what comes next</h2></div>
          <dl><div><dt>History</dt><dd>{completedHistoryCount} complete · {plannedHistoryCount} planned</dd></div><div><dt>Ideas</dt><dd>{completedIdeaCount} complete · {plannedIdeaCount} planned</dd></div><div><dt>Last updated</dt><dd><time dateTime="2026-09-05">5 September 2026</time></dd></div></dl>
          <p className="count-key"><strong>Count key:</strong> 178 histories and 172 ideas are editorial chapter catalogues. The Knowledge Graph counts a different unit—880 searchable nodes, including 244 idea nodes made from debate chapters and extracted comparison concepts. “People” and “figures” both refer to the same 138-record biographical index.</p>
          <a href="./updates/index.html">Read the changelog and roadmap <ChevronRight /></a>
        </section>

        <ResearchExpansion />

        <LearningLab />

        <section
          className="cover-showcase"
          id="cover-showcase"
          aria-labelledby="cover-showcase-title"
        >
          <div className="cover-introduction">
            <p>THE VIDEHA LIBRARY</p>
            <h2 id="cover-showcase-title">The books behind the archive</h2>
            <p>
              Browse the covers of the histories, Panji studies, philosophical
              research, and Sanskrit–Maithili translations that sustain this
              growing digital research environment.
            </p>
            <div className="cover-filters" aria-label="Filter book covers">
              {coverCategories.map((category) => (
                <button
                  key={category}
                  className={coverCategory === category ? 'active' : ''}
                  aria-pressed={coverCategory === category}
                  onClick={() => chooseCoverCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <section
            className="cover-carousel"
            aria-roledescription="carousel"
            aria-label="Book cover slideshow"
          >
            <div className="cover-stage">
              <button
                className="cover-arrow previous"
                onClick={() => changeCover(-1)}
                aria-label="Previous book cover"
              >
                <ChevronLeft />
              </button>
              <figure key={currentCover.src}>
                <div
                  className={`cover-image ${currentCover.width > currentCover.height ? 'spread' : ''}`}
                >
                  <Image
                    unoptimized
                    src={currentCover.src}
                    width={currentCover.width}
                    height={currentCover.height}
                    alt={`${currentCover.title}, ${currentCover.sequence}, ${currentCover.side}`}
                    loading="lazy"
                  />
                </div>
                <figcaption aria-live="polite">
                  <span>
                    {currentCover.category} · {currentCover.side}
                  </span>
                  <h3>{currentCover.title}</h3>
                  <p>{currentCover.sequence}</p>
                  <button onClick={() => openCoverCollection(currentCover)}>
                    Open this collection <ChevronRight />
                  </button>
                </figcaption>
              </figure>
              <button
                className="cover-arrow next"
                onClick={() => changeCover(1)}
                aria-label="Next book cover"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="cover-playback">
              <button
                onClick={() => setCoverPlaying((playing) => !playing)}
                aria-label={
                  coverPlaying
                    ? 'Pause cover slideshow'
                    : 'Play cover slideshow'
                }
              >
                {coverPlaying ? <Pause /> : <Play />}
                {coverPlaying ? 'Pause' : 'Play'}
              </button>
              <span>
                Cover {String(coverIndex + 1).padStart(2, '0')} of{' '}
                {String(shownCovers.length).padStart(2, '0')} · {shownCovers.length} images total
              </span>
            </div>

            <ul className="cover-thumbnails" aria-label="Choose a cover">
              {shownCovers.map((cover, index) => (
                <li key={`${cover.src}-${index}`}>
                  <button
                    className={index === coverIndex ? 'active' : ''}
                    aria-current={index === coverIndex ? 'true' : undefined}
                    aria-label={`Show ${cover.title}, ${cover.sequence}, ${cover.side}`}
                    onClick={() => setCoverIndex(index)}
                  >
                    <Image
                      unoptimized
                      src={cover.src}
                      width={cover.width}
                      height={cover.height}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <section
          className="time-control"
          aria-label="Historical period controls"
        >
          <div className="year-control">
            <span>YEAR</span>
            <button
              onClick={() => changeEvent(-1)}
              aria-label="Previous historical anchor"
            >
              <ChevronLeft />
            </button>
            <label>
              <span className="sr-only">Selected year</span>
              <input
                type="number"
                min="-1800"
                max="2026"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
              <small>{formatYear(year)}</small>
            </label>
            <button
              onClick={() => changeEvent(1)}
              aria-label="Next historical anchor"
            >
              <ChevronRight />
            </button>
          </div>
          <input
            className="year-range"
            aria-label="Timeline from 1800 BCE to 2026 CE"
            type="range"
            min="-1800"
            max="2026"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <a href="#selected-detail">
            Open {formatYear(selectedEvent.year)} <ChevronRight size={16} />
          </a>
          <div className="era-row">
            {eras.map((era) => (
              <button
                key={era.name}
                className={selectedEra.name === era.name ? 'active' : ''}
                onClick={() =>
                  setYear(
                    chronology.find(
                      (c) => c.year >= era.from && c.year <= era.to,
                    )?.year ?? era.from,
                  )
                }
              >
                {era.name}
              </button>
            ))}
          </div>
        </section>

        <section id="explorer" className="workspace">
          <aside className="filter-panel">
            <div className="panel-title">
              <Layers3 size={18} />
              <span>Research controls</span>
            </div>
            {activeTab === 'chapters' && (
              <>
                <label>
                  Collection
                  <select
                    value={collection}
                    onChange={(e) => {
                      setCollection(e.target.value);
                      setVolume('All volumes');
                    }}
                  >
                    <option>All collections</option>
                    <option>Political &amp; connected history</option>
                    <option>Socio-cultural-economic history</option>
                  </select>
                </label>
                <label>
                  Volume
                  <select
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  >
                    {volumeOptions.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>All statuses</option>
                    <option>Complete</option>
                    <option>Planned</option>
                  </select>
                </label>
              </>
            )}
            {activeTab === 'library' && (
              <label>
                Shelf
                <select
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                >
                  <option>All shelves</option>
                  {Array.from(new Set(works.map((work) => work.shelf))).map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </label>
            )}
            <label className="search-field">
              <span>Filter only the current archive view</span>
              <div>
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Place, person, chapter, idea…"
                />
              </div>
            </label>
            <article className="story-card">
              <p>THE STORY · PREHISTORY → TODAY</p>
              <strong>{selectedEvent.title}</strong>
              <span>
                {selectedEvent.date} · anchor {nearestIndex + 1} of{' '}
                {chronology.length}
              </span>
              <div>
                <button onClick={() => changeEvent(-1)}>
                  <ChevronLeft size={15} /> Earlier
                </button>
                <button onClick={() => changeEvent(1)}>
                  Later <ChevronRight size={15} />
                </button>
              </div>
            </article>
            <article className="status-card">
              <h2>Archive at a glance</h2>
              <p className="archive-count-line">
                <Check size={16} /> 178 historical chapters indexed · {completedHistoryCount} completed history chapters
              </p>
              <p>
                <Check size={16} /> 172 philosophy ideas indexed · {completedIdeaCount} complete · {plannedIdeaCount} planned
              </p>
              <p>
                <Check size={16} /> {people.length} literary and intellectual
                figures
              </p>
              <p>
                <Check size={16} /> Curated explorer: {places.length} places and heritage sites · Map gazetteer: {learningData.places.length} sourced reference points
              </p>
            </article>
          </aside>

          <div className="browse-panel">
            <div className="tabbar" role="tablist" aria-label="Research views">
              <button
                id="research-tab-chronology"
                role="tab"
                tabIndex={activeTab === 'chronology' ? 0 : -1}
                aria-selected={activeTab === 'chronology'}
                aria-controls="research-panel"
                className={activeTab === 'chronology' ? 'active' : ''}
                onClick={() => chooseTab('chronology')}
                onKeyDown={(event) => handleResearchTabKeys(event, 'chronology')}
              >
                <CalendarDays /> Chronology <span>{chronology.length}</span>
              </button>
              <button
                id="research-tab-places"
                role="tab"
                tabIndex={activeTab === 'places' ? 0 : -1}
                aria-selected={activeTab === 'places'}
                aria-controls="research-panel"
                className={activeTab === 'places' ? 'active' : ''}
                onClick={() => chooseTab('places')}
                onKeyDown={(event) => handleResearchTabKeys(event, 'places')}
              >
                <Building2 /> Curated places <span>{places.length}</span>
              </button>
              <button
                id="research-tab-chapters"
                role="tab"
                tabIndex={activeTab === 'chapters' ? 0 : -1}
                aria-selected={activeTab === 'chapters'}
                aria-controls="research-panel"
                className={activeTab === 'chapters' ? 'active' : ''}
                onClick={() => chooseTab('chapters')}
                onKeyDown={(event) => handleResearchTabKeys(event, 'chapters')}
              >
                <BookOpen /> Histories <span>{chapters.length}</span>
              </button>
              <button
                id="research-tab-library"
                role="tab"
                tabIndex={activeTab === 'library' ? 0 : -1}
                aria-selected={activeTab === 'library'}
                aria-controls="research-panel"
                className={activeTab === 'library' ? 'active' : ''}
                onClick={() => chooseTab('library')}
                onKeyDown={(event) => handleResearchTabKeys(event, 'library')}
              >
                <Library /> Library <span>{works.length}</span>
              </button>
              <button
                id="research-tab-people"
                role="tab"
                tabIndex={activeTab === 'people' ? 0 : -1}
                aria-selected={activeTab === 'people'}
                aria-controls="research-panel"
                className={activeTab === 'people' ? 'active' : ''}
                onClick={() => chooseTab('people')}
                onKeyDown={(event) => handleResearchTabKeys(event, 'people')}
              >
                <Users /> People <span>{people.length}</span>
              </button>
              <button
                id="research-tab-ideas"
                role="tab"
                tabIndex={activeTab === 'ideas' ? 0 : -1}
                aria-selected={activeTab === 'ideas'}
                aria-controls="research-panel"
                className={activeTab === 'ideas' ? 'active' : ''}
                onClick={() => chooseTab('ideas')}
                onKeyDown={(event) => handleResearchTabKeys(event, 'ideas')}
              >
                <GitBranch /> Ideas &amp; debates{' '}
                <span>{ideas.length}</span>
              </button>
              <button
                id="research-tab-sources"
                role="tab"
                tabIndex={activeTab === 'sources' ? 0 : -1}
                aria-selected={activeTab === 'sources'}
                aria-controls="research-panel"
                className={activeTab === 'sources' ? 'active' : ''}
                onClick={() => chooseTab('sources')}
                onKeyDown={(event) => handleResearchTabKeys(event, 'sources')}
              >
                <FileText /> Sources <span>5</span>
              </button>
            </div>

            <div id="research-panel" role="tabpanel" aria-labelledby={`research-tab-${activeTab}`} tabIndex={0}>
            {activeTab === 'chronology' && (
              <div className="tab-content chronology-view">
                <div className="map-stage">
                  <Image
                    unoptimized
                    src="./assets/orientation-map-page.png"
                    width={720}
                    height={1080}
                    alt="Modern reference map locating Kathmandu, Simraungadh, Janakpur, Darbhanga, Vaishali, Purnia, Patna and Bhagalpur"
                  />
                  <p>
                    Editorial map from Work I (2026) · Natural Earth / GeoNames
                    · no ancient or medieval frontier is implied
                  </p>
                </div>
                <div className="result-heading">
                  <div>
                    <span>{selectedEra.name}</span>
                    <h2>{filteredChronology.length} chronological anchors</h2>
                  </div>
                  <a href="./sources/index.html">Open the 160-record cited source register</a>
                </div>
                <div className="record-list">
                  {filteredChronology.map((item) => (
                    <button
                      key={`${item.year}-${item.title}`}
                      className={
                        item.title === selectedEvent.title ? 'selected' : ''
                      }
                      onClick={() => setYear(item.year)}
                    >
                      <time>{item.date}</time>
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.region} · {item.evidence}
                        </small>
                      </span>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'places' && (
              <div className="tab-content">
                <div className="result-heading">
                  <div>
                    <span>CONNECTED GEOGRAPHIES &amp; BUILT HERITAGE</span>
                    <h2>
                      {filteredPlaces.length} curated places, corridors, temples,
                      palaces and sites
                    </h2>
                  </div>
                  <small>India · Nepal · borderland</small>
                </div>
                <div className="heritage-strip">
                  <Building2 />
                  <div>
                    <strong>Architecture is historical evidence</strong>
                    <p>
                      Fortifications, tanks, monasteries, temples, palaces, rail
                      corridors, and reused institutions are read alongside
                      inscriptions, excavation, patronage, disaster, and living
                      memory.
                    </p>
                  </div>
                </div>
                <div className="place-grid">
                  {filteredPlaces.map((place) => (
                    <button
                      key={place.id}
                      className={place.id === selectedPlace ? 'selected' : ''}
                      onClick={() => setSelectedPlace(place.id)}
                    >
                      <MapPin />
                      <span>
                        <strong>{place.name}</strong>
                        <small>
                          {place.country} · {place.region}
                        </small>
                      </span>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'chapters' && (
              <div className="tab-content">
                <div className="result-heading">
                  <div>
                    <span>COMPLETE RESEARCH INDEX</span>
                    <h2>{filteredChapters.length} chapters</h2>
                  </div>
                  <small>{completedHistoryCount} complete · {plannedHistoryCount} planned</small>
                </div>
                <div className="chapter-list">
                  {filteredChapters.map((chapter) => (
                    <article
                      key={chapter.id}
                      className={
                        chapter.id === selectedChapter ? 'selected' : ''
                      }
                    >
                      <div>
                        <span className="chapter-number">
                          {chapter.collection.startsWith('Political')
                            ? 'A'
                            : 'B'}
                          {String(chapter.number).padStart(3, '0')}
                        </span>
                        <button onClick={() => setSelectedChapter(chapter.id)}>
                          <strong>{chapter.title}</strong>
                          <small>
                            {chapter.collection} · {chapter.volume}
                          </small>
                        </button>
                        <em className={chapter.status.toLowerCase()}>
                          {chapter.status}
                        </em>
                      </div>
                      <details>
                        <summary>
                          Chapter contents <ChevronDown size={16} />
                        </summary>
                        <p>{chapter.summary}</p>
                        {chapter.sections.length > 0 && (
                          <ol>
                            {chapter.sections.map((section) => (
                              <li key={section}>{section}</li>
                            ))}
                          </ol>
                        )}
                      </details>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'library' && (
              <div className="tab-content library-view">
                <div className="result-heading">
                  <div>
                    <span>A SHELF DESIGNED TO GROW</span>
                    <h2>{filteredWorks.length} works across three shelves</h2>
                  </div>
                  <small>Every title opens its manuscript structure</small>
                </div>
                <div className="shelf-chips" aria-label="Library shelves">
                  <button
                    className={shelf === 'All shelves' ? 'active' : ''}
                    onClick={() => setShelf('All shelves')}
                  >
                    All <span>{works.length}</span>
                  </button>
                  {Array.from(new Set(works.map((work) => work.shelf))).map(
                    (item) => (
                      <button
                        key={item}
                        className={shelf === item ? 'active' : ''}
                        onClick={() => setShelf(item)}
                      >
                        {item}{' '}
                        <span>
                          {works.filter((work) => work.shelf === item).length}
                        </span>
                      </button>
                    ),
                  )}
                </div>
                {materialDetail && (
                  <section
                    className="material-room"
                    aria-labelledby="material-title"
                  >
                    <div>
                      <span>OPEN MANUSCRIPT MAP</span>
                      <h3 id="material-title">{workDetail.title}</h3>
                      <p>
                        {materialDetail.items.length} headings ·{' '}
                        {materialDetail.paragraphs.toLocaleString()} paragraphs
                        {materialDetail.tables
                          ? ` · ${materialDetail.tables} tables`
                          : ''}
                      </p>
                    </div>
                    <details open>
                      <summary>
                        Browse all indexed materials <ChevronDown size={16} />
                      </summary>
                      <ol>
                        {materialDetail.items.map((item, index) => (
                          <li
                            key={`${item.title}-${index}`}
                            className={`level-${item.level}`}
                          >
                            <button onClick={() => setQuery(item.title)}>
                              {item.title}
                            </button>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </section>
                )}
                <div className="library-grid">
                  {filteredWorks.map((work, index) => (
                    <article
                      key={work.id}
                      style={{ '--card-index': index } as React.CSSProperties}
                      className={work.id === selectedWork ? 'selected' : ''}
                    >
                      <div className="library-label">
                        <span>{work.shelf}</span>
                        <em>{work.sequence}</em>
                      </div>
                      <h3>
                        <button onClick={() => openWork(work.id)}>
                          {work.title}
                        </button>
                      </h3>
                      <p className="library-subtitle">{work.subtitle}</p>
                      <p>{work.description}</p>
                      <small>{work.extent}</small>
                      <button
                        className="open-record"
                        onClick={() => openWork(work.id)}
                      >
                        Open manuscript map <ChevronRight size={15} />
                      </button>
                    </article>
                  ))}
                </div>
                {filteredWorks.length === 0 && (
                  <div className="empty-state">
                    <Search />
                    <h3>No matching works</h3>
                    <p>Try another name, topic, or shelf.</p>
                    <button
                      onClick={() => {
                        setQuery('');
                        setShelf('All shelves');
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}
                <div className="result-heading gallery-heading">
                  <div>
                    <span>FROM THE SUPPLIED MANUSCRIPTS</span>
                    <h2>Visual archive</h2>
                  </div>
                  <small>
                    Book covers, portraits, prose and verse witnesses
                  </small>
                </div>
                <div className="visual-gallery">
                  {visualGallery.map((item) => (
                    <figure key={item.src}>
                      <Image
                        unoptimized
                        src={item.src}
                        width={420}
                        height={580}
                        alt={item.alt}
                      />
                      <figcaption>
                        <strong>{item.title}</strong>
                        <small>{item.note}</small>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'people' && (
              <div className="tab-content">
                <div className="result-heading">
                  <div>
                    <span>LITERARY &amp; INTELLECTUAL CONSTELLATION</span>
                    <h2>
                      {filteredPeople.length} of {people.length} named figures
                    </h2>
                  </div>
                  <small>
                    Writers · philosophers · critics · translators · editors
                  </small>
                </div>
                <div className="people-grid">
                  {filteredPeople.map((person) => (
                    <button
                      key={person.id}
                      className={person.id === selectedPerson ? 'selected' : ''}
                      onClick={() => setSelectedPerson(person.id)}
                    >
                      <span>{person.name.slice(0, 1)}</span>
                      <div>
                        <strong>{person.name}</strong>
                        <small>
                          {person.field} · {person.era}
                        </small>
                      </div>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'ideas' && (
              <div className="tab-content">
                <div className="result-heading">
                  <div>
                    <span>GAJENDRA THAKUR’S PARALLEL PHILOSOPHY</span>
                    <h2>
                      {filteredIdeas.length} of {ideas.length} ideas
                    </h2>
                  </div>
                  <small>172 indexed ideas · {completedIdeaCount} complete · {plannedIdeaCount} planned</small>
                </div>
                <div className="idea-status-filters" aria-label="Filter ideas by completion status">
                  {['All ideas', 'Available', 'Planned'].map((filter) => (
                    <button
                      key={filter}
                      className={ideaStatus === filter ? 'active' : ''}
                      aria-pressed={ideaStatus === filter}
                      onClick={() => setIdeaStatus(filter)}
                    >
                      {filter}
                      <span>
                        {filter === 'All ideas'
                          ? ideas.length
                          : filter === 'Available'
                            ? ideas.filter((idea) => idea.status !== 'Planned').length
                            : ideas.filter((idea) => idea.status === 'Planned').length}
                      </span>
                    </button>
                  ))}
                </div>
                <div
                  className="method-diagram"
                  aria-label="Parallel Philosophy method"
                >
                  <span>Claim</span>
                  <b>→</b>
                  <span>Pūrvapakṣa</span>
                  <b>→</b>
                  <span>Pramāṇa test</span>
                  <b>→</b>
                  <span>Uttarapakṣa</span>
                  <b>→</b>
                  <span>Parallel conclusion</span>
                </div>
                <div className="idea-list">
                  {filteredIdeas.map((item) => (
                    <article
                      key={item.id}
                      className={item.id === selectedIdea ? 'selected' : ''}
                    >
                      <button onClick={() => setSelectedIdea(item.id)}>
                        <span>{item.volume === 'Volume I' ? 'I' : 'II'}-{String(item.number).padStart(2, '0')}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.part} · {item.status}</small>
                        </div>
                        <ChevronRight />
                      </button>
                      {item.status !== 'Planned' && item.purvapaksha && (
                      <details>
                        <summary>
                          Open debate and contents <ChevronDown size={16} />
                        </summary>
                        <div className="debate-mini">
                          <p>
                            <b>Pūrvapakṣa</b>
                            {item.purvapaksha}
                          </p>
                          <p>
                            <b>Uttarapakṣa</b>
                            {item.uttarapaksha}
                          </p>
                        </div>
                        {item.sections.length > 0 && (
                          <ol>
                            {item.sections.map((section) => (
                              <li key={section}>{section}</li>
                            ))}
                          </ol>
                        )}
                      </details>
                      )}
                      {item.status === 'Planned' && (
                        <p className="planned-idea-note">Approved English chapter title; full English chapter is not yet supplied.</p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'sources' && (
              <div className="tab-content">
                <div className="result-heading">
                  <div>
                    <span>SOURCE ROOM</span>
                    <h2>Five evidence families</h2>
                  </div>
                  <small>Claims remain traceable and qualified</small>
                </div>
                <div className="source-grid">
                  {sourceGroups.map((source, index) => (
                    <article key={source.title}>
                      <span>0{index + 1}</span>
                      <FileText />
                      <h3>{source.title}</h3>
                      <p>{source.examples}</p>
                      <small>{source.rule}</small>
                    </article>
                  ))}
                </div>
                <div className="apparatus">
                  <h3>Publication apparatus</h3>
                  <ul>
                    <li>
                      Consolidated chronology <b>p. 617</b>
                    </li>
                    <li>
                      Glossary and place-name concordance <b>p. 635</b>
                    </li>
                    <li>
                      General source register <b>p. 654</b>
                    </li>
                    <li>
                      Index <b>p. 679</b>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            </div>
          </div>

          <aside
            id="selected-detail"
            className="detail-panel"
            aria-live="polite"
          >
            {activeTab === 'chronology' && (
              <>
                <p className="detail-kicker">SELECTED HISTORICAL ANCHOR</p>
                <span className="detail-icon">
                  <CalendarDays />
                </span>
                <h2>{selectedEvent.title}</h2>
                <p className="detail-meta">
                  {selectedEvent.date} · {selectedEvent.region}
                </p>
                <p>{selectedEvent.text}</p>
                <div className="evidence">
                  <strong>Evidence status</strong>
                  <span>{selectedEvent.evidence}</span>
                </div>
                <div className="detail-actions">
                  <button onClick={() => changeEvent(-1)}>
                    <ChevronLeft /> Earlier
                  </button>
                  <button onClick={() => changeEvent(1)}>
                    Later <ChevronRight />
                  </button>
                </div>
              </>
            )}
            {activeTab === 'places' && (
              <>
                <p className="detail-kicker">SELECTED PLACE OR HERITAGE SITE</p>
                <span className="detail-icon">
                  <Building2 />
                </span>
                <h2>{placeDetail.name}</h2>
                <p className="detail-meta">
                  {placeDetail.country} · {placeDetail.period}
                </p>
                <p>{placeDetail.text}</p>
                <div className="evidence">
                  <strong>Research links</strong>
                  <span>{placeDetail.links}</span>
                </div>
              </>
            )}
            {activeTab === 'chapters' && (
              <>
                <p className="detail-kicker">SELECTED CHAPTER</p>
                <span className="detail-icon">
                  <BookOpen />
                </span>
                <h2>{chapterDetail.title}</h2>
                <p className="detail-meta">
                  {chapterDetail.collection}
                  <br />
                  {chapterDetail.volume} · {chapterDetail.pages}
                </p>
                <p>{chapterDetail.summary}</p>
                <div className="evidence">
                  <strong>Status</strong>
                  <span>
                    {chapterDetail.status}
                    {chapterDetail.sections.length
                      ? ` · ${chapterDetail.sections.length} indexed sections`
                      : ''}
                  </span>
                </div>
                {chapterDetail.sections.length > 0 && (
                  <details className="detail-contents">
                    <summary>
                      View section index <ChevronDown size={16} />
                    </summary>
                    <ol>
                      {chapterDetail.sections.map((section) => (
                        <li key={section}>{section}</li>
                      ))}
                    </ol>
                  </details>
                )}
              </>
            )}
            {activeTab === 'library' && (
              <>
                <p className="detail-kicker">SELECTED LIBRARY RECORD</p>
                <span className="detail-icon">
                  <Library />
                </span>
                <h2>{workDetail.title}</h2>
                <p className="detail-meta">
                  {workDetail.shelf}
                  <br />
                  {workDetail.sequence}
                </p>
                <p>{workDetail.subtitle}</p>
                <p>{workDetail.description}</p>
                <div className="evidence">
                  <strong>Edition record</strong>
                  <span>
                    {workDetail.creator}
                    <br />
                    {workDetail.extent}
                  </span>
                </div>
                <details className="detail-contents" open>
                  <summary>
                    Research structure <ChevronDown size={16} />
                  </summary>
                  <ol>
                    {workDetail.structure.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </details>
                {workDetail.id === 'parallel-philosophy' && (
                  <button
                    className="deep-link"
                    onClick={() => chooseTab('ideas')}
                  >
                    Open all {ideas.length} ideas and debates <ChevronRight />
                  </button>
                )}
                {workDetail.id === 'parallel-history' && (
                  <button
                    className="deep-link"
                    onClick={() => chooseTab('people')}
                  >
                    Open the literary-figure index <ChevronRight />
                  </button>
                )}
                {workDetail.shelf === 'Decoding the Panji' && (
                  <div className="panji-network">
                    <strong>Panji record network</strong>
                    <span>Person</span>
                    <b>→</b>
                    <span>Mūla / gotra</span>
                    <b>→</b>
                    <span>Village</span>
                    <b>→</b>
                    <span>Marriage &amp; maternal links</span>
                  </div>
                )}
                {workDetail.shelf ===
                  'Sanskrit–Maithili Philosophical Texts' && (
                  <div className="translation-path">
                    <strong>Living translation pathway</strong>
                    <p>
                      Sanskrit source → Maithili philosophical vocabulary →
                      commentary → glossary → contemporary reader
                    </p>
                  </div>
                )}
              </>
            )}
            {activeTab === 'people' && (
              <>
                <p className="detail-kicker">SELECTED FIGURE</p>
                <span className="detail-icon">
                  <Users />
                </span>
                <h2>{personDetail.name}</h2>
                <p className="detail-meta">
                  {personDetail.field}
                  <br />
                  {personDetail.era}
                </p>
                <p>{personDetail.description}</p>
                <div className="evidence">
                  <strong>Indexed from</strong>
                  <span>{personDetail.source}</span>
                </div>
              </>
            )}
            {activeTab === 'ideas' && (
              <>
                <p className="detail-kicker">
                  {ideaDetail.volume.toUpperCase()} · CHAPTER {ideaDetail.number} · {ideaDetail.status.toUpperCase()}
                </p>
                <span className="detail-icon">
                  <GitBranch />
                </span>
                <h2>{ideaDetail.title}</h2>
                <p>{ideaDetail.summary}</p>
                <div className="evidence">
                  <strong>Source status</strong>
                  <span>{ideaDetail.source}</span>
                </div>
                {ideaDetail.purvapaksha && (
                  <>
                <div className="debate-card purva">
                  <strong>Pūrvapakṣa · strongest objection</strong>
                  <p>{ideaDetail.purvapaksha}</p>
                </div>
                <div className="debate-card uttara">
                  <strong>Uttarapakṣa · response</strong>
                  <p>{ideaDetail.uttarapaksha}</p>
                </div>
                <div className="debate-card synthesis">
                  <strong>Parallel conclusion</strong>
                  <p>{ideaDetail.synthesis}</p>
                </div>
                <details className="detail-contents">
                  <summary>
                    Chapter section index <ChevronDown size={16} />
                  </summary>
                  <ol>
                    {ideaDetail.sections.map((section) => (
                      <li key={section}>{section}</li>
                    ))}
                  </ol>
                </details>
                  </>
                )}
                {ideaDetail.status === 'Planned' && (
                  <div className="debate-card purva">
                    <strong>Planned—not yet supplied</strong>
                    <p>No argument, quotation, or debate structure has been invented for this chapter.</p>
                  </div>
                )}
              </>
            )}
            {activeTab === 'sources' && (
              <>
                <p className="detail-kicker">EDITORIAL METHOD</p>
                <span className="detail-icon">
                  <Landmark />
                </span>
                <h2>Evidence before assertion</h2>
                <p>
                  Archaeological, philological, archival, environmental,
                  linguistic, institutional, oral, and statistical evidence is
                  used according to period and claim type.
                </p>
                <div className="evidence">
                  <strong>Governing distinction</strong>
                  <span>
                    Tradition, mythology, memory, material evidence, and
                    administration are related—but never treated as
                    interchangeable.
                  </span>
                </div>
                <a
                  className="detail-link"
                  href="https://www.videha.co.in/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Continue at Videha <ExternalLink size={16} />
                </a>
              </>
            )}
          </aside>
        </section>

        <section id="about" className="about">
          <div>
            <p>THE VIDEHA RESEARCH ECOSYSTEM</p>
            <h2>History joined to genealogy, literature, and philosophy</h2>
          </div>
          <div className="book-pair">
            <article>
              <span>REGIONAL HISTORY</span>
              <h3>
                <button
                  className="section-title-button"
                  onClick={() => {
                    chooseTab('chapters');
                    location.hash = 'explorer';
                  }}
                >
                  Two complementary histories <ChevronRight />
                </button>
              </h3>
              <p>
                Political and connected history in 28 chapters;
                socio-cultural-economic history with supplied Chapters 1–86
                available in the cumulative research corpus.
              </p>
              <button
                onClick={() => {
                  chooseTab('chapters');
                  location.hash = 'explorer';
                }}
              >
                Browse 178 chapters <ChevronRight size={15} />
              </button>
            </article>
            <article>
              <span>PANJI RESEARCH</span>
              <h3>
                <button
                  className="section-title-button"
                  onClick={() => openShelf('Decoding the Panji', 'panji-1')}
                >
                  Six-volume decoding series <ChevronRight />
                </button>
              </h3>
              <p>
                Genealogy, kinship, village networks, archival notation, social
                memory, and the ethical reading of difficult records.
              </p>
              <div className="work-links">
                {works
                  .filter((work) => work.shelf === 'Decoding the Panji')
                  .map((work) => (
                    <button
                      key={work.id}
                      onClick={() => openShelf('Decoding the Panji', work.id)}
                    >
                      {work.sequence}
                    </button>
                  ))}
              </div>
            </article>
            <article>
              <span>PARALLEL RESEARCH</span>
              <h3>
                <button
                  className="section-title-button"
                  onClick={() =>
                    openShelf('Parallel Research', 'parallel-philosophy')
                  }
                >
                  Philosophy &amp; literary history <ChevronRight />
                </button>
              </h3>
              <p>
                A 172-idea philosophical architecture—{completedIdeaCount} complete and {plannedIdeaCount}
                retained as future scope—together with the 100-volume Parallel
                History of Mithilā and Maithilī literature.
              </p>
              <div className="work-links">
                <button
                  onClick={() =>
                    openShelf('Parallel Research', 'parallel-philosophy')
                  }
                >
                  Parallel Philosophy
                </button>
                <button
                  onClick={() =>
                    openShelf('Parallel Research', 'parallel-history')
                  }
                >
                  Parallel History · Volumes 1–100
                </button>
                <button
                  onClick={() => {
                    chooseTab('people');
                    location.hash = 'explorer';
                  }}
                >
                  138 named figures
                </button>
              </div>
            </article>
            <article>
              <span>TEXTS &amp; TRANSLATIONS</span>
              <h3>
                <button
                  className="section-title-button"
                  onClick={() =>
                    openShelf(
                      'Sanskrit–Maithili Philosophical Texts',
                      'atmatattvaviveka',
                    )
                  }
                >
                  Sanskrit into Maithili <ChevronRight />
                </button>
              </h3>
              <p>
                Four major works within a living Maithili intellectual
                tradition.
              </p>
              <div className="work-links">
                <button
                  onClick={() =>
                    openShelf(
                      'Sanskrit–Maithili Philosophical Texts',
                      'atmatattvaviveka',
                    )
                  }
                >
                  Ātmatattvaviveka
                </button>
                <button
                  onClick={() =>
                    openShelf(
                      'Sanskrit–Maithili Philosophical Texts',
                      'bhamati',
                    )
                  }
                >
                  Bhāmatī
                </button>
                <button
                  onClick={() =>
                    openShelf(
                      'Sanskrit–Maithili Philosophical Texts',
                      'nyayakusumanjali',
                    )
                  }
                >
                  Nyāyakusumāñjali
                </button>
                <button
                  onClick={() =>
                    openShelf(
                      'Sanskrit–Maithili Philosophical Texts',
                      'tattvacintamani',
                    )
                  }
                >
                  Tattvacintāmaṇi
                </button>
              </div>
            </article>
          </div>
        </section>
        <section className="provenance" aria-labelledby="provenance-title">
          <div className="provenance-heading">
            <p>EDITORIAL CREDIT &amp; FOUNDATIONS</p>
            <h2 id="provenance-title">A Videha scholarly project</h2>
            <p>
              © Gajendra Thakur, Editor, Videha Maithili eJournal · ISSN
              2229-547X
            </p>
            <div className="journal-links">
              <a
                href="https://www.videha.co.in/"
                target="_blank"
                rel="noreferrer"
              >
                www.videha.co.in <ExternalLink size={15} />
              </a>
              <a
                href="https://videha-ejournal.github.io/videha/"
                target="_blank"
                rel="noreferrer"
              >
                Videha GitHub archive <ExternalLink size={15} />
              </a>
            </div>
          </div>
          <div className="foundation-list">
            <p>
              This site is based on the following books and translations by
              Gajendra Thakur:
            </p>
            <button onClick={() => openShelf('Decoding the Panji', 'panji-1')}>
              <strong>Decoding the Panji of Mithila</strong>
              <span>Volumes I–VI</span>
              <ChevronRight />
            </button>
            <button
              onClick={() => openShelf('Parallel Research', 'parallel-history')}
            >
              <strong>
                A Parallel History of Mithilā &amp; Maithilī Literature
              </strong>
              <span>Tomes I–IV · Volumes 1–100</span>
              <ChevronRight />
            </button>
            <button
              onClick={() =>
                openShelf('Parallel Research', 'parallel-philosophy')
              }
            >
              <strong>Gajendra Thakur’s Parallel Philosophy</strong>
              <span>Comparative philosophical research</span>
              <ChevronRight />
            </button>
            <button
              onClick={() => {
                chooseTab('chapters');
                location.hash = 'explorer';
              }}
            >
              <strong>A History of Mithila, Vajji &amp; Anga</strong>
              <span>
                Volume I: General &amp; Political · Volume II:
                Socio-Cultural-Economic
              </span>
              <ChevronRight />
            </button>
            <button
              onClick={() =>
                openShelf('Sanskrit–Maithili Philosophical Texts', 'bhamati')
              }
            >
              <strong>Sanskrit-to-Maithili Translations</strong>
              <span>
                Bhāmatī · Ātmatattvaviveka · Nyāyakusumāñjali · Tattvacintāmaṇi
              </span>
              <ChevronRight />
            </button>
          </div>
        </section>
      </main>
      <a className="back-to-top" href="#top" aria-label="Back to top"> <ArrowUp /> </a>
      <footer>
        <a className="identity" href="#top">
          <span className="mark" aria-hidden="true">
            𑒧
          </span>
          <span>
            <strong>Mithila–Vajji–Anga</strong>
            <small>A Videha research project</small>
          </span>
        </a>
        <p>
          © Gajendra Thakur, Editor, Videha Maithili eJournal · ISSN 2229-547X
        </p>
        <div className="footer-links">
          <a href="https://www.videha.co.in/" target="_blank" rel="noreferrer">
            videha.co.in <ExternalLink size={15} />
          </a>
          <a
            href="https://videha-ejournal.github.io/videha/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub archive <ExternalLink size={15} />
          </a>
        </div>
      </footer>
    </>
  );
}
