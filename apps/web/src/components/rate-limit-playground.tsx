'use client';

import { useState } from 'react';
import type { ApiResponse } from '@/lib/api-response';
import {
  createRateLimitSession,
  sendRateLimitRequest,
  type RateLimitDecision,
  type SessionResponse,
} from '@/lib/api-client';

type Algorithm = 'fixed' | 'sliding';

export function RateLimitPlayground() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('sliding');
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [responses, setResponses] = useState<ApiResponse<RateLimitDecision>[]>([]);
  const [message, setMessage] = useState('Create a session to begin.');
  const [busy, setBusy] = useState(false);

  async function createSession() {
    setBusy(true);
    try {
      const result = await createRateLimitSession(5, 10);
      if (!result.ok) throw new Error('Session creation failed');
      setSession(result.body);
      setResponses([]);
      setMessage('Session created: 5 requests per 10 seconds.');
    } catch {
      setMessage('API is unavailable. Start the backend and Redis, then retry.');
    } finally { setBusy(false); }
  }

  async function sendRequests(count: number) {
    if (!session) return;
    setBusy(true);
    try {
      const results = await Promise.all(Array.from({ length: count }, () => sendRateLimitRequest(session.token, algorithm)));
      setResponses((current) => [...results, ...current].slice(0, 12));
      setMessage(results.some((result) => result.status === 429) ? 'The API rejected excess traffic with HTTP 429.' : 'Requests accepted.');
    } catch {
      setMessage('Request failed. Check the API connection.');
    } finally { setBusy(false); }
  }

  return <section id="playground" className="panel space-y-6">
    <div><p className="eyebrow">Live security demo</p><h2>Rate-limiting playground</h2><p className="muted">Observe server-issued session tokens, atomic Redis decisions, quota headers, and HTTP 429 responses.</p></div>
    <div className="flex flex-wrap gap-3"><button onClick={createSession} disabled={busy}>Create demo session</button><button className="secondary" onClick={() => sendRequests(1)} disabled={busy || !session}>Send one request</button><button className="secondary" onClick={() => sendRequests(8)} disabled={busy || !session}>Send burst ×8</button><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as Algorithm)} disabled={busy}><option value="sliding">Sliding Window</option><option value="fixed">Fixed Window</option></select></div>
    <p className="status">{message}</p>
    <div className="terminal" aria-live="polite">{responses.length === 0 ? <p>$ Awaiting request activity…</p> : responses.map((result, index) => <div key={`${result.durationMs}-${index}`} className={result.status === 429 ? 'blocked' : 'allowed'}><span>#{responses.length - index}</span><span>HTTP {result.status}</span><span>{result.durationMs} ms</span><span>remaining {result.rateLimit.remaining ?? '—'}</span><span>{result.rateLimit.retryAfterSeconds ? `retry ${result.rateLimit.retryAfterSeconds}s` : 'accepted'}</span></div>)}</div>
  </section>;
}