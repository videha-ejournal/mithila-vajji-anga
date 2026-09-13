import archiveUnitsData from './generated/archive-units.json';
import archiveMaithiliData from './generated/archive-maithili.json';
import panjiInventoryData from './generated/panji-inventory.json';
import literatureInventoryData from './literature-inventory.json';
import libraryData from './library-data.json';

export type ArchiveGroup = 'philosophy' | 'literature' | 'panji';

export type ArchiveUnit = {
  key: string;
  group: ArchiveGroup;
  workId: string;
  workTitle: string;
  workSequence: string;
  unitId: string;
  number: number;
  title: string;
  description: string;
  sections: string[];
  sourceNote: string;
  sourcePdf: string;
  sourceLanguage: string;
  authorship: string;
  region: string;
};

export type LiteratureInventoryRecord = {
  number: number;
  tome: 'I' | 'II' | 'III' | 'IV';
  title: string;
  sections: string[];
  sourceNote: string;
  verificationSources: string[];
};

export type PanjiInventoryRecord = {
  workId: string;
  number: number;
  title: string;
  titleSource: string;
  sections: string[];
  source: string;
  sourceParagraphs: number;
  sourceTables: number;
  sourceCorrection: null | {
    source: string;
    sourcePages: string;
    verification: string;
  };
};

export type LibraryWork = {
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

export const archiveBasePath = '/mithila-vajji-anga';
export const archiveUnits = archiveUnitsData as ArchiveUnit[];
export const archiveMaithili = archiveMaithiliData as Record<string, string>;
export const literatureInventory = (literatureInventoryData as LiteratureInventoryRecord[])
  .slice()
  .sort((a, b) => a.number - b.number);
export const panjiInventory = (panjiInventoryData as PanjiInventoryRecord[])
  .slice()
  .sort((a, b) => a.workId.localeCompare(b.workId) || a.number - b.number);
export const libraryWorks = libraryData as LibraryWork[];

const parallelPhilosophyBase = libraryWorks.find((work) => work.id === 'parallel-philosophy');
const parallelPhilosophyVolumes: Record<string, LibraryWork> = {
  'parallel-philosophy-1': {
    id: 'parallel-philosophy-1',
    shelf: 'Parallel Research',
    sequence: 'Volume I',
    title: 'Parallel Philosophy — Volume I',
    subtitle: parallelPhilosophyBase?.subtitle ?? 'Mithila’s parallel philosophical tradition in Indian and global conversation',
    creator: 'Gajendra Thakur · Videha · ISSN 2229-547X',
    extent: '72 source-bilingual chapters',
    description: parallelPhilosophyBase?.description ?? 'A source-bilingual Maithili–English philosophical research volume.',
    structure: parallelPhilosophyBase?.structure ?? [],
  },
  'parallel-philosophy-2': {
    id: 'parallel-philosophy-2',
    shelf: 'Parallel Research',
    sequence: 'Volume II',
    title: 'Parallel Philosophy — Volume II',
    subtitle: 'Continuation of the parallel philosophical programme through modern, postcolonial and contemporary debates',
    creator: 'Gajendra Thakur · Videha · ISSN 2229-547X',
    extent: '100 source-bilingual chapters',
    description: 'A source-bilingual Maithili–English continuation of the Parallel Philosophy project, extending the archive through critical theory, philosophy of mind, science, technology, AI and reconstructive parallel philosophy.',
    structure: parallelPhilosophyBase?.structure ?? [],
  },
};

export const archiveGroups: Record<
  ArchiveGroup,
  {
    maithiliTitle: string;
    englishTitle: string;
    maithiliDeck: string;
    englishDeck: string;
    workIds: string[];
  }
> = {
  philosophy: {
    maithiliTitle: 'समानान्तर दर्शन',
    englishTitle: 'Parallel Philosophy',
    maithiliDeck:
      'मिथिला–वज्जि–अंग बौद्धिक अभिलेखागारक दार्शनिक स्रोत। उपलब्ध स्रोत स्वयं मैथिली–अंग्रेजी द्विभाषी छथि; संस्कृत मूल, टीका आ अनुवादक-सम्पादकक भूमिका अलग-अलग स्पष्ट राखल गेल अछि।',
    englishDeck:
      'Philosophical sources in the Mithila–Vajji–Anga intellectual archive. These works are source-bilingual in Maithili and English; original Sanskrit authorship, commentary and translator-editor roles remain distinct.',
    workIds: [
      'parallel-philosophy-1',
      'parallel-philosophy-2',
      'bhamati',
      'atmatattvaviveka',
      'nyayakusumanjali',
      'tattvacintamani',
    ],
  },
  literature: {
    maithiliTitle: 'समानान्तर साहित्य इतिहास',
    englishTitle: 'Parallel Literature',
    maithiliDeck:
      'मिथिला–वज्जि–अंगक समानान्तर इतिहास लेल साहित्यिक स्रोत। मूल अंग्रेजी अध्यायकेँ प्रमाणित स्रोत-सूचीक आधार पर जोड़ल जाएत; नव मैथिली पाठकेँ स्पष्ट रूपेँ विदेह डिजिटल रिसर्च आर्काइव लेल तैयार शोध-संस्करण कहल जाएत।',
    englishDeck:
      'Literary-history sources for the parallel history of Mithila–Vajji–Anga. Only chapters with a verified source inventory are exposed; newly prepared Maithili texts are identified as research editions for the Videha Digital Research Archive.',
    workIds: ['parallel-history'],
  },
  panji: {
    maithiliTitle: 'पञ्जी शोध',
    englishTitle: 'Decoding Panji',
    maithiliDeck:
      'मिथिलाक पञ्जीकेँ वंशावली, सम्बन्ध, बसावट, सामाजिक स्मृति आ दीर्घकालीन अभिलेखक रूपमे पढ़बाक छह-खण्डीय स्रोत-समूह। अंग्रेजी मूलक संग नव मैथिली शोध-संस्करण स्पष्ट रूपेँ अलग चिन्हित रहत।',
    englishDeck:
      'A six-volume source corpus reading Mithila’s Panji as genealogy, kinship, settlement, social memory and a long-duration archive. English originals remain visible beside clearly identified Maithili research editions.',
    workIds: ['panji-1', 'panji-2', 'panji-3', 'panji-4', 'panji-5', 'panji-6'],
  },
};

export function groupUnits(group: ArchiveGroup) {
  return archiveUnits.filter((unit) => unit.group === group);
}

export function workUnits(group: ArchiveGroup, workId: string) {
  return archiveUnits
    .filter((unit) => unit.group === group && unit.workId === workId)
    .sort((a, b) => a.number - b.number);
}

export function panjiWorkInventory(workId: string) {
  return panjiInventory.filter((record) => record.workId === workId);
}

export function getArchiveUnit(group: ArchiveGroup, workId: string, unitId: string) {
  return archiveUnits.find(
    (unit) => unit.group === group && unit.workId === workId && unit.unitId === unitId,
  );
}

export function getLibraryWork(workId: string) {
  return parallelPhilosophyVolumes[workId] ?? libraryWorks.find((work) => work.id === workId);
}

export function maithiliReading(unit: ArchiveUnit) {
  return archiveMaithili[unit.key] || '';
}

export function routeFor(unit: ArchiveUnit, language: 'mai' | 'en') {
  const languagePrefix = language === 'en' ? '/en' : '';
  return `${archiveBasePath}${languagePrefix}/${unit.group}/${unit.workId}/${unit.unitId}/`;
}

export function groupRoute(group: ArchiveGroup, language: 'mai' | 'en') {
  const languagePrefix = language === 'en' ? '/en' : '';
  return `${archiveBasePath}${languagePrefix}/${group}/`;
}
