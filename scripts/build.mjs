import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const template = await readFile(path.join(root, 'src/index.html'), 'utf8');
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const links = (items, className = '') => items.map((item) => `<a class="${className}" href="${escape(item.url)}">${escape(item.label)} ${arrow}</a>`).join('\n');

// Generate full HTML at build time: content and navigation work without JavaScript.
// A future CMS exporter only needs to provide the same content/site.json schema.
for (const lang of ['de', 'en']) {
const english = lang === 'en';
const contentFile = english ? 'site.en.json' : 'site.json';
const outputFile = english ? 'en.html' : 'index.html';
const content = JSON.parse(await readFile(path.join(root, 'content', contentFile), 'utf8'));
const ui = JSON.parse(await readFile(path.join(root, 'content', `ui.${lang}.json`), 'utf8'));
const quote = (verse) => `<blockquote><p>${ui.quoteOpen}${escape(verse.text)}${ui.quoteClose}</p><cite>${escape(verse.reference)}</cite></blockquote>`;
const slots = {
  ...Object.fromEntries(Object.entries(ui).map(([key, value]) => [key, escape(value)])),
  lang,
  ogLocale: english ? 'en_GB' : 'de_DE',
  canonical: `https://bibeltreff.info/${english ? 'en.html' : ''}`,
  languageUrl: english ? 'index.html' : 'en.html',
  otherLang: english ? 'de' : 'en',
  scriptureNotice: ui.scriptureNotice ? `<p class="scripture-notice">${escape(ui.scriptureNotice)}</p>` : '',
  title: escape(content.title),
  description: escape(content.description),
  eyebrow: escape(content.hero.eyebrow),
  heading: escape(content.hero.heading),
  accent: escape(content.hero.accent),
  intro: escape(content.hero.text),
  verse: escape(content.hero.verse),
  verseReference: escape(content.hero.verseReference),
  meetings: content.meetings.map((meeting, index) => `<article class="meeting-card${index === 0 ? ' meeting-featured' : ''}">
    <div class="meeting-top"><span class="eyebrow">${escape(meeting.label)}</span><span class="meeting-number" aria-hidden="true">0${index + 1}</span></div>
    <h3>${escape(meeting.day)}</h3>
    <p class="meeting-time"><time>${escape(meeting.start)}</time><span aria-hidden="true">–</span><span class="sr-only">${escape(ui.to)}</span><time>${escape(meeting.end)}</time>${ui.timeSuffix ? ` <span>${escape(ui.timeSuffix)}</span>` : ''}</p>
    <div class="meeting-location"><svg class="icon" aria-hidden="true"><use href="#icon-pin"/></svg><p><strong>${escape(meeting.location)}</strong><br>${escape(meeting.address)}</p></div>
    <p class="meeting-note">${escape(meeting.note)}</p>
    <div class="meeting-links"><a href="${escape(meeting.map)}">${escape(ui.route)} ${arrow}</a>${meeting.online ? `<a href="${escape(meeting.online)}">${escape(ui.online)} ${arrow}</a>` : ''}</div>
  </article>`).join('\n'),
  colors: content.gospel.map((chapter, index) => `<a class="color-tab color-${escape(chapter.color)}" href="#${escape(chapter.id)}" data-chapter="${escape(chapter.id)}" aria-label="${index + 1}. ${escape(chapter.label)}: ${escape(chapter.question)} (${escape(chapter.colorName)})">
    <span class="color-index" aria-hidden="true">0${index + 1}<span class="color-arrow">↘</span></span><span class="color-label">${escape(chapter.label)}</span>
    <span class="color-tooltip" aria-hidden="true">${escape(chapter.question)}</span>
  </a>`).join('\n'),
  chapters: content.gospel.map((chapter, index) => `<article class="gospel-chapter chapter-${escape(chapter.color)}" id="${escape(chapter.id)}" aria-labelledby="${escape(chapter.id)}-title">
    <div class="chapter-marker"><span class="chapter-dot color-${escape(chapter.color)}" aria-hidden="true"></span><span>0${index + 1} / ${escape(chapter.label)}</span></div>
    <div class="chapter-copy"><h3 id="${escape(chapter.id)}-title">${escape(chapter.question)}</h3><p>${escape(chapter.text)}</p></div>
    <div class="chapter-scripture">${chapter.verses.map(quote).join('')}${chapter.moreVerses?.length ? `<details class="verse-details"><summary>${escape(ui.moreVerses)} <span aria-hidden="true">+</span></summary><div>${chapter.moreVerses.map(quote).join('')}</div></details>` : ''}</div>
  </article>`).join('\n'),
  testimonies: content.testimonies.map((testimony) => `<details class="testimony" id="zeugnis-${escape(testimony.id)}">
    <summary><span class="testimony-person"><span class="avatar" aria-hidden="true">${escape(testimony.name.split(' ').map(n => n[0]).join(''))}</span><span><strong>${escape(testimony.name)}</strong><span>${escape(ui.myTestimony)}</span></span></span>
    <span class="testimony-preview"><span class="testimony-headline">${ui.quoteOpen}${escape(testimony.headline)}${ui.quoteClose}</span><span class="testimony-intro">${escape(testimony.intro)}</span><span class="testimony-action"><span class="when-closed">${escape(ui.readTestimony)}</span><span class="when-open">${escape(ui.closeTestimony)}</span></span></span><span class="expand-icon" aria-hidden="true">+</span></summary>
    <div class="testimony-body">${testimony.paragraphs.map(p => typeof p === 'string' ? `<p>${escape(p)}</p>` : quote(p)).join('\n')}</div>
  </details>`).join('\n'),
  contact: links(content.contact, 'contact-link'),
  social: links(content.social)
};

const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in slots)) throw new Error(`Unknown template slot: ${key}`);
  return slots[key];
});
await writeFile(path.join(root, outputFile), html);
console.log(`Built ${outputFile} from src/index.html and content/${contentFile}.`);
}
