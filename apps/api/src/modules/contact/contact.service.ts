import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ContactRequest } from '@portfolio/contracts';
import { renderContactEmail } from './contact-email.js';
import { EMAIL_SENDER, type EmailSender } from './email-sender.js';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly to: string;
  private readonly from: string;

  constructor(
    @Inject(EMAIL_SENDER) private readonly sender: EmailSender,
    config: ConfigService,
  ) {
    this.to = config.getOrThrow<string>('CONTACT_TO_EMAIL');
    this.from = config.getOrThrow<string>('CONTACT_FROM_EMAIL');
  }

  async submit(request: ContactRequest): Promise<void> {
    if (request.website !== undefined && request.website.length > 0) {
      return;
    }

    try {
      await this.sender.send({
        to: this.to,
        from: this.from,
        replyTo: request.email,
        subject: 'Portfolio contact request',
        text: renderContactEmail(request),
      });
    } catch {
      this.logger.warn('Contact email delivery failed');
      throw new ServiceUnavailableException('Contact delivery is temporarily unavailable');
    }
  }
}
