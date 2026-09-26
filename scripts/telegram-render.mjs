import { channel, validateState } from './telegram.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderTelegram(state, ui, lang) {
  validateState(state);
  // Until the first import there is no empty feed section on the public site.
  if (!state.posts.length) return '';
  const dateFormat = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'Europe/Berlin' });
  const cards = [...state.posts].sort((a, b) => b.id - a.id).map(post => `<article class="telegram-card">
    <h3><a href="https://t.me/${channel}/${post.id}"><time datetime="${escape(post.date)}">${escape(dateFormat.format(new Date(post.date)))}</time></a></h3>
    ${post.text ? `<p class="telegram-text" dir="auto">${escape(post.text)}</p>` : ''}
    ${post.hasMedia ? `<p class="telegram-media">${escape(ui.telegramMedia)}</p>` : ''}
    <a class="text-link" href="https://t.me/${channel}/${post.id}">${escape(ui.telegramRead)} <span aria-hidden="true">↗</span></a>
  </article>`).join('\n');
  return `<section class="telegram-section section wrap" id="aktuelles" aria-labelledby="telegram-title">
    <div class="section-heading"><div><p class="eyebrow section-label">Telegram · @${channel}</p><h2 id="telegram-title">${escape(ui.telegramHeading)}</h2></div><p>${escape(ui.telegramIntro)}</p></div>
    <div class="telegram-grid">${cards}</div>
    <p class="telegram-channel"><a class="text-link" href="https://t.me/${channel}">${escape(ui.telegramChannel)} <span aria-hidden="true">↗</span></a></p>
  </section>`;
}
