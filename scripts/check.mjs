import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadTestimonies } from './testimonies.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const locales = [
  { lang: 'de', page: 'index.html', source: 'site.json', other: 'en.html' },
  { lang: 'en', page: 'en.html', source: 'site.en.json', other: 'index.html' }
];
const shared = JSON.parse(await readFile(path.join(root, 'content/shared.json'), 'utf8'));
const pages = [];
const contents = [];
let checked = 0;
for (const { lang, page, source, other } of locales) {
const html = await readFile(path.join(root, page), 'utf8');
const content = JSON.parse(await readFile(path.join(root, 'content', source), 'utf8'));
content.testimonies = await loadTestimonies(root, lang, shared.testimonies);
const ui = JSON.parse(await readFile(path.join(root, 'content', `ui.${lang}.json`), 'utf8'));
assert.ok(html.includes(`<html lang="${lang}">`), `Incorrect language in ${page}`);
assert.ok(html.includes(`class="language-switch" href="${other}"`), `Missing language switch in ${page}`);
for (const alternate of ['de', 'en', 'x-default']) {
  assert.ok(html.includes(`rel="alternate" hreflang="${alternate}"`), `Missing alternate ${alternate} in ${page}`);
}
if (lang === 'en') {
  assert.ok(html.includes('New King James Version'), 'Missing NKJV attribution');
  assert.ok(html.includes('German PDF'), 'Download language must be clear');
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
assert.ok(!/\{\{\w+\}\}/.test(html), 'Unresolved template slots');
assert.ok(!html.includes('\uFFFD'), 'Broken text encoding');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Expected a single page heading');

for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)), `Missing anchor ${url}`);
  else if (!/^[a-z]+:/i.test(url)) await access(path.join(root, url));
  else assert.ok(/^(https?:|mailto:)/.test(url), `Unexpected URL scheme: ${url}`);
  checked++;
}
for (const chapter of shared.gospel) assert.ok(ids.includes(chapter.id), `Missing chapter ${chapter.id}`);
assert.equal(shared.gospel.length, 6, 'Expected all six gospel chapters');
for (const testimony of content.testimonies) assert.ok(ids.includes(`zeugnis-${testimony.id}`), `Missing testimony ${testimony.id}`);
pages.push({ ids, ui });
contents.push(content);
}
assert.deepEqual(pages[0].ids, pages[1].ids, 'Language versions must share all anchor targets');
assert.deepEqual(Object.keys(pages[0].ui).sort(), Object.keys(pages[1].ui).sort(), 'Interface translations must have matching keys');
const structure = content => ({
  meetings: Object.keys(content.meetings),
  gospel: Object.entries(content.gospel).map(([id, { verses, moreVerses }]) => ({ id, verses: verses.length, moreVerses: moreVerses?.length || 0 })),
  testimonies: content.testimonies.map(({ id, name, paragraphs }) => ({ id, name, paragraphs: paragraphs.length })),
  contact: Object.keys(content.contact),
  social: Object.keys(content.social),
  privacy: content.privacy.sections.map(({ paragraphs, links }) => ({ paragraphs: paragraphs.length, links: links?.map(({ url }) => url.replace('/de/', '/en/')) }))
});
assert.deepEqual(structure(contents[0]), structure(contents[1]), 'Keep both languages complete and in sync');
const pdf = await readFile(path.join(root, 'assets/documents/evangelium-in-farben.pdf'));
assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', 'Download must be a valid PDF file');
const legal = JSON.parse(await readFile(path.join(root, 'content/legal.json'), 'utf8'));
const missing = Object.entries(legal).filter(([, value]) => value.includes('BITTE ERGÄNZEN')).map(([key]) => key);
if (missing.length) console.warn(`WARNING: content/legal.json still has placeholders: ${missing.join(', ')}`);
console.log(`OK: both languages, ${checked} links/assets, matching anchors/content, six chapters, testimonies, PDF and text encoding.`);
