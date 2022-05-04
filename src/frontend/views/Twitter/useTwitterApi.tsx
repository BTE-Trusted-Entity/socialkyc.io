import { useMemo } from 'react';

import { quoteTwitter } from '../../../backend/twitter/quoteTwitterApi';
import { requestAttestationTwitter } from '../../../backend/twitter/requestAttestationTwitterApi';
import { confirmTwitter } from '../../../backend/twitter/confirmTwitterApi';
import { attestTwitter } from '../../../backend/twitter/attestationTwitterApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useTwitterApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      quote: sessionBound(quoteTwitter),
      requestAttestation: sessionBound(requestAttestationTwitter),
      confirm: sessionBound(confirmTwitter),
      attest: sessionBound(attestTwitter),
    };
  }, [sessionId]);
}
