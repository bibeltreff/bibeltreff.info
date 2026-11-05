import { readFileSync } from 'node:fs';
import { renderTabernacleSvg } from './tabernacle-svg.mjs';

const translations = JSON.parse(readFileSync(new URL('../content/tabernacle.json', import.meta.url), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const tabernacleUrls = { de: 'artikel/die-stiftshuette/rundgang.html', en: 'articles/die-stiftshuette/tour.html' };

// These illustrations enlarge the contents of the ark rather than pretending
// they are visible through its closed sides in the overview.
function renderContents(kind, title) {
  const drawings = {
    jar: `<ellipse cx="180" cy="250" rx="90" ry="15" fill="#0a1423"/><path d="M129 104h102l-10 25c38 25 41 89 16 113H123c-25-24-22-88 16-113Z" fill="url(#tab-detail-gold)" stroke="#f4d996" stroke-width="2"/><path d="M128 105c0-36 104-36 104 0Z" fill="url(#tab-detail-gold)" stroke="#f4d996" stroke-width="2"/><circle cx="180" cy="73" r="7" fill="#f5d78b"/><path d="M134 132c-53-8-56 61-5 60m102-60c53-8 56 61 5 60" fill="none" stroke="#d4a64c" stroke-width="8"/><path d="M146 142c-12 28-11 54-3 72" fill="none" stroke="#fff1bd" stroke-width="5" stroke-linecap="round" opacity=".6"/>`,
    staff: `<ellipse cx="180" cy="259" rx="86" ry="12" fill="#0a1423"/><path d="M156 261c9-49 22-96 24-153s19-67 32-47" fill="none" stroke="#d3aa64" stroke-width="10" stroke-linecap="round"/><path d="M175 164c-29-14-39-29-39-50 27 4 43 22 39 50Zm7-40c27-8 41-23 44-42-25 0-42 15-44 42Z" fill="#91b59c" stroke="#b6d5af" stroke-width="2"/><path d="m171 195 35-34m-25-39-25-35" stroke="#cfb67f" stroke-width="3"/><g fill="#ead9e9" stroke="#cfa4c9"><circle cx="207" cy="155" r="12"/><circle cx="198" cy="164" r="10"/><circle cx="214" cy="169" r="10"/><circle cx="153" cy="80" r="10"/></g><g fill="#f4ce71"><circle cx="207" cy="163" r="5"/><circle cx="153" cy="80" r="4"/></g>`,
    tablets: `<ellipse cx="180" cy="253" rx="108" ry="14" fill="#0a1423"/><path d="M81 235V112a47 47 0 0 1 94 0v123Z" fill="#c4c5c6" stroke="#f1e5cb" stroke-width="2"/><path d="M185 235V112a47 47 0 0 1 94 0v123Z" fill="#b2b7bc" stroke="#eee2ca" stroke-width="2"/><g stroke="#6b727b" stroke-width="4" stroke-linecap="round"><path d="M100 133h55m-55 18h45m-45 18h55m-55 18h39m-39 18h51M204 133h55m-55 18h45m-45 18h55m-55 18h39m-39 18h51"/></g>`
  };
  if (kind === 'manna') {
    const grains = Array.from({ length: 24 }, (_, i) => `<circle cx="${137 + (i % 5) * 20 + (Math.floor(i / 5) % 2) * 8}" cy="${134 + Math.floor(i / 5) * 22}" r="6" fill="#f7edcc"/>`).join('');
    drawings.manna = `<ellipse cx="180" cy="250" rx="90" ry="15" fill="#0a1423"/><path d="M128 97h104l-10 30c37 23 40 92 15 115H123c-25-23-22-92 15-115Z" fill="#c79b4020" stroke="#edcb7d" stroke-width="3"/>${grains}`;
  }
  return `<svg class="tour-content-svg" viewBox="0 0 360 300" role="img" aria-label="${escape(title)}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tab-detail-${kind}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe3a0"/><stop offset=".5" stop-color="#d6ac55"/><stop offset="1" stop-color="#9e712b"/></linearGradient></defs>${drawings[kind].replaceAll('tab-detail-gold', `tab-detail-${kind}`)}</svg>`;
}

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
          <div class="tour-contents" hidden><p>${escape(t.contentsLabel)}</p>${t.steps.filter(s => s.detail).map(s => `<div data-tour-detail="${s.detail}" hidden>${renderContents(s.detail, s.title)}</div>`).join('')}<p class="tour-contents-note">${escape(t.contentsNote)}</p></div>
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
  return `<aside class="tour-teaser wrap" aria-label="${escape(t.title)}"><div class="tour-teaser-art" aria-hidden="true"><svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m15 100 37-29h130l-37 29Z" fill="#ffffff08" stroke="#d8b46a"/><path d="M15 100V56l37-30h130v45M15 56h130l37-30M145 56v44M102 100V56l37-30" stroke="#d8b46a" stroke-width="1.5"/><path d="M102 100V56l37-30v45Z" fill="#b29ac655"/><path d="M57 86V58m-12 5c0 15 24 15 24 0M40 58c0 28 34 28 34 0M50 87h14" stroke="#f3d184" stroke-width="3" stroke-linecap="round"/><path d="M132 67h21v17h-21Zm-3-4h27v4h-27Z" fill="#dbb665"/></svg></div><div><p class="eyebrow section-label">${escape(t.teaserLabel)}</p><h2>${escape(t.title)}</h2><p>${escape(t.teaserText)}</p><a class="text-link" href="${tabernacleUrls[lang]}">${escape(t.teaserLink)}</a></div></aside>`;
}
