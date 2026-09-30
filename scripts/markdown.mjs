// Minimal Markdown for content files: a frontmatter block with `key: value` lines, then
// paragraphs separated by blank lines. A block whose lines all start with `>` is a quote;
// its last line `— Reference` names the source. Text stays plain: no inline formatting.

const unquote = (value) => {
  if (/^".*"$/.test(value)) return JSON.parse(value);
  if (/^'.*'$/.test(value)) return value.slice(1, -1).replaceAll("''", "'");
  return value;
};

// Shared by testimonies and articles: returns the fields and the body lines after the frontmatter.
export function readFrontmatter(source, file) {
  const lines = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  if (lines[0].trim() !== '---') throw new Error(`${file}: must start with a --- line`);
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end < 0) throw new Error(`${file}: frontmatter needs a closing --- line`);

  const data = {};
  lines.slice(1, end).forEach((line, index) => {
    if (!line.trim() || line.trimStart().startsWith('#')) return;
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!match) throw new Error(`${file}:${index + 2}: expected "key: value", got "${line}"`);
    if (match[1] in data) throw new Error(`${file}:${index + 2}: duplicate field ${match[1]}`);
    data[match[1]] = unquote(match[2].trim());
  });
  return { data, lines, end };
}

export function parseMarkdown(source, file) {
  const { data, lines, end } = readFrontmatter(source, file);

  const blocks = [];
  let block = [];
  let blockStart = 0;
  const flush = () => {
    if (!block.length) return;
    const where = `${file}:${blockStart}`;
    const quoted = block.filter((line) => line.startsWith('>'));
    if (quoted.length && quoted.length !== block.length) throw new Error(`${where}: every line of a quote must start with >`);
    if (quoted.length) {
      const quote = block.map((line) => line.replace(/^>\s?/, '').trim()).filter(Boolean);
      const reference = quote.at(-1)?.match(/^(?:—|–|--)\s*(.+)$/);
      if (!reference) throw new Error(`${where}: a quote must end with a line like "> — Johannes 3:16"`);
      if (quote.length < 2) throw new Error(`${where}: quote has a reference but no text`);
      blocks.push({ type: 'quote', text: quote.slice(0, -1).join(' '), reference: reference[1] });
    } else {
      if (block[0].startsWith('#')) throw new Error(`${where}: headings are not supported here`);
      blocks.push({ type: 'paragraph', text: block.join(' ') });
    }
    block = [];
  };
  lines.slice(end + 1).forEach((line, index) => {
    if (!line.trim()) return flush();
    if (!block.length) blockStart = end + index + 2;
    block.push(line.trim());
  });
  flush();
  return { data, blocks };
}
