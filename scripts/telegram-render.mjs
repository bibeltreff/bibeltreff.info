import { channel, validateState } from './telegram.mjs';
import { renderText, escapeHtml as escape } from './telegram-format.mjs';

// `aside` is optional HTML shown next to the chat (the article teasers on the home page).
export function renderTelegram(state, ui, lang, aside = '') {
  validateState(state);
  if (!state.posts.length && !aside) return '';
  const dateFormat = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' });
  const cards = [...state.posts].sort((a, b) => a.id - b.id).map(post => `<div class="telegram-message">
    <p class="telegram-date"><time datetime="${escape(post.date)}">${escape(dateFormat.format(new Date(post.date)))}</time></p>
    <article class="telegram-card">
    <header class="telegram-sender"><img class="telegram-avatar" src="assets/images/bibeltreff_logo_telegram.jpg" width="36" height="36" loading="lazy" decoding="async" alt=""><h3><a class="telegram-card-link" href="https://t.me/${channel}/${post.id}" target="_blank" rel="noopener noreferrer" aria-label="${escape(ui.telegramOpenMessage)} · ${escape(dateFormat.format(new Date(post.date)))}">Bibeltreff</a></h3></header>
${post.photo?.src ? `<a class="telegram-photo" href="${escape(post.photo.src)}" aria-label="${escape(ui.telegramPhotoOpen)}"><img src="${escape(post.photo.src)}" width="${post.photo.width}" height="${post.photo.height}" loading="lazy" decoding="async" alt="${escape(ui.telegramPhoto)}"></a>` : ''}
${post.text ? `<div class="telegram-text" dir="auto">${renderText(post.text, post.entities, { compactParagraphs: true })}</div>` : ''}
${post.audio || (post.hasMedia && !post.photo?.src) ? `<div class="telegram-attachments">${post.audio?.src ? `<div class="telegram-audio"><audio controls preload="none" aria-label="${escape(post.audio.title || ui.telegramAudio)}" src="${escape(post.audio.src)}"></audio><a href="${escape(post.audio.src)}" download>${escape(ui.telegramAudioDownload)}</a></div>` : `<p class="telegram-media">${escape(post.audio ? ui.telegramAudioFallback : ui.telegramMedia)}</p>`}</div>` : ''}
    </article>
  </div>`).join('\n');
  return `<section class="telegram-section section wrap" id="aktuelles" aria-labelledby="telegram-title">
    <div class="section-heading"><div><p class="eyebrow section-label">Telegram · @${channel}</p><h2 id="telegram-title">${escape(ui.telegramHeading)}</h2></div><p>${escape(ui.telegramIntro)}</p></div>
    ${aside ? '<div class="telegram-layout">' : ''}${state.posts.length ? `<div class="telegram-chat"><div class="telegram-window" role="region" aria-labelledby="telegram-title" tabindex="0"><div class="telegram-grid">${cards}</div></div></div>` : ''}
    <p class="telegram-channel"><a class="text-link" href="https://t.me/${channel}">${escape(ui.telegramChannel)} <span aria-hidden="true">↗</span></a></p>${aside ? `
    ${aside}</div>` : ''}
  </section>`;
}
