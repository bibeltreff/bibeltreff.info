import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderTabernacleTour, renderTabernacleTeaser, tabernacleUrls } from './tabernacle.mjs';
import { renderTabernacleSvg } from './tabernacle-svg.mjs';
import { renderTabernacleDetail } from './tabernacle-details.mjs';

const texts = JSON.parse(await readFile(new URL('../content/tabernacle.json', import.meta.url), 'utf8'));

test('both languages have the same complete sequence and valid illustration targets', () => {
  assert.deepEqual(texts.de.steps.map(s => s.id), texts.en.steps.map(s => s.id));
  assert.equal(texts.de.steps.length, 10);
  for (const lang of ['de', 'en']) {
    const html = renderTabernacleTour(lang);
    const targets = [...html.matchAll(/data-tour-object="([^"]+)"/g)].map(m => m[1]);
    for (const step of texts[lang].steps) {
      assert.ok(step.title && step.short && step.reference && step.verse && step.text);
      for (const object of step.objects) assert.ok(targets.includes(object), `${lang}: missing target ${object}`);
      if (step.detail) assert.ok(html.includes(`data-tour-detail="${step.detail}"`));
    }
  }
});

test('static fallback renders every station with unique IDs and working local anchors', () => {
  for (const lang of ['de', 'en']) {
    const html = renderTabernacleTour(lang);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), anchor);
    for (const step of texts[lang].steps) {
      assert.ok(html.includes(`id="station-${step.id}" data-tour-panel`), 'station remains readable without JavaScript');
      assert.ok(html.includes(step.verse.replaceAll('&', '&amp;')));
    }
    assert.ok(html.includes('role="status"'));
    assert.ok(!html.includes('{{'));
  }
});

test('teasers point to generated routes and quotations identify their source', () => {
  assert.notEqual(tabernacleUrls.de, tabernacleUrls.en);
  for (const lang of ['de', 'en']) {
    assert.ok(renderTabernacleTeaser(lang).includes(`href="${tabernacleUrls[lang]}"`));
    assert.ok(renderTabernacleTour(lang).includes(texts[lang].scriptureLabel));
    assert.ok(texts[lang].readingIntro.includes(texts[lang].reference));
  }
});

// The user's supplied wording is pinned independently of the editable content.
const exactGermanPassage = 'Denn es war ein Zelt bereitet, der erste (Teil), worin sowohl der Leuchter als auch der Tisch und die Schaubrote waren, welcher das Heilige heißt, und hinter dem zweiten Vorhang war der zweite Teil des Zeltes, welcher das Allerheiligste heißt; (dieses) hatte den goldenen Räucheraltar und die Lade des Bundes, von allen Seiten ganz mit Gold überzogen, in welcher der goldene Krug war, der das Manna enthielt, und der Stab Aarons, der gesprosst hatte, und die Tafeln des Bundes, und oben über ihr die Cherubim der Herrlichkeit, die den Sühne(deckel) überschatteten, wovon jetzt nicht im Einzelnen zu reden ist.';

test('German quotations preserve the exact supplied wording and verse boundaries', () => {
  assert.equal(texts.de.fullPassage, exactGermanPassage);
  assert.equal(texts.de.steps.map(s => s.verse).join(' '), exactGermanPassage);
  assert.deepEqual(texts.de.steps.filter(s => s.verseNumber).map(s => [s.id, s.verseNumber]), [
    ['tent', 2], ['most-holy', 3], ['altar', 4], ['cherubim', 5]
  ]);
  const html = renderTabernacleTour('de');
  const quotes = [...html.matchAll(/<blockquote class="tour-verse"><p>([\s\S]*?)<\/p>/g)];
  assert.equal(quotes.length, texts.de.steps.length + 1);
  const extract = quote => [...quote.matchAll(/data-verse-chunk>([^<]*)<\/span>/g)].map(m => m[1]).join(' ');
  for (let i = 0; i < texts.de.steps.length; i++) {
    assert.equal(extract(quotes[i][1]), texts.de.steps.slice(0, i + 1).map(s => s.verse).join(' '));
    assert.equal((quotes[i][1].match(/class="tour-verse-current"/g) || []).length, 1);
  }
  assert.equal(extract(quotes.at(-1)[1]), exactGermanPassage);
});

test('station sequence follows the screenshots and every reference uses a colon', () => {
  const sequence = ['tent', 'holy', 'most-holy', 'altar', 'ark', 'jar', 'manna', 'staff', 'tablets', 'cherubim'];
  for (const lang of ['de', 'en']) {
    const t = texts[lang];
    assert.deepEqual(t.steps.map(s => s.id), sequence);
    assert.equal(t.steps.map(s => s.verse).join(' '), t.fullPassage);
    assert.ok(t.reference.endsWith('9:2–5'));
    for (const step of t.steps) assert.match(step.reference, /9:[2-5]$/);
    assert.doesNotMatch(JSON.stringify(t), /(?:Hebräer|Hebr\.) 9,/);
  }
});

test('overview preserves the reference furnishings in both languages', () => {
  for (const lang of ['de', 'en']) {
    const svg = renderTabernacleSvg(lang);
    for (const [attribute, count] of [['data-lamp', 7], ['data-loaf', 12], ['data-cherub', 2], ['data-horn', 4], ['data-carrying-ring', 4]]) {
      assert.equal([...svg.matchAll(new RegExp(`${attribute}="`, 'g'))].length, count, attribute);
    }
    for (const object of ['cherubim', 'mercy-seat', 'lampstand', 'table', 'altar', 'ark']) {
      assert.ok(svg.includes(`data-tour-object="${object}"`));
    }
    const teaser = renderTabernacleTeaser(lang);
    assert.ok(teaser.includes('data-loaf="6"'), 'article preview reuses the corrected furnishings');
    assert.ok(teaser.includes('id="teaser-tab-gold"'));
    assert.ok(!teaser.includes('id="tab-gold"'), 'preview IDs must not collide with the tour');
  }
});

test('each detail illustration has accessible labels and valid local SVG references', () => {
  for (const kind of ['jar', 'manna', 'staff', 'tablets']) {
    const svg = renderTabernacleDetail(kind, kind);
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const [, id] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(id));
    const labels = svg.match(/aria-labelledby="([^"]+)"/)[1].split(' ');
    assert.ok(labels.every(label => ids.includes(label)));
  }
  assert.throws(() => renderTabernacleDetail('unknown', 'unknown'), /Unknown tabernacle detail/);
});
