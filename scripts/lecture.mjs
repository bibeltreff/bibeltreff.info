import { readFileSync } from 'node:fs';

const lecture = JSON.parse(readFileSync(new URL('../content/lecture-2026-11-25.json', import.meta.url), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderLecture(lang) {
  const t = lecture[lang];
  if (!t) throw new Error(`Unsupported lecture language: ${lang}`);
  const pdf = t.pdf ?? lecture.pdf;
  const front = t.front ?? lecture.front;
  const back = t.back ?? lecture.back;
  const sectionId = 'vortrag-ki';
  const directLink = `https://bibeltreff.info/${lang === 'en' ? 'en.html' : ''}#${sectionId}`;
  return `    <section class="lecture-section wrap" id="${sectionId}" aria-labelledby="lecture-title">
      <div class="lecture-copy">
        <p class="eyebrow lecture-label">${escape(t.label)}</p>
        <p class="lecture-question">${escape(t.question)}</p>
        <h2 id="lecture-title">${escape(t.title)}</h2>
        <p class="lecture-subtitle">${escape(t.subtitle)}</p>
        <div class="lecture-details">
          <p><time datetime="${escape(lecture.datetime)}"><strong>${escape(t.date)}<br>${escape(t.time)}</strong></time></p>
          <p><a class="lecture-location" href="${escape(lecture.map)}">${escape(t.room)}<br>${escape(t.campus)}</a></p>
        </div>
        <div class="lecture-actions"><a class="button lecture-download" href="${escape(pdf)}" download>${escape(t.download)}</a><a class="lecture-share" href="${escape(directLink)}">${escape(t.shareLink)}</a></div>
      </div>
      <div class="lecture-gallery">
        <a href="${escape(front)}" aria-label="${escape(t.frontLabel)}"><img src="${escape(front)}" alt="" width="${lecture.imageWidth}" height="${lecture.imageHeight}" loading="lazy" decoding="async"></a>
        <a href="${escape(back)}" aria-label="${escape(t.backLabel)}"><img src="${escape(back)}" alt="" width="${lecture.imageWidth}" height="${lecture.imageHeight}" loading="lazy" decoding="async"></a>
      </div>
    </section>`;
}
