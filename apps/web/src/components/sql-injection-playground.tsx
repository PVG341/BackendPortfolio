'use client';

import { useState, type FormEvent } from 'react';
import type { SqlInjectionMode, SqlInjectionResponse } from '@portfolio/contracts';
import { readErrorMessage } from '@/lib/api-response';
import { runSqlInjection } from '@/lib/api-client';

const presets = [
  { label: 'OR 1=1', value: "' OR '1'='1' --" },
  { label: 'Comment', value: "admin' --" },
  { label: 'Drop attempt', value: "'; DROP TABLE demo.users; --" },
  { label: 'Normal user', value: 'alice' },
];

export function SqlInjectionPlayground() {
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
        setError(readErrorMessage(response.body, 'The SQL sandbox rejected the request.'));
      }
    } catch {
      setError('The SQL sandbox is unavailable. Check the API connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="sql" className="panel">
      <div>
        <p className="eyebrow">Isolated database demo</p>
        <h2>SQL injection sandbox</h2>
        <p className="muted">
          Compare a deliberately unsafe concatenated query with a parameterized query. The demo
          database contains fictional data, uses a read-only role, and never accepts arbitrary SQL.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as SqlInjectionMode)}
            disabled={busy}
            aria-label="SQL mode"
          >
            <option value="unsafe">Unsafe: string concatenation</option>
            <option value="safe">Safe: parameterized $1</option>
          </select>

          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={64}
            disabled={busy}
            aria-label="Username or payload"
            placeholder="Username or payload"
          />

          <button type="submit" disabled={busy || username.trim().length === 0}>
            Run query
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
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
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={3}>No rows matched.</td>
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
