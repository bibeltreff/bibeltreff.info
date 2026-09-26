// Progressive enhancement only. Anchors and disclosures also work without JS.
const themeControl = document.querySelector('.theme-control');
const themeToggle = themeControl.querySelector('summary');
const themeOptions = [...themeControl.querySelectorAll('[data-theme-option]')];

function updateThemeControl() {
  const theme = document.documentElement.dataset.theme || 'system';
  themeToggle.querySelector('use').setAttribute('href', `#icon-${theme}`);
  for (const option of themeOptions) {
    const selected = option.dataset.themeOption === theme;
    option.setAttribute('aria-pressed', String(selected));
    if (selected) {
      themeToggle.title = `Farbschema: ${option.textContent.trim()}`;
      themeToggle.setAttribute('aria-label', themeToggle.title);
    }
  }
}

for (const option of themeOptions) option.addEventListener('click', () => {
  const theme = option.dataset.themeOption;
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  try {
    if (theme === 'system') localStorage.removeItem('bibeltreff-theme');
    else localStorage.setItem('bibeltreff-theme', theme);
  } catch { /* Switching still works for this visit without storage. */ }
  updateThemeControl();
  themeControl.open = false;
  themeToggle.focus();
});
themeControl.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    themeControl.open = false;
    themeToggle.focus();
    event.preventDefault();
  }
});
document.addEventListener('pointerdown', event => {
  if (!themeControl.contains(event.target)) themeControl.open = false;
});
themeControl.addEventListener('focusout', event => {
  if (!themeControl.contains(event.relatedTarget)) themeControl.open = false;
});
updateThemeControl();
themeControl.hidden = false;

const header = document.querySelector('.site-header');
const navigation = document.querySelector('.color-nav');
const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')].map(link => ({
  link,
  section: document.getElementById(link.hash.slice(1)),
}));
const chapters = [...document.querySelectorAll('.gospel-chapter')];
const chapterLinks = [...document.querySelectorAll('[data-chapter]')];

function measureNavigation() {
  document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
  document.documentElement.style.setProperty('--color-nav-height', `${navigation.getBoundingClientRect().height}px`);
}

let scheduled = false;
function updateActiveNavigation() {
  scheduled = false;
  const headerHeight = header.getBoundingClientRect().height;
  const sectionReadingLine = headerHeight + 24;
  for (const { link, section } of sectionLinks) {
    const bounds = section.getBoundingClientRect();
    if (bounds.top <= sectionReadingLine && bounds.bottom > sectionReadingLine) {
      link.setAttribute('aria-current', 'location');
    } else link.removeAttribute('aria-current');
  }

  const readingLine = headerHeight + navigation.getBoundingClientRect().height + 60;
  const current = chapters.findLast(chapter => chapter.getBoundingClientRect().top <= readingLine) || chapters[0];
  for (const link of chapterLinks) {
    if (link.dataset.chapter === current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function scheduleUpdate() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(updateActiveNavigation);
  }
}

measureNavigation();
updateActiveNavigation();
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => { measureNavigation(); scheduleUpdate(); });
if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(() => { measureNavigation(); scheduleUpdate(); });
  observer.observe(header);
  observer.observe(navigation);
}
