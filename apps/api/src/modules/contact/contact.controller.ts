import { BadRequestException, Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import type { ContactResponse } from '@portfolio/contracts';
import { parseContactRequest } from '@portfolio/contracts';
import { UseAbuseProtection } from '../abuse-protection/abuse-protection.decorator.js';
import { ContactService } from './contact.service.js';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @UseAbuseProtection('contact')
  async submit(@Body() body: unknown): Promise<ContactResponse> {
    const request = parseContactRequest(body);

    if (request === null) {
      throw new BadRequestException('Invalid contact request');
    }

    await this.contact.submit(request);

    return { status: 'accepted' };
  }
}
