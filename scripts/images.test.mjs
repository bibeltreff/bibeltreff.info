import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { createImageOptimizer } from './images.mjs';

test('build creates real previews, preserves originals and refreshes replaced photos', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'bibeltreff-images-'));
  try {
    await mkdir(path.join(root, 'assets/images'), { recursive: true });
    const source = path.join(root, 'assets/images/photo.png');
    const writePhoto = (width, height, background) => sharp({ create: { width, height, channels: 3, background } }).png().toFile(source);
    await writePhoto(2400, 1600, 'red');
    const original = await readFile(source);
    const html = '<img src="assets/images/photo.png" alt="A &amp; B">';
    const optimize = createImageOptimizer(root);
    const output = await optimize(html);
    assert.match(output, /^<a href="assets\/images\/photo.png"><img /);
    assert.match(output, /width="1200" height="800"/);
    assert.match(output, /alt="A &amp; B"/);
    const url = output.match(/src="([^"]+)"/)[1];
    const metadata = await sharp(await readFile(path.join(root, url))).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 800);
    assert.equal(metadata.format, 'webp');
    assert.deepEqual(await readFile(source), original);
    const linked = await optimize(`<a href="assets/images/photo.png" aria-label="Open">${html}</a>`);
    assert.equal((linked.match(/<a /g) || []).length, 1);
    assert.match(linked, /aria-label="Open"/);
    const decorative = '<img src="assets/images/photo.png" alt="">';
    assert.equal(await optimize(decorative), decorative);
    const remote = '<img src="https://example.com/photo.jpg" alt="Remote">';
    assert.equal(await optimize(remote), remote);
    await writePhoto(300, 200, 'blue');
    const refreshed = await createImageOptimizer(root)(html);
    assert.match(refreshed, /width="300" height="200"/);
    assert.notEqual(refreshed.match(/src="([^"]+)"/)[1], url);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
