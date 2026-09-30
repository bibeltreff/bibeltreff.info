// Progressive enhancement only. Anchors and disclosures also work without JS.
const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

function currentTheme() {
  return document.documentElement.dataset.theme || (systemTheme.matches ? 'dark' : 'light');
}

function updateThemeControl() {
  const theme = currentTheme();
  themeToggle.querySelector('use').setAttribute('href', `#icon-${theme}`);
  const action = theme === 'dark' ? themeToggle.dataset.switchLight : themeToggle.dataset.switchDark;
  themeToggle.title = `${themeToggle.dataset.label}: ${themeToggle.dataset[theme]}. ${action}`;
  themeToggle.setAttribute('aria-label', themeToggle.title);
}

themeToggle.addEventListener('click', () => {
  const theme = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try {
    sessionStorage.setItem('bibeltreff-theme', theme);
  } catch { /* Switching still works for this page without storage. */ }
  updateThemeControl();
});
systemTheme.addEventListener('change', updateThemeControl);
updateThemeControl();
themeToggle.hidden = false;

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

// Open the chat at the latest message, without moving the page or stealing focus.
// Stop following as soon as the visitor interacts, so reading older posts is stable.
const telegramWindow = document.querySelector('.telegram-window');
if (telegramWindow) {
  let followNewest = true;
  const showNewest = () => {
    if (followNewest) telegramWindow.scrollTop = telegramWindow.scrollHeight;
  };
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'focusin']) {
    telegramWindow.addEventListener(event, () => { followNewest = false; }, { passive: true });
  }
  requestAnimationFrame(showNewest);
  // Font and image loading can change the message heights after the first paint.
  if (document.fonts) document.fonts.ready.then(showNewest);
  if ('ResizeObserver' in window) {
    const chatObserver = new ResizeObserver(showNewest);
    chatObserver.observe(telegramWindow.querySelector('.telegram-grid'));
  }
}
