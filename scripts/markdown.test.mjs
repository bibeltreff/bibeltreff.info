import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMarkdown } from './markdown.mjs';

const parse = (source) => parseMarkdown(source, 'test.md');

test('reads frontmatter, paragraphs and quotes', () => {
  const { data, blocks } = parse(`---
name: Can Luca
headline: "Zitat: mit Doppelpunkt"
intro: 'It''s fine'
---

Erste Zeile
geht weiter.

> Ich bin der Weg
> und die Wahrheit.
> — Johannes 14:6

Letzter Absatz.
`);
  assert.deepEqual(data, { name: 'Can Luca', headline: 'Zitat: mit Doppelpunkt', intro: "It's fine" });
  assert.deepEqual(blocks, [
    { type: 'paragraph', text: 'Erste Zeile geht weiter.' },
    { type: 'quote', text: 'Ich bin der Weg und die Wahrheit.', reference: 'Johannes 14:6' },
    { type: 'paragraph', text: 'Letzter Absatz.' }
  ]);
});

test('accepts Windows line endings and a byte order mark', () => {
  const { data, blocks } = parse('﻿---\r\nname: A\r\n---\r\n\r\nText\r\n');
  assert.deepEqual(data, { name: 'A' });
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'Text' }]);
});

test('reports mistakes with file and line', () => {
  assert.throws(() => parse('name: A\n'), /test\.md: must start with a --- line/);
  assert.throws(() => parse('---\nname: A\n'), /closing ---/);
  assert.throws(() => parse('---\nname A\n---\n'), /test\.md:2: expected "key: value"/);
  assert.throws(() => parse('---\nname: A\nname: B\n---\n'), /duplicate field name/);
  assert.throws(() => parse('---\n---\n\n> Zitat ohne Quelle\n'), /test\.md:4: a quote must end with/);
  assert.throws(() => parse('---\n---\n\n> Zitat\nohne Zeichen\n> — Joh 1:1\n'), /every line of a quote/);
  assert.throws(() => parse('---\n---\n\n> — Joh 1:1\n'), /no text/);
  assert.throws(() => parse('---\n---\n\n# Titel\n'), /headings are not supported/);
});

test('turns ^12^ into superscript verse numbers', () => {
  const { blocks } = parse('---\n---\n\n^1^ Im Anfang ^12^ x^2\n\n> ^16^ Denn also\n> — Johannes 3:16\n');
  assert.deepEqual(blocks, [
    { type: 'paragraph', text: '¹ Im Anfang ¹² x^2' },
    { type: 'quote', text: '¹⁶ Denn also', reference: 'Johannes 3:16' }
  ]);
});
