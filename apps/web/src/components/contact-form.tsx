'use client';

import { useState, type FormEvent } from 'react';
import { readErrorMessage } from '@/lib/api-response';
import { sendContact } from '@/lib/api-client';

type Status = 'idle' | 'sending' | 'accepted' | 'error';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError(null);

    try {
      const response = await sendContact({ name, email, message, website });

      if (response.status === 202) {
        setStatus('accepted');
        setName('');
        setEmail('');
        setMessage('');
        setWebsite('');
        return;
      }

      setStatus('error');

      if (response.status === 429) {
        const seconds = response.rateLimit.retryAfterSeconds ?? 60;
        setError(`Too many messages. Try again in ${seconds}s.`);
        return;
      }

      setError(readErrorMessage(response.body, 'The message could not be sent.'));
    } catch {
      setStatus('error');
      setError('Contact is unavailable. Check the API connection.');
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className="field">
        <label htmlFor="contact-name">Name</label>
        <input
          id="contact-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          required
          disabled={status === 'sending'}
        />
      </div>

      <div className="field">
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={254}
          required
          disabled={status === 'sending'}
        />
      </div>

      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
          rows={6}
          required
          disabled={status === 'sending'}
        />
      </div>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>

      {status === 'accepted' ? (
        <p className="success" role="status">
          Message received. Thank you.
        </p>
      ) : null}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
