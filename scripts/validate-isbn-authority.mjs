import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const root = process.cwd();
const authoritySourcePath = path.join(root, 'data', 'videha-isbn-authority.json.gz.b64');
const libraryPath = path.join(root, 'app', 'library-data.json');

const compressed = Buffer.from(fs.readFileSync(authoritySourcePath, 'utf8').trim(), 'base64');
const raw = zlib.gunzipSync(compressed);
const rawSha256 = crypto.createHash('sha256').update(raw).digest('hex');
const expectedRawSha256 = 'f072f685bcd05200a071dea218baad30298f7b4717b9cee4be6178bfdbd25df8';
if (rawSha256 !== expectedRawSha256) {
  throw new Error(`[ISBN authority] source digest mismatch: ${rawSha256}`);
}

const authority = JSON.parse(raw.toString('utf8'));
const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));

function digits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function validIsbn13(value) {
  const d = digits(value);
  if (d.length !== 13) return false;
  let total = 0;
  for (let index = 0; index < 12; index += 1) {
    total += Number(d[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return ((10 - (total % 10)) % 10) === Number(d[12]);
}

function isbnFromExtent(extent) {
  const match = String(extent ?? '').match(/ISBN\s+([0-9-]{13,17})/i);
  return match ? match[1] : null;
}

const fail = (message) => {
  throw new Error(`[ISBN authority] ${message}`);
};

if (authority.schemaVersion !== 1) fail(`unsupported schemaVersion ${authority.schemaVersion}`);
if (authority.recordCount !== 293) fail(`recordCount must be 293, got ${authority.recordCount}`);
if (!Array.isArray(authority.records) || authority.records.length !== 293) {
  fail('records must contain exactly 293 entries');
}
if (authority.sourceWorkbookSha256 !== '12aab41f16e974423e4ce8860e061f0b592bb9e156a9b8a1f884ac0d3cf4ed26') {
  fail('editor-supplied workbook digest drifted');
}
if (!Array.isArray(authority.excludedSourceColumns) ||
    !authority.excludedSourceColumns.includes('Name of Publishing Agency/Publisher')) {
  fail('publisher source column must remain explicitly excluded');
}

const isbnSet = new Set();
const adminCounts = new Map();
for (const record of authority.records) {
  if (!record.isbn || !validIsbn13(record.isbn)) fail(`invalid ISBN-13: ${record.isbn}`);
  if (isbnSet.has(record.isbn)) fail(`duplicate ISBN: ${record.isbn}`);
  if (Object.hasOwn(record, 'publisher')) fail(`publisher field must not be stored: ${record.isbn}`);
  if (Object.hasOwn(record, 'publishingAgency')) fail(`publishing agency field must not be stored: ${record.isbn}`);
  isbnSet.add(record.isbn);
  adminCounts.set(record.administrator, (adminCounts.get(record.administrator) ?? 0) + 1);
}
if (isbnSet.size !== 293 || authority.uniqueIsbnCount !== 293) fail('unique ISBN count must be 293');
if ((adminCounts.get('Gajendra') ?? 0) !== 182 || (adminCounts.get('Kumari Prity') ?? 0) !== 111) {
  fail('administrator split must remain Gajendra=182, Kumari Prity=111');
}

const requiredEquivalences = new Map([
  ['Gadya Padya Bharti 1', '978-93-341-0402-8'],
  ['Videha Sadeha 28', '978-93-341-0402-8'],
  ['Gadya Padya Bharti 2', '978-93-5890-150-4'],
  ['Videha Sadeha 37', '978-93-5890-150-4'],
]);
for (const [alias, isbn] of requiredEquivalences) {
  const record = authority.records.find((item) => item.isbn === isbn);
  if (!record) fail(`equivalence target missing: ${alias} -> ${isbn}`);
  if (!Array.isArray(record.aliases) || !record.aliases.includes(alias)) {
    fail(`equivalence alias missing from record ${isbn}: ${alias}`);
  }
}

const requiredPortalTitles = new Map([
  ['978-93-341-0402-8', 'विदेह सदेह २८ अनूदित गद्य आ पद्य अंक १ to ३५०'],
  ['978-93-5890-150-4', 'गद्य पद्य भारती अनुवाद खण्ड 2 विदेह सदेह 37'],
]);
for (const [isbn, title] of requiredPortalTitles) {
  const record = authority.records.find((item) => item.isbn === isbn);
  if (record?.bookTitle !== title) fail(`portal title drift for ${isbn}`);
}

const expectedLibraryIsbns = new Map([
  ['panji-1', '978-93-5915-894-5'],
  ['panji-2', '978-93-6012-526-4'],
  ['panji-3', '978-93-6068-808-0'],
  ['panji-4', '978-93-6123-509-2'],
  ['panji-5', '978-93-5933-373-1'],
  ['panji-6', '978-93-5933-623-7'],
  ['parallel-philosophy', '978-93-344-9610-9'],
  ['parallel-history', '978-93-5812-486-6'],
  ['atmatattvaviveka', '978-93-5943-857-3'],
  ['bhamati', '978-93-5943-682-1'],
  ['nyayakusumanjali', '978-93-344-6450-4'],
  ['tattvacintamani', '978-93-6123-729-4'],
]);

for (const item of library) {
  const isbn = isbnFromExtent(item.extent);
  if (isbn && !isbnSet.has(isbn)) {
    fail(`library record ${item.id} carries ISBN not present in the 293-record authority: ${isbn}`);
  }
}
for (const [id, expected] of expectedLibraryIsbns) {
  const item = library.find((entry) => entry.id === id);
  if (!item) fail(`expected library record missing: ${id}`);
  const actual = isbnFromExtent(item.extent);
  if (actual !== expected) fail(`library ISBN mismatch for ${id}: expected ${expected}, got ${actual}`);
}

if (isbnSet.has('9798180232212')) {
  fail('superseded Panji ISBN unexpectedly present in authoritative registry');
}

console.log(
  `ISBN authority verified: ${authority.records.length} records, ${isbnSet.size} unique valid ISBN-13 values, ` +
  `publisher column excluded, aliases enforced, library conflicts resolved, source SHA-256 ${rawSha256}.`,
);
