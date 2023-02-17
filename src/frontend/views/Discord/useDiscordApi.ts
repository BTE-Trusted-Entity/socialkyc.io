import { useMemo } from 'react';

import { confirmDiscord } from '../../../backend/discord/confirmDiscordApi';
import { authUrl } from '../../../backend/endpoints/authUrlApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestation } from '../../../backend/endpoints/requestAttestationApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useDiscordApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrl.bind(undefined, 'discord')),
      confirm: sessionBound(confirmDiscord),
      quote: sessionBound(quote.bind(undefined, 'discord')),
      requestAttestation: sessionBound(
        requestAttestation.bind(undefined, 'discord'),
      ),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
