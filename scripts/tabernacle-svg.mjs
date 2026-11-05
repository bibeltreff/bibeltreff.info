// A schematic cutaway, not an archaeological reconstruction. The altar is drawn
// before the veil; Hebrews 9:4 associates it with the Most Holy Place.
export function renderTabernacleSvg(lang = 'de') {
  const en = lang === 'en';
  const labels = en ? {
    title: 'The tabernacle: an illustrated cutaway',
    description: 'A schematic view of the tent. The Holy Place contains the lampstand and the table with twelve loaves. A purple veil separates the Most Holy Place with the ark of the covenant. The incense altar is shown before the veil. The drawing is not to scale.',
    holy: 'The Holy Place', mostHoly: 'The Most Holy Place', entrance: 'Entrance', veil: 'The veil',
    diagram: 'SCHEMATIC CUTAWAY',
  } : {
    title: 'Die Stiftshütte: ein Blick ins Innere',
    description: 'Schematische Ansicht des Zeltes. Im Heiligen stehen der Leuchter und der Tisch mit zwölf Broten. Ein violetter Vorhang trennt das Allerheiligste mit der Bundeslade ab. Der Räucheraltar ist vor dem Vorhang dargestellt. Die Zeichnung ist nicht maßstabsgetreu.',
    holy: 'Das Heilige', mostHoly: 'Das Allerheiligste', entrance: 'Eingang', veil: 'Der Vorhang',
    diagram: 'SCHEMATISCHER EINBLICK',
  };
  const bread = Array.from({ length: 12 }, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    return `<ellipse cx="${371 + col * 9 + row * 8}" cy="${207 - row * 9}" rx="5.5" ry="3.2" fill="#f5d889" stroke="#a97a28" stroke-width=".8"/>`;
  }).join('');
  const wallBoards = Array.from({ length: 19 }, (_, i) => `<path d="M${248 + i * 29} 113v115"/>`).join('');
  return `<svg class="tabernacle-svg" viewBox="0 0 900 540" role="img" aria-labelledby="tab-diagram-title tab-diagram-desc" xmlns="http://www.w3.org/2000/svg">
  <title id="tab-diagram-title">${labels.title}</title>
  <desc id="tab-diagram-desc">${labels.description}</desc>
  <defs>
    <linearGradient id="tab-floor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3a4151"/><stop offset="1" stop-color="#222b3a"/></linearGradient>
    <linearGradient id="tab-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c39b55" stop-opacity=".19"/><stop offset="1" stop-color="#c39b55" stop-opacity=".04"/></linearGradient>
    <linearGradient id="tab-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe8a6"/><stop offset=".45" stop-color="#d5ac54"/><stop offset="1" stop-color="#a87627"/></linearGradient>
    <linearGradient id="tab-gold-front" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#c9953d"/><stop offset=".55" stop-color="#f2d489"/><stop offset="1" stop-color="#c18b30"/></linearGradient>
    <linearGradient id="tab-veil" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#7b688f" stop-opacity=".4"/><stop offset=".4" stop-color="#a28cb3" stop-opacity=".18"/><stop offset="1" stop-color="#79558f" stop-opacity=".45"/></linearGradient>
    <radialGradient id="tab-light"><stop stop-color="#f6d37d" stop-opacity=".24"/><stop offset="1" stop-color="#f6d37d" stop-opacity="0"/></radialGradient>
  </defs>

  <text x="48" y="48" fill="#a8b6ca" font-size="12" letter-spacing="2.2" font-family="inherit">${labels.diagram}</text>
  <ellipse cx="462" cy="360" rx="330" ry="43" fill="#070f1d" opacity=".34"/>
  <path d="m90 335 145-95h585l-145 95Z" fill="url(#tab-floor)" stroke="#a6b2c7" stroke-opacity=".25"/>
  <path d="M90 335v16l585 0v-16" fill="#161f2e" stroke="#8592aa" stroke-opacity=".2"/>
  <path d="m675 335 145-95v16l-145 95Z" fill="#1c2636" stroke="#8592aa" stroke-opacity=".2"/>

  <g class="tour-object" data-tour-object="holy">
    <path class="tour-region" d="m90 335 145-95h390l-145 95Z" fill="#7ba3d5" fill-opacity=".08" stroke="#a2badb" stroke-width="1" stroke-opacity=".4"/>
    <path d="M276 354v36" fill="none" stroke="#a2badb" stroke-opacity=".5"/>
    <text x="276" y="416" text-anchor="middle" fill="#c9d8ec" font-family="inherit" font-size="21" font-weight="500">${labels.holy}</text>
    <path d="M166 433h220" stroke="#a2badb" stroke-opacity=".2"/>
  </g>
  <g class="tour-object" data-tour-object="most-holy">
    <path class="tour-region" d="m480 335 145-95h195l-145 95Z" fill="#c2a1d2" fill-opacity=".1" stroke="#c5acda" stroke-width="1" stroke-opacity=".5"/>
    <path d="M650 354v36" fill="none" stroke="#c5acda" stroke-opacity=".5"/>
    <text x="650" y="416" text-anchor="middle" fill="#ddcce9" font-family="inherit" font-size="21" font-weight="500">${labels.mostHoly}</text>
    <path d="M533 433h234" stroke="#c5acda" stroke-opacity=".2"/>
  </g>

  <g class="tour-object" data-tour-object="tent">
    <path d="M235 240V100h585v140" fill="url(#tab-wall)" stroke="#d7b875" stroke-width="1.5" stroke-opacity=".75"/>
    <g fill="none" stroke="#d7b875" stroke-opacity=".1" stroke-width="1">${wallBoards}</g>
    <path d="M90 335V195l145-95M90 195h585l145-95M675 195v140" fill="none" stroke="#d7b875" stroke-width="1.5" stroke-opacity=".65"/>
    <path d="m90 195 73-72 365-42 292 19" fill="none" stroke="#d7b875" stroke-width="1" stroke-opacity=".23" stroke-dasharray="5 7"/>
    <path d="M119 216v92m29-110v90m29-110v91m29-110v89" fill="none" stroke="#e5c580" stroke-opacity=".12" stroke-width="4"/>
    <path d="m48 376 53-35" fill="none" stroke="#aebdd2" stroke-opacity=".55"/>
    <text x="45" y="398" fill="#aebdd2" font-size="13" font-family="inherit">${labels.entrance}</text>
  </g>

  <g class="tab-veil">
    <path d="M480 335V195l145-95v140Z" fill="url(#tab-veil)" stroke="#bba3ce" stroke-width="1.5" stroke-opacity=".7"/>
    <path d="M493 326V187m18 127V175m18 127V163m18 127V151m18 127V139m18 127V127m18 127V115" stroke="#c5a6da" stroke-opacity=".15" stroke-width="3"/>
    <path d="m543 167-21-42" fill="none" stroke="#baa3ce" stroke-opacity=".65"/>
    <text x="515" y="112" fill="#c9b7da" text-anchor="end" font-size="12" font-family="inherit">${labels.veil}</text>
  </g>

  <g class="tour-object" data-tour-object="table">
    <ellipse cx="400" cy="272" rx="53" ry="12" fill="#090f19" opacity=".3"/>
    <path d="M352 214v55m73-55v55m-49-69v47m73-47v47" fill="none" stroke="#cca456" stroke-width="5"/>
    <path d="m345 213 28-19h83l-28 19Z" fill="url(#tab-gold)" stroke="#f3d78f" stroke-width="1.5"/>
    <path d="M345 213v7h83v-7m0 7 28-19v-7" fill="#c49642" stroke="#e0ba67" stroke-width="1.2"/>
    <path d="M350 230h75m-64 16h56" stroke="#c9a250" stroke-width="2"/>
    ${bread}
  </g>

  <g class="tour-object" data-tour-object="lampstand">
    <ellipse cx="278" cy="296" rx="56" ry="10" fill="#090f19" opacity=".3"/>
    <circle cx="278" cy="227" r="83" fill="url(#tab-light)"/>
    <g fill="none" stroke="url(#tab-gold)" stroke-width="4.5" stroke-linecap="round">
      <path d="M278 293V177"/>
      <path d="M278 267c-47 0-53-30-53-62v-9m53 59c-32 0-35-25-35-50v-16m35 51c-16 0-17-17-17-35v-22"/>
      <path d="M278 267c47 0 53-30 53-62v-9m-53 59c32 0 35-25 35-50v-16m-35 51c16 0 17-17 17-35v-22"/>
      <path d="M259 294h38m-32-7h26"/>
    </g>
    <g fill="#f2ce7e" stroke="#f8dfa4" stroke-width="1">
      <path d="m219 194 6 6 6-6Zm18-7 6 6 6-6Zm18-6 6 6 6-6Zm17-6 6 6 6-6Zm17 6 6 6 6-6Zm18 6 6 6 6-6Zm18 7 6 6 6-6Z"/>
    </g>
    <g fill="#ffe7a3">
      <path d="M225 191c-7-5-2-9 0-15 2 6 7 10 0 15Zm18-7c-7-5-2-9 0-15 2 6 7 10 0 15Zm18-6c-7-5-2-9 0-15 2 6 7 10 0 15Zm17-6c-7-5-2-9 0-15 2 6 7 10 0 15Zm17 6c-7-5-2-9 0-15 2 6 7 10 0 15Zm18 6c-7-5-2-9 0-15 2 6 7 10 0 15Zm18 7c-7-5-2-9 0-15 2 6 7 10 0 15Z"/>
    </g>
  </g>

  <g class="tour-object" data-tour-object="altar">
    <ellipse cx="517" cy="302" rx="40" ry="9" fill="#090f19" opacity=".3"/>
    <path d="M492 248h42v48h-42Z" fill="url(#tab-gold-front)" stroke="#e4be6a" stroke-width="1.3"/>
    <path d="m534 248 18-12v48l-18 12Z" fill="#b78636" stroke="#dfb865" stroke-width="1.3"/>
    <path d="m487 247 19-13h51l-19 13Z" fill="url(#tab-gold)" stroke="#f3d78f" stroke-width="1.5"/>
    <path d="M487 247v-8m51 8v-8m-32-5v-8m51 8v-8" stroke="#f1cf7c" stroke-width="4" stroke-linecap="round"/>
    <path d="M500 258h26v28h-26Z" fill="none" stroke="#a9772b" stroke-opacity=".55"/>
    <path d="M487 296h52v5h-52Z" fill="#d0a24b"/>
    <ellipse cx="521" cy="240" rx="12" ry="3" fill="#835335"/>
    <path d="M520 234c-15-17 11-26 0-42s-5-25 1-33m9 72c10-12-6-19-3-30" fill="none" stroke="#dfd3be" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
  </g>

  <g class="tour-object" data-tour-object="ark">
    <ellipse cx="693" cy="294" rx="70" ry="14" fill="#090f19" opacity=".35"/>
    <path d="M639 235h86v51h-86Z" fill="url(#tab-gold-front)" stroke="#f1ce79" stroke-width="1.8"/>
    <path d="m725 235 27-18v51l-27 18Z" fill="#b88937" stroke="#e3bc64" stroke-width="1.6"/>
    <path d="m633 234 28-19h98l-29 19Z" fill="url(#tab-gold)" stroke="#ffe0a0" stroke-width="1.6"/>
    <path d="M633 234v5h97v-5m0 5 29-19v-5" fill="#b98c3a" stroke="#e6c270" stroke-width="1.2"/>
    <path d="M649 246h66v29h-66Z" fill="none" stroke="#9f7027" stroke-opacity=".5"/>
    <path d="m626 262 112 0m-85-53 112 0" fill="none" stroke="#ebca80" stroke-width="4" stroke-linecap="round"/>
    <g fill="url(#tab-gold)" stroke="#f5d78f" stroke-width="1.2" stroke-linejoin="round">
      <path d="M665 223c3-7 7-13 8-24l6-1c1 12 5 18 8 25Zm8-24c-13-3-19-13-21-28 15 4 25 15 27 27Zm6-1c1-16 9-28 24-36-1 18-9 30-24 36Z"/>
      <path d="M724 211c-3-7-7-13-8-24l-6-1c-1 12-5 18-8 25Zm-8-24c13-3 19-13 21-28-15 4-25 15-27 27Zm-6-1c-1-16-9-28-24-36 1 18 9 30 24 36Z"/>
      <circle cx="677" cy="192" r="4"/><circle cx="712" cy="180" r="4"/>
    </g>
  </g>
  <path d="M48 475h804" stroke="#9aabc3" stroke-opacity=".15"/>
</svg>`;
}
