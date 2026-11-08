'use client';

import { useRef, useState } from 'react';

import type { ApiResponse } from '@/lib/api-response';

import {
  createRateLimitSession,
  resetRateLimitSession,
  sendRateLimitRequest,
  type RateLimitDecision,
  type SessionResponse,
} from '@/lib/api-client';

type Algorithm = 'fixed' | 'sliding';
type BurstSize = 1 | 5 | 10 | 20;

const HISTORY_LIMIT = 200;
const DISPLAY_LIMIT = 40;

export function RateLimitPlayground() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('sliding');

  const [limit, setLimit] = useState(5);
  const [windowSeconds, setWindowSeconds] = useState(10);
  const [burstSize, setBurstSize] = useState<BurstSize>(10);

  const [session, setSession] = useState<SessionResponse | null>(null);

  const [responses, setResponses] = useState<ApiResponse<RateLimitDecision>[]>([]);

  const [message, setMessage] = useState('Create a session to begin.');
  const [busy, setBusy] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const stopRef = useRef(false);

  function readScope(body: unknown): string | undefined {
    if (typeof body === 'object' && body !== null && 'scope' in body) {
      const scope = (body as { scope?: unknown }).scope;

      return typeof scope === 'string' ? scope : undefined;
    }

    return undefined;
  }

  async function createSession() {
    if (busy) return;

    setBusy(true);

    try {
      const result = await createRateLimitSession(limit, windowSeconds);

      if (!result.ok) {
        throw new Error('Session creation failed');
      }

      setSession(result.body);
      setResponses([]);

      setMessage(`Session created: ${limit} requests per ${windowSeconds} seconds.`);
    } catch {
      setMessage('API is unavailable. Start the backend and Redis, then retry.');
    } finally {
      setBusy(false);
    }
  }

  async function sendRequests(count: BurstSize) {
    if (!session || busy) return;

    stopRef.current = false;
    setBusy(true);
    setIsSending(true);

    try {
      for (let index = 0; index < count; index += 1) {
        // Stop before starting the next request.
        if (stopRef.current) {
          setMessage('Burst stopped.');
          break;
        }

        // Send exactly one request. No automatic retry.
        const result = await sendRateLimitRequest(session.token, algorithm);

        setResponses((current) => [result, ...current].slice(0, HISTORY_LIMIT));

        if (result.status === 410) {
          stopRef.current = true;
          setSession(null);
          setMessage('Session expired or was reset. Create a new session.');
          break;
        }

        if (result.status === 429) {
          if (readScope(result.body) === 'service') {
            setMessage('Service abuse quota exceeded. Burst stopped.');
            stopRef.current = true;
            break;
          }

          if (result.rateLimit.retryAfterSeconds !== null) {
            setMessage(`Demo quota exceeded. Retry after ${result.rateLimit.retryAfterSeconds}s.`);
          } else {
            setMessage('Demo quota exceeded.');
          }
        }
      }

      if (stopRef.current && message !== 'Burst stopped.') {
        // The stop state is handled by the button or the 429/410 branches.
      }
    } catch {
      setMessage('Request failed. Check the API connection.');
    } finally {
      setBusy(false);
      setIsSending(false);
    }
  }

  function stopRequests() {
    stopRef.current = true;
    setMessage('Stopping burst after the current request...');
  }

  async function resetSession() {
    if (!session || busy) return;

    stopRef.current = true;
    setBusy(true);

    try {
      const result = await resetRateLimitSession(session.token);

      if (!result.ok) {
        throw new Error('Reset failed');
      }

      setSession(null);
      setResponses([]);
      setMessage('Session reset. Create a new session.');
    } catch {
      setMessage('Could not reset the session.');
    } finally {
      setBusy(false);
    }
  }

  const visibleResponses = responses.slice(0, DISPLAY_LIMIT);

  const validConfiguration =
    Number.isInteger(limit) &&
    limit >= 1 &&
    limit <= 20 &&
    Number.isInteger(windowSeconds) &&
    windowSeconds >= 1 &&
    windowSeconds <= 60;

  return (
    <section id="playground" className="panel space-y-6">
      <div>
        <p className="eyebrow">Live security demo</p>

        <h2>Rate-limiting playground</h2>

        <p className="muted">
          Observe server-issued session tokens, atomic Redis decisions, quota headers, and HTTP 429
          responses.
        </p>
      </div>

      {/* Session configuration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span>Request limit (1–20)</span>

          <input
            type="number"
            min={1}
            max={20}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            disabled={busy}
          />
        </label>

        <label className="space-y-2">
          <span>Window (1–60 seconds)</span>

          <input
            type="number"
            min={1}
            max={60}
            value={windowSeconds}
            onChange={(event) => setWindowSeconds(Number(event.target.value))}
            disabled={busy}
          />
        </label>
      </div>

      {/* Request configuration */}
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2">
          <span>Algorithm</span>

          <select
            value={algorithm}
            onChange={(event) => setAlgorithm(event.target.value as Algorithm)}
            disabled={busy}
          >
            <option value="sliding">Sliding Window</option>
            <option value="fixed">Fixed Window</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span>Burst size</span>

          <select
            value={burstSize}
            onChange={(event) => setBurstSize(Number(event.target.value) as BurstSize)}
            disabled={busy}
          >
            <option value={1}>1 request</option>
            <option value={5}>5 requests</option>
            <option value={10}>10 requests</option>
            <option value={20}>20 requests</option>
          </select>
        </label>
      </div>

      {/* Session actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={createSession} disabled={busy || !validConfiguration}>
          Create demo session
        </button>

        <button className="secondary" onClick={() => sendRequests(1)} disabled={busy || !session}>
          Send one request
        </button>

        <button
          className="secondary"
          onClick={() => sendRequests(burstSize)}
          disabled={busy || !session}
        >
          Send burst ×{burstSize}
        </button>

        <button className="secondary" onClick={stopRequests} disabled={!isSending}>
          Stop
        </button>

        <button className="secondary" onClick={resetSession} disabled={busy || !session}>
          Reset session
        </button>
      </div>

      <p className="status" role="status" aria-live="polite">
        {message}
      </p>

      {/* Session information */}
      {session && (
        <div className="space-y-2">
          <p>
            <strong>Session active</strong>
          </p>

          <p className="muted">
            Limit: {limit} requests / {windowSeconds} seconds
          </p>
        </div>
      )}

      {/* Request history */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-between gap-2">
          <h3>Request history</h3>

          <p className="muted">
            Showing {visibleResponses.length} / {responses.length} (max {HISTORY_LIMIT})
          </p>
        </div>

        <div className="terminal" aria-live="polite">
          {visibleResponses.length === 0 ? (
            <p>$ Awaiting request activity…</p>
          ) : (
            visibleResponses.map((result, index) => (
              <div
                key={`${result.durationMs}-${responses.length - index}`}
                className={result.status === 429 ? 'blocked' : 'allowed'}
              >
                <span>#{responses.length - index}</span>

                <span>HTTP {result.status}</span>

                <span>{result.durationMs} ms</span>

                <span>remaining {result.rateLimit.remaining ?? '—'}</span>

                <span>
                  {result.rateLimit.retryAfterSeconds !== null
                    ? `retry ${result.rateLimit.retryAfterSeconds}s`
                    : 'accepted'}
                </span>

                {result.status === 429 && (
                  <span>
                    {readScope(result.body) === 'service' ? 'Service quota' : 'Demo quota'}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
