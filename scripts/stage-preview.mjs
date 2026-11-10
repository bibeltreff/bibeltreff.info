import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
// Use the same public pages/assets as GitHub Pages. CNAME belongs to production.
// Never publish the repository root: source, settings and scripts stay out.
const publicEntries = [
  'index.html', 'en.html', 'styles.css', 'site.js', '.nojekyll',
  'robots.txt', 'sitemap.xml', 'assets', 'artikel', 'articles'
];

export async function stagePreview(source = root) {
  // A failed/incomplete build must not erase a previous staged version.
  await Promise.all(publicEntries.map(entry => access(path.join(source, entry))));
  const output = path.join(source, '_site');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const entry of publicEntries) {
    await cp(path.join(source, entry), path.join(output, entry), { recursive: true });
  }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await stagePreview();
  console.log('Preview files ready in _site/');
}
