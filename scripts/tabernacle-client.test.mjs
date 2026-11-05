import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const client = await readFile(new URL('../assets/tabernacle.js', import.meta.url), 'utf8');
const texts = JSON.parse(await readFile(new URL('../content/tabernacle.json', import.meta.url), 'utf8'));

// A small DOM fixture exercises the actual client entrypoint without adding a
// browser dependency to the site's build. Static HTML is checked separately.
function fixture(lang, hash = '') {
  const t = texts[lang];
  const node = (extra = {}) => ({
    dataset: {}, attributes: {}, listeners: {}, hidden: false, textContent: '', style: {},
    classList: { add() {}, toggle() {} },
    addEventListener(type, callback) { this.listeners[type] = callback; },
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    closest() { return null; }, matches() { return false; }, focus() {},
    click() { this.listeners.click?.({ preventDefault() {} }); }, ...extra
  });
  const stops = t.steps.map(() => node());
  const panels = t.steps.map(s => node({ id: `station-${s.id}`, dataset: { highlight: s.objects.join(' '), detail: s.detail }, querySelector: () => ({ textContent: s.title }) }));
  const objects = [...new Set(t.steps.flatMap(s => s.objects))].map(id => node({ dataset: { tourObject: id }, getBBox: () => ({ x: 20, y: 20, width: 100, height: 100 }) }));
  const details = t.steps.filter(s => s.detail).map(s => node({ dataset: { tourDetail: s.detail } }));
  const previous = node(), next = node({ dataset: { nextLabel: t.next, restartLabel: t.restart } });
  const status = node({ dataset: { stepLabel: t.step, ofLabel: t.of } });
  const zoom = node({ dataset: { overviewLabel: 'overview', detailLabel: 'detail' } });
  const svg = node({ querySelectorAll: () => objects });
  const contents = node(), count = node(), caption = node();
  const singles = { '[data-tour-previous]': previous, '[data-tour-next]': next, '[data-tour-status]': status, '[data-tour-count]': count, '.tabernacle-svg': svg, '[data-tour-zoom]': zoom, '.tour-contents': contents, '.tour-controls': node(), '.tour-stops': node({ scrollWidth: 100, clientWidth: 100 }), figcaption: caption };
  const multiples = { '[data-tour-stop]': stops, '[data-tour-panel]': panels, '[data-tour-object]': objects, '[data-tour-detail]': details };
  const tour = node({ querySelector: key => singles[key], querySelectorAll: key => multiples[key] });
  const window = node(), location = { hash };
  vm.runInNewContext(client, { document: { querySelector: () => tour }, window, location, history: { replaceState: (_, __, value) => { location.hash = value; } } });
  return { tour, stops, panels, previous, next, zoom, svg, contents, details, status, caption, window, location };
}

for (const lang of ['de', 'en']) {
  test(`${lang}: all stops, contents, boundaries and restart remain in sync`, () => {
    const f = fixture(lang);
    assert.equal(f.previous.disabled, true);
    for (let index = 0; index < f.stops.length; index++) {
      f.stops[index].click();
      assert.equal(f.panels.filter(p => !p.hidden).length, 1);
      assert.equal(f.panels[index].hidden, false);
      assert.equal(f.stops[index].attributes['aria-current'], 'step');
      assert.equal(f.status.textContent, `${texts[lang].step} ${index + 1} ${texts[lang].of} 10 · ${texts[lang].steps[index].title}`);
      assert.equal(f.contents.hidden, !Boolean(texts[lang].steps[index].detail));
      if (index >= 7) assert.equal(f.details.filter(d => !d.hidden).length, 1);
    }
    assert.equal(f.next.textContent, texts[lang].restart);
    f.next.click();
    assert.equal(f.panels[0].hidden, false);
    assert.equal(f.contents.hidden, true);
    assert.equal(f.previous.disabled, true);
  });
}

test('deep links, scoped keyboard navigation and zoom work without scrolling the page', () => {
  const f = fixture('de', '#station-ark');
  assert.equal(f.panels[6].hidden, false);
  f.zoom.click();
  assert.equal(f.zoom.attributes['aria-pressed'], 'true');
  assert.notEqual(f.svg.attributes.viewBox, '0 0 900 540');
  const key = name => f.tour.listeners.keydown({ key: name, target: { closest: () => null, matches: () => false }, preventDefault() {} });
  key('End');
  assert.equal(f.panels[9].hidden, false);
  key('ArrowLeft');
  assert.equal(f.panels[8].hidden, false);
  key('Home');
  assert.equal(f.panels[0].hidden, false);
  f.location.hash = '#station-table';
  f.window.listeners.hashchange();
  assert.equal(f.panels[3].hidden, false);
});
