import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResendEmailSender } from './resend-email-sender.js';
import type { Mock } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ResendEmailSender', () => {
  it('sends plain text to the configured recipient', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async (_input, _init) => new Response(null, { status: 200 }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const sender = new ResendEmailSender(new ConfigService({ RESEND_API_KEY: 're_test_key' }));

    await sender.send({
      to: 'owner@example.com',
      from: 'onboarding@resend.dev',
      replyTo: 'visitor@example.com',
      subject: 'Portfolio contact request',
      text: 'Hello',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));

    expect(url).toBe('https://api.resend.com/emails');
    expect(body).toMatchObject({
      from: 'onboarding@resend.dev',
      to: ['owner@example.com'],
      subject: 'Portfolio contact request',
      text: 'Hello',
      reply_to: 'visitor@example.com',
    });
  });

  it('throws a generic error when Resend rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (_input, _init) => new Response('invalid key', { status: 401 })),
    );

    const sender = new ResendEmailSender(new ConfigService({ RESEND_API_KEY: 're_test_key' }));

    await expect(
      sender.send({
        to: 'owner@example.com',
        from: 'onboarding@resend.dev',
        replyTo: 'visitor@example.com',
        subject: 'Portfolio contact request',
        text: 'Hello',
      }),
    ).rejects.toThrow('Email provider rejected the request');
  });
});
