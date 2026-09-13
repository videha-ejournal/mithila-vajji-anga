import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = 'dist/client';
const indexPath = path.join(root, 'index.html');
if (!existsSync(indexPath)) throw new Error('Static index.html is missing.');

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const html = readFileSync(indexPath, 'utf8');
const normalizeAsset = (url) => {
  const clean = url.split('?')[0].split('#')[0];
  const nextIndex = clean.indexOf('/_next/');
  if (nextIndex >= 0) return path.join(root, clean.slice(nextIndex + 1));
  return path.join(root, clean.replace(/^\.\//, '').replace(/^\//, ''));
};

const initialUrls = new Set(
  [...html.matchAll(/(?:src|href)=["']([^"']+\.js(?:\?[^"']*)?)["']/g)].map(
    (match) => match[1],
  ),
);
const initialFiles = [...initialUrls]
  .map((url) => ({ url, file: normalizeAsset(url) }))
  .filter(({ file }) => existsSync(file));
const initialJavaScriptBytes = initialFiles.reduce(
  (total, { file }) => total + statSync(file).size,
  0,
);

const javascriptFiles = walk(path.join(root, '_next'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => ({
    file: path.relative(root, file).replaceAll(path.sep, '/'),
    bytes: statSync(file).size,
  }))
  .sort((a, b) => b.bytes - a.bytes);

const learningChunk = javascriptFiles.find((item) => item.file.includes('learning-data'));
const learningChunkIsInitial = learningChunk
  ? initialFiles.some(({ file }) => path.relative(root, file).replaceAll(path.sep, '/') === learningChunk.file)
  : false;

const sourceLearningBytes = statSync('app/learning-data.json').size;
const liteSearchBytes = statSync('app/generated/specialist-search-lite.json').size;
const liteSearchRatio = Number((liteSearchBytes / sourceLearningBytes).toFixed(3));

const imageReportPath = path.join(root, 'data/image-optimization-report.json');
const imageReport = existsSync(imageReportPath)
  ? JSON.parse(readFileSync(imageReportPath, 'utf8'))
  : { optimized: false, rewrittenToWebp: 0, savingsBytes: 0, savingsPercent: 0 };

const checks = {
  initialJavaScriptUnderBudget: initialJavaScriptBytes <= 2_800_000,
  specialistLearningChunkDeferred: Boolean(learningChunk) && !learningChunkIsInitial,
  lightweightSearchIndex: liteSearchRatio <= 0.5,
  imagePipelineRan: imageReport.optimized === true,
  imagesUseNextGenerationFormat:
    imageReport.rewrittenToWebp > 0 && imageReport.savingsBytes > 0,
};

const report = {
  generatedAt: new Date().toISOString(),
  initialJavaScriptBytes,
  initialJavaScriptFiles: initialFiles.map(({ url, file }) => ({
    url,
    file: path.relative(root, file).replaceAll(path.sep, '/'),
    bytes: statSync(file).size,
  })),
  largestJavaScriptChunks: javascriptFiles.slice(0, 12),
  learningChunk: learningChunk ?? null,
  learningChunkIsInitial,
  sourceLearningBytes,
  liteSearchBytes,
  liteSearchRatio,
  imageOptimization: {
    sourceCount: imageReport.sourceCount ?? 0,
    rewrittenToWebp: imageReport.rewrittenToWebp ?? 0,
    savingsBytes: imageReport.savingsBytes ?? 0,
    savingsPercent: imageReport.savingsPercent ?? 0,
  },
  checks,
};

writeFileSync(
  path.join(root, 'data/performance-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);
console.log(report);

if (Object.values(checks).some((check) => !check)) process.exit(1);
