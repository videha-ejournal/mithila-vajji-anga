import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const source = path.join(root, 'data', 'videha-isbn-authority.json.gz.b64');
const outDir = path.join(root, 'public', 'data');
const jsonOut = path.join(outDir, 'videha-isbn-authority.json');
const csvOut = path.join(outDir, 'videha-isbn-authority.csv');

const compressed = Buffer.from(fs.readFileSync(source, 'utf8').trim(), 'base64');
const registry = JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonOut, JSON.stringify(registry), 'utf8');

const columns = [
  'isbn', 'bookTitle', 'aliases', 'authorEditor', 'language', 'edition', 'year',
  'publicationDate', 'productForm', 'country', 'status', 'publisher', 'administrator',
  'applicationNo', 'applicationSubmitted', 'verificationNotes', 'earmarked', 'available',
  'used', 'totalEarmarked', 'booksSubmitted', 'booksPending', 'booksSurrendered',
  'applicationSerialNo', 'bookSerialNo',
];

const escapeCsv = (value) => {
  const text = value == null ? '' : Array.isArray(value) ? value.join(' | ') : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const csv = [
  columns.map(escapeCsv).join(','),
  ...registry.records.map((record) => columns.map((key) => escapeCsv(record[key])).join(',')),
].join('\n') + '\n';

fs.writeFileSync(csvOut, csv, 'utf8');
console.log(`Exported authoritative ISBN registry: ${registry.records.length} records.`);
