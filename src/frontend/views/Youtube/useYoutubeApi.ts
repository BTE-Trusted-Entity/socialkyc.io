import { useMemo } from 'react';

import { confirm } from '../../../backend/endpoints/confirmApi';
import { authUrl } from '../../../backend/endpoints/authUrlApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestation } from '../../../backend/endpoints/requestAttestationApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useYoutubeApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrl.bind(undefined, 'youtube')),
      confirm: sessionBound(confirm.bind(undefined, 'youtube')),
      quote: sessionBound(quote.bind(undefined, 'youtube')),
      requestAttestation: sessionBound(
        requestAttestation.bind(undefined, 'youtube'),
      ),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
