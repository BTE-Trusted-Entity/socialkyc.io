import { useMemo } from 'react';

import { confirmTelegram } from '../../../backend/telegram/confirmTelegramApi';
import { authUrlTelegram } from '../../../backend/telegram/authUrlTelegramApi';
import { quoteTelegram } from '../../../backend/telegram/quoteTelegramApi';
import { requestAttestationTelegram } from '../../../backend/telegram/requestAttestationTelegramApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useTelegramApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlTelegram),
      confirm: sessionBound(confirmTelegram),
      quote: sessionBound(quoteTelegram),
      requestAttestation: sessionBound(requestAttestationTelegram),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
