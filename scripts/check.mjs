import assert from 'node:assert/strict';
import { readFile, access, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadTestimonies } from './testimonies.mjs';
import { articleFolders, loadArticles, overviewUrl, topicUrl } from './articles.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const locales = [
  { lang: 'de', page: 'index.html', source: 'site.json', other: 'en.html' },
  { lang: 'en', page: 'en.html', source: 'site.en.json', other: 'index.html' }
];
const shared = JSON.parse(await readFile(path.join(root, 'content/shared.json'), 'utf8'));
const site = 'https://bibeltreff.info/';
const checkedPages = [];
const pages = [];
const contents = [];
let checked = 0;
// Shared by all generated pages: structure, encoding and every local link or asset.
async function checkPage(page, html) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate HTML IDs in ${page}`);
  assert.ok(!/\{\{\w+\}\}/.test(html), `Unresolved template slots in ${page}`);
  assert.ok(!html.includes('\uFFFD'), `Broken text encoding in ${page}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `Expected a single page heading in ${page}`);
  // Share preview and structured data: the image must exist and the JSON-LD must parse.
  const image = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
  assert.ok(image?.startsWith(site), `Missing absolute og:image in ${page}`);
  await access(path.join(root, image.slice(site.length))).catch(() => assert.fail(`Missing og:image ${image} in ${page}`));
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)) JSON.parse(json);
  checkedPages.push(page);
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)), `Missing anchor ${url} in ${page}`);
    else if (!/^[a-z]+:/i.test(url)) {
      const target = path.join(root, path.dirname(page), url.replace(/#.*$/, ''));
      await access((await stat(target)).isDirectory() ? path.join(target, 'index.html') : target).catch(() => assert.fail(`Missing ${url} in ${page}`));
    }
    else assert.ok(/^(https?:|mailto:)/.test(url), `Unexpected URL scheme: ${url} in ${page}`);
    checked++;
  }
  return ids;
}
for (const { lang, page, source, other } of locales) {
const html = await readFile(path.join(root, page), 'utf8');
const content = JSON.parse(await readFile(path.join(root, 'content', source), 'utf8'));
content.gospel = JSON.parse(await readFile(path.join(root, 'content', `gospel.${lang}.json`), 'utf8'));
content.testimonies = await loadTestimonies(root, lang, shared.testimonies);
const ui = JSON.parse(await readFile(path.join(root, 'content', `ui.${lang}.json`), 'utf8'));
assert.ok(html.includes(`<html lang="${lang}"`), `Incorrect language in ${page}`);
assert.ok(html.includes(`class="language-switch" href="${other}"`), `Missing language switch in ${page}`);
for (const alternate of ['de', 'en', 'x-default']) {
  assert.ok(html.includes(`rel="alternate" hreflang="${alternate}"`), `Missing alternate ${alternate} in ${page}`);
}
if (lang === 'en') {
  assert.ok(html.includes('New King James Version'), 'Missing NKJV attribution');
  assert.ok(html.includes('German PDF'), 'Download language must be clear');
}
const ids = await checkPage(page, html);
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
// Articles: every topic and article has its page, and nothing else is left in the output folders.
const { topics, articles } = await loadArticles(root);
let articlePages = 0;
for (const lang of ['de', 'en']) {
  const folder = articleFolders[lang];
  const expected = [`${overviewUrl(lang)}index.html`,
    ...topics.filter(topic => articles[lang].some(article => article.topic === topic.id)).map(topic => `${topicUrl(lang, topic.id)}index.html`),
    ...articles[lang].map(article => article.url)].sort();
  const found = (await readdir(path.join(root, folder), { recursive: true })).filter(name => name.endsWith('.html')).map(name => `${folder}/${name.split(path.sep).join('/')}`).sort();
  assert.deepEqual(found, expected, `${folder}/ does not match content/artikel/${lang}; run npm run build`);
  for (const page of found) {
    const html = await readFile(path.join(root, page), 'utf8');
    assert.ok(html.includes(`<html lang="${lang}"`), `Incorrect language in ${page}`);
    assert.ok(html.includes('class="language-switch"'), `Missing language switch in ${page}`);
    await checkPage(page, html);
    articlePages++;
  }
}
// sitemap.xml lists exactly the generated pages, robots.txt points to it.
const sitemapUrls = [...(await readFile(path.join(root, 'sitemap.xml'), 'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, url]) => url.slice(site.length).replace(/(^|\/)$/, '$1index.html')).sort();
assert.deepEqual(sitemapUrls, [...checkedPages].sort(), 'sitemap.xml does not match the pages; run npm run build');
assert.ok((await readFile(path.join(root, 'robots.txt'), 'utf8')).includes(`Sitemap: ${site}sitemap.xml`), 'robots.txt must point to sitemap.xml');
const pdf = await readFile(path.join(root, 'assets/documents/evangelium-in-farben.pdf'));
assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', 'Download must be a valid PDF file');
const legal = JSON.parse(await readFile(path.join(root, 'content/legal.json'), 'utf8'));
const missing = Object.entries(legal).filter(([, value]) => value.includes('BITTE ERGÄNZEN')).map(([key]) => key);
if (missing.length) console.warn(`WARNING: content/legal.json still has placeholders: ${missing.join(', ')}`);
console.log(`OK: both languages, ${articlePages} article pages, ${checked} links/assets, matching anchors/content, six chapters, testimonies, PDF, text encoding, share images, structured data and sitemap.`);
