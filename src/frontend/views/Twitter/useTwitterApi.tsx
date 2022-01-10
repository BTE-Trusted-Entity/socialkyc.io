import { useMemo } from 'react';

import { quoteTwitter } from '../../../backend/twitter/quoteTwitterApi';
import { requestAttestationTwitter } from '../../../backend/twitter/requestAttestationTwitterApi';
import { confirmTwitter } from '../../../backend/twitter/confirmTwitterApi';
import { attestTwitter } from '../../../backend/twitter/attestationTwitterApi';
import { bindToSession, SessionBound } from '../../utilities/bindToSession';

export function useTwitterApi(sessionId: string): {
  quote: SessionBound<typeof quoteTwitter>;
  requestAttestation: SessionBound<typeof requestAttestationTwitter>;
  confirm: SessionBound<typeof confirmTwitter>;
  attest: SessionBound<typeof attestTwitter>;
} {
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
