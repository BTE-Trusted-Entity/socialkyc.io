import { useMemo } from 'react';

import { confirmTwitch } from '../../../backend/twitch/confirmTwitchApi';
import { authUrlTwitch } from '../../../backend/twitch/authUrlTwitchApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestationTwitch } from '../../../backend/twitch/requestAttestationTwitchApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useTwitchApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlTwitch),
      confirm: sessionBound(confirmTwitch),
      quote: sessionBound(quote.bind(undefined, 'twitch')),
      requestAttestation: sessionBound(requestAttestationTwitch),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
