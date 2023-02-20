import { useMemo } from 'react';

import { confirm } from '../../../backend/endpoints/confirmApi';
import { authUrl } from '../../../backend/endpoints/authUrlApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestation } from '../../../backend/endpoints/requestAttestationApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useGithubApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrl.bind(undefined, 'github')),
      confirm: sessionBound(confirm.bind(undefined, 'github')),
      quote: sessionBound(quote.bind(undefined, 'github')),
      requestAttestation: sessionBound(
        requestAttestation.bind(undefined, 'github'),
      ),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
