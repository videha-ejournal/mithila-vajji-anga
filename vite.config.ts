import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

const pagePerformanceTransform = () => ({
  name: 'mva-page-performance-transform',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!/[\\/]app[\\/]page\.tsx(?:\?|$)/.test(id)) return null;

    const next = code
      .replace(
        "import learningData from './learning-data.json';",
        "import specialistSearchData from './generated/specialist-search-lite.json';",
      )
      .replace(
        "import ResearchExpansion from './research-expansion';\nimport LearningLab from './learning-lab';",
        "import DeferredResearchRooms from './deferred-research-rooms';",
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
      );

    if (
      next.includes('learningData.') ||
      next.includes('<ResearchExpansion />') ||
      next.includes('<LearningLab />')
    ) {
      throw new Error(
        'Performance transform did not fully detach the specialist research payload from the initial page.',
      );
    }

    return { code: next, map: null };
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
