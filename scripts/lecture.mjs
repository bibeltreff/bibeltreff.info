import { readFileSync } from 'node:fs';

const lecture = JSON.parse(readFileSync(new URL('../content/lecture-2026-11-25.json', import.meta.url), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderLecture(lang) {
  const t = lecture[lang];
  if (!t) throw new Error(`Unsupported lecture language: ${lang}`);
  return `    <section class="lecture-section wrap" id="vortrag-ki" aria-labelledby="lecture-title">
      <div class="lecture-copy">
        <p class="eyebrow lecture-label">${escape(t.label)}</p>
        <p class="lecture-question">${escape(t.question)}</p>
        <h2 id="lecture-title">${escape(t.title)}</h2>
        <p class="lecture-subtitle">${escape(t.subtitle)}</p>
        <div class="lecture-details">
          <p><time datetime="${escape(lecture.datetime)}">${escape(t.date)}<br><strong>${escape(t.time)}</strong></time></p>
          <p><strong>${escape(t.room)}</strong><br>${escape(t.campus)}</p>
        </div>
        <a class="button lecture-download" href="${escape(lecture.pdf)}" download>${escape(t.download)}</a>
      </div>
      <div class="lecture-gallery">
        <a href="${escape(lecture.front)}" aria-label="${escape(t.frontLabel)}"><img src="${escape(lecture.front)}" alt="" width="1200" height="1692" loading="lazy" decoding="async"></a>
        <a href="${escape(lecture.back)}" aria-label="${escape(t.backLabel)}"><img src="${escape(lecture.back)}" alt="" width="1200" height="1692" loading="lazy" decoding="async"></a>
      </div>
    </section>`;
}
