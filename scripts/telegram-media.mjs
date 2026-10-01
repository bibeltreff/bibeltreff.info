import { mkdir, readFile, writeFile, rename, readdir, unlink, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const maxMediaBytes = 20_000_000;
export const audioSourcePattern = /^assets\/telegram\/audio-\d+-[a-f0-9]{16}\.(mp3|m4a|ogg|oga|opus|wav|aac|flac)$/;
export const photoSourcePattern = /^assets\/telegram\/photo-\d+-[a-f0-9]{16}\.jpg$/;
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

export function getPhoto(message) {
  const sizes = (message.photo || []).filter(photo => typeof photo.file_id === 'string' && typeof photo.file_unique_id === 'string' && Number.isSafeInteger(photo.width) && photo.width > 0 && Number.isSafeInteger(photo.height) && photo.height > 0);
  const photo = sizes.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!photo) return undefined;
  return { fileId: photo.file_id, key: createHash('sha256').update(photo.file_unique_id).digest('hex').slice(0, 16), extension: 'jpg', width: photo.width, height: photo.height, size: photo.file_size || 0 };
}

export async function readMediaResponse(response) {
  if (!response.ok || !response.body) throw new Error('Media download failed.');
  if (Number(response.headers.get('content-length')) > maxMediaBytes) throw new Error('Media is too large.');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxMediaBytes) throw new Error('Media is too large.');
    chunks.push(chunk);
  }
  if (!size) throw new Error('Media download is empty.');
  return Buffer.concat(chunks);
}

const attachments = state => state.posts.flatMap(post => ['audio', 'photo'].filter(kind => post[kind]?.fileId)
  .map(kind => ({ post, kind, attachment: post[kind], name: `${kind}-${post.id}-${post[kind].key}.${post[kind].extension}` })));

// Media files are not versioned: the build links whatever the media step left in the folder.
// Missing files fall back to the Telegram link.
export async function attachLocalMedia(state, { folder = directory } = {}) {
  for (const { attachment, name } of attachments(state)) {
    delete attachment.src;
    try {
      const { size } = await stat(new URL(name, folder));
      if (size && size <= maxMediaBytes) attachment.src = `assets/telegram/${name}`;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return state;
}

// Token-bearing URLs are used only here, never saved in JSON or HTML.
export async function downloadMedia(state, api, token, { fetcher = fetch, folder = directory, warn = console.warn } = {}) {
  await mkdir(folder, { recursive: true });
  for (const { post, attachment, name } of attachments(state)) {
    const target = new URL(name, folder);
    const src = `assets/telegram/${name}`;
    try {
      const cached = await readFile(target);
      if (cached.length && cached.length <= maxMediaBytes) { attachment.src = src; continue; }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    delete attachment.src;
    if (attachment.size > maxMediaBytes) {
      warn(`Media for post ${post.id} exceeds 20 MB; keeping the Telegram link.`);
      continue;
    }
    try {
      const file = await api('getFile', { file_id: attachment.fileId });
      if (file.file_size > maxMediaBytes || typeof file.file_path !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(file.file_path) || file.file_path.split('/').includes('..')) throw new Error('Unsupported file.');
      const response = await fetcher(`https://api.telegram.org/file/bot${token}/${file.file_path}`, { signal: AbortSignal.timeout(60000), redirect: 'error' });
      const bytes = await readMediaResponse(response);
      await writeFile(new URL(name + '.tmp', folder), bytes);
      await rename(new URL(name + '.tmp', folder), target);
      attachment.src = src;
    } catch {
      // Retry on the next build, while still publishing the text and original link.
      warn(`Media for post ${post.id} could not be downloaded; keeping the Telegram link and retrying on the next build.`);
    }
  }
  // Keep only current feed media in the folder (and thus the build cache); unrelated assets are untouched.
  const keep = new Set(state.posts.flatMap(post => [post.audio?.src, post.photo?.src]).filter(Boolean).map(src => src.split('/').pop()));
  for (const name of await readdir(folder)) {
    if (/^(audio-\d+-[a-f0-9]{16}\.(mp3|m4a|ogg|oga|opus|wav|aac|flac)|photo-\d+-[a-f0-9]{16}\.jpg)(\.tmp)?$/.test(name) && !keep.has(name)) await unlink(new URL(name, folder));
  }
  return state;
}
