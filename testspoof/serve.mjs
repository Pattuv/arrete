#!/usr/bin/env node
/**
 * Zero-dependency static file server for testspoof sites.
 *
 * Usage:
 *   node serve.mjs <site-folder> [port]
 *
 * Examples:
 *   node serve.mjs scam-site 5001
 *   node serve.mjs suspicious-site 5002
 *
 * Serves on 0.0.0.0 so it also responds to hostnames pointed at 127.0.0.1
 * via /etc/hosts (see ../README.md for why that matters for testing
 * Arrête's typosquat signal).
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [, , siteArg, portArg] = process.argv;

if (!siteArg) {
  console.error('Usage: node serve.mjs <site-folder> [port]');
  console.error('Example: node serve.mjs scam-site 5001');
  process.exit(1);
}

const siteRoot = path.resolve(__dirname, siteArg);
const port = Number(portArg) || 5000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let relPath = urlPath === '/' ? '/index.html' : urlPath;

    // Prevent path traversal outside the site root.
    const resolved = path.normalize(path.join(siteRoot, relPath));
    if (!resolved.startsWith(siteRoot)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const info = await stat(resolved).catch(() => null);
    const finalPath = info?.isDirectory() ? path.join(resolved, 'index.html') : resolved;

    const data = await readFile(finalPath);
    const ext = path.extname(finalPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(port, () => {
  console.log(`Serving ${siteArg} at:`);
  console.log(`  http://localhost:${port}`);
  console.log(`  http://127.0.0.1:${port}`);
  console.log('If you added a fake hostname to /etc/hosts, use that instead of localhost, e.g.:');
  console.log(`  http://amaz0n.com:${port}`);
});
