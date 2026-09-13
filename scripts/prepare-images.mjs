import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const reportPath = 'public/data/image-optimization-report.json';
const assetsRoot = 'public/assets';
const cleanup = process.argv.includes('--cleanup');

if (cleanup) {
  if (!existsSync(reportPath)) process.exit(0);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  for (const item of report.images ?? []) {
    if (item.generatedWebp) rmSync(item.generatedWebp, { force: true });
    if (item.generatedAvif) rmSync(item.generatedAvif, { force: true });
  }
  rmSync(reportPath, { force: true });
  process.exit(0);
}

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  const report = {
    optimized: false,
    reason: 'sharp is not installed; production CI installs it before the build.',
    images: [],
  };
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  if (process.env.REQUIRE_IMAGE_OPTIMIZATION === '1') {
    console.error(report.reason);
    process.exit(1);
  }
  console.warn(report.reason);
  process.exit(0);
}

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const sourceImages = walk(assetsRoot).filter((file) => /\.(png|jpe?g)$/i.test(file));
const images = [];
let originalBytes = 0;
let preferredBytes = 0;

for (const source of sourceImages) {
  const originalSize = statSync(source).size;
  const base = source.replace(/\.(png|jpe?g)$/i, '');
  const webp = `${base}.webp`;
  const avif = `${base}.avif`;

  const webpExisted = existsSync(webp);
  const avifExisted = existsSync(avif);

  if (!webpExisted) {
    await sharp(source).rotate().webp({ quality: 82, effort: 5 }).toFile(webp);
  }
  if (!avifExisted) {
    await sharp(source).rotate().avif({ quality: 60, effort: 5 }).toFile(avif);
  }

  const webpSize = statSync(webp).size;
  const avifSize = statSync(avif).size;
  const useWebp = webpSize < originalSize;

  originalBytes += originalSize;
  preferredBytes += useWebp ? webpSize : originalSize;
  images.push({
    source,
    webp,
    avif,
    originalBytes: originalSize,
    webpBytes: webpSize,
    avifBytes: avifSize,
    useWebp,
    generatedWebp: webpExisted ? null : webp,
    generatedAvif: avifExisted ? null : avif,
  });
}

const report = {
  optimized: true,
  sourceCount: sourceImages.length,
  rewrittenToWebp: images.filter((item) => item.useWebp).length,
  originalBytes,
  preferredBytes,
  savingsBytes: originalBytes - preferredBytes,
  savingsPercent: originalBytes
    ? Number((((originalBytes - preferredBytes) / originalBytes) * 100).toFixed(1))
    : 0,
  images,
};

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Prepared ${images.length} image families; WebP preferred for ${report.rewrittenToWebp}. Estimated transfer saving: ${report.savingsPercent}%.`,
);
