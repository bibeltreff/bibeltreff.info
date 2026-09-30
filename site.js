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
  if (navigation) document.documentElement.style.setProperty('--color-nav-height', `${navigation.getBoundingClientRect().height}px`);
}

// A section chosen from the menu stays highlighted until the visitor scrolls on their own.
// Otherwise sections near the page end, which cannot scroll up to the reading line, never become active.
let chosenSection = sectionLinks.find(({ link }) => link.hash === location.hash)?.section || null;
for (const { link, section } of sectionLinks) {
  link.addEventListener('click', () => { chosenSection = section; scheduleUpdate(); });
}
for (const event of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
  window.addEventListener(event, () => {
    if (!chosenSection) return;
    chosenSection = null;
    scheduleUpdate();
  }, { passive: true });
}

function currentSection(headerHeight) {
  if (chosenSection) return chosenSection;
  const visible = sectionLinks.map(({ section }) => section).filter(section => section.getBoundingClientRect().bottom > headerHeight);
  const pageEnd = document.documentElement.scrollHeight - 1;
  if (window.scrollY + window.innerHeight >= pageEnd) {
    return visible.findLast(section => section.getBoundingClientRect().top < window.innerHeight) || null;
  }
  // 1px tolerance, because anchor jumps can stop a fraction of a pixel below the line.
  const readingLine = headerHeight + 24 + 1;
  return visible.find(section => section.getBoundingClientRect().top <= readingLine && section.getBoundingClientRect().bottom > readingLine) || null;
}

let scheduled = false;
function updateActiveNavigation() {
  scheduled = false;
  const headerHeight = header.getBoundingClientRect().height;
  const currentLocation = currentSection(headerHeight);
  for (const { link, section } of sectionLinks) {
    if (section === currentLocation) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }

  // Article pages have no gospel chapters.
  if (!navigation) return;
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
  if (navigation) observer.observe(navigation);
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

// "Zufälliger Artikel": without JavaScript the link opens a fixed article chosen at build time.
const siteRoot = new URL(document.documentElement.dataset.root || './', location.href);
const pickRandom = (items, avoid) => {
  const choices = items.filter(item => new URL(item, siteRoot).pathname !== avoid);
  return choices[Math.floor(Math.random() * choices.length)] || items[0];
};
for (const link of document.querySelectorAll('[data-random-articles]')) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    location.href = new URL(pickRandom(link.dataset.randomArticles.split(' '), location.pathname), siteRoot).href;
  });
}

// The overview shows a different random article on every visit.
const randomCard = document.querySelector('[data-random-card]');
const articleIndex = document.getElementById('article-index');
if (randomCard && articleIndex) {
  const articles = JSON.parse(articleIndex.textContent);
  const latest = articles[0].url;
  const url = pickRandom(articles.map(article => article.url), new URL(latest, siteRoot).pathname);
  const article = articles.find(item => item.url === url);
  const field = name => randomCard.querySelector(`[data-field="${name}"]`);
  const resolve = target => new URL(target, siteRoot).href;
  field('title').textContent = article.title;
  field('title').href = field('link').href = resolve(article.url);
  const time = field('date').querySelector('time');
  time.textContent = article.date;
  time.dateTime = article.datetime;
  field('topic').textContent = article.topic;
  field('topic').href = resolve(article.topicUrl);
  field('excerpt').textContent = article.excerpt;
}

// Open the topic flyout to the left when the window is too narrow on the right.
for (const item of document.querySelectorAll('.nav-subitem')) {
  const place = () => {
    item.classList.remove('open-left');
    const menu = item.querySelector('.nav-submenu');
    if (menu.getBoundingClientRect().right > document.documentElement.clientWidth - 8) item.classList.add('open-left');
  };
  item.addEventListener('mouseenter', place);
  item.addEventListener('focusin', place);
}
