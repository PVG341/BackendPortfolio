import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailMessage, EmailSender } from './email-sender.js';

@Injectable()
export class ResendEmailSender implements EmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('RESEND_API_KEY');
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        reply_to: message.replyTo,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      this.logger.warn(`Resend rejected contact email with status ${response.status}`);
      throw new Error('Email provider rejected the request');
    }
  }
}
