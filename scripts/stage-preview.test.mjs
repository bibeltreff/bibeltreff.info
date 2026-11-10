import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { stagePreview } from './stage-preview.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'bibeltreff-preview-'));
  for (const file of ['index.html', 'en.html', 'styles.css', 'site.js', '.nojekyll', 'robots.txt', 'sitemap.xml']) {
    await writeFile(path.join(root, file), file);
  }
  for (const folder of ['assets/events', 'artikel/thema', 'articles/topic', 'content', 'scripts', '_site']) {
    await mkdir(path.join(root, folder), { recursive: true });
  }
  await writeFile(path.join(root, 'assets/events/flyer.webp'), 'flyer');
  await writeFile(path.join(root, 'artikel/thema/index.html'), 'de');
  await writeFile(path.join(root, 'articles/topic/index.html'), 'en');
  return root;
}

test('preview staging copies public pages/assets and removes stale output without publishing sources', async () => {
  const root = await fixture();
  try {
    for (const file of ['.env', 'README.md', 'CNAME', 'content/source.json', 'scripts/internal.mjs', '_site/obsolete.html']) {
      await writeFile(path.join(root, file), 'private-or-obsolete');
    }
    const output = await stagePreview(root);
    assert.deepEqual((await readdir(output)).sort(), [
      '.nojekyll', 'artikel', 'articles', 'assets', 'en.html', 'index.html',
      'robots.txt', 'site.js', 'sitemap.xml', 'styles.css'
    ].sort());
    assert.equal(await readFile(path.join(output, 'assets/events/flyer.webp'), 'utf8'), 'flyer');
    assert.equal(await readFile(path.join(output, 'artikel/thema/index.html'), 'utf8'), 'de');
    assert.equal(await readFile(path.join(output, 'articles/topic/index.html'), 'utf8'), 'en');
    await assert.rejects(access(path.join(output, 'obsolete.html')));
    await assert.rejects(access(path.join(output, '.env')));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an incomplete build fails before replacing a previous staged version', async () => {
  const root = await fixture();
  try {
    await writeFile(path.join(root, '_site/previous.html'), 'previous');
    await rm(path.join(root, 'en.html'));
    await assert.rejects(stagePreview(root), { code: 'ENOENT' });
    assert.equal(await readFile(path.join(root, '_site/previous.html'), 'utf8'), 'previous');
  } finally { await rm(root, { recursive: true, force: true }); }
});
