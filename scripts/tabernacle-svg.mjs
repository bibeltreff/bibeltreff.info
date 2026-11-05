// A schematic cutaway, not an archaeological reconstruction. The altar is drawn
// before the veil, following the placement described in Exodus 30:6.
export function renderTabernacleSvg(lang = 'de') {
  const en = lang === 'en';
  const labels = en ? {
    title: 'The tabernacle: exterior and cutaway views',
    description: 'The tour begins with the closed tent seen from outside. Later stations reveal a schematic cutaway: the Holy Place with the lampstand and the table with twelve loaves, and the Most Holy Place with the ark behind the veil. The incense altar is shown before the veil. The drawing is not to scale.',
    holy: 'The Holy Place', mostHoly: 'The Most Holy Place', entrance: 'Entrance', veil: 'The veil',
    diagram: 'SCHEMATIC CUTAWAY', exterior: 'THE CLOSED TENT', tent: 'The tent',
  } : {
    title: 'Die Stiftshütte: Außenansicht und Einblick ins Innere',
    description: 'Der Rundgang beginnt mit dem geschlossenen Zelt von außen. Spätere Stationen zeigen einen schematischen Einblick: das Heilige mit dem Leuchter und dem Tisch mit zwölf Broten sowie das Allerheiligste mit der Bundeslade hinter dem Vorhang. Der Räucheraltar ist vor dem Vorhang dargestellt. Die Zeichnung ist nicht maßstabsgetreu.',
    holy: 'Das Heilige', mostHoly: 'Das Allerheiligste', entrance: 'Eingang', veil: 'Der Vorhang',
    diagram: 'SCHEMATISCHER EINBLICK', exterior: 'DAS GESCHLOSSENE ZELT', tent: 'Das Zelt',
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
  const branchGeometry = [[225, 267, 225, 199], [243, 255, 220, 192], [261, 240, 212, 186], [295, 240, 212, 186], [313, 255, 220, 192], [331, 267, 225, 199]];
  const branches = branchGeometry.map(([x, startY, controlY, endY]) => `<path d="M278 ${startY}C${x} ${startY} ${x} ${controlY} ${x} ${endY}"/>`).join('');
  // Derive each branch ornament from its Bézier centreline so it touches the
  // same metalwork rather than floating beside it.
  const cupPositions = [[278, 211], [278, 234], [278, 260]];
  for (const [x, startY, controlY, endY] of branchGeometry) for (const t of [.38, .68]) {
    const u = 1 - t;
    cupPositions.push([u ** 3 * 278 + (1 - u ** 3) * x, u ** 3 * startY + 3 * u ** 2 * t * startY + 3 * u * t ** 2 * controlY + t ** 3 * endY]);
  }
  const cups = cupPositions.map(([x, y]) => `<g transform="translate(${x} ${y})" fill="url(#tab-gold)" stroke="#f5d68c" stroke-width=".7"><path d="M-4-4q1 5 4 7 3-2 4-7L0-1Z"/><ellipse cy="4" rx="3" ry="2"/></g>`).join('');
  const wovenCherub = '<path d="M-2 4v-8l-4-5-8-5 4 9 6 5-1 6-2 4H7L5 6 4 0l6-5 4-9-8 5-4 5v8Z"/><circle cy="-7" r="2.3"/>';
  const wovenMotifs = [22, 58, 96, 130].map((x) => [36, 89].map((y) => `<g transform="translate(${x} ${y})" fill="#e4c77d" fill-opacity=".45">${wovenCherub}</g>`).join('')).join('');
  const veilPosts = Array.from({ length: 4 }, (_, i) => {
    const x = 480 + i * 145 / 3, top = 195 - i * 95 / 3, bottom = top + 140;
    return `<path d="M${x} ${top}v140" stroke="#d8b766" stroke-width="4.5"/><path d="M${x - 4} ${bottom - 1}h8v9h-8Z" fill="url(#tab-silver)" stroke="#bec4ce" stroke-width=".5"/>`;
  }).join('');
  const cherub = (x, y, mirror = false) => `<g data-cherub="${mirror ? 2 : 1}" transform="translate(${x} ${y})${mirror ? ' scale(-1 1)' : ''}" fill="url(#tab-gold)" stroke="#f3d48b" stroke-width="1" stroke-linejoin="round">
    <path d="M-4-21c-13-12-18-29-9-42 14-8 28-2 43 9-14 0-25 10-34 33Z" fill-opacity=".7"/>
    <path d="M-5 0V-15q-3-14 6-16l6 4-3 6q1 9 9 14L15 0Z"/>
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
    <linearGradient id="tab-exterior-roof" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b09a7c"/><stop offset="1" stop-color="#887055"/></linearGradient>
    <linearGradient id="tab-exterior-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8e7558"/><stop offset="1" stop-color="#66513e"/></linearGradient>
    <linearGradient id="tab-exterior-entry" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#345379"/><stop offset=".45" stop-color="#6d4774"/><stop offset="1" stop-color="#874354"/></linearGradient>
    <radialGradient id="tab-light"><stop stop-color="#f6d37d" stop-opacity=".24"/><stop offset="1" stop-color="#f6d37d" stop-opacity="0"/></radialGradient>
  </defs>

  <g data-tour-exterior="">
    <text x="48" y="48" fill="#a8b6ca" font-size="12" letter-spacing="2.2" font-family="inherit">${labels.exterior}</text>
    <ellipse cx="462" cy="360" rx="330" ry="43" fill="#070f1d" opacity=".34"/>
    <path d="M235 195h585v140H235Z" fill="url(#tab-exterior-wall)" stroke="#c3aa7d" stroke-width="1.5"/>
    <path d="M90 100h585l145 95H235Z" fill="url(#tab-exterior-roof)" stroke="#d2bc96" stroke-width="1.5"/>
    <path d="m90 100 145 95v140L90 240Z" fill="url(#tab-exterior-entry)" stroke="#bb9b67" stroke-width="1.5"/>
    <path d="m207 100 145 95m-28-95 145 95m-28-95 145 95m-28-95 145 95" fill="none" stroke="#cbb795" stroke-width="1" stroke-opacity=".38"/>
    <path d="M235 208h585m-585 108h585M260 210v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102m28-102v102" stroke="#b69b74" stroke-width=".8" stroke-opacity=".18"/>
    ${Array.from({ length: 5 }, (_, i) => {
      const x = 90 + i * 145 / 4, top = 100 + i * 95 / 4, bottom = top + 140;
      return `<path d="M${x} ${top}v140" stroke="#d8b766" stroke-width="3.5"/><path d="M${x - 3} ${bottom}h6v7h-6Z" fill="#a87b45" stroke="#d0a76b" stroke-width=".5"/>`;
    }).join('')}
    <path d="M235 335h585v10H235Z" fill="#463d34"/><path d="m90 240 145 95v10L90 250Z" fill="#3c352f"/>
    <path d="m48 320 55-64" fill="none" stroke="#aebdd2" stroke-opacity=".55"/>
    <text x="45" y="344" fill="#aebdd2" font-size="13" font-family="inherit">${labels.entrance}</text>
    <path d="M462 360v30" fill="none" stroke="#cbb795" stroke-opacity=".5"/>
    <text x="462" y="416" text-anchor="middle" fill="#dfd4c0" font-family="inherit" font-size="21" font-weight="500">${labels.tent}</text>
    <path d="M352 433h220M48 475h804" stroke="#9aabc3" stroke-opacity=".15"/>
  </g>
  <g data-tour-interior="" hidden="hidden" style="display:none">
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

  <g class="tour-object" data-tour-object="table" transform="translate(-122 0)">
    <ellipse cx="400" cy="272" rx="53" ry="12" fill="#090f19" opacity=".3"/>
    <path d="M352 220v54m69-54v54m-41-73v47m68-47v47" fill="none" stroke="#cca456" stroke-width="5"/>
    <path d="m345 213 28-19h83l-28 19Z" fill="url(#tab-gold)" stroke="#f3d78f" stroke-width="1.5"/>
    <path d="M345 213v7h83v-7m0 7 28-19v-7" fill="#c49642" stroke="#e0ba67" stroke-width="1.2"/>
    <path d="M352 241h69" stroke="#c9a250" stroke-width="2"/>
    ${bread}
  </g>

  <g class="tour-object" data-tour-object="lampstand" transform="translate(122 0)">
    <ellipse cx="278" cy="296" rx="56" ry="10" fill="#090f19" opacity=".3"/>
    <circle cx="278" cy="227" r="83" fill="url(#tab-light)"/>
    <g fill="none" stroke="#d8b766" stroke-width="4.5" stroke-linecap="round">
      <path d="M278 293V180"/>
      ${branches}
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
    <path d="m478 253 66-44m-30 52 60-40" stroke="#e5bf6f" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="496" cy="241" rx="3" ry="4" fill="none" stroke="#f8d997" stroke-width="1.5"/><ellipse cx="536" cy="246.333333" rx="3" ry="4" fill="none" stroke="#f8d997" stroke-width="1.5"/>
    <path d="M487 294h47v5h-47Z" fill="#d0a24b"/>
    <ellipse cx="524" cy="207" rx="12" ry="3" fill="#835335"/>
    <path d="M523 202c-15-17 11-26 0-42s-5-25 1-33m9 72c10-12-6-19-3-30" fill="none" stroke="#dfd3be" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
  </g>

  <g class="tour-object" data-tour-object="ark">
    <ellipse cx="693" cy="294" rx="70" ry="14" fill="#090f19" opacity=".35"/>
    <path d="m601 296 99-66" fill="none" stroke="#ebca80" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="#ffe0a0" stroke-width="1.7"><ellipse data-carrying-ring="1" cx="639" cy="270.666667" rx="4" ry="5"/><ellipse data-carrying-ring="2" cx="666" cy="252.666667" rx="4" ry="5"/></g>
    <path d="M639 235h86v51h-86Z" fill="url(#tab-gold-front)" stroke="#f1ce79" stroke-width="1.8"/>
    <path d="m725 235 27-18v51l-27 18Z" fill="#b88937" stroke="#e3bc64" stroke-width="1.6"/>
    <path d="m687 296 99-66" fill="none" stroke="#ebca80" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="#ffe0a0" stroke-width="1.7"><ellipse data-carrying-ring="3" cx="725" cy="270.666667" rx="4" ry="5"/><ellipse data-carrying-ring="4" cx="752" cy="252.666667" rx="4" ry="5"/></g>
  </g>
  <g class="tour-object" data-tour-object="mercy-seat">
    <path d="m633 234 28-19h98l-29 19Z" fill="url(#tab-gold)" stroke="#ffe0a0" stroke-width="1.6"/>
    <path d="M633 234v5h97v-5m0 5 29-19v-5" fill="#b98c3a" stroke="#e6c270" stroke-width="1.2"/>
  </g>
  <g class="tour-object" data-tour-object="cherubim">
      ${cherub(655, 225)}${cherub(738, 223, true)}
  </g>
  <path d="M48 475h804" stroke="#9aabc3" stroke-opacity=".15"/>
  </g>
</svg>`;
}
