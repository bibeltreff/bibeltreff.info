import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderTabernacleTour, renderTabernacleTeaser, tabernacleUrls } from './tabernacle.mjs';

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

test('teasers point to generated routes and both translations identify paraphrased Bible text', () => {
  assert.notEqual(tabernacleUrls.de, tabernacleUrls.en);
  for (const lang of ['de', 'en']) {
    assert.ok(renderTabernacleTeaser(lang).includes(`href="${tabernacleUrls[lang]}"`));
    assert.ok(renderTabernacleTour(lang).includes(texts[lang].scriptureLabel));
    assert.ok(texts[lang].altarNote.includes('9'));
  }
});
