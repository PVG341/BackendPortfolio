import type { ContactRequest } from '@portfolio/contracts';

export function renderContactEmail(request: ContactRequest): string {
  return [
    'New contact form submission',
    '',
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    '',
    'Message:',
    request.message,
  ].join('\n');
}
