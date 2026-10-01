import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Marked } from 'marked';
import { readFrontmatter, superscript } from './markdown.mjs';

// Articles live in content/artikel/<lang>/<topic>/<id>.md; content/artikel/themen.json names the topics.
// German is required, an English version with the same topic and id is optional.
export const articleLanguages = ['de', 'en'];
// Output folders: German pages under artikel/, English ones under articles/.
export const articleFolders = { de: 'artikel', en: 'articles' };
const fields = ['title', 'date', 'excerpt', 'image', 'imageAlt'];
const required = ['title', 'date'];
const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function loadArticles(root) {
  const topicFile = 'content/artikel/themen.json';
  const topics = JSON.parse(await readFile(path.join(root, topicFile), 'utf8'));
  const topicIds = topics.map((topic) => topic.id);
  for (const topic of topics) {
    if (!idPattern.test(topic.id)) throw new Error(`${topicFile}: id "${topic.id}" may only use a-z, 0-9 and hyphens`);
    for (const lang of articleLanguages) if (!topic[lang]) throw new Error(`${topicFile}: ${topic.id} needs a name for "${lang}"`);
  }

  const articles = {};
  for (const lang of articleLanguages) {
    articles[lang] = [];
    const folder = `content/artikel/${lang}`;
    for (const topic of await readdir(path.join(root, folder))) {
      if (!topicIds.includes(topic)) throw new Error(`${folder}/${topic}: add "${topic}" to ${topicFile}`);
      for (const name of await readdir(path.join(root, folder, topic))) {
        const file = `${folder}/${topic}/${name}`;
        if (!name.endsWith('.md')) throw new Error(`${file}: only .md files belong here`);
        const id = name.slice(0, -3);
        if (!idPattern.test(id)) throw new Error(`${file}: file name may only use a-z, 0-9 and hyphens`);
        const { data, lines, end } = readFrontmatter(await readFile(path.join(root, file), 'utf8'), file);
        for (const field of required) if (!data[field]) throw new Error(`${file}: missing field ${field}`);
        const unknown = Object.keys(data).filter((field) => !fields.includes(field));
        if (unknown.length) throw new Error(`${file}: unknown field ${unknown.join(', ')} (allowed: ${fields.join(', ')})`);
        const date = new Date(data.date);
        if (!/^\d{4}-\d{2}-\d{2}/.test(data.date) || Number.isNaN(date.getTime())) throw new Error(`${file}: date must look like 2024-05-31 or 2024-05-31T18:30:00+02:00`);
        const body = lines.slice(end + 1).join('\n').trim();
        if (!body) throw new Error(`${file}: article text is empty`);
        articles[lang].push({ ...data, id, topic, lang, file, date, body });
      }
    }
  }

  const german = new Map(articles.de.map((article) => [article.id, article]));
  if (german.size !== articles.de.length) {
    const seen = new Set();
    const twice = articles.de.find((article) => seen.has(article.id) || !seen.add(article.id));
    throw new Error(`${twice.file}: another topic already has an article "${twice.id}"`);
  }
  for (const article of articles.en) {
    const original = german.get(article.id);
    if (!original) throw new Error(`${article.file}: no German article content/artikel/de/${article.topic}/${article.id}.md`);
    if (original.topic !== article.topic) throw new Error(`${article.file}: the German version is in ${original.topic}`);
  }

  // Newest first; articles from the same moment keep a stable alphabetical order.
  for (const lang of articleLanguages) {
    articles[lang].sort((a, b) => b.date - a.date || a.title.localeCompare(b.title, lang));
  }
  for (const lang of articleLanguages) {
    for (const article of articles[lang]) {
      article.url = articleUrl(lang, article);
      article.translations = Object.fromEntries(articleLanguages
        .map((other) => [other, articles[other].find((candidate) => candidate.id === article.id)])
        .filter(([, candidate]) => candidate));
    }
  }
  const renderer = createRenderer(articles, topicIds);
  for (const lang of articleLanguages) {
    for (const article of articles[lang]) {
      const tokens = renderer.lexer(article.body);
      // A hand-written excerpt from the frontmatter is used as is.
      article.excerpt = article.excerpt?.trim() || excerpt(tokens);
      article.html = renderer.parser(tokens, article);
    }
  }
  return { topics, articles };
}

export const articleUrl = (lang, article) => `${articleFolders[lang]}/${article.topic}/${article.id}.html`;
export const topicUrl = (lang, topic) => `${articleFolders[lang]}/${topic}/`;
export const overviewUrl = (lang) => `${articleFolders[lang]}/`;

// Plain text of inline tokens, for excerpts.
function plain(tokens = []) {
  return tokens.map((token) => {
    if (token.type === 'html') return '';
    if (token.type === 'br') return ' ';
    if (token.tokens) return plain(token.tokens);
    return token.text ?? '';
  }).join('');
}

// The first one or two sentences of the first plain paragraph (Bible quotes and headings are skipped),
// always ending with "…" to show that the article goes on.
function excerpt(tokens) {
  const texts = tokens.filter((token) => token.type === 'paragraph').map((token) => plain(token.tokens).replace(/\s+/g, ' ').trim()).filter(Boolean);
  // Skip short lead-ins such as "Wir fahren fort mit Offenbarung 11:1-2:" that only introduce a quote.
  const text = texts.find((candidate) => candidate.length >= 60 && !candidate.endsWith(':')) || texts[0];
  if (!text) return '';
  // A sentence ends before a capital letter or opening quote, but not after abbreviations such as
  // "z. B.", "V. 7", "vgl." or short Bible book names.
  const [first, second] = text.split(/(?<![\s(]\p{L}\.|\b(?:vgl|bzw|ca|bspw|evtl|ggf|Kap|Nr|Dr|St|Offb|Joh|Röm|Kor|Hebr|Jes|Ps|Mo|Mt|Mk|Lk|Apg|Gal|Eph|Phil|Kol)\.)(?<=[.!?…]["“”»]?)\s+(?=[„“"»\p{Lu}])/u);
  const result = first.length < 120 && second ? `${first} ${second}` : first;
  const short = result.length > 320 ? result.slice(0, 300).replace(/\s+\S*$/, '') : result;
  return short.endsWith('…') ? short : `${short} …`;
}

function createRenderer(articles, topicIds) {
  // Old hochschul-bibelkreise.de links point to the imported pages where possible.
  const ids = new Set(articleLanguages.flatMap((lang) => articles[lang].map((article) => article.id)));
  const find = (lang, id) => articles[lang].find((article) => article.id === id);
  let current;
  function internalLink(href) {
    // The www host of the old site has no valid certificate.
    href = href.replace(/^https?:\/\/www\.hochschul-bibelkreise\.de\//, 'https://hochschul-bibelkreise.de/');
    const match = href.match(/^https?:\/\/hochschul-bibelkreise\.de\/((?:[a-z0-9-]+\/)*)([a-z0-9-]+)\/?(?:#.*)?$/);
    if (!match) return href;
    const [, folders, slug] = match;
    if (/(^|\/)category\/neues-aus-dem-bibelkreis\/$/.test(folders) && topicIds.includes(slug)) {
      return topicUrl(articles[current.lang].some((article) => article.topic === slug) ? current.lang : 'de', slug);
    }
    if (folders.startsWith('category/') || folders.startsWith('tag/') || !ids.has(slug)) return href;
    return (find(current.lang, slug) || find('de', slug)).url;
  }

  const marked = new Marked({ gfm: true });
  marked.use({
    extensions: [{
      // Verse numbers: `^12^` becomes `¹²`.
      name: 'verse',
      level: 'inline',
      start: (src) => src.match(/\^\d+\^/)?.index,
      tokenizer(src) {
        const match = src.match(/^\^\d+\^/);
        if (match) return { type: 'verse', raw: match[0] };
      },
      renderer: ({ raw }) => superscript(raw)
    }],
    renderer: {
      // Inline HTML stays text, except underline and line breaks in table cells.
      html({ text }) {
        return /^<\/?(u|br)\s*\/?>$/i.test(text.trim()) ? text : escape(text);
      },
      // The article title is the page's only h1.
      heading({ tokens, depth }) {
        const level = Math.max(depth, 2);
        return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
      },
      // A last paragraph "— Reference" becomes the citation, as in testimonies and the gospel.
      blockquote({ tokens }) {
        const last = tokens.at(-1);
        if (last?.type === 'paragraph' && /^(?:—|–|--)\s/.test(last.text)) {
          const cite = this.parser.parseInline(last.tokens).replace(/^(?:—|–|--)\s*/, '');
          return `<blockquote>\n${this.parser.parse(tokens.slice(0, -1))}<cite>${cite}</cite>\n</blockquote>\n`;
        }
        return `<blockquote>\n${this.parser.parse(tokens)}</blockquote>\n`;
      },
      link({ href, title, tokens }) {
        const target = internalLink(href);
        return `<a href="${escape(target)}"${title ? ` title="${escape(title)}"` : ''}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }) {
        return `<img src="${escape(href)}" alt="${escape(text)}"${title ? ` title="${escape(title)}"` : ''}>`;
      }
    }
  });
  return {
    lexer: (body) => marked.lexer(body),
    parser: (tokens, article) => {
      current = article;
      // Wide tables scroll inside their own box instead of widening the page.
      return marked.parser(tokens).replace(/<table>/g, '<div class="article-table"><table>').replace(/<\/table>/g, '</table></div>');
    }
  };
}
