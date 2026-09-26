import { channel, validateState } from './telegram.mjs';
import { renderText, escapeHtml as escape } from './telegram-format.mjs';

export function renderTelegram(state, ui, lang) {
  validateState(state);
  // Until the first import there is no empty feed section on the public site.
  if (!state.posts.length) return '';
  const dateFormat = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'Europe/Berlin' });
  const cards = [...state.posts].sort((a, b) => b.id - a.id).map(post => `<article class="telegram-card">
    <h3><a href="https://t.me/${channel}/${post.id}"><time datetime="${escape(post.date)}">${escape(dateFormat.format(new Date(post.date)))}</time></a></h3>
    ${post.text ? `<div class="telegram-text" dir="auto">${renderText(post.text, post.entities)}</div>` : ''}
    ${post.audio?.src ? `<figure class="telegram-audio"><figcaption>${escape(post.audio.title || ui.telegramAudio)}</figcaption><audio controls preload="none" aria-label="${escape(post.audio.title || ui.telegramAudio)}" src="${escape(post.audio.src)}"></audio><a href="${escape(post.audio.src)}" download>${escape(ui.telegramAudioDownload)}</a></figure>` : ''}
    ${post.hasMedia && !post.audio?.src ? `<p class="telegram-media">${escape(ui.telegramMedia)}</p>` : ''}
    <a class="text-link" href="https://t.me/${channel}/${post.id}">${escape(ui.telegramRead)} <span aria-hidden="true">↗</span></a>
  </article>`).join('\n');
  return `<section class="telegram-section section wrap" id="aktuelles" aria-labelledby="telegram-title">
    <div class="section-heading"><div><p class="eyebrow section-label">Telegram · @${channel}</p><h2 id="telegram-title">${escape(ui.telegramHeading)}</h2></div><p>${escape(ui.telegramIntro)}</p></div>
    <div class="telegram-grid">${cards}</div>
    <p class="telegram-channel"><a class="text-link" href="https://t.me/${channel}">${escape(ui.telegramChannel)} <span aria-hidden="true">↗</span></a></p>
  </section>`;
}
