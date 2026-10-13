// Gemini client — routes all calls through /api/gemini (Vercel Edge Function)
// so the API key never ships to the browser. In dev (tsx server.ts) the same
// path is served by the local Express proxy at http://localhost:5173/api/gemini.

const API_BASE = '/api/gemini';

export type AIRecommendation = {
  id: string;
  title: string;
  reason: string;
  kind: 'movie' | 'series' | 'channel' | 'track';
};

export type AIMessage = {
  role: 'user' | 'model';
  content: string;
};

function isAIEnabled() {
  // Don't even try if there's no proxy available
  return typeof window !== 'undefined';
}

/**
 * Ask Gemini for a recommendation list based on the user's mood / query.
 * Falls back to a deterministic local pick if the proxy is unreachable.
 */
export async function getAIRecommendations(prompt: string): Promise<AIRecommendation[]> {
  if (!isAIEnabled()) return fallbackRecommendations(prompt);
  try {
    const res = await fetch(`${API_BASE}/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `You are the recommender for PlayBeat TV. Suggest 6 items the user might enjoy based on this mood or query: "${prompt}". Respond as JSON array with shape [{id,title,reason,kind}] where kind is one of movie|series|channel|track. Keep reasons under 25 words. No markdown.` }],
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) return fallbackRecommendations(prompt);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return fallbackRecommendations(prompt);
    return JSON.parse(match[0]);
  } catch {
    return fallbackRecommendations(prompt);
  }
}

function fallbackRecommendations(prompt: string): AIRecommendation[] {
  // Deterministic fallback so the UI is never empty even without Gemini.
  const p = (prompt || '').toLowerCase();
  const items: AIRecommendation[] = [
    { id: 'mv-1', title: 'Big Buck Bunny', kind: 'movie', reason: 'Light, funny, universally liked — safe default.' },
    { id: 'sr-4', title: 'Quiet Cities', kind: 'series', reason: 'Slow, contemplative — pairs with most moods.' },
    { id: 'ch-1', title: 'Big Buck Bunny Live', kind: 'channel', reason: 'Always-on background animation.' },
    { id: 'tr-3', title: 'Late Night Loop', kind: 'track', reason: 'Lo-fi without being sleepy.' },
    { id: 'mv-2', title: 'Tears of Steel', kind: 'movie', reason: 'Sci-fi anchor if the mood is intense.' },
    { id: 'sr-1', title: 'Open Movie Anthology', kind: 'series', reason: 'Sampler for when nothing else fits.' },
  ];
  if (/sad|down|melan/i.test(p)) return items.filter(i => i.id === 'sr-4' || i.id === 'tr-3');
  if (/energ|up|workout|run/i.test(p)) return items.filter(i => i.id === 'tr-2' || i.id === 'tr-5' || i.id === 'mv-2');
  if (/focus|work|study/i.test(p)) return items.filter(i => i.id === 'tr-1' || i.id === 'tr-6');
  return items;
}

/**
 * Ask Gemini to write a short description for a catalog entry.
 */
export async function describeTitle(kind: string, title: string): Promise<string> {
  if (!isAIEnabled()) return `${title} — a ${kind} worth your attention.`;
  try {
    const res = await fetch(`${API_BASE}/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `In one sentence (max 25 words), describe "${title}" (a ${kind}) for a streaming platform. No quotes, no markdown.` }]}],
        generationConfig: { temperature: 0.5, maxOutputTokens: 80 },
      }),
    });
    if (!res.ok) return `${title} — a ${kind} worth your attention.`;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || `${title} — a ${kind} worth your attention.`;
  } catch {
    return `${title} — a ${kind} worth your attention.`;
  }
}

/**
 * Quick health check — returns true if the /api/gemini proxy is reachable.
 */
export async function pingGemini(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/v1beta/models`, { method: 'GET' });
    return res.ok;
  } catch { return false; }
}
