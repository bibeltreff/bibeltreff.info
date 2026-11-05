// Progressive enhancement: every station is readable and linked without JS.
(() => {
  const tour = document.querySelector('[data-tour]');
  if (!tour) return;
  const stops = [...tour.querySelectorAll('[data-tour-stop]')];
  const panels = [...tour.querySelectorAll('[data-tour-panel]')];
  const previous = tour.querySelector('[data-tour-previous]');
  const next = tour.querySelector('[data-tour-next]');
  const status = tour.querySelector('[data-tour-status]');
  const count = tour.querySelector('[data-tour-count]');
  const svg = tour.querySelector('.tabernacle-svg');
  const zoom = tour.querySelector('[data-tour-zoom]');
  const contents = tour.querySelector('.tour-contents');
  let selected = 0;
  let enlarged = false;

  function updateView() {
    const panel = panels[selected];
    const active = panel.dataset.highlight.split(' ');
    tour.querySelectorAll('[data-tour-object]').forEach(object => {
      object.classList.toggle('is-active', active.includes(object.dataset.tourObject));
    });
    const detail = panel.dataset.detail;
    svg.hidden = Boolean(detail);
    // SVG does not consistently honor the HTML hidden attribute in all engines.
    svg.style.display = detail ? 'none' : '';
    contents.hidden = !detail;
    tour.querySelector('figcaption').hidden = Boolean(detail);
    tour.querySelectorAll('[data-tour-detail]').forEach(element => { element.hidden = element.dataset.tourDetail !== detail; });
    zoom.hidden = Boolean(detail);
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? zoom.dataset.overviewLabel : zoom.dataset.detailLabel;
    let viewBox = '0 0 900 540';
    if (enlarged && !detail) {
      const object = [...svg.querySelectorAll('[data-tour-object]')].find(item => item.dataset.tourObject === active[0]);
      const box = object.getBBox();
      viewBox = `${box.x - 35} ${box.y - 35} ${box.width + 70} ${box.height + 70}`;
    }
    svg.setAttribute('viewBox', viewBox);
  }

  function show(index, saveHash = true) {
    selected = Math.max(0, Math.min(index, panels.length - 1));
    panels.forEach((panel, i) => { panel.hidden = i !== selected; });
    stops.forEach((stop, i) => {
      if (i === selected) stop.setAttribute('aria-current', 'step');
      else stop.removeAttribute('aria-current');
    });
    previous.disabled = selected === 0;
    next.textContent = selected === panels.length - 1 ? next.dataset.restartLabel : next.dataset.nextLabel;
    count.textContent = `${String(selected + 1).padStart(2, '0')} / ${panels.length}`;
    status.textContent = `${status.dataset.stepLabel} ${selected + 1} ${status.dataset.ofLabel} ${panels.length} · ${panels[selected].querySelector('h2').textContent}`;
    updateView();
    if (saveHash) {
      // Replace rather than push so ten tour steps do not fill browser history.
      try { history.replaceState(null, '', `#${panels[selected].id}`); } catch { /* Still works when history is unavailable. */ }
    }
    const nav = tour.querySelector('.tour-stops');
    const stop = stops[selected];
    if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = stop.offsetLeft - nav.offsetLeft - (nav.clientWidth - stop.offsetWidth) / 2;
  }

  stops.forEach((stop, index) => stop.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    show(index);
  }));
  previous.addEventListener('click', () => show(selected - 1));
  next.addEventListener('click', () => show(selected === panels.length - 1 ? 0 : selected + 1));
  zoom.addEventListener('click', () => { enlarged = !enlarged; updateView(); });
  tour.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input, textarea, select, [contenteditable]')) return;
    const change = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: panels.length - 1 }[event.key];
    if (change === undefined) return;
    event.preventDefault();
    show(change);
    if (event.target.matches('[data-tour-stop]')) stops[selected].focus({ preventScroll: true });
  });
  const indexFromHash = () => panels.findIndex(panel => `#${panel.id}` === location.hash);
  window.addEventListener('hashchange', () => { const index = indexFromHash(); if (index >= 0) show(index, false); });
  tour.classList.add('tour-ready');
  tour.querySelector('.tour-controls').hidden = false;
  zoom.hidden = false;
  show(Math.max(0, indexFromHash()), false);
})();
