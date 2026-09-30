import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadArticles } from './articles.mjs';

const topics = [{ id: 'serie', de: 'Serie', en: 'Series' }, { id: 'andere', de: 'Andere', en: 'Other' }];

// Builds a throwaway content/artikel tree: { 'de/serie/a.md': '...' }.
async function load(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'artikel-'));
  try {
    await mkdir(path.join(root, 'content/artikel/de'), { recursive: true });
    await mkdir(path.join(root, 'content/artikel/en'), { recursive: true });
    await writeFile(path.join(root, 'content/artikel/themen.json'), JSON.stringify(topics));
    for (const [name, text] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(root, 'content/artikel', name)), { recursive: true });
      await writeFile(path.join(root, 'content/artikel', name), text);
    }
    return await loadArticles(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
const article = (title, date, body) => `---\ntitle: ${title}\ndate: ${date}\n---\n\n${body}\n`;

test('renders quotes, headings, underline and escapes other HTML', async () => {
  const { articles } = await load({
    'de/serie/eins.md': article('Eins', '2024-01-02', `# Große Überschrift

> “Im Anfang war das Wort.”
>
> — Johannes 1:1

Text mit <u>Betonung</u> und <script>alert(1)</script>.`)
  });
  const { html } = articles.de[0];
  assert.match(html, /<h2>Große Überschrift<\/h2>/);
  assert.match(html, /<blockquote>\n<p>“Im Anfang war das Wort.”<\/p>\n<cite>Johannes 1:1<\/cite>\n<\/blockquote>/);
  assert.match(html, /<u>Betonung<\/u>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('links to the old website lead to the imported pages', async () => {
  const { articles } = await load({
    'de/serie/eins.md': article('Eins', '2024-01-02', 'Siehe [Teil zwei](https://www.hochschul-bibelkreise.de/neues-aus-dem-bibelkreis/zwei/#Abschnitt), [das Thema](https://hochschul-bibelkreise.de/category/neues-aus-dem-bibelkreis/andere/) und [anderes](https://hochschul-bibelkreise.de/artikel/fremd/).'),
    'de/andere/zwei.md': article('Zwei', '2024-01-03', 'Zweiter Text.'),
    'en/andere/zwei.md': article('Two', '2024-01-03', 'Linking [part one](https://hochschul-bibelkreise.de/neues-aus-dem-bibelkreis/eins/).')
  });
  const one = articles.de.find(item => item.id === 'eins');
  assert.match(one.html, /href="artikel\/andere\/zwei.html"/);
  assert.match(one.html, /href="artikel\/andere\/"/);
  assert.match(one.html, /href="https:\/\/hochschul-bibelkreise.de\/artikel\/fremd\/"/);
  // English pages fall back to the German article when there is no translation.
  assert.match(articles.en[0].html, /href="artikel\/serie\/eins.html"/);
  assert.equal(articles.en[0].translations.de, articles.de.find(item => item.id === 'zwei'));
});

test('sorts newest first and takes the excerpt from the first real paragraph', async () => {
  const { articles } = await load({
    'de/serie/alt.md': article('Alt', '2020-05-01', '> “Ein Vers.”\n>\n> — Psalm 1:1\n\nWir fahren fort mit Psalm 2:\n\nDas ist der erste richtige Satz im Artikel, lang genug für den Anriss. Hier ist der zweite Satz. Der dritte fehlt.'),
    'de/serie/neu.md': article('Neu', '2024-05-01T08:00:00+02:00', 'Kurz. Und noch ein Satz, z. B. mit V. 7 darin. Nicht mehr.')
  });
  assert.deepEqual(articles.de.map(item => item.id), ['neu', 'alt']);
  assert.equal(articles.de[1].excerpt, 'Das ist der erste richtige Satz im Artikel, lang genug für den Anriss. Hier ist der zweite Satz. …');
  assert.equal(articles.de[0].excerpt, 'Kurz. Und noch ein Satz, z. B. mit V. 7 darin. …');
});

test('a hand-written excerpt replaces the automatic one', async () => {
  const { articles } = await load({
    'de/serie/eigen.md': '---\ntitle: Eigen\ndate: 2024-01-01\nexcerpt: Ein selbst geschriebener Anriss.\n---\n\nDer Artikel beginnt ganz anders.'
  });
  assert.equal(articles.de[0].excerpt, 'Ein selbst geschriebener Anriss.');
});

test('reports mistakes with the file', async () => {
  await assert.rejects(load({ 'en/serie/nur-englisch.md': article('Only', '2024-01-01', 'Text.') }), /content\/artikel\/en\/serie\/nur-englisch.md: no German article/);
  await assert.rejects(load({ 'de/unbekannt/a.md': article('A', '2024-01-01', 'Text.') }), /content\/artikel\/de\/unbekannt: add "unbekannt" to content\/artikel\/themen.json/);
  await assert.rejects(load({ 'de/serie/a.md': '---\ndate: 2024-01-01\n---\n\nText.' }), /a.md: missing field title/);
  await assert.rejects(load({ 'de/serie/a.md': article('A', '1. Mai 2024', 'Text.') }), /a.md: date must look like/);
  await assert.rejects(load({ 'de/serie/a.md': article('A', '2024-01-01', 'Text.'), 'de/andere/a.md': article('B', '2024-01-01', 'Text.') }), /already has an article "a"/);
});
