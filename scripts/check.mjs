import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const content = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
assert.ok(!/\{\{\w+\}\}/.test(html), 'Unresolved template slots');
assert.ok(!html.includes('\uFFFD'), 'Broken text encoding');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Expected a single page heading');

let checked = 0;
for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)), `Missing anchor ${url}`);
  else if (!/^[a-z]+:/i.test(url)) await access(path.join(root, url));
  else assert.ok(/^(https:|mailto:)/.test(url), `Unexpected URL scheme: ${url}`);
  checked++;
}
for (const chapter of content.gospel) assert.ok(ids.includes(chapter.id), `Missing chapter ${chapter.id}`);
assert.equal(content.gospel.length, 6, 'Expected all six gospel chapters');
for (const testimony of content.testimonies) assert.ok(ids.includes(`zeugnis-${testimony.id}`), `Missing testimony ${testimony.id}`);
const pdf = await readFile(path.join(root, 'assets/documents/evangelium-in-farben.pdf'));
assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', 'Download must be a valid PDF file');
console.log(`OK: ${checked} links/assets, unique anchors, all six chapters, testimonies, PDF and text encoding.`);
