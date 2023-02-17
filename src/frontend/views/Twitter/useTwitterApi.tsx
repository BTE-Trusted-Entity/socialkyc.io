import { useMemo } from 'react';

import { claimTwitter } from '../../../backend/twitter/claimTwitterApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestationTwitter } from '../../../backend/twitter/requestAttestationTwitterApi';
import { confirmTwitter } from '../../../backend/twitter/confirmTwitterApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useTwitterApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      claim: sessionBound(claimTwitter),
      confirm: sessionBound(confirmTwitter),
      quote: sessionBound(quote.bind(undefined, 'twitter')),
      requestAttestation: sessionBound(requestAttestationTwitter),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
