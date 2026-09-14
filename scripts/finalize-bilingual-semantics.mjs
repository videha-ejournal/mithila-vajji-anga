import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = 'dist/client';
if (!existsSync(root)) throw new Error(`Missing static export: ${root}`);

function htmlFiles(directory) {
  const output = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

let mai = 0;
let en = 0;
for (const path of htmlFiles(root)) {
  const route = relative(root, path).split(sep).join('/');
  const language = route === 'en.html' || route.startsWith('en/') ? 'en' : 'mai';
  let html = readFileSync(path, 'utf8');
  html = html.replace(/<html\b([^>]*?)\slang=(['"])[^'"]*\2([^>]*)>/i, `<html$1 lang="${language}"$3>`);
  if (!/<html\b[^>]*\slang=/i.test(html)) {
    html = html.replace(/<html\b/i, `<html lang="${language}"`);
  }
  html = html.replace(/<html\b([^>]*?)\sdata-edition=(['"])[^'"]*\2([^>]*)>/i, `<html$1 data-edition="${language === 'mai' ? 'mai' : 'en'}"$3>`);
  if (!/<html\b[^>]*\sdata-edition=/i.test(html)) {
    html = html.replace(/<html\b/i, `<html data-edition="${language === 'mai' ? 'mai' : 'en'}"`);
  }
  writeFileSync(path, html, 'utf8');
  if (language === 'en') en += 1;
  else mai += 1;
}

console.log(`Finalized document-language semantics for ${mai} Maithili and ${en} English HTML files.`);
