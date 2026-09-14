import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

const pagePerformanceTransform = () => ({
  name: 'mva-page-performance-transform',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    const isEnglishHome = /[\\/]app[\\/]archive-english\.tsx(?:\?|$)/.test(id);
    const isMaithiliHome = /[\\/]app[\\/]home-maithili\.tsx(?:\?|$)/.test(id);
    if (!isEnglishHome && !isMaithiliHome) return null;

    const next = code
      .replace(
        "import learningData from './learning-data.json';",
        "import specialistSearchData from './generated/specialist-search-lite.json';",
      )
      .replace("import collectionDetailsData from './collection-details.json';\n", '')
      .replace(
        "import ResearchExpansion from './research-expansion';\nimport LearningLab from './learning-lab';",
        "import DeferredResearchRooms from './deferred-research-rooms';",
      )
      .replace(
        "const collectionDetails = collectionDetailsData as Record<\n  string,\n  CollectionDetail\n>;\n",
        '',
      )
      .replace(
        "  const [activeTab, setActiveTab] = useState<Tab>('chronology');",
        "  const [activeTab, setActiveTab] = useState<Tab>('chronology');\n  const [collectionDetails, setCollectionDetails] = useState<Record<string, CollectionDetail>>({});",
      )
      .replace(
        "  const globalSearchRef = useRef<HTMLInputElement>(null);",
        `  const globalSearchRef = useRef<HTMLInputElement>(null);\n  useEffect(() => {\n    if (activeTab !== 'library' || Object.keys(collectionDetails).length) return;\n    let active = true;\n    import('./collection-details.json').then(({ default: data }) => {\n      if (active) setCollectionDetails(data as Record<string, CollectionDetail>);\n    });\n    return () => { active = false; };\n  }, [activeTab, collectionDetails]);`,
      )
      .replace(
        /  \.\.\.learningData\.places\.map[\s\S]*?route: 'knowledge-graph' as const \}\)\),\n/,
        '  ...(specialistSearchData.records as GlobalSearchRecord[]),\n',
      )
      .replaceAll(
        'learningData.places.length',
        'specialistSearchData.counts.places',
      )
      .replace(
        /\n\s*<ResearchExpansion \/>\s*\n\s*<LearningLab \/>\s*\n/,
        '\n        <DeferredResearchRooms />\n',
      )
      .replace(
        '<small>Videha historical research</small>',
        '<small>Videha Digital Research Archive</small>',
      )
      .replace(
        `<p className="eyebrow">SOURCE-CONTROLLED REGIONAL ATLAS</p>\n            <h1>Explore Mithila, Vajji and Anga</h1>\n            <p>\n              A guided entrance to the Videha archive: genealogy, regional\n              history, philosophical debate, texts, and translation across\n              India and Nepal. Choose a research question first; the archive\n              will then lead you to the relevant evidence, chapter, or tool.\n            </p>`,
        `<p className="eyebrow">VIDEHA DIGITAL RESEARCH ARCHIVE</p>\n            <h1>Videha Digital Research Archive</h1>\n            <p><strong>Digital Humanities Research Environment for Mithila, Vajji &amp; Anga</strong></p>\n            <p>\n              A permanent, citable, machine-readable and versioned research environment for genealogy, regional\n              history, philosophical debate, texts, translation, people, places and chronology across\n              India and Nepal. Begin with a research question; the archive leads to the relevant evidence,\n              permanent record, citation or specialist tool.\n            </p>`,
      )
      .replace(
        '<p>THE VIDEHA RESEARCH STUDIO</p>',
        '<p>DIGITAL HUMANITIES RESEARCH ENVIRONMENT</p>',
      )
      .replace(
        '<h2 id="studio-title">Four doors into one archive</h2>',
        '<h2 id="studio-title">Four doors into the Videha Digital Research Archive</h2>',
      )
      .replace(
        '<p>THE VIDEHA RESEARCH ECOSYSTEM</p>',
        '<p>VIDEHA DIGITAL RESEARCH ARCHIVE</p>',
      )
      .replace(
        '<h2>History joined to genealogy, literature, and philosophy</h2>',
        '<h2>A citable digital humanities environment for Mithila, Vajji &amp; Anga</h2>',
      )
      .replace(
        '<a href="./updates/index.html">Status &amp; updates</a>\n          <a href="#about">About</a>',
        '<a href="./updates/index.html">Status &amp; updates</a>\n          <a href="./about/index.html">About / Archive</a>\n          <a href="./source-library/index.html">Source PDFs</a>',
      )
      .replaceAll(
        '<small>A Videha research project</small>',
        '<small>Videha Digital Research Archive</small>',
      );

    if (
      next.includes('learningData.') ||
      next.includes('collectionDetailsData') ||
      next.includes('<ResearchExpansion />') ||
      next.includes('<LearningLab />')
    ) {
      throw new Error(
        'Performance transform did not fully detach deferred research payloads from the initial page.',
      );
    }

    if (
      isEnglishHome &&
      (!next.includes('Videha Digital Research Archive') ||
        !next.includes('Digital Humanities Research Environment for Mithila, Vajji &amp; Anga'))
    ) {
      throw new Error('Archive identity transform did not apply to the English homepage source.');
    }

    if (
      isMaithiliHome &&
      (!next.includes('मिथिला, वज्जि आ अंगक अन्वेषण करू') ||
        !next.includes('एक अभिलेखागारक चारि शोध-दुआरि'))
    ) {
      throw new Error('Maithili homepage integrity markers were lost during the performance transform.');
    }

    return { code: next, map: null };
  },
});

const splitSpecialistImportTransform = () => ({
  name: 'mva-split-specialist-data-imports',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!/[\\/]app[\\/].*\.(tsx?|jsx?)(?:\?|$)/.test(id)) return null;
    const next = code
      .replace("import learningData from './learning-data.json';", "import learningData from './generated/learning-data-split';")
      .replace("import researchData from './research-data.json';", "import researchData from './generated/research-data-split';")
      .replace("import deepData from './deep-data.json';", "import deepData from './generated/deep-data-split';")
      .replace("import ideasVolumeTwoData from './ideas-volume2.json';", "import ideasVolumeTwoData from './generated/ideas-volume2-split';")
      .replace("import collectionDetailsData from './collection-details.json';", "import collectionDetailsData from './generated/collection-details-split';")
      .replace("import('./collection-details.json')", "import('./generated/collection-details-split')");
    return next === code ? null : { code: next, map: null };
  },
});

const optimizedImageTransform = () => ({
  name: 'mva-next-generation-image-paths',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (
      process.env.MVA_IMAGE_OPTIMIZED !== '1' ||
      !/[\\/](app|components)[\\/].*\.(tsx?|jsx?|css)(?:\?|$)/.test(id) ||
      !code.includes('/assets/')
    ) {
      return null;
    }

    const next = code.replace(
      /(\.?\/assets\/[^"'`\s)]+)\.(png|jpe?g)/gi,
      '$1.webp',
    );
    return next === code ? null : { code: next, map: null };
  },
});

const splitPrefixes = [
  'learning-data',
  'research-data',
  'deep-data',
  'ideas-volume2',
  'collection-details',
];
const splitDataGroups = splitPrefixes.flatMap((prefix) =>
  Array.from({ length: 48 }, (_, part) => ({
    name: `${prefix}-part-${part}`,
    test: new RegExp(`[\\/]app[\\/]generated[\\/]${prefix}-chunk-${part}\\.json(?:\\?|$)`),
    priority: 100 - part,
  })),
);

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    pagePerformanceTransform(),
    splitSpecialistImportTransform(),
    optimizedImageTransform(),
    vinext(),
  ],
  build: {
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: splitDataGroups,
        },
      },
    },
  },
});
