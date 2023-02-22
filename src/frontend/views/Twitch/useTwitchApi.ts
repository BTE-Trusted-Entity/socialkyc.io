import { useMemo } from 'react';

import { confirm } from '../../../backend/endpoints/confirmApi';
import { authUrl } from '../../../backend/endpoints/authUrlApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestation } from '../../../backend/endpoints/requestAttestationApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useTwitchApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrl.bind(undefined, 'twitch')),
      confirm: sessionBound(confirm.bind(undefined, 'twitch')),
      quote: sessionBound(quote.bind(undefined, 'twitch')),
      requestAttestation: sessionBound(
        requestAttestation.bind(undefined, 'twitch'),
      ),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
