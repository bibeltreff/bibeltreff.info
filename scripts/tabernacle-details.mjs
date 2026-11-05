// Deliberately schematic: the reference PDF does not depict these four items.
// Keep their shape simple and do not add inscriptions or decorative symbols.
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderTabernacleDetail(kind, title, lang = 'de') {
  const gold = `url(#tab-detail-${kind}-gold)`;
  const shadow = '<ellipse cx="180" cy="263" rx="94" ry="12" fill="#0a1423" opacity=".65"/>';
  // Both views use the same outline: an intact golden jar and a schematic
  // cutaway of it. The cutaway does not imply a transparent historical vessel.
  const jarOutline = 'M146 101h68v26c34 19 47 53 43 83-2 24-13 40-28 46h-98c-15-6-26-22-28-46-4-30 9-64 43-83Z';
  // Handles pass behind the body and terminate inside its outline at both ends.
  // The knob has a short stem overlapping the lid so it cannot float above it.
  const jar = `${shadow}<path d="M139 144C79 128 77 224 112 219M221 144c60-16 62 80 27 75" fill="none" stroke="#cf9f47" stroke-width="7"/><path d="${jarOutline}" fill="${gold}" stroke="#efd18b" stroke-width="2"/><path d="M146 104c-2-25 70-25 68 0Z" fill="${gold}" stroke="#efd18b" stroke-width="2"/><path d="M180 83v8" stroke="#e3bf6c" stroke-width="4"/><circle cx="180" cy="80" r="5" fill="#f1d48c"/><path d="M136 150c-17 23-20 54-6 78" fill="none" stroke="#fff0bc" stroke-width="4" opacity=".45" stroke-linecap="round"/>`;
  const grains = Array.from({ length: 26 }, (_, i) => {
    const row = Math.floor(i / 5), col = i % 5;
    return `<ellipse cx="${133 + col * 22 + (row % 2) * 9}" cy="${148 + row * 18}" rx="5.5" ry="4.5" fill="${i % 3 ? '#e9dec4' : '#fff4d6'}" transform="rotate(${(i % 5) * 12 - 24} ${133 + col * 22 + (row % 2) * 9} ${148 + row * 18})"/>`;
  }).join('');
  const manna = `${shadow}<path d="${jarOutline}" fill="#bd9343" fill-opacity=".09" stroke="#edcb7d" stroke-width="2.5" stroke-dasharray="5 3"/><path d="M146 101h68" stroke="#edcb7d" stroke-width="3"/><g data-manna-grains="">${grains}</g>`;
  const blossom = (x, y, size) => `<g transform="translate(${x} ${y}) scale(${size})"><g fill="#f1e5e4" stroke="#d4b9bd" stroke-width=".6"><ellipse cy="-6" rx="4" ry="6"/><ellipse cy="-6" rx="4" ry="6" transform="rotate(72)"/><ellipse cy="-6" rx="4" ry="6" transform="rotate(144)"/><ellipse cy="-6" rx="4" ry="6" transform="rotate(216)"/><ellipse cy="-6" rx="4" ry="6" transform="rotate(288)"/></g><circle r="3" fill="#dfb559"/></g>`;
  const staff = `${shadow}<g data-budding-rod=""><path d="M143 263c14-56 27-101 35-146 5-31 11-53 14-70" fill="none" stroke="#a47a46" stroke-width="8" stroke-linecap="round"/><path d="M162 196c-24-25-39-50-46-77M174 142c25-19 43-42 50-63M185 99l26-47" fill="none" stroke="#aa8250" stroke-width="4" stroke-linecap="round"/><path d="m124 141-3-8m78-13 2-14m-14-24-2-7m-4 36 10 2" fill="none" stroke="#aa8250" stroke-width="3" stroke-linecap="round"/><path d="M148 182c-20-3-30-13-30-26 15 2 24 9 30 26m29-43c15-1 26-8 31-20-17-2-29 5-31 20" fill="#91ac86" stroke="#c1cfa0" stroke-width="1"/>${blossom(121, 133, 1.05)}${blossom(201, 106, 1.2)}${blossom(185, 75, .8)}<g fill="#c7a572" stroke="#e2c697" stroke-width="1"><path d="M212 56q-14-16 2-25 12 15-2 25Z"/><path d="M224 84q-13-15 3-25 11 15-3 25Z"/><path d="M191 113q-13-15 3-25 11 15-3 25Z"/></g></g>`;
  const tablets = `${shadow}<g data-stone-tablets=""><path d="m86 77 79-7 7 172-79 7Z" fill="#c7c4bc" stroke="#ede4d0" stroke-width="2"/><path d="m165 70 8 5 7 172-8-5Z" fill="#8e939a"/><path d="m193 70 80 7-8 172-79-7Z" fill="#bcbfbe" stroke="#e8e0ce" stroke-width="2"/><path d="m273 77 6 5-8 172-6-5Z" fill="#818993"/></g>`;
  const drawings = { jar, manna, staff, tablets };
  if (!drawings[kind]) throw new Error(`Unknown tabernacle detail: ${kind}`);
  const cutaway = kind === 'manna' ? (lang === 'de' ? ' Schematischer Einblick in den Krug mit Manna.' : ' A schematic cutaway of the jar containing manna.') : '';
  return `<svg class="tour-content-svg" viewBox="0 0 360 300" role="img" aria-labelledby="tab-detail-${kind}-title tab-detail-${kind}-desc" xmlns="http://www.w3.org/2000/svg"><title id="tab-detail-${kind}-title">${escape(title)}</title><desc id="tab-detail-${kind}-desc">${escape(title + cutaway)}</desc><defs><linearGradient id="tab-detail-${kind}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7db94"/><stop offset=".45" stop-color="#d0a350"/><stop offset="1" stop-color="#9d702e"/></linearGradient></defs>${drawings[kind]}</svg>`;
}
