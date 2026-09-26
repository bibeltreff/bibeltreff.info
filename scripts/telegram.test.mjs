import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeUpdates, syncFeed, createApi } from './telegram.mjs';
import { renderTelegram } from './telegram-render.mjs';

const empty = () => ({ nextOffset: 0, posts: [] });
const message = (id, text = `Post ${id}`) => ({ message_id: id, date: 1790188765, chat: { type: 'channel', username: 'bibeltreff_uni' }, text });
const update = (id, post) => ({ update_id: id, channel_post: post });

test('keeps newest three by message ID, deduplicates, and applies edits', () => {
  const state = mergeUpdates(empty(), [update(10, message(433)), update(11, message(430)), update(12, message(432)), update(13, message(431))]);
  assert.deepEqual(state.posts.map(p => p.id), [433, 432, 431]);
  const edited = mergeUpdates(state, [{ update_id: 14, edited_channel_post: message(432, 'Changed') }]);
  assert.equal(edited.posts[1].text, 'Changed');
  assert.equal(edited.nextOffset, 15);
  assert.equal(state.posts[1].text, 'Post 432');
});

test('ignores private messages, other channels, and service messages', () => {
  const result = mergeUpdates(empty(), [
    { update_id: 1, message: { ...message(1, 'private'), chat: { type: 'private' } } },
    update(2, { ...message(2, 'unrelated'), chat: { type: 'channel', username: 'other' } }),
    update(3, { ...message(3), text: undefined, new_chat_title: 'new name' })
  ]);
  assert.deepEqual(result, { nextOffset: 4, posts: [] });
});

test('seeds only verifiable forwards from the target channel, preserving original ID/date', () => {
  const forwarded = { update_id: 5, message: { ...message(99, 'Seed'), forward_origin: { type: 'channel', chat: { username: 'bibeltreff_uni' }, message_id: 433, date: 1790188765 } } };
  const state = mergeUpdates(empty(), [forwarded]);
  assert.equal(state.posts[0].id, 433);
  const changed = mergeUpdates(state, [{ update_id: 6, edited_channel_post: message(433, 'Edited') }, { ...forwarded, update_id: 7 }]);
  assert.equal(changed.posts[0].text, 'Edited');
});

test('preserves captions, includes media-only posts and polls', () => {
  const state = mergeUpdates(empty(), [
    update(1, { ...message(1), text: undefined, caption: 'Caption', photo: [{}] }),
    update(2, { ...message(2), text: undefined, video: {} }),
    update(3, { ...message(3), text: undefined, poll: { question: 'When?', options: [{ text: 'Wednesday' }] } })
  ]);
  assert.equal(state.posts[2].text, 'Caption');
  assert.equal(state.posts[1].hasMedia, true);
  assert.equal(state.posts[0].text, 'When?\nWednesday');
});

function mockApi(webhook = '') {
  const calls = [];
  const api = async (method, params) => {
    calls.push({ method, params });
    return { getMe: { id: 1, username: 'bibeltreff_bot' }, getWebhookInfo: { url: webhook }, getChatMember: { status: 'administrator' }, getUpdates: [update(19, message(433))] }[method];
  };
  return { api, calls };
}

test('active webhook prevents polling and is never removed', async () => {
  const { api, calls } = mockApi('https://existing.example/webhook');
  await assert.rejects(syncFeed(api, empty()), /existing webhook/);
  assert.deepEqual(calls.map(c => c.method), ['getMe', 'getWebhookInfo', 'getChatMember']);
});

test('polls one batch with saved offset; does not acknowledge newly received updates', async () => {
  const { api, calls } = mockApi();
  const state = await syncFeed(api, { nextOffset: 10, posts: [] });
  assert.equal(state.nextOffset, 20);
  assert.equal(calls.filter(c => c.method === 'getUpdates').length, 1);
  assert.equal(calls.at(-1).params.offset, 10);
});

test('network and API errors never disclose tokens or response descriptions', async () => {
  const secret = 'secret-token';
  const api = createApi(secret, async () => { throw new Error(secret); });
  await assert.rejects(api('getMe'), error => !error.message.includes(secret));
  const rejected = createApi(secret, async () => ({ ok: false, status: 401, json: async () => ({ ok: false, description: secret }) }));
  await assert.rejects(rejected('getMe'), error => !error.message.includes(secret));
});

test('renders complete escaped text, safe links, three cards, and no empty section', () => {
  const ui = { telegramHeading: 'News', telegramIntro: 'Latest', telegramMedia: 'Media', telegramRead: 'Read', telegramChannel: 'Channel' };
  assert.equal(renderTelegram(empty(), ui, 'en'), '');
  const state = mergeUpdates(empty(), [1, 2, 3].map(id => update(id, message(id, '<script>alert(1)</script>\nA & B'))));
  for (const lang of ['de', 'en']) {
    const html = renderTelegram(state, ui, lang);
    assert.equal((html.match(/class="telegram-card"/g) || []).length, 3);
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('A &amp; B'));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('https://t.me/bibeltreff_uni'));
    assert.ok(html.includes('https://t.me/bibeltreff_uni/3'));
  }
});

// Formatting and local audio regression coverage.
import { cleanEntities, renderText } from './telegram-format.mjs';
import { getAudio, downloadMedia, readMediaResponse, maxMediaBytes } from './telegram-media.mjs';
import { mkdtemp, readFile, writeFile, readdir, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

test('formatting uses UTF-16 offsets and preserves nested styles and line breaks', () => {
  const text = '🎧 Bold title\nText';
  assert.equal(renderText(text, [
    { type: 'bold', offset: 3, length: 10 },
    { type: 'italic', offset: 8, length: 5 }
  ]), '🎧 <strong>Bold <em>title</em></strong>\nText');
  assert.equal(renderText('abcde', [{ type: 'bold', offset: 0, length: 3 }, { type: 'italic', offset: 2, length: 3 }]), '<strong>ab<em>c</em></strong><em>de</em>');
  assert.equal(renderText('quote', [{ type: 'blockquote', offset: 0, length: 5 }]), '<blockquote>quote</blockquote>');
});

test('links and formatting cannot inject HTML or script URLs', () => {
  const text = '<click>';
  assert.equal(renderText(text, [{ type: 'text_link', offset: 0, length: 7, url: 'javascript:alert(1)' }]), '&lt;click&gt;');
  assert.equal(renderText(text, [{ type: 'text_link', offset: 0, length: 7, url: 'https://example.org/?x="&y=2' }]), '<a href="https://example.org/?x=&quot;&amp;y=2" rel="noopener noreferrer">&lt;click&gt;</a>');
  assert.equal(cleanEntities('Hi', [{ type: 'bold', offset: -1, length: 3 }, { type: 'bold', offset: 0, length: 30 }, { type: 'text_mention', offset: 0, length: 2, user: { id: 123 } }]).length, 0);
  assert.equal((renderText('Hi', [{ type: 'url', offset: 0, length: 2 }, { type: 'text_link', offset: 0, length: 2, url: 'https://example.org' }]).match(/<a /g) || []).length, 1);
});

const audioMessage = id => ({ ...message(id), audio: { file_id: 'opaque-file-id', file_unique_id: 'unique-audio', file_size: 4, mime_type: 'audio/mpeg', title: 'A <title>' }, entities: [{ type: 'bold', offset: 0, length: 4 }] });

test('captures caption entities and audio; re-forwarding upgrades legacy posts without reverting edits', () => {
  const legacy = mergeUpdates(empty(), [update(1, message(433))]);
  delete legacy.posts[0].entities;
  const forwarded = { update_id: 2, message: { ...audioMessage(99), text: 'Post 433', forward_origin: { type: 'channel', chat: { username: 'bibeltreff_uni' }, message_id: 433, date: 1790188765 } } };
  const upgraded = mergeUpdates(legacy, [forwarded]);
  assert.equal(upgraded.posts[0].entities[0].type, 'bold');
  assert.equal(upgraded.posts[0].audio.extension, 'mp3');
  const caption = mergeUpdates(empty(), [update(3, { ...audioMessage(434), text: undefined, entities: undefined, caption: 'Title', caption_entities: [{ type: 'bold', offset: 0, length: 5 }] })]);
  assert.equal(caption.posts[0].entities[0].length, 5);
  const edited = mergeUpdates(upgraded, [{ update_id: 4, edited_channel_post: message(433, 'New text') }, { ...forwarded, update_id: 5 }]);
  assert.equal(edited.posts[0].text, 'New text');
  assert.equal(edited.posts[0].audio, undefined);
});

test('supports voice messages and audio documents with safe extension selection', () => {
  assert.equal(getAudio({ voice: { file_id: 'v', file_unique_id: 'v' } }).extension, 'ogg');
  assert.equal(getAudio({ document: { file_id: 'd', file_unique_id: 'd', file_name: '../../track.mp3', mime_type: 'audio/mpeg' } }).extension, 'mp3');
  assert.equal(getAudio({ document: { file_id: 'd', file_unique_id: 'd', file_name: 'script.html', mime_type: 'text/html' } }), undefined);
});

async function audioFolder(t) {
  const folderPath = await mkdtemp(join(tmpdir(), 'bibeltreff-audio-test-'));
  const folder = pathToFileURL(folderPath + '/');
  t.after(async () => {
    for (const name of await readdir(folder)) await unlink(new URL(name, folder));
    await rmdir(folder);
  });
  return folder;
}

test('downloads audio once, renders local player, and removes retired managed audio only', async t => {
  const folder = await audioFolder(t);
  const state = mergeUpdates(empty(), [update(1, audioMessage(433))]);
  const calls = [];
  const api = async (method, params) => { calls.push({ method, params }); return { file_path: 'music/file_1.mp3', file_size: 4 }; };
  const options = { folder, fetcher: async () => new Response(new Uint8Array([1, 2, 3, 4])), warn: message => assert.fail(message) };
  await downloadMedia(state, api, 'test-secret', options);
  assert.equal(calls[0].method, 'getFile');
  assert.match(state.posts[0].audio.src, /^assets\/telegram\/audio-433-[a-f0-9]{16}\.mp3$/);
  assert.equal((await readFile(new URL(state.posts[0].audio.src.split('/').pop(), folder))).length, 4);
  await downloadMedia(state, api, 'test-secret', { ...options, fetcher: () => assert.fail('Cache was ignored') });
  assert.equal(calls.length, 1);
  const html = renderTelegram(state, { telegramAudio: 'Audio', telegramAudioDownload: 'Download' }, 'en');
  assert.ok(html.includes('<audio controls preload="none"'));
  assert.ok(html.includes('A &lt;title&gt;'));
  assert.ok(html.includes('<strong>Post</strong>'));
  assert.ok(!html.includes('test-secret'));
  assert.ok(!html.includes('opaque-file-id'));
  await writeFile(new URL('keep.txt', folder), 'unrelated');
  await downloadMedia(empty(), api, 'test-secret', options);
  assert.deepEqual(await readdir(folder), ['keep.txt']);
});

test('oversize audio and failed downloads preserve feed with a Telegram fallback', async t => {
  const folder = await audioFolder(t);
  const state = mergeUpdates(empty(), [update(1, audioMessage(433))]);
  state.posts[0].audio.size = maxMediaBytes + 1;
  const warnings = [];
  const options = { folder, fetcher: () => assert.fail('Must not download'), warn: message => warnings.push(message) };
  await downloadMedia(state, () => assert.fail('Must not call API'), 'secret', options);
  assert.equal(state.posts[0].audio.src, undefined);
  state.posts[0].audio.size = 4;
  await downloadMedia(state, async () => { throw new Error('secret'); }, 'secret', options);
  assert.equal(state.posts[0].audio.src, undefined);
  assert.ok(warnings.every(message => !message.includes('secret')));
  assert.equal(state.posts[0].text, 'Post 433');
});

test('audio downloader enforces declared and streamed byte limits', async () => {
  await assert.rejects(readMediaResponse(new Response('x', { headers: { 'content-length': String(maxMediaBytes + 1) } })), /too large/);
  await assert.rejects(readMediaResponse(new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(maxMediaBytes + 1)); controller.close(); } }))), /too large/);
  await assert.rejects(readMediaResponse(new Response('')), /empty/);
});

import { getPhoto } from './telegram-media.mjs';
const photoMessage = id => ({ ...message(id), photo: [
  { file_id: 'small', file_unique_id: 'small', width: 90, height: 60, file_size: 4 },
  { file_id: 'large', file_unique_id: 'large', width: 1280, height: 850, file_size: 4 }
] });

test('imports the largest photo and enriches a legacy forward without changing its text', () => {
  assert.equal(getPhoto(photoMessage(1)).fileId, 'large');
  const legacy = mergeUpdates(empty(), [update(1, message(433))]);
  const upgraded = mergeUpdates(legacy, [{ update_id: 2, message: { ...photoMessage(99), text: 'Post 433', forward_origin: { type: 'channel', chat: { username: 'bibeltreff_uni' }, message_id: 433, date: 1790188765 } } }]);
  assert.equal(upgraded.posts[0].photo.width, 1280);
  assert.equal(upgraded.posts[0].text, legacy.posts[0].text);
});

test('downloads photos alongside audio, renders local images and cleans retired media', async t => {
  const folder = await audioFolder(t);
  const state = mergeUpdates(empty(), [update(1, photoMessage(434)), update(2, audioMessage(433))]);
  const options = { folder, fetcher: async () => new Response(new Uint8Array([255, 216, 255, 217])), warn: message => assert.fail(message) };
  const api = async () => ({ file_path: 'photos/file.jpg', file_size: 4 });
  await downloadMedia(state, api, 'secret', options);
  assert.match(state.posts[0].photo.src, /^assets\/telegram\/photo-434-[a-f0-9]{16}\.jpg$/);
  assert.ok(state.posts[1].audio.src);
  const ui = JSON.parse(await readFile(new URL('../content/ui.en.json', import.meta.url), 'utf8'));
  const html = renderTelegram(state, ui, 'en');
  assert.ok(html.includes('loading="lazy"'));
  assert.ok(html.includes('width="1280" height="850"'));
  assert.ok(html.includes('Open full-size photo'));
  assert.ok(!html.includes('<figcaption>'));
  assert.ok(html.includes('https://t.me/bibeltreff_uni/433'));
  assert.ok(!html.includes('undefined'));
  await downloadMedia(state, () => assert.fail('Cache should include both attachments'), 'secret', options);
  await downloadMedia(empty(), api, 'secret', options);
  assert.deepEqual(await readdir(folder), []);
});

test('failed photo downloads preserve captions and unsafe photo sources are rejected', async t => {
  const folder = await audioFolder(t);
  const state = mergeUpdates(empty(), [update(1, photoMessage(434))]);
  await downloadMedia(state, async () => { throw new Error('secret'); }, 'secret', { folder, warn: () => {} });
  assert.equal(state.posts[0].photo.src, undefined);
  assert.equal(state.posts[0].text, 'Post 434');
  state.posts[0].photo.src = 'https://example.org/private.jpg';
  assert.throws(() => renderTelegram(state, {}, 'en'), /Invalid Telegram photo/);
});
