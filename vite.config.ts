import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

const pagePerformanceTransform = () => ({
  name: 'mva-page-performance-transform',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!/[\\/]app[\\/]archive-english\.tsx(?:\?|$)/.test(id)) return null;

    const next = code
      .replace("import collectionDetailsData from './collection-details.json';\n", '')
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
      );

    if (
      next.includes("from './learning-data.json'") ||
      next.includes('learningData.') ||
      next.includes('collectionDetailsData') ||
      next.includes('<ResearchExpansion />') ||
      next.includes('<LearningLab />')
    ) {
      throw new Error(
        'Performance transform did not fully detach deferred research payloads from archive-english.',
      );
    }

    if (
      !next.includes("from './generated/specialist-search-lite.json'") ||
      !next.includes('<DeferredResearchRooms />') ||
      !next.includes("import('./collection-details.json')")
    ) {
      throw new Error(
        'Performance optimization markers are missing from archive-english.',
      );
    }

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

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [pagePerformanceTransform(), optimizedImageTransform(), vinext()],
  build: {
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'learning-data',
              test: /[\\/]app[\\/]learning-data\.json(?:\?|$)/,
              priority: 50,
            },
            {
              name: 'collection-details',
              test: /[\\/]app[\\/]collection-details\.json(?:\?|$)/,
              priority: 45,
            },
            {
              name: 'ideas-volume-two',
              test: /[\\/]app[\\/]ideas-volume2\.json(?:\?|$)/,
              priority: 40,
            },
            {
              name: 'research-data',
              test: /[\\/]app[\\/]research-data\.json(?:\?|$)/,
              priority: 35,
            },
            {
              name: 'deep-data',
              test: /[\\/]app[\\/]deep-data\.json(?:\?|$)/,
              priority: 30,
            },
          ],
        },
      },
    },
  },
});
