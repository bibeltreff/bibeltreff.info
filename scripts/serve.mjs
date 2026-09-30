import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg', '.wav': 'audio/wav', '.aac': 'audio/aac', '.flac': 'audio/flac' };
const port = Number(process.env.PORT || 4173);
types['.webp'] = 'image/webp';
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const name = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(root, name);
    const relative = path.relative(root, target);
    const allowed = ['index.html', 'en.html', 'styles.css', 'site.js'].includes(name) || name.startsWith('assets/');
    if (!allowed || relative.startsWith('..') || path.isAbsolute(relative)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const data = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(data);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Bibeltreff preview: http://127.0.0.1:${port}`));
