import { mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { parse } from 'parse5';

const escape = value => String(value).replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c]));

// Keep the surrounding HTML byte-for-byte intact; only replace image elements.
export function createImageOptimizer(root) {
  const previews = new Map();
  async function preview(src) {
    if (!previews.has(src)) previews.set(src, (async () => {
      const file = path.resolve(root, src);
      const relative = path.relative(path.join(root, 'assets'), file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Image must be inside assets/: ${src}`);
      const input = await readFile(file);
      const hash = createHash('sha256').update(input).update('preview-1200-webp-80-v1').digest('hex').slice(0, 20);
      const url = `assets/previews/${hash}.webp`;
      await mkdir(path.join(root, 'assets/previews'), { recursive: true });
      const info = await sharp(input).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(root, url));
      return { url, width: info.width, height: info.height };
    })());
    return previews.get(src);
  }
  return async html => {
    const document = parse(html, { sourceCodeLocationInfo: true });
    const images = [];
    function visit(node, linked = false, picture = false) {
      if (node.tagName === 'img') images.push({ node, linked, picture });
      for (const child of node.childNodes || []) visit(child, linked || node.tagName === 'a', picture || node.tagName === 'picture');
    }
    visit(document);
    const edits = [];
    for (const { node, linked, picture } of images) {
      const attrs = new Map(node.attrs.map(({ name, value }) => [name, value]));
      const src = attrs.get('src') || '';
      // Decorative images, remote images and explicitly responsive images keep their existing behavior.
      if (!/^assets\/(?!previews\/).+\.(jpe?g|png|webp)$/i.test(src) || attrs.get('alt') === '' || attrs.has('srcset') || picture) continue;
      const result = await preview(src);
      attrs.set('src', result.url);
      attrs.set('width', String(result.width));
      attrs.set('height', String(result.height));
      if (!attrs.has('loading')) attrs.set('loading', 'lazy');
      if (!attrs.has('decoding')) attrs.set('decoding', 'async');
      const image = `<img${[...attrs].map(([name, value]) => ` ${name}="${escape(value)}"`).join('')}>`;
      edits.push({ ...node.sourceCodeLocation, replacement: linked ? image : `<a href="${escape(src)}">${image}</a>` });
    }
    for (const edit of edits.sort((a, b) => b.startOffset - a.startOffset)) html = html.slice(0, edit.startOffset) + edit.replacement + html.slice(edit.endOffset);
    return html;
  };
}
