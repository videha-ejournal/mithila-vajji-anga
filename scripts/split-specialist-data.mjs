import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const GENERATED = 'app/generated';
const MAX_CHUNK_BYTES = 180_000;
const sources = [
  { name: 'learning-data', source: 'app/learning-data.json', module: 'learning-data-split.ts' },
  { name: 'research-data', source: 'app/research-data.json', module: 'research-data-split.ts' },
  { name: 'deep-data', source: 'app/deep-data.json', module: 'deep-data-split.ts' },
  { name: 'ideas-volume2', source: 'app/ideas-volume2.json', module: 'ideas-volume2-split.ts' },
  { name: 'collection-details', source: 'app/collection-details.json', module: 'collection-details-split.ts' },
];

mkdirSync(GENERATED, { recursive: true });
const jsonBytes = (value) => Buffer.byteLength(JSON.stringify(value));

function chunkArray(items) {
  const chunks = [];
  let current = [];
  let bytes = 2;
  for (const item of items) {
    const itemBytes = jsonBytes(item) + (current.length ? 1 : 0);
    if (current.length && bytes + itemBytes > MAX_CHUNK_BYTES) {
      chunks.push(current);
      current = [];
      bytes = 2;
    }
    current.push(item);
    bytes += itemBytes;
  }
  if (current.length || items.length === 0) chunks.push(current);
  return chunks;
}

function cleanGenerated(name) {
  for (const entry of readdirSync(GENERATED)) {
    if (entry.startsWith(`${name}-`) && (entry.endsWith('.json') || entry.endsWith('-split.ts'))) {
      rmSync(path.join(GENERATED, entry), { force: true });
    }
  }
}

function emitJson(filename, value) {
  const target = path.join(GENERATED, filename);
  writeFileSync(target, `${JSON.stringify(value)}\n`, 'utf8');
  return statSync(target).size;
}

const report = {
  generatedAt: new Date().toISOString(),
  maxTargetChunkBytes: MAX_CHUNK_BYTES,
  sources: [],
  totalChunks: 0,
  largestGeneratedChunkBytes: 0,
};

for (const config of sources) {
  if (!existsSync(config.source)) throw new Error(`Specialist split source missing: ${config.source}`);
  cleanGenerated(config.name);
  const sourceValue = JSON.parse(readFileSync(config.source, 'utf8'));
  const imports = [];
  const declarations = [];
  const chunkMeta = [];
  let importIndex = 0;
  let fileIndex = 0;

  const emitParts = (key, value) => {
    const parts = Array.isArray(value) ? chunkArray(value) : [value];
    const variables = [];
    parts.forEach((part, partIndex) => {
      const filename = `${config.name}-chunk-${fileIndex++}.json`;
      const variable = `part${importIndex++}`;
      const bytes = emitJson(filename, part);
      imports.push(`import ${variable} from './${filename}';`);
      variables.push(variable);
      chunkMeta.push({ key, part: partIndex, filename, bytes, records: Array.isArray(part) ? part.length : null });
      report.largestGeneratedChunkBytes = Math.max(report.largestGeneratedChunkBytes, bytes);
    });
    return Array.isArray(value) ? `[${variables.map((variable) => `...${variable}`).join(', ')}]` : variables[0];
  };

  let exportExpression;
  if (Array.isArray(sourceValue)) {
    exportExpression = emitParts('root', sourceValue);
  } else if (sourceValue && typeof sourceValue === 'object') {
    for (const [key, value] of Object.entries(sourceValue)) {
      declarations.push(`${JSON.stringify(key)}: ${emitParts(key, value)}`);
    }
    exportExpression = `{\n  ${declarations.join(',\n  ')}\n}`;
  } else {
    exportExpression = emitParts('root', sourceValue);
  }

  const module = `${imports.join('\n')}\n\nconst data: any = ${exportExpression};\nexport default data;\n`;
  writeFileSync(path.join(GENERATED, config.module), module, 'utf8');

  const sourceReport = {
    name: config.name,
    source: config.source,
    sourceBytes: statSync(config.source).size,
    module: `app/generated/${config.module}`,
    chunkCount: chunkMeta.length,
    chunks: chunkMeta,
  };
  report.sources.push(sourceReport);
  report.totalChunks += chunkMeta.length;
}

writeFileSync(
  path.join(GENERATED, 'split-specialist-data-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

if (report.largestGeneratedChunkBytes > MAX_CHUNK_BYTES + 10_000) {
  throw new Error(`Generated specialist data chunk exceeds budget: ${report.largestGeneratedChunkBytes} bytes.`);
}

console.log(`Split specialist data into ${report.totalChunks} cacheable source chunks; largest ${report.largestGeneratedChunkBytes} bytes.`);
