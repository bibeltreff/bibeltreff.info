// Progressive enhancement only. Anchors and disclosures also work without JS.
const header = document.querySelector('.site-header');
const navigation = document.querySelector('.color-nav');
const chapters = [...document.querySelectorAll('.gospel-chapter')];
const chapterLinks = [...document.querySelectorAll('[data-chapter]')];

function measureNavigation() {
  document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
  document.documentElement.style.setProperty('--color-nav-height', `${navigation.getBoundingClientRect().height}px`);
}

let scheduled = false;
function updateActiveChapter() {
  scheduled = false;
  const readingLine = header.getBoundingClientRect().height + navigation.getBoundingClientRect().height + 60;
  const current = chapters.findLast(chapter => chapter.getBoundingClientRect().top <= readingLine) || chapters[0];
  for (const link of chapterLinks) {
    if (link.dataset.chapter === current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function scheduleUpdate() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(updateActiveChapter);
  }
}

measureNavigation();
updateActiveChapter();
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => { measureNavigation(); scheduleUpdate(); });
if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(() => { measureNavigation(); scheduleUpdate(); });
  observer.observe(header);
  observer.observe(navigation);
}
