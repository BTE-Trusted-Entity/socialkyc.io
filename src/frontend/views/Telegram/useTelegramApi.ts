import { useMemo } from 'react';

import { confirmTelegram } from '../../../backend/telegram/confirmTelegramApi';
import { authUrl } from '../../../backend/endpoints/authUrlApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestation } from '../../../backend/endpoints/requestAttestationApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useTelegramApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrl.bind(undefined, 'telegram')),
      confirm: sessionBound(confirmTelegram),
      quote: sessionBound(quote.bind(undefined, 'telegram')),
      requestAttestation: sessionBound(
        requestAttestation.bind(undefined, 'telegram'),
      ),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
