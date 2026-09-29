import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseMarkdown } from './markdown.mjs';

const fields = ['name', 'headline', 'intro'];

// Testimonies live in content/zeugnisse/<lang>/<id>.md; content/shared.json sets their order.
export async function loadTestimonies(root, lang, ids) {
  const folder = `content/zeugnisse/${lang}`;
  const files = (await readdir(path.join(root, folder))).filter((name) => name.endsWith('.md'));
  const unlisted = files.map((name) => name.slice(0, -3)).filter((id) => !ids.includes(id));
  if (unlisted.length) throw new Error(`${folder}: add ${unlisted.join(', ')} to "testimonies" in content/shared.json`);

  return Promise.all(ids.map(async (id) => {
    const file = `${folder}/${id}.md`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) throw new Error(`${file}: file name may only use a-z, 0-9 and hyphens`);
    if (!files.includes(`${id}.md`)) throw new Error(`${file} is missing`);
    const { data, blocks } = parseMarkdown(await readFile(path.join(root, file), 'utf8'), file);
    for (const field of fields) if (!data[field]) throw new Error(`${file}: missing field ${field}`);
    const unknown = Object.keys(data).filter((field) => !fields.includes(field));
    if (unknown.length) throw new Error(`${file}: unknown field ${unknown.join(', ')} (allowed: ${fields.join(', ')})`);
    if (!blocks.length) throw new Error(`${file}: testimony text is empty`);
    return {
      id,
      ...data,
      paragraphs: blocks.map(({ type, text, reference }) => type === 'quote' ? { text, reference } : text)
    };
  }));
}
