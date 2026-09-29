import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderTelegram } from './telegram-render.mjs';
import { loadTestimonies } from './testimonies.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const template = await readFile(path.join(root, 'src/index.html'), 'utf8');
const telegram = JSON.parse(await readFile(path.join(root, 'content/telegram.json'), 'utf8'));
const legal = JSON.parse(await readFile(path.join(root, 'content/legal.json'), 'utf8'));
// Language-independent data (times, addresses, links, colors); the language files only hold visible text.
const shared = JSON.parse(await readFile(path.join(root, 'content/shared.json'), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const links = (items, className = '') => items.map((item) => `<a class="${className}" href="${escape(item.url)}"${item.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(item.label)} ${arrow}</a>`).join('\n');
const weekdays = {
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
const weekdayKeys = weekdays.en.map((day) => day.toLowerCase());

// Generate full HTML at build time: content and navigation work without JavaScript.
// A future CMS exporter only needs to provide the same content/shared.json and content/site.json schemas.
for (const lang of ['de', 'en']) {
const english = lang === 'en';
const contentFile = english ? 'site.en.json' : 'site.json';
const outputFile = english ? 'en.html' : 'index.html';
const content = JSON.parse(await readFile(path.join(root, 'content', contentFile), 'utf8'));
const ui = JSON.parse(await readFile(path.join(root, 'content', `ui.${lang}.json`), 'utf8'));
// Combine each shared entry with the text stored under its id in the language file.
const localize = (section, toFields = (text) => text) => {
  const texts = content[section];
  const ids = shared[section].map((item) => item.id);
  const unknown = Object.keys(texts).filter((id) => !ids.includes(id));
  if (unknown.length) throw new Error(`content/${contentFile}: ${section} has no shared entry for ${unknown.join(', ')}`);
  return shared[section].map((item) => {
    if (!(item.id in texts)) throw new Error(`content/${contentFile}: ${section}.${item.id} is missing`);
    return { ...item, ...toFields(texts[item.id]) };
  });
};
const meetings = localize('meetings').map((meeting) => {
  const weekday = weekdayKeys.indexOf(meeting.weekday);
  if (weekday < 0) throw new Error(`Unknown meeting weekday: ${meeting.weekday}`);
  return { ...meeting, weekday, day: weekdays[lang][weekday] };
});
const gospel = localize('gospel');
const contact = localize('contact', (label) => ({ label }));
const social = localize('social', (label) => ({ label }));
const testimonies = await loadTestimonies(root, lang, shared.testimonies);
const operator = `<address>${escape(legal.name)}<br>${escape(ui.legalResponsible)}: ${escape(legal.representative)}<br>${escape(legal.street)}<br>${escape(legal.city)}<br>${escape(ui.legalEmail)}: <a href="mailto:${escape(legal.email)}">${escape(legal.email)}</a></address>`;
const privacyDate = new Intl.DateTimeFormat(english ? 'en-GB' : 'de-DE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(legal.privacyUpdated));
const legalNotice = `<details class="footer-legal"><summary>${escape(ui.legalNoticeLabel)}</summary><div class="footer-legal-body"><div><h2>${escape(ui.legalNoticeTitle)}</h2>${operator}${legal.register ? `<p>${escape(ui.legalRegister)}: ${escape(legal.register)}</p>` : ''}</div>${ui.scriptureNotice ? `<div class="scripture-notice"><h2>${escape(ui.scriptureNoticeTitle)}</h2><p>${escape(ui.scriptureNotice)}</p>${ui.scriptureNoticeNote ? `<p class="scripture-notice-note">${escape(ui.scriptureNoticeNote)}</p>` : ''}</div>` : ''}</div></details>`;
const privacy = `<details class="footer-legal" id="datenschutz"><summary>${escape(ui.privacyLabel)}</summary><div class="footer-legal-body privacy"><div><h2>${escape(ui.privacyTitle)}</h2><p>${escape(content.privacy.intro)}</p></div>
    <section><h3>${escape(ui.privacyControllerTitle)}</h3>${operator}</section>
${content.privacy.sections.map((section) => `    <section><h3>${escape(section.heading)}</h3>${section.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('')}${section.links?.length ? `<p>${links(section.links, 'text-link')}</p>` : ''}</section>`).join('\n')}
    <p class="privacy-updated">${escape(ui.privacyUpdated)}: ${escape(privacyDate)}</p></div></details>`;
const quote = (verse) => `<blockquote><p>${ui.quoteOpen}${escape(verse.text)}${ui.quoteClose}</p><cite>${escape(verse.reference)}</cite></blockquote>`;
const slots = {
  ...Object.fromEntries(Object.entries(ui).map(([key, value]) => [key, escape(value)])),
  lang,
  telegram: renderTelegram(telegram, ui, lang),
  ogLocale: english ? 'en_GB' : 'de_DE',
  canonical: `https://bibeltreff.info/${english ? 'en.html' : ''}`,
  languageUrl: english ? 'index.html' : 'en.html',
  otherLang: english ? 'de' : 'en',
  legal: legalNotice + privacy,
  title: escape(content.title),
  description: escape(content.description),
  eyebrow: escape(content.hero.eyebrow),
  heading: escape(content.hero.heading),
  accent: escape(content.hero.accent),
  intro: escape(content.hero.text),
  verse: escape(content.hero.verse),
  verseReference: escape(content.hero.verseReference),
  meetings: meetings.map((meeting, index) => `<article class="meeting-card${index === 0 ? ' meeting-featured' : ''}" data-meeting-day="${meeting.weekday}" data-meeting-start="${escape(meeting.start)}" data-meeting-end="${escape(meeting.end)}">
    <div class="meeting-top"><span class="eyebrow">${escape(meeting.label)}</span><span class="meeting-number" aria-hidden="true">0${index + 1}</span></div>
    <h3>${escape(meeting.day)}</h3>
    <p class="meeting-time"><time>${escape(meeting.start)}</time><span aria-hidden="true">–</span><span class="sr-only">${escape(ui.to)}</span><time>${escape(meeting.end)}</time>${ui.timeSuffix ? ` <span>${escape(ui.timeSuffix)}</span>` : ''}</p>
    <div class="meeting-location"><svg class="icon" aria-hidden="true"><use href="#icon-pin"/></svg><p><strong>${escape(meeting.location)}</strong><br>${escape(meeting.address)}</p></div>
    <p class="meeting-note">${escape(meeting.note)}</p>
    <div class="meeting-links"><a href="${escape(meeting.map)}">${escape(ui.route)} ${arrow}</a>${meeting.online ? `<a href="${escape(meeting.online)}">${escape(ui.online)} ${arrow}</a>` : ''}</div>
  </article>`).join('\n'),
  colors: gospel.map((chapter, index) => `<a class="color-tab color-${escape(chapter.color)}" href="#${escape(chapter.id)}" data-chapter="${escape(chapter.id)}" aria-label="${index + 1}. ${escape(chapter.label)}: ${escape(chapter.question)} (${escape(chapter.colorName)})">
    <span class="color-index" aria-hidden="true">0${index + 1}<span class="color-arrow">↘</span></span><span class="color-label">${escape(chapter.label)}</span>
    <span class="color-tooltip" aria-hidden="true">${escape(chapter.question)}</span>
  </a>`).join('\n'),
  chapters: gospel.map((chapter, index) => `<article class="gospel-chapter chapter-${escape(chapter.color)}" id="${escape(chapter.id)}" aria-labelledby="${escape(chapter.id)}-title">
    <div class="chapter-marker"><span class="chapter-dot color-${escape(chapter.color)}" aria-hidden="true"></span><span>0${index + 1} / ${escape(chapter.label)}</span></div>
    <div class="chapter-copy"><h3 id="${escape(chapter.id)}-title">${escape(chapter.question)}</h3><p>${escape(chapter.text)}</p></div>
    <div class="chapter-scripture">${chapter.verses.map(quote).join('')}${chapter.moreVerses?.length ? `<details class="verse-details"><summary>${escape(ui.moreVerses)} <span aria-hidden="true">+</span></summary><div>${chapter.moreVerses.map(quote).join('')}</div></details>` : ''}</div>
  </article>`).join('\n'),
  testimonies: testimonies.map((testimony) => `<details class="testimony" id="zeugnis-${escape(testimony.id)}">
    <summary><span class="testimony-person"><span class="avatar" aria-hidden="true">${escape(testimony.name.split(' ').map(n => n[0]).join(''))}</span><span><strong>${escape(testimony.name)}</strong><span>${escape(ui.myTestimony)}</span></span></span>
    <span class="testimony-preview"><span class="testimony-headline">${ui.quoteOpen}${escape(testimony.headline)}${ui.quoteClose}</span><span class="testimony-intro">${escape(testimony.intro)}</span><span class="testimony-action"><span class="when-closed">${escape(ui.readTestimony)}</span><span class="when-open">${escape(ui.closeTestimony)}</span></span></span><span class="expand-icon" aria-hidden="true">+</span></summary>
    <div class="testimony-body">${testimony.paragraphs.map(p => typeof p === 'string' ? `<p>${escape(p)}</p>` : quote(p)).join('\n')}</div>
  </details>`).join('\n'),
  contact: links(contact, 'contact-link'),
  social: links(social)
};

const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in slots)) throw new Error(`Unknown template slot: ${key}`);
  return slots[key];
});
await writeFile(path.join(root, outputFile), html);
console.log(`Built ${outputFile} from src/index.html, content/shared.json, content/${contentFile} and content/zeugnisse/${lang}.`);
}
