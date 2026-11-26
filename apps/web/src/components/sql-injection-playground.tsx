'use client';

import { useState, type FormEvent } from 'react';
import type { SqlInjectionMode, SqlInjectionResponse } from '@portfolio/contracts';
import { readErrorMessage } from '@/lib/api-response';
import { runSqlInjection } from '@/lib/api-client';
import { useLanguage } from '@/components/language-context';

export function SqlInjectionPlayground() {
  const { content } = useLanguage();
  const t = content.ui.sqlPlayground;

  const [mode, setMode] = useState<SqlInjectionMode>('unsafe');
  const [username, setUsername] = useState('alice');
  const [result, setResult] = useState<SqlInjectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await runSqlInjection(mode, username);

      if (response.ok) {
        setResult(response.body);
      } else {
        setError(readErrorMessage(response.body, t.rejectedFallback));
      }
    } catch {
      setError(t.unavailable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="sql" className="panel">
      <div>
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.heading}</h2>
        <p className="muted">{t.description}</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as SqlInjectionMode)}
            disabled={busy}
            aria-label={t.modeAria}
          >
            <option value="unsafe">{t.unsafeOption}</option>
            <option value="safe">{t.safeOption}</option>
          </select>

          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={64}
            disabled={busy}
            aria-label={t.inputPlaceholder}
            placeholder={t.inputPlaceholder}
          />

          <button type="submit" disabled={busy || username.trim().length === 0}>
            {t.runQuery}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {t.presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => setUsername(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-3">
          <p className="status">
            mode={result.mode} · rows={result.rowCount} · {result.durationMs} ms
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.colId}</th>
                <th>{t.colUsername}</th>
                <th>{t.colRole}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={3}>{t.noRows}</td>
                </tr>
              ) : (
                result.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.username}</td>
                    <td>{row.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
