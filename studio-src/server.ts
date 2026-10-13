/**
 * Dev server for PlayBeat Studio.
 *
 * - Serves the Vite dev server (HMR, React refresh, Tailwind 4) on the same port.
 * - Exposes /api/gemini/* as a local proxy to Google's Generative Language API,
 *   reading GEMINI_API_KEY from .env so the key never ships to the browser.
 *   Mirrors the /api/gemini Edge Function deployed on Vercel.
 *
 * Run:  npm run dev  (tsx server.ts)
 * Default port: 5173
 */

import 'dotenv/config';
import express from 'express';
import { createServer, type IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com';

const app = express();
const httpServer = createServer(app);

// ── /api/gemini proxy ────────────────────────────────────────────────────
app.all('/api/gemini(/*)?', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not set. Add it to .env to use Gemini locally.',
    });
  }

  const ip = req.ip || req.socket.remoteAddress || 'anon';
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Too many requests.' });

  // Build upstream path:
  // /api/gemini/v1beta/models/... → /v1beta/models/...
  // /api/gemini                  → /v1beta/models
  const tail = req.url.replace(/^\/(v1beta\/?.*)$/, '$1');
  const upstreamPath = tail.startsWith('/v1beta') ? tail : '/v1beta/models' + (req.url === '/' ? '' : req.url);
  const upstreamUrl = GOOGLE_AI_BASE + upstreamPath;

  // Buffer body for non-GET requests
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = Buffer.concat(chunks);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
    });

    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (upstream.headers.get('content-type')?.includes('text/event-stream')) {
      // stream
      const reader = upstream.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } else {
      const text = await upstream.text();
      res.send(text);
    }
  } catch (err: any) {
    res.status(502).json({ error: 'Upstream Gemini call failed: ' + err.message });
  }
});

// CORS preflight for /api/gemini
app.options('/api/gemini(/*)?', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-goog-api-key');
  res.end();
});

// ── Vite dev server proxy ──────────────────────────────────────────────────
// Spawn Vite on PORT + 1 and proxy everything else to it.
const vite = spawn('npx', ['vite', '--port', String(PORT + 1), '--strictPort'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

// Pass-through everything else to vite
app.use(async (req, res) => {
  const target = `http://localhost:${PORT + 1}${req.url}`;
  try {
    // Buffer the body (if any)
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);

    const upstream = await fetch(target, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body,
    });
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch {
    res.status(502).send('Vite dev server not ready. Retry in a moment.');
  }
});

httpServer.on('upgrade', (req, socket, head) => {
  // HMR WebSocket → forward to vite directly (raw TCP)
  const net = require('node:net');
  const proxy = net.createConnection({ port: PORT + 1, host: 'localhost' }, () => {
    socket.write(
      'HTTP/1.1 200 Connection Established\r\n' +
      '\r\n'
    );
    const reqLine = `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
    proxy.write(reqLine);
    if (head.length) proxy.write(head);
    proxy.pipe(socket);
    socket.pipe(proxy);
  });
  proxy.on('error', () => socket.destroy());
});

httpServer.listen(PORT, () => {
  console.log(`\n  PlayBeat Studio dev server → http://localhost:${PORT}`);
  console.log(`  Vite HMR              → http://localhost:${PORT + 1}`);
  console.log(`  /api/gemini/*         → ${GOOGLE_AI_BASE} (key: ${GEMINI_API_KEY ? '✓ set' : '✗ missing'})\n`);
});

// rate limit (in-memory)
const WINDOW_MS = 60_000;
const MAX = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > b.resetAt) { b.count = 0; b.resetAt = now + WINDOW_MS; }
  b.count++;
  buckets.set(ip, b);
  return b.count <= MAX;
}

process.on('exit', () => vite.kill());
