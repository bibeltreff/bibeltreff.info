import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const script = await readFile(new URL('../assets/meeting-status.js', import.meta.url), 'utf8');

for (const page of ['index.html', 'en.html']) {
  const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
  const publishedMeetings = [...html.matchAll(/data-meeting-day="(\d)" data-meeting-start="([\d:]+)" data-meeting-end="([\d:]+)"/g)]
    .map(([, meetingDay, meetingStart, meetingEnd]) => ({ dataset: { meetingDay, meetingStart, meetingEnd } }));

  test(`${page}: meeting indicator follows Berlin summer and winter times`, () => {
    assert.equal(publishedMeetings.length, 3);
    // Stable fixtures keep boundary tests independent of temporary preview times.
    const meetings = [
      { meetingDay: '3', meetingStart: '13:15', meetingEnd: '13:50' },
      { meetingDay: '4', meetingStart: '19:30', meetingEnd: '21:00' },
      { meetingDay: '0', meetingStart: '10:00', meetingEnd: '12:30' }
    ].map(dataset => ({ dataset, classList: {
      active: false,
      toggle(name, active) { assert.equal(name, 'meeting-active'); this.active = active; }
    } }));
    assert.match(html, /class="badge-dot"[^>]* hidden/);
    assert.match(html, /src="assets\/meeting-status.js" defer/);
    let now;
    let refresh;
    let firstTick;
    let minuteTick;
    let timeoutDelay;
    const dot = { hidden: true };
    runInNewContext(script, {
      Intl,
      Date: class extends Date {
        constructor() { super(now || '2026-09-23T11:14:45Z'); }
        static now() { return new Date(now || '2026-09-23T11:14:45Z').getTime(); }
      },
      document: {
        querySelector: () => dot,
        querySelectorAll: () => meetings,
        addEventListener: (event, callback) => { if (event === 'visibilitychange') refresh = callback; }
      },
      window: { addEventListener() {} },
      setTimeout: (callback, delay) => { firstTick = callback; timeoutDelay = delay; },
      setInterval: (callback, delay) => { minuteTick = callback; assert.equal(delay, 60_000); }
    });
    assert.equal(dot.hidden, true);
    assert.equal(timeoutDelay, 15_000);
    now = '2026-09-23T11:15:00Z';
    firstTick();
    assert.equal(dot.hidden, false, 'becomes visible at the start without a reload');
    assert.deepEqual(meetings.map(meeting => meeting.classList.active), [true, false, false]);
    now = '2026-09-23T11:50:00Z';
    minuteTick();
    assert.equal(dot.hidden, true, 'hides at the end without a reload');
    assert.ok(meetings.every(meeting => !meeting.classList.active));

    for (const [instant, active] of [
      ['2026-09-23T11:49:59Z', true],
      ['2026-09-24T17:29:59Z', false],
      ['2026-09-24T17:30:00Z', true],
      ['2026-09-24T19:00:00Z', false],
      ['2026-09-27T07:59:59Z', false],
      ['2026-09-27T08:00:00Z', true],
      ['2026-09-27T10:30:00Z', false],
      ['2026-09-26T08:30:00Z', false],
      ['2026-01-07T12:15:00Z', true],
      ['2026-01-08T18:30:00Z', true],
      ['2026-01-11T09:00:00Z', true],
      ['2026-03-29T08:00:00Z', true],
      ['2026-10-25T08:00:00Z', false],
      ['2026-10-25T09:00:00Z', true]
    ]) {
      now = instant;
      refresh();
      assert.equal(!dot.hidden, active, instant);
      assert.equal(meetings.filter(meeting => meeting.classList.active).length, active ? 1 : 0, instant);
    }
  });
}
