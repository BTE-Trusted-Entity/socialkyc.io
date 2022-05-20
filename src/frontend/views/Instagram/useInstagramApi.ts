import { useMemo } from 'react';

import { bindToSession } from '../../utilities/bindToSession';
import { authUrlInstagram } from '../../../backend/instagram/authUrlInstagramApi';
import { confirmInstagram } from '../../../backend/instagram/confirmInstagramApi';
import { quoteInstagram } from '../../../backend/instagram/quoteInstagramApi';
import { requestAttestationInstagram } from '../../../backend/instagram/requestAttestationInstagramApi';
import { attestInstagram } from '../../../backend/instagram/attestInstagramApi';

export function useInstagramApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlInstagram),
      confirm: sessionBound(confirmInstagram),
      quote: sessionBound(quoteInstagram),
      requestAttestation: sessionBound(requestAttestationInstagram),
      attest: sessionBound(attestInstagram),
    };
  }, [sessionId]);
}
