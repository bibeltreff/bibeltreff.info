import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeUpdates, syncFeed, createApi } from './telegram.mjs';
import { renderTelegram } from './telegram-render.mjs';

const empty = () => ({ nextOffset: 0, posts: [] });
const message = (id, text = `Post ${id}`) => ({ message_id: id, date: 1790188765, chat: { type: 'channel', username: 'bibelkreise' }, text });
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
  const forwarded = { update_id: 5, message: { ...message(99, 'Seed'), forward_origin: { type: 'channel', chat: { username: 'bibelkreise' }, message_id: 433, date: 1790188765 } } };
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
    assert.ok(html.includes('https://t.me/bibelkreise/3'));
  }
});
