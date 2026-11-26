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
import { readErrorMessage } from '@/lib/api-response';
import { useLanguage } from '@/components/language-context';

type Algorithm = 'fixed' | 'sliding';
type BurstSize = 1 | 5 | 10 | 20;

const HISTORY_LIMIT = 200;
const DISPLAY_LIMIT = 40;

export function RateLimitPlayground() {
  const { content } = useLanguage();
  const t = content.ui.rateLimit;

  const [algorithm, setAlgorithm] = useState<Algorithm>('sliding');
  const [limit, setLimit] = useState(5);
  const [windowSeconds, setWindowSeconds] = useState(10);
  const [burstSize, setBurstSize] = useState<BurstSize>(10);

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [responses, setResponses] = useState<ApiResponse<RateLimitDecision>[]>([]);
  const [message, setMessage] = useState<string | null>(null);
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
      setMessage(t.sessionCreated(limit, windowSeconds));
    } catch {
      setMessage(t.apiUnavailable);
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
        if (stopRef.current) {
          setMessage(t.burstStopped);
          break;
        }

        const result = await sendRateLimitRequest(session.token, algorithm);
        setResponses((current) => [result, ...current].slice(0, HISTORY_LIMIT));

        if (result.status === 410) {
          stopRef.current = true;
          setSession(null);
          setMessage(t.sessionExpired);
          break;
        }

        if (result.status === 429) {
          setMessage(t.serviceQuotaExceeded);
        } else {
          setMessage(readErrorMessage(result.body, t.createFailedFallback));
        }
      }
    } catch {
      setMessage(t.requestFailed);
    } finally {
      setBusy(false);
      setIsSending(false);
    }
  }

  function stopRequests() {
    stopRef.current = true;
    setMessage(t.stoppingBurst);
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
      setMessage(t.sessionReset);
    } catch {
      setMessage(t.resetFailed);
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
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.heading}</h2>
        <p className="muted">{t.description}</p>
      </div>

      {/* Session configuration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span>{t.limitLabel}</span>
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
          <span>{t.windowLabel}</span>
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
          <span>{t.algorithmLabel}</span>
          <select
            value={algorithm}
            onChange={(event) => setAlgorithm(event.target.value as Algorithm)}
            disabled={busy}
          >
            <option value="sliding">{t.slidingOption}</option>
            <option value="fixed">{t.fixedOption}</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span>{t.burstLabel}</span>
          <select
            value={burstSize}
            onChange={(event) => setBurstSize(Number(event.target.value) as BurstSize)}
            disabled={busy}
          >
            <option value={1}>1 {t.requestSingular}</option>
            <option value={5}>5 {t.requestPlural}</option>
            <option value={10}>10 {t.requestPlural}</option>
            <option value={20}>20 {t.requestPlural}</option>
          </select>
        </label>
      </div>

      {/* Session actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={createSession} disabled={busy || !validConfiguration}>
          {t.createSession}
        </button>

        <button className="secondary" onClick={() => sendRequests(1)} disabled={busy || !session}>
          {t.sendOne}
        </button>

        <button
          className="secondary"
          onClick={() => sendRequests(burstSize)}
          disabled={busy || !session}
        >
          {t.sendBurst(burstSize)}
        </button>

        <button className="secondary" onClick={stopRequests} disabled={!isSending}>
          {t.stop}
        </button>

        <button className="secondary" onClick={resetSession} disabled={busy || !session}>
          {t.reset}
        </button>
      </div>

      <p className="status" role="status" aria-live="polite">
        {message ?? t.initialMessage}
      </p>

      {/* Session information */}
      {session && (
        <div className="space-y-2">
          <p>
            <strong>{t.sessionActive}</strong>
          </p>
          <p className="muted">
            {t.sessionLimitSummary(session.config.limit, session.config.windowSeconds)}
          </p>
        </div>
      )}

      {/* Request history */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-between gap-2">
          <h3>{t.historyHeading}</h3>
          <p className="muted">
            {t.historyShowing(visibleResponses.length, responses.length, HISTORY_LIMIT)}
          </p>
        </div>

        <div className="terminal" aria-live="polite">
          {visibleResponses.length === 0 ? (
            <p>{t.awaitingActivity}</p>
          ) : (
            visibleResponses.map((result, index) => (
              <div
                key={`${result.durationMs}-${responses.length - index}`}
                className={result.status === 429 ? 'blocked' : 'allowed'}
              >
                <span>#{responses.length - index}</span>
                <span>HTTP {result.status}</span>
                <span>{result.durationMs} ms</span>
                <span>
                  {t.remaining} {result.rateLimit.remaining ?? '—'}
                </span>
                <span>
                  {result.rateLimit.retryAfterSeconds !== null
                    ? t.retryIn(result.rateLimit.retryAfterSeconds)
                    : t.accepted}
                </span>
                {result.status === 429 && (
                  <span>{readScope(result.body) === 'service' ? t.serviceQuota : t.demoQuota}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
