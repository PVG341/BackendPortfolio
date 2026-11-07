import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';
import { EMAIL_SENDER } from './email-sender.js';
import { ResendEmailSender } from './resend-email-sender.js';

@Module({
  controllers: [ContactController],
  providers: [
    ContactService,
    {
      provide: EMAIL_SENDER,
      useClass: ResendEmailSender,
    },
  ],
})
export class ContactModule {}
