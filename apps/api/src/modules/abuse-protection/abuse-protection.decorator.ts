import { SetMetadata } from '@nestjs/common';
import type { AbuseScope } from './abuse-protection.service.js';

export const ABUSE_PROTECTION_SCOPE = 'abuse-protection:scope';

export const UseAbuseProtection = (scope: AbuseScope) => SetMetadata(ABUSE_PROTECTION_SCOPE, scope);
