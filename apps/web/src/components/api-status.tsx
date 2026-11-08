'use client';

import { useCallback, useEffect, useState } from 'react';
import { getReadiness } from '@/lib/api-client';

type Status = 'checking' | 'ready' | 'offline';

const MAX_WAIT_MS = 90_000;

export function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let delay = 1_000;
    const startedAt = Date.now();

    async function probe() {
      while (!cancelled && Date.now() - startedAt < MAX_WAIT_MS) {
        const result = await getReadiness().catch(() => null);

        if (cancelled) {
          return;
        }

        if (result?.ok) {
          setStatus('ready');
          return;
        }

        setStatus('checking');

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 5_000);
      }

      if (!cancelled) {
        setStatus('offline');
      }
    }

    void probe();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus('checking');
    setAttempt((value) => value + 1);
  }, []);

  return (
    <div className="health">
      <span className={status === 'ready' ? 'dot online' : 'dot'} />
      API status: {status}
      {status === 'offline' ? (
        <button type="button" className="secondary" onClick={retry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
