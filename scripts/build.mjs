import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderTelegram } from './telegram-render.mjs';
import { loadTestimonies } from './testimonies.mjs';
import { createImageOptimizer } from './images.mjs';
import { articleFolders, loadArticles, overviewUrl, topicUrl } from './articles.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const optimizeImages = createImageOptimizer(root);
const layout = await readFile(path.join(root, 'src/layout.html'), 'utf8');
const template = await readFile(path.join(root, 'src/index.html'), 'utf8');
const telegram = JSON.parse(await readFile(path.join(root, 'content/telegram.json'), 'utf8'));
const legal = JSON.parse(await readFile(path.join(root, 'content/legal.json'), 'utf8'));
// Language-independent data (times, addresses, links, colors); the language files only hold visible text.
const shared = JSON.parse(await readFile(path.join(root, 'content/shared.json'), 'utf8'));
const { topics, articles } = await loadArticles(root);
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const links = (items, className = '') => items.map((item) => `<a class="${className}" href="${escape(item.url)}"${item.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(item.label)} ${arrow}</a>`).join('\n');
const weekdays = {
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
const weekdayKeys = weekdays.en.map((day) => day.toLowerCase());
const homeFiles = { de: 'index.html', en: 'en.html' };
const site = 'https://bibeltreff.info/';
const siteName = 'Bibeltreff Stuttgart';
// Link preview for pages without their own image; square, so shown as a small card.
const defaultImage = { url: 'assets/images/bibeltreff_logo_telegram.jpg', width: 640, height: 640, alt: siteName };
const organization = { '@type': 'Organization', name: siteName, url: site };
// Every public page, for sitemap.xml.
const sitemap = [];
const day = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(date);

const fill = (text, slots) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in slots)) throw new Error(`Unknown template slot: ${key}`);
  return slots[key];
});
// Pages are written with URLs relative to the site root; pages in subfolders get the matching ../ prefix.
const relocate = (html, prefix) => prefix ? html.replace(/(\s(?:href|src))="(?![a-z][a-z0-9+.-]*:|#|\/)([^"]*)"/gi, `$1="${prefix}$2"`) : html;
async function writePage(file, html, lastmod) {
  sitemap.push({ url: file.replace(/(^|\/)index\.html$/, '$1'), lastmod });
  const prefix = '../'.repeat(file.split('/').length - 1);
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), relocate(await optimizeImages(html), prefix));
  return prefix;
}

// Article pages are fully generated: start from empty folders so removed articles disappear.
for (const folder of Object.values(articleFolders)) await rm(path.join(root, folder), { recursive: true, force: true });

// Generate full HTML at build time: content and navigation work without JavaScript.
// A future CMS exporter only needs to provide the same shared, site and gospel content schemas.
for (const lang of ['de', 'en']) {
const english = lang === 'en';
const other = english ? 'de' : 'en';
const contentFile = english ? 'site.en.json' : 'site.json';
const outputFile = homeFiles[lang];
const content = JSON.parse(await readFile(path.join(root, 'content', contentFile), 'utf8'));
const gospelFile = `gospel.${lang}.json`;
const gospelTexts = JSON.parse(await readFile(path.join(root, 'content', gospelFile), 'utf8'));
const ui = JSON.parse(await readFile(path.join(root, 'content', `ui.${lang}.json`), 'utf8'));
// Combine each shared entry with the text stored under its id in the language file.
const localize = (section, toFields = (text) => text, texts = content[section], source = contentFile) => {
  const ids = shared[section].map((item) => item.id);
  const unknown = Object.keys(texts).filter((id) => !ids.includes(id));
  if (unknown.length) throw new Error(`content/${source}: ${section} has no shared entry for ${unknown.join(', ')}`);
  return shared[section].map((item) => {
    if (!(item.id in texts)) throw new Error(`content/${source}: ${section}.${item.id} is missing`);
    return { ...item, ...toFields(texts[item.id]) };
  });
};
const meetings = localize('meetings').map((meeting) => {
  const weekday = weekdayKeys.indexOf(meeting.weekday);
  if (weekday < 0) throw new Error(`Unknown meeting weekday: ${meeting.weekday}`);
  return { ...meeting, weekday, day: weekdays[lang][weekday] };
});
const gospel = localize('gospel', undefined, gospelTexts, gospelFile);
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
const uiSlots = Object.fromEntries(Object.entries(ui).map(([key, value]) => [key, escape(value)]));

// --- Articles of this language ----------------------------------------------
const list = articles[lang];
const langTopics = topics.filter((topic) => list.some((article) => article.topic === topic.id));
const topicName = (id) => topics.find((topic) => topic.id === id)[lang];
const dateFormat = new Intl.DateTimeFormat(english ? 'en-GB' : 'de-DE', { dateStyle: 'long', timeZone: 'Europe/Berlin' });
const isoDay = day;
const time = (article) => `<time datetime="${isoDay(article.date)}">${escape(dateFormat.format(article.date))}</time>`;
const count = (n) => n === 1 ? ui.articleCountOne : ui.articleCountOther.replace('{count}', n);
const latest = list[0];
// Without JavaScript the "random" links need a fixed target; it only changes when the articles change.
const fallback = list[[...list.map((article) => article.id).join()].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 1000003, 7) % list.length];
const pickable = list.map((article) => article.url).join(' ');

// Semesters as at Uni Stuttgart: summer 1 April – 30 September, winter 1 October – 31 March.
// Keys count half-years, so consecutive semesters have consecutive keys.
const semesterKey = (date) => {
  const [year, month] = isoDay(date).split('-').map(Number);
  if (month >= 4 && month <= 9) return year * 2;
  return (month >= 10 ? year : year - 1) * 2 + 1;
};
const semesterName = (key) => {
  const year = Math.floor(key / 2);
  return key % 2 ? ui.semesterWinter.replace('{year}', `${year}/${String(year + 1).slice(2)}`) : ui.semesterSummer.replace('{year}', year);
};
// "WiSe 2020/21 – SoSe 2022" for consecutive semesters, otherwise a list.
const semesterRanges = (keys) => keys.reduce((ranges, key) => {
  const last = ranges.at(-1);
  if (last && key === last[1] + 1) last[1] = key; else ranges.push([key, key]);
  return ranges;
}, []).map(([from, to]) => from === to ? semesterName(from) : `${semesterName(from)} – ${semesterName(to)}`).join(', ');
// Topics are listed by the semester they started in, newest first.
const topicsBySemester = langTopics.map((topic) => {
  const topicArticles = list.filter((article) => article.topic === topic.id);
  // Translations are dated when they were translated, so the German original decides the semester.
  const semesters = [...new Set(topicArticles.map((article) => semesterKey(article.translations.de.date)))].sort((a, b) => a - b);
  return { topic, count: topicArticles.length, semesters };
}).sort((a, b) => b.semesters[0] - a.semesters[0] || a.topic[lang].localeCompare(b.topic[lang], lang));

// Navigation: on the home page the sections are anchors, elsewhere they lead back to it.
// Artikel comes last, set apart from the home page sections by a divider.
const nav = (page) => {
  const home = page === 'home' ? '' : homeFiles[lang];
  const current = page === 'home' ? '' : ' aria-current="page"';
  return `<a href="${home}#treffen">${uiSlots.navMeetings}</a><a href="${home}#evangelium">${uiSlots.navGospel}</a><a href="${home}#zeugnisse">${uiSlots.navTestimonies}</a><a href="${home}#kontakt">${uiSlots.navContact}</a><div class="nav-item nav-articles">
        <a class="nav-parent" href="${overviewUrl(lang)}"${current}>${uiSlots.navArticles}</a>
        <div class="nav-menu" aria-label="${uiSlots.articlesMenu}" role="group">
          <a href="${latest.url}">${uiSlots.articlesLatest}</a>
          <a href="${fallback.url}" data-random-articles="${escape(pickable)}">${uiSlots.articlesRandom}</a>
          <div class="nav-item nav-subitem"><a class="nav-parent" href="${overviewUrl(lang)}">${uiSlots.articlesAll} <span aria-hidden="true">›</span></a>
            <div class="nav-menu nav-submenu">${langTopics.map((topic) => `<a href="${topicUrl(lang, topic.id)}">${escape(topic[lang])}</a>`).join('')}</div>
          </div>
        </div>
      </div>`;
};

// Share preview (Open Graph, X/Twitter) and structured data (JSON-LD) for search engines.
// "<" is escaped so the JSON cannot close the script element.
const meta = ({ image = defaultImage, published, structuredData }) => [
  `  <meta property="og:site_name" content="${escape(siteName)}">`,
  `  <meta property="og:image" content="${escape(site + image.url)}">`,
  `  <meta property="og:image:width" content="${image.width}">`,
  `  <meta property="og:image:height" content="${image.height}">`,
  `  <meta property="og:image:alt" content="${escape(image.alt)}">`,
  published ? `  <meta property="article:published_time" content="${published.toISOString()}">` : '',
  `  <meta name="twitter:card" content="${image.width > image.height ? 'summary_large_image' : 'summary'}">`,
  structuredData ? `  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': structuredData }).replace(/</g, '\\u003c')}</script>` : ''
].filter(Boolean).join('\n');
const breadcrumbData = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([url, name], index) => ({ '@type': 'ListItem', position: index + 1, name, item: site + url }))
});
const renderPage = ({ file, page, title, description, canonical, alternates = '', ogType = 'website', image, published, structuredData, languageUrl, main, scripts = '' }) => fill(layout, {
  ...uiSlots,
  lang,
  root: '../'.repeat(file.split('/').length - 1),
  title: escape(title),
  description: escape(description),
  canonical: escape(canonical),
  alternates,
  ogType,
  ogLocale: english ? 'en_GB' : 'de_DE',
  meta: meta({ image, published, structuredData }),
  scripts,
  homeUrl: page === 'home' ? '#start' : homeFiles[lang],
  nav: nav(page),
  languageUrl,
  otherLang: other,
  main,
  legal: legalNotice + privacy,
  social: links(social)
});
const alternateLinks = (urls) => typeof urls.de === 'string' && typeof urls.en === 'string'
  ? ['de', 'en'].map((code) => `  <link rel="alternate" hreflang="${code}" href="${site}${urls[code]}">`).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${site}${urls.de}">`
  : '';
const articleCard = (article, label, attributes = '', level = 2) => `<article class="article-card"${attributes}>
          <p class="eyebrow section-label">${escape(label)}</p>
          <h${level}><a href="${article.url}" data-field="title">${escape(article.title)}</a></h${level}>
          <p class="article-meta"><span data-field="date">${time(article)}</span> · <a href="${topicUrl(lang, article.topic)}" data-field="topic">${escape(topicName(article.topic))}</a></p>
          <p class="article-excerpt" data-field="excerpt">${escape(article.excerpt)}</p>
          <a class="text-link" href="${article.url}" data-field="link">${uiSlots.readArticle} <span aria-hidden="true">→</span></a>
        </article>`;
const breadcrumb = (items) => `<nav class="breadcrumb" aria-label="${uiSlots.breadcrumb}">${items.map(([url, label]) => `<a href="${url}">${escape(label)}</a>`).join('<span aria-hidden="true">/</span>')}</nav>`;

// --- Home page --------------------------------------------------------------
// Data for the random card; "<" is escaped so the JSON cannot close the script element.
const randomData = JSON.stringify(list.map((article) => ({
  url: article.url, title: article.title, date: dateFormat.format(article.date), datetime: isoDay(article.date),
  topic: topicName(article.topic), topicUrl: topicUrl(lang, article.topic), excerpt: article.excerpt
}))).replace(/</g, '\\u003c');
const randomScript = `<script type="application/json" id="article-index">${randomData}</script>`;
// Next to the Telegram chat: latest, random and all articles.
const articleAside = `<aside class="telegram-articles" aria-label="${uiSlots.articlesTitle}">
        ${articleCard(latest, ui.articlesLatest, '', 3)}
        ${articleCard(fallback, ui.articlesRandom, ' data-random-card', 3)}
        <a class="article-all" href="${overviewUrl(lang)}"><span class="eyebrow section-label">${uiSlots.articlesAll}</span><span class="article-all-count">${escape(count(list.length))} · ${escape(ui.articlesTopicCount.replace('{count}', langTopics.length))}</span><span class="article-all-arrow" aria-hidden="true">→</span></a>
        ${randomScript}
      </aside>`;
const home = fill(template, {
  ...uiSlots,
  telegram: renderTelegram(telegram, ui, lang, articleAside),
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
  contact: links(contact, 'contact-link')
});
await writePage(outputFile, renderPage({
  file: outputFile,
  page: 'home',
  title: content.title,
  description: content.description,
  canonical: `${site}${english ? 'en.html' : ''}`,
  alternates: alternateLinks({ de: '', en: 'en.html' }),
  languageUrl: homeFiles[other],
  structuredData: [
    { '@type': 'WebSite', name: siteName, url: site, inLanguage: lang },
    {
      ...organization,
      logo: site + defaultImage.url,
      email: legal.email,
      sameAs: social.map((item) => item.url),
      location: meetings.map((meeting) => ({ '@type': 'Place', name: meeting.location, address: meeting.address }))
    }
  ],
  main: home,
  scripts: '  <script src="assets/meeting-status.js" defer></script>'
}));

// --- Article overview: latest, random, then all topics -----------------------
const overview = overviewUrl(lang);
await writePage(`${overview}index.html`, renderPage({
  file: `${overview}index.html`,
  page: 'articles',
  title: `${ui.articlesTitle} – Bibeltreff`,
  description: ui.articlesIntro,
  canonical: `${site}${overview}`,
  alternates: alternateLinks({ de: overviewUrl('de'), en: overviewUrl('en') }),
  languageUrl: overviewUrl(other),
  main: `  <main id="inhalt" class="articles-page">
    <header class="page-head wrap">
      <h1>${uiSlots.articlesTitle}</h1>
      <p class="page-intro">${uiSlots.articlesIntro}${ui.articlesInGerman ? ` ${uiSlots.articlesInGerman} <a class="text-link" href="${overviewUrl('de')}" lang="de" hreflang="de">${uiSlots.articlesInGermanLink} <span aria-hidden="true">→</span></a>` : ''}</p>
    </header>
    <section class="article-highlights wrap" aria-label="${uiSlots.articlesLatest}, ${uiSlots.articlesRandom}">
        ${articleCard(latest, ui.articlesLatest)}
        ${articleCard(fallback, ui.articlesRandom, ' data-random-card')}
    </section>
    <section class="topics-section wrap" aria-labelledby="topics-title">
      <h2 id="topics-title">${uiSlots.articlesTopics}</h2>
<ul class="topic-list">${topicsBySemester.map(({ topic, count: n, semesters }) => `
        <li><a class="topic-row" href="${topicUrl(lang, topic.id)}"><span class="topic-name">${escape(topic[lang])}</span><span class="topic-semesters">${escape(semesterRanges(semesters))}</span><span class="topic-count">${escape(count(n))}</span><span class="topic-arrow" aria-hidden="true">→</span></a></li>`).join('')}
      </ul>
    </section>
    ${randomScript}
  </main>
`
}), latest.date);

// --- One page per topic: all articles, newest first --------------------------
for (const topic of langTopics) {
  const file = `${topicUrl(lang, topic.id)}index.html`;
  const topicArticles = list.filter((article) => article.topic === topic.id);
  const thumbnails = await Promise.all(topicArticles.map((article) => article.image && optimizeImages.thumbnail(article.image)));
  // The thumbnail repeats the title link, so it is skipped by keyboard and screen readers.
  const thumbnail = (article, index) => thumbnails[index] ? `<a class="article-thumb" href="${article.url}" tabindex="-1" aria-hidden="true"><img src="${thumbnails[index].url}" alt="" width="${thumbnails[index].width}" height="${thumbnails[index].height}" loading="lazy" decoding="async"></a>` : '';
  await writePage(file, renderPage({
    file,
    page: 'topic',
    title: `${topic[lang]} – ${ui.articlesTitle} – Bibeltreff`,
    description: `${topic[lang]}: ${count(topicArticles.length)}. ${ui.articlesIntro}`,
    canonical: `${site}${topicUrl(lang, topic.id)}`,
    alternates: alternateLinks({ de: topicUrl('de', topic.id), en: articles.en.some((article) => article.topic === topic.id) && topicUrl('en', topic.id) }),
    languageUrl: articles[other].some((article) => article.topic === topic.id) ? topicUrl(other, topic.id) : overviewUrl(other),
    structuredData: [breadcrumbData([[overview, ui.articlesTitle], [topicUrl(lang, topic.id), topic[lang]]])],
    main: `  <main id="inhalt" class="articles-page">
    <header class="page-head wrap">
      ${breadcrumb([[overview, ui.articlesTitle]])}
      <h1>${escape(topic[lang])}</h1>
      <p class="page-intro">${escape(count(topicArticles.length))}</p>
    </header>
    <ol class="article-list wrap">${topicArticles.map((article, index) => `
      <li class="article-item${thumbnails[index] ? ' has-thumb' : ''}">
        ${thumbnail(article, index)}
        <div class="article-item-text">
          <h2><a href="${article.url}">${escape(article.title)}</a></h2>
          <p class="article-meta">${time(article)}</p>
          <p class="article-excerpt">${escape(article.excerpt)}</p>
        </div>
      </li>`).join('')}
    </ol>
  </main>
`
  }), topicArticles[0].date);
}

// --- One page per article ----------------------------------------------------
for (const article of list) {
  const topicArticles = list.filter((candidate) => candidate.topic === article.topic);
  const index = topicArticles.indexOf(article);
  const [newer, older] = [topicArticles[index - 1], topicArticles[index + 1]];
  const pager = (target, label, rel) => target ? `<a class="pager-${rel}" rel="${rel}" href="${target.url}"><span>${escape(label)}</span>${escape(target.title)}</a>` : '<span></span>';
  const translation = article.translations[other];
  const shareImage = article.image && { ...await optimizeImages.share(article.image), alt: article.title };
  await writePage(article.url, renderPage({
    file: article.url,
    page: 'article',
    title: `${article.title} – Bibeltreff`,
    description: article.excerpt,
    canonical: `${site}${article.url}`,
    alternates: alternateLinks({ [lang]: article.url, [other]: translation?.url }),
    ogType: 'article',
    image: shareImage || undefined,
    published: article.date,
    structuredData: [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt,
        datePublished: article.date.toISOString(),
        inLanguage: lang,
        ...(shareImage && { image: site + shareImage.url }),
        author: organization,
        publisher: { ...organization, logo: site + defaultImage.url },
        mainEntityOfPage: site + article.url,
        articleSection: topicName(article.topic)
      },
      breadcrumbData([[overview, ui.articlesTitle], [topicUrl(lang, article.topic), topicName(article.topic)], [article.url, article.title]])
    ],
    languageUrl: translation ? translation.url : overviewUrl(other),
    main: `  <main id="inhalt" class="articles-page">
    <article class="article wrap">
      <header class="page-head">
        ${breadcrumb([[overview, ui.articlesTitle], [topicUrl(lang, article.topic), topicName(article.topic)]])}
        <h1>${escape(article.title)}</h1>
        <p class="article-meta">${time(article)}</p>
      </header>
      <div class="article-body">
${article.html}      </div>
      ${older || newer ? `<nav class="article-pager" aria-label="${uiSlots.articleMore}">${pager(older, ui.articleOlder, 'prev')}${pager(newer, ui.articleNewer, 'next')}</nav>` : ''}
    </article>
  </main>
`
  }), article.date);
}
console.log(`Built ${outputFile}, ${overview} with ${langTopics.length} topics and ${list.length} articles from src/, content/shared.json, content/${contentFile}, content/${gospelFile}, content/zeugnisse/${lang} and content/artikel/${lang}.`);
}

// --- Search engines: sitemap.xml lists every page, robots.txt points to it ---
const xml = (value) => escape(value).replace(/&#39;/g, '&apos;');
await writeFile(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(({ url, lastmod }) => `  <url><loc>${xml(site + url)}</loc>${lastmod ? `<lastmod>${day(lastmod)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);
await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`);
console.log(`Built sitemap.xml with ${sitemap.length} pages and robots.txt.`);
