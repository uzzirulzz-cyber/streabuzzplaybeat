/**
 * /api/gemini — Vercel Edge Function proxy for Gemini API calls.
 *
 * Why this exists:
 *   The PlayBeat Studio embed (an AI Studio Build export) makes calls to the
 *   Gemini API. AI Studio Build apps ship with `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`
 *   for a reason — baking the key into client JS exposes it to every visitor.
 *   This proxy reads the key from process.env.GEMINI_API_KEY and forwards
 *   the request, never leaking the key to the browser.
 *
 * Supported endpoints (path after /api/gemini/ is forwarded to Google's API):
 *   POST /api/gemini/v1beta/models/:model:generateContent
 *   POST /api/gemini/v1beta/models/:model:streamGenerateContent
 *   GET  /api/gemini/v1beta/models   (list models)
 *
 * Set GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables.
 */

export const config = {
  runtime: "edge",
};

const GOOGLE_AI_BASE = "https://generativelanguage.googleapis.com";

// simple per-IP rate limit (best-effort, edge-state)
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 30;
const buckets = new Map(); // ip -> { count, resetAt }

function rateLimit(ip) {
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > b.resetAt) {
    b.count = 0;
    b.resetAt = now + WINDOW_MS;
  }
  b.count += 1;
  buckets.set(ip, b);
  // GC: drop expired buckets occasionally
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }
  return b.count <= MAX_PER_WINDOW;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-goog-api-key",
    "Access-Control-Max-Age": "86400",
  };
}

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(), ...extra },
  });
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: "GEMINI_API_KEY is not set. Add it in Vercel Environment Variables.",
    });
  }

  // rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             req.headers.get("x-real-ip") || "anonymous";
  if (!rateLimit(ip)) {
    return json(429, { error: "Too many requests. Slow down." });
  }

  // build the upstream path
  // request URL: https://<vercel>/api/gemini/<rest>
  const url = new URL(req.url);
  const upstreamPath = url.pathname.replace(/^\/api\/gemini/, "") || "/v1beta/models";
  const upstreamUrl = GOOGLE_AI_BASE + upstreamPath + (url.search || "");

  // forward
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const respHeaders = new Headers(upstream.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    // detect streaming responses and pass through
    if (upstream.headers.get("content-type")?.includes("text/event-stream")) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: respHeaders,
      });
    }
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err) {
    return json(502, { error: "Upstream Gemini call failed: " + err.message });
  }
}
