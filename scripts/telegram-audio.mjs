import { mkdir, readFile, writeFile, rename, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const maxAudioBytes = 20_000_000;
export const audioSourcePattern = /^assets\/telegram\/audio-\d+-[a-f0-9]{16}\.(mp3|m4a|ogg|oga|opus|wav|aac|flac)$/;
const directory = new URL('../assets/telegram/', import.meta.url);
const extensions = new Set(['mp3', 'm4a', 'ogg', 'oga', 'opus', 'wav', 'aac', 'flac']);
const mimeExtensions = { 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/opus': 'opus', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/aac': 'aac', 'audio/flac': 'flac' };

export function getAudio(message) {
  const document = message.document;
  const audio = message.audio || message.voice || (document?.mime_type?.startsWith('audio/') ? document : null);
  if (!audio || typeof audio.file_id !== 'string' || typeof audio.file_unique_id !== 'string') return undefined;
  const suffix = audio.file_name?.split('.').pop()?.toLowerCase();
  const extension = extensions.has(suffix) ? suffix : mimeExtensions[audio.mime_type] || (message.voice ? 'ogg' : null);
  if (!extension) return undefined;
  return { fileId: audio.file_id, key: createHash('sha256').update(audio.file_unique_id).digest('hex').slice(0, 16), extension,
    title: audio.title || audio.file_name || '', size: audio.file_size || 0 };
}

export async function readAudioResponse(response) {
  if (!response.ok || !response.body) throw new Error('Audio download failed.');
  if (Number(response.headers.get('content-length')) > maxAudioBytes) throw new Error('Audio is too large.');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxAudioBytes) throw new Error('Audio is too large.');
    chunks.push(chunk);
  }
  if (!size) throw new Error('Audio download is empty.');
  return Buffer.concat(chunks);
}

// Token-bearing URLs are used only here, never saved in JSON or HTML.
export async function downloadAudio(state, api, token, { fetcher = fetch, folder = directory, warn = console.warn } = {}) {
  await mkdir(folder, { recursive: true });
  for (const post of state.posts) {
    const audio = post.audio;
    if (!audio?.fileId) continue;
    const name = `audio-${post.id}-${audio.key}.${audio.extension}`;
    const target = new URL(name, folder);
    const src = `assets/telegram/${name}`;
    try {
      const cached = await readFile(target);
      if (cached.length && cached.length <= maxAudioBytes) { audio.src = src; continue; }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    delete audio.src;
    if (audio.size > maxAudioBytes) {
      warn(`Audio for post ${post.id} exceeds 20 MB; keeping the Telegram link.`);
      continue;
    }
    try {
      const file = await api('getFile', { file_id: audio.fileId });
      if (file.file_size > maxAudioBytes || typeof file.file_path !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(file.file_path) || file.file_path.split('/').includes('..')) throw new Error('Unsupported file.');
      const response = await fetcher(`https://api.telegram.org/file/bot${token}/${file.file_path}`, { signal: AbortSignal.timeout(60000), redirect: 'error' });
      const bytes = await readAudioResponse(response);
      await writeFile(new URL(name + '.tmp', folder), bytes);
      await rename(new URL(name + '.tmp', folder), target);
      audio.src = src;
    } catch {
      // Retry on the next sync, while still publishing the text and original link.
      warn(`Audio for post ${post.id} could not be downloaded; keeping the Telegram link and retrying next time.`);
    }
  }
  // Keep only current feed audio in the working tree; unrelated assets are untouched.
  const keep = new Set(state.posts.map(post => post.audio?.src?.split('/').pop()).filter(Boolean));
  for (const name of await readdir(folder)) {
    if (/^audio-\d+-[a-f0-9]{16}\.(mp3|m4a|ogg|oga|opus|wav|aac|flac)(\.tmp)?$/.test(name) && !keep.has(name)) await unlink(new URL(name, folder));
  }
  return state;
}
