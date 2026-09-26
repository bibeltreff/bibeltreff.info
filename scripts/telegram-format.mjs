// Telegram entity offsets are UTF-16 code units, matching JavaScript string slices.
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = { bold: 'strong', italic: 'em', underline: 'u', strikethrough: 's', code: 'code' };
const blocks = new Set(['blockquote', 'expandable_blockquote', 'pre']);
const supported = new Set([...Object.keys(inline), ...blocks, 'url', 'text_link', 'email']);

export function cleanEntities(text, entities = []) {
  if (!Array.isArray(entities)) return [];
  return entities.filter(e => e && supported.has(e.type) && Number.isInteger(e.offset) && Number.isInteger(e.length) && e.offset >= 0 && e.length > 0 && e.offset + e.length <= text.length)
    .map(({ type, offset, length, url }) => ({ type, offset, length, ...(type === 'text_link' && typeof url === 'string' ? { url } : {}) }));
}

function tags(entity, text) {
  const type = entity.type;
  if (inline[type]) return [`<${inline[type]}>`, `</${inline[type]}>`];
  if (type === 'pre') return ['<pre><code>', '</code></pre>'];
  if (blocks.has(type)) return ['<blockquote>', '</blockquote>'];
  let url = type === 'text_link' ? entity.url : text.slice(entity.offset, entity.offset + entity.length);
  if (type === 'email') url = `mailto:${url}`;
  if (type === 'url' && url && !/^[a-z][a-z\d+.-]*:/i.test(url)) url = `https://${url}`;
  try {
    if (!['https:', 'http:', 'mailto:'].includes(new URL(url).protocol)) return null;
  } catch { return null; }
  return [`<a href="${escapeHtml(url)}" rel="noopener noreferrer">`, '</a>'];
}

export function renderText(text, entities = [], { compactParagraphs = false } = {}) {
  const ranges = cleanEntities(text, entities).map(e => ({ ...e, end: e.offset + e.length, tags: tags(e, text) })).filter(e => e.tags)
    .sort((a, b) => Number(blocks.has(b.type)) - Number(blocks.has(a.type)) || a.offset - b.offset || b.end - a.end);
  const boundaries = [...new Set([0, text.length, ...ranges.flatMap(e => [e.offset, e.end])])].sort((a, b) => a - b);
  let active = [], html = '';
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    let linked = false;
    const next = ranges.filter(e => {
      if (e.offset > start || e.end <= start) return false;
      if (!e.tags[0].startsWith('<a ')) return true;
      if (linked) return false; // Never nest anchors, even with malformed input.
      linked = true;
      return true;
    });
    let common = 0;
    while (common < active.length && common < next.length && active[common] === next[common]) common++;
    html += active.slice(common).reverse().map(e => e.tags[1]).join('');
    html += next.slice(common).map(e => e.tags[0]).join('');
    let segment = escapeHtml(text.slice(start, boundaries[i + 1]));
    // Compact blank lines after applying entity offsets; preserve code whitespace.
    if (compactParagraphs && !next.some(e => e.type === 'pre' || e.type === 'code')) {
      segment = segment.replace(/(?:\r?\n){2,}/g, '<span class="telegram-paragraph-gap" aria-hidden="true"></span>');
    }
    html += segment;
    active = next;
  }
  return html + active.reverse().map(e => e.tags[1]).join('');
}
