// A schematic cutaway, not an archaeological reconstruction. The altar is drawn
// before the veil, following the placement described in Exodus 30:6.
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
  // The reference shows the twelve loaves as two stacks of six flat breads.
  const bread = [378, 417].map((x) => `<ellipse cx="${x}" cy="207" rx="17" ry="6" fill="url(#tab-gold)" stroke="#f3d78f"/>${Array.from({ length: 6 }, (_, i) => {
    const y = 201 - i * 5;
    return `<g data-loaf="${i + 1}"><path d="M${x - 14} ${y}v3c0 6 28 6 28 0v-3" fill="#c8a16a" stroke="#8e6c40" stroke-width=".7"/><ellipse cx="${x}" cy="${y}" rx="14" ry="4" fill="#e4c28c" stroke="#a98752" stroke-width=".7"/></g>`;
  }).join('')}`).join('');
  const wallBoards = Array.from({ length: 20 }, (_, i) => {
    const x = 235 + i * 29.25;
    return `<path d="M${x} 102v136" stroke="#e6c579" stroke-opacity=".25"/><path d="M${x + 1} 239h13v8h-13Zm15 0h12v8h-12Z" fill="url(#tab-silver)" stroke="#b5bac1" stroke-opacity=".4" stroke-width=".5"/>`;
  }).join('');
  const lamps = [[225, 194], [243, 187], [261, 181], [278, 175], [295, 181], [313, 187], [331, 194]].map(([x, y], i) => `<g data-lamp="${i + 1}" transform="translate(${x} ${y})"><path d="M-7-2c0 10 14 10 14 0L11-4 6-6Z" fill="url(#tab-gold)" stroke="#f1d387" stroke-width="1"/><ellipse cy="-2" rx="7" ry="3" fill="#e6c679" stroke="#ffe6a2"/><ellipse cy="-2" rx="4.5" ry="1.6" fill="#89632d"/><path d="m7-5 3-1" stroke="#655134" stroke-width="1.4"/><path d="M10-6c-3-3 0-5 0-8 3 4 4 6 0 8Z" fill="#ffe8a6"/></g>`).join('');
  const cups = [[278, 211], [278, 234], [278, 260], [231, 235], [249, 224], [265, 212], [325, 235], [307, 224], [291, 212]].map(([x, y]) => `<g transform="translate(${x} ${y})" fill="url(#tab-gold)" stroke="#f5d68c" stroke-width=".7"><path d="M-4-4q1 5 4 7 3-2 4-7L0-1Z"/><ellipse cy="4" rx="3" ry="2"/></g>`).join('');
  const wovenCherub = '<path d="M-2 4v-8l-4-5-8-5 4 9 6 5-1 6-2 4H7L5 6 4 0l6-5 4-9-8 5-4 5v8Z"/><circle cy="-7" r="2.3"/>';
  const wovenMotifs = [22, 58, 96, 130].map((x) => [36, 89].map((y) => `<g transform="translate(${x} ${y})" fill="#e4c77d" fill-opacity=".45">${wovenCherub}</g>`).join('')).join('');
  const veilPosts = Array.from({ length: 4 }, (_, i) => {
    const x = 480 + i * 145 / 3, top = 195 - i * 95 / 3, bottom = top + 140;
    return `<path d="M${x} ${top}v140" stroke="url(#tab-gold)" stroke-width="4.5"/><path d="M${x - 4} ${bottom - 1}h8v9h-8Z" fill="url(#tab-silver)" stroke="#bec4ce" stroke-width=".5"/>`;
  }).join('');
  const cherub = (x, y, mirror = false) => `<g data-cherub="${mirror ? 2 : 1}" transform="translate(${x} ${y})${mirror ? ' scale(-1 1)' : ''}" fill="url(#tab-gold)" stroke="#f3d48b" stroke-width="1" stroke-linejoin="round">
    <path d="M-4-21c-13-12-18-29-9-42 14-8 28-2 43 9-14 0-25 10-34 33Z" fill-opacity=".7"/>
    <path d="M-5-1-5-15q-3-14 6-16l6 4-3 6q1 9 9 14L15-1Z"/>
    <path d="M-3-22c-7-13-6-26 5-34 10-7 21-3 32 8-12-3-23 6-37 26Z"/>
    <path d="M-7-47Q5-61 26-51M-6-42Q7-56 27-49M-5-37Q8-51 25-46M-4-32Q9-46 22-42M-2-28Q10-41 18-38" fill="none" stroke="#9b722e" stroke-width=".85"/>
    <ellipse cx="4" cy="-34" rx="4.5" ry="5.5" transform="rotate(-26 4 -34)"/>
    <path d="m7-33 3 4-4 1M4-22q11 7 9 15M-8 0h22" fill="none" stroke="#f8dc96" stroke-linecap="round"/>
  </g>`;
  return `<svg class="tabernacle-svg" viewBox="0 0 900 540" role="img" aria-labelledby="tab-diagram-title tab-diagram-desc" xmlns="http://www.w3.org/2000/svg">
  <title id="tab-diagram-title">${labels.title}</title>
  <desc id="tab-diagram-desc">${labels.description}</desc>
  <defs>
    <linearGradient id="tab-floor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3a4151"/><stop offset="1" stop-color="#222b3a"/></linearGradient>
    <linearGradient id="tab-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c39b55" stop-opacity=".19"/><stop offset="1" stop-color="#c39b55" stop-opacity=".04"/></linearGradient>
    <linearGradient id="tab-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe8a6"/><stop offset=".45" stop-color="#d5ac54"/><stop offset="1" stop-color="#a87627"/></linearGradient>
    <linearGradient id="tab-gold-front" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#c9953d"/><stop offset=".55" stop-color="#f2d489"/><stop offset="1" stop-color="#c18b30"/></linearGradient>
    <linearGradient id="tab-silver" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f0f0e7"/><stop offset=".5" stop-color="#9aa4b4"/><stop offset="1" stop-color="#ced1cf"/></linearGradient>
    <linearGradient id="tab-veil" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#355d9a" stop-opacity=".65"/><stop offset=".4" stop-color="#79558f" stop-opacity=".5"/><stop offset="1" stop-color="#a84b61" stop-opacity=".65"/></linearGradient>
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
    <g stroke-width="1">${wallBoards}</g>
    <path d="M90 335V195l145-95M90 195h585l145-95M675 195v140" fill="none" stroke="#d7b875" stroke-width="1.5" stroke-opacity=".65"/>
    <path d="m90 195 145-95h585l-145 95Z" fill="none" stroke="#d7b875" stroke-width="1" stroke-opacity=".3" stroke-dasharray="5 7"/>
    <path d="M119 216v92m29-110v90m29-110v91m29-110v89" fill="none" stroke="#e5c580" stroke-opacity=".12" stroke-width="4"/>
    <path d="m48 376 53-35" fill="none" stroke="#aebdd2" stroke-opacity=".55"/>
    <text x="45" y="398" fill="#aebdd2" font-size="13" font-family="inherit">${labels.entrance}</text>
  </g>

  <g class="tab-veil">
    <path d="M480 335V195l145-95v140Z" fill="url(#tab-veil)" stroke="#bba3ce" stroke-width="1.5" stroke-opacity=".7"/>
    <g transform="matrix(1 -.65517 0 1 480 195)">${wovenMotifs}</g>
    ${veilPosts}
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
      <path d="m255 295 23-4 23 4m-23-4v14"/>
    </g>
    ${cups}
    ${lamps}
  </g>

  <g class="tour-object" data-tour-object="altar">
    <ellipse cx="517" cy="302" rx="40" ry="9" fill="#090f19" opacity=".3"/>
    <path d="M492 214h40v80h-40Z" fill="url(#tab-gold-front)" stroke="#e4be6a" stroke-width="1.3"/>
    <path d="m532 214 22-14v80l-22 14Z" fill="#b78636" stroke="#dfb865" stroke-width="1.3"/>
    <path d="m492 214 22-14h40l-22 14Z" fill="url(#tab-gold)" stroke="#f3d78f" stroke-width="1.5"/>
    <path data-horn="1" d="M492 214v-11q3-5 3-8l1 17Z" fill="#f1cf7c"/><path data-horn="2" d="M532 214v-11q3-5 3-8l1 17Z" fill="#f1cf7c"/>
    <path data-horn="3" d="M514 200v-10q3-5 3-8l1 16Z" fill="#e8c575"/><path data-horn="4" d="M554 200v-10q3-5 3-8l1 16Z" fill="#e8c575"/>
    <path d="M492 218h40l22-14" fill="none" stroke="#e9c579" stroke-width="2.5"/>
    <path d="m478 252 66-44m-30 61 60-40" stroke="#e5bf6f" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="496" cy="241" rx="3" ry="4" fill="none" stroke="#f8d997" stroke-width="1.5"/><ellipse cx="536" cy="246" rx="3" ry="4" fill="none" stroke="#f8d997" stroke-width="1.5"/>
    <path d="M487 294h47v5h-47Z" fill="#d0a24b"/>
    <ellipse cx="524" cy="207" rx="12" ry="3" fill="#835335"/>
    <path d="M523 202c-15-17 11-26 0-42s-5-25 1-33m9 72c10-12-6-19-3-30" fill="none" stroke="#dfd3be" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
  </g>

  <g class="tour-object" data-tour-object="ark">
    <ellipse cx="693" cy="294" rx="70" ry="14" fill="#090f19" opacity=".35"/>
    <path d="m601 296 99-66" fill="none" stroke="#ebca80" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="#ffe0a0" stroke-width="1.7"><ellipse data-carrying-ring="1" cx="639" cy="271" rx="4" ry="5"/><ellipse data-carrying-ring="2" cx="666" cy="253" rx="4" ry="5"/></g>
    <path d="M639 235h86v51h-86Z" fill="url(#tab-gold-front)" stroke="#f1ce79" stroke-width="1.8"/>
    <path d="m725 235 27-18v51l-27 18Z" fill="#b88937" stroke="#e3bc64" stroke-width="1.6"/>
    <path d="m687 296 99-66" fill="none" stroke="#ebca80" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="#ffe0a0" stroke-width="1.7"><ellipse data-carrying-ring="3" cx="725" cy="271" rx="4" ry="5"/><ellipse data-carrying-ring="4" cx="752" cy="253" rx="4" ry="5"/></g>
  </g>
  <g class="tour-object" data-tour-object="mercy-seat">
    <path d="m633 234 28-19h98l-29 19Z" fill="url(#tab-gold)" stroke="#ffe0a0" stroke-width="1.6"/>
    <path d="M633 234v5h97v-5m0 5 29-19v-5" fill="#b98c3a" stroke="#e6c270" stroke-width="1.2"/>
  </g>
  <g class="tour-object" data-tour-object="cherubim">
      ${cherub(655, 225)}${cherub(738, 212, true)}
  </g>
  <path d="M48 475h804" stroke="#9aabc3" stroke-opacity=".15"/>
</svg>`;
}
