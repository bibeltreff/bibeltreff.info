import { readFile, writeFile, rename } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { cleanEntities } from './telegram-format.mjs';
import { getAudio, getPhoto, downloadMedia, audioSourcePattern, photoSourcePattern } from './telegram-media.mjs';

export const channel = 'bibeltreff_uni';
const stateFile = new URL('../content/telegram.json', import.meta.url);
const mediaTypes = ['photo', 'video', 'animation', 'audio', 'voice', 'video_note', 'document', 'sticker', 'poll', 'contact', 'location', 'venue', 'rich_message', 'live_photo', 'paid_media'];

export function validateState(state) {
  if (!Number.isSafeInteger(state.nextOffset) || state.nextOffset < 0 || !Array.isArray(state.posts) || state.posts.length > 3) throw new Error('Invalid Telegram feed state.');
  const ids = new Set();
  for (const post of state.posts) {
    if (!Number.isSafeInteger(post.id) || post.id < 1 || ids.has(post.id) || typeof post.text !== 'string' || typeof post.hasMedia !== 'boolean' || typeof post.date !== 'string' || !Number.isFinite(Date.parse(post.date))) throw new Error('Invalid Telegram post.');
    if (post.entities !== undefined && !Array.isArray(post.entities)) throw new Error('Invalid Telegram formatting.');
    if (post.audio && (typeof post.audio.fileId !== 'string' || !/^[a-f0-9]{16}$/.test(post.audio.key) || !/^(mp3|m4a|ogg|oga|opus|wav|aac|flac)$/.test(post.audio.extension) || typeof post.audio.title !== 'string' || !Number.isSafeInteger(post.audio.size) || post.audio.size < 0 || (post.audio.src !== undefined && !audioSourcePattern.test(post.audio.src)))) throw new Error('Invalid Telegram audio.');
    if (post.photo && (typeof post.photo.fileId !== 'string' || !/^[a-f0-9]{16}$/.test(post.photo.key) || post.photo.extension !== 'jpg' || !Number.isSafeInteger(post.photo.width) || post.photo.width < 1 || !Number.isSafeInteger(post.photo.height) || post.photo.height < 1 || !Number.isSafeInteger(post.photo.size) || post.photo.size < 0 || (post.photo.src !== undefined && !photoSourcePattern.test(post.photo.src)))) throw new Error('Invalid Telegram photo.');
    ids.add(post.id);
  }
  return state;
}

// Store only public channel content, never private chats or Telegram file URLs.
export function mergeUpdates(state, updates) {
  validateState(state);
  const posts = new Map(state.posts.map(post => [post.id, post]));
  let nextOffset = state.nextOffset;
  for (const update of updates) {
    if (!Number.isSafeInteger(update.update_id)) throw new Error('Invalid Telegram update.');
    nextOffset = Math.max(nextOffset, update.update_id + 1);
    const direct = update.channel_post || update.edited_channel_post;
    const origin = update.message?.forward_origin;
    const forwarded = origin?.type === 'channel' && origin.chat?.username?.toLowerCase() === channel;
    const message = direct || (forwarded ? update.message : null);
    if (!message || (direct && (message.chat?.type !== 'channel' || message.chat?.username?.toLowerCase() !== channel))) continue;
    const id = direct ? message.message_id : origin.message_id;
    // Forwarding an older copy must not overwrite a previously collected edit.
    const previous = posts.get(id);
    const text = message.text ?? message.caption ?? (message.poll ? [message.poll.question, ...message.poll.options.map(option => option.text)].join('\n') : '');
    const hasMedia = mediaTypes.some(key => message[key] != null);
    if (!text && !hasMedia) continue; // Ignore channel service messages.
    const entities = cleanEntities(text, message.text !== undefined ? message.entities : message.caption_entities);
    const audio = getAudio(message);
    const photo = getPhoto(message);
    if (!direct && previous) {
      if (previous.text !== text) continue;
      // Re-forwarding can enrich a legacy import without undoing known edits.
      posts.set(id, { ...previous, entities: previous.entities ?? entities, ...(previous.audio || !audio ? {} : { audio }), ...(previous.photo || !photo ? {} : { photo }) });
      continue;
    }
    if (audio && audio.key === previous?.audio?.key && previous.audio.src) audio.src = previous.audio.src;
    if (photo && photo.key === previous?.photo?.key && previous.photo.src) photo.src = previous.photo.src;
    posts.set(id, { id, date: new Date((direct ? message.date : origin.date) * 1000).toISOString(), text, entities, hasMedia, ...(audio ? { audio } : {}), ...(photo ? { photo } : {}) });
  }
  return validateState({ nextOffset, posts: [...posts.values()].sort((a, b) => b.id - a.id).slice(0, 3) });
}

export function createApi(token, fetcher = fetch) {
  if (!token) throw new Error('Set TELEGRAM_BOT_TOKEN privately before running this command.');
  return async (method, params = {}) => {
    // Never log fetch errors or Telegram descriptions: they can include the token/URL.
    let response, body;
    try {
      response = await fetcher(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params), signal: AbortSignal.timeout(20000)
      });
      body = await response.json();
    } catch { throw new Error(`Telegram ${method}: network request failed. No feed changes saved.`); }
    if (!response.ok || !body.ok) throw new Error(`Telegram ${method} failed (HTTP ${response.status}). Check the token, permissions, and other bot consumers.`);
    return body.result;
  };
}

export async function inspectBot(api) {
  const bot = await api('getMe');
  if (bot.username?.toLowerCase() !== 'bibeltreff_bot') throw new Error('This token does not belong to @bibeltreff_bot.');
  const webhook = await api('getWebhookInfo');
  const member = await api('getChatMember', { chat_id: `@${channel}`, user_id: bot.id });
  if (!['administrator', 'creator', 'member'].includes(member.status)) throw new Error('The bot is not a member of @bibeltreff_uni.');
  return { webhookActive: Boolean(webhook.url), pendingUpdates: webhook.pending_update_count, membership: member.status };
}

export async function syncFeed(api, state) {
  const info = await inspectBot(api);
  if (info.webhookActive) throw new Error('An existing webhook is active. Identify its service before switching; no changes were made.');
  // One batch per run. This acknowledges only the PREVIOUSLY saved batch.
  // Commit the new state durably before running again (see the workflow).
  const updates = await api('getUpdates', { offset: state.nextOffset, limit: 100, timeout: 0, allowed_updates: ['channel_post', 'edited_channel_post', 'message'] });
  return mergeUpdates(state, updates);
}

async function main() {
  const command = process.argv[2];
  if (!['inspect', 'sync'].includes(command)) throw new Error('Usage: node scripts/telegram.mjs inspect|sync');
  const api = createApi(process.env.TELEGRAM_BOT_TOKEN);
  if (command === 'inspect') {
    console.log(JSON.stringify(await inspectBot(api), null, 2));
    console.log('Read-only check complete. An empty webhook does not rule out another polling program.');
    return;
  }
  if (process.env.TELEGRAM_SYNC_ENABLED !== 'true') throw new Error('First inspect the bot and stop any old polling program. Then set TELEGRAM_SYNC_ENABLED=true.');
  const state = validateState(JSON.parse(await readFile(stateFile, 'utf8')));
  const next = await downloadMedia(await syncFeed(api, state), api, process.env.TELEGRAM_BOT_TOKEN);
  if (JSON.stringify(next) !== JSON.stringify(state)) {
    const temporary = new URL('../content/telegram.json.tmp', import.meta.url);
    await writeFile(temporary, JSON.stringify(next, null, 2) + '\n');
    await rename(temporary, stateFile);
  }
  console.log(`Saved ${next.posts.length} public channel posts. Commit the feed before the next sync.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
