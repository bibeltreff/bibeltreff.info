import { readFileSync } from 'node:fs';
import { renderTabernacleSvg } from './tabernacle-svg.mjs';
import { renderTabernacleDetail } from './tabernacle-details.mjs';

const translations = JSON.parse(readFileSync(new URL('../content/tabernacle.json', import.meta.url), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const tabernacleUrls = { de: 'artikel/die-stiftshuette/rundgang.html', en: 'articles/die-stiftshuette/tour.html' };

function renderPassage(t, endIndex, highlightCurrent = false) {
  const steps = t.steps.slice(0, endIndex + 1);
  const verse = steps.filter(s => s.verseNumber).at(-1).verseNumber;
  const reference = `${t.reference.split(':')[0]}:2${verse === 2 ? '' : `–${verse}`}`;
  const text = steps.map((s, index) => {
    const number = s.verseNumber ? `<sup class="tour-verse-number">${s.verseNumber}</sup>` : '';
    const className = highlightCurrent ? (index === endIndex ? 'tour-verse-current' : 'tour-verse-context') : '';
    return `${number}<span class="${className}" data-verse-chunk>${escape(s.verse)}</span>`;
  }).join(' ');
  return `<blockquote class="tour-verse"><p>${text}</p><cite>${escape(reference)}</cite></blockquote>`;
}

export function renderTabernacleTour(lang) {
  const t = translations[lang];
  if (!t) throw new Error(`Unsupported tabernacle language: ${lang}`);
  const articles = lang === 'de' ? 'artikel/' : 'articles/';
  return `<main id="inhalt" class="tabernacle-page wrap">
    <header class="tour-intro">
      <nav class="breadcrumb" aria-label="${lang === 'de' ? 'Brotkrümelnavigation' : 'Breadcrumb'}"><a href="${articles}">${lang === 'de' ? 'Artikel' : 'Articles'}</a><span aria-hidden="true">/</span><span>${escape(t.title)}</span></nav>
      <p class="eyebrow section-label">${escape(t.eyebrow)}</p>
      <h1>${escape(t.title)}</h1>
      <p>${escape(t.intro)}</p>
    </header>
    <section class="tabernacle-tour" data-tour aria-label="${escape(t.title)}">
      <div class="tour-workspace">
        <figure class="tour-visual">
          <div class="tour-visual-heading"><span>${escape(t.diagram)}</span><button class="tour-zoom" type="button" hidden data-tour-zoom data-detail-label="${lang === 'de' ? 'Detailansicht' : 'Closer view'}" data-overview-label="${lang === 'de' ? 'Übersicht' : 'Overview'}" aria-pressed="false">${lang === 'de' ? 'Detailansicht' : 'Closer view'}</button></div>
          ${renderTabernacleSvg(lang)}
          <div class="tour-contents" hidden><p>${escape(t.contentsLabel)}</p>${t.steps.filter(s => s.detail).map(s => `<div data-tour-detail="${s.detail}" hidden>${renderTabernacleDetail(s.detail, s.title, lang)}</div>`).join('')}<p class="tour-contents-note">${escape(t.contentsNote)}</p></div>
          <figcaption>${escape(t.diagramNote)}</figcaption>
        </figure>
        <div class="tour-reading">
          <div class="tour-status" role="status" aria-live="polite" aria-atomic="true" data-tour-status data-step-label="${escape(t.step)}" data-of-label="${escape(t.of)}">${escape(t.step)} 1 ${escape(t.of)} ${t.steps.length} · ${escape(t.steps[0].title)}</div>
          <div class="tour-panels">${t.steps.map((s, index) => `
            <section class="tour-panel" id="station-${s.id}" data-tour-panel data-highlight="${s.objects.join(' ')}"${s.detail ? ` data-detail="${s.detail}"` : ''} aria-labelledby="station-title-${s.id}">
              <p class="tour-reference">${escape(s.reference)}</p>
              <h2 id="station-title-${s.id}">${escape(s.title)}</h2>
              <p class="tour-verse-label">${escape(t.scriptureLabel)}</p>
              ${renderPassage(t, index, true)}
              <p class="tour-explanation">${escape(s.text)}</p>
            </section>`).join('')}
          </div>
          <div class="tour-controls" hidden><button type="button" data-tour-previous>${escape(t.previous)}</button><span data-tour-count aria-hidden="true">01 / ${t.steps.length}</span><button type="button" data-tour-next data-next-label="${escape(t.next)}" data-restart-label="${escape(t.restart)}">${escape(t.next)}</button></div>
        </div>
      </div>
      <nav class="tour-stops" aria-label="${escape(t.overview)}">${t.steps.map((s, index) => `<a href="#station-${s.id}" data-tour-stop><span>${String(index + 1).padStart(2, '0')}</span>${escape(s.short)}</a>`).join('')}</nav>
      <p class="tour-hint">${escape(t.hint)}</p>
    </section>
    <details class="tour-context"><summary>${escape(t.reading)}</summary><p>${escape(t.readingIntro)}</p>${renderPassage(t, t.steps.length - 1)}<p>${escape(t.altarNote)}</p></details>
    <section class="tour-related"><div><h2>${escape(t.related)}</h2><p>${escape(t.relatedText)}</p></div><a class="button button-quiet" href="${lang === 'de' ? 'artikel/die-stiftshuette/' : 'articles/'}">${escape(t.relatedLink)}</a></section>
  </main>`;
}

export function renderTabernacleTeaser(lang) {
  const t = translations[lang];
  return `<aside class="tour-teaser wrap" aria-label="${escape(t.title)}"><div class="tour-teaser-art" aria-hidden="true">${renderTabernacleSvg(lang).replaceAll('tab-', 'teaser-tab-').replace('viewBox="0 0 900 540"', 'viewBox="50 70 800 310"')}</div><div><p class="eyebrow section-label">${escape(t.teaserLabel)}</p><h2>${escape(t.title)}</h2><p>${escape(t.teaserText)}</p><a class="text-link" href="${tabernacleUrls[lang]}">${escape(t.teaserLink)}</a></div></aside>`;
}
